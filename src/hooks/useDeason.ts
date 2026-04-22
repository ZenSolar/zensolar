import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BillReport } from "@/components/deason/BillSavingsReport";

export interface DeasonContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface DeasonMessage {
  role: "user" | "assistant";
  content: string | DeasonContentPart[];
  /** When the assistant attaches a structured bill savings report. */
  billReport?: BillReport;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deason-chat`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-bill`;

/**
 * Streaming chat hook for Deason. Ephemeral — nothing persisted.
 * Supports text + image attachments (e.g. utility bill uploads) via
 * OpenAI-style multimodal `content` arrays.
 */
export function useDeason() {
  const [messages, setMessages] = useState<DeasonMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string, imageDataUrl?: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !imageDataUrl) || streaming) return;
      setError(null);

      // Build user content: plain string if text-only, multimodal array if image attached.
      const userContent: string | DeasonContentPart[] = imageDataUrl
        ? [
            ...(trimmed
              ? [{ type: "text" as const, text: trimmed }]
              : [{ type: "text" as const, text: "Here's my utility bill — can you analyze it and suggest savings?" }]),
            { type: "image_url" as const, image_url: { url: imageDataUrl } },
          ]
        : trimmed;

      const next: DeasonMessage[] = [...messages, { role: "user", content: userContent }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setStreaming(true);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          session = refreshed?.session ?? null;
        }
        if (!session) {
          throw new Error("Please sign in to chat with Deason.");
        }

        // ── Branch A: bill image uploaded → run structured analysis, render card.
        if (imageDataUrl) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: "Reading your bill…" };
            return copy;
          });

          const analyzeRes = await fetch(ANALYZE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ image: imageDataUrl, note: trimmed || undefined }),
            signal: ac.signal,
          });

          if (!analyzeRes.ok) {
            let detail = `HTTP ${analyzeRes.status}`;
            try {
              const j = await analyzeRes.clone().json();
              detail = j.detail ?? j.error ?? detail;
              if (j.error === "rate_limited") detail = "Slow down a moment and try again.";
              if (j.error === "credits_exhausted") detail = "AI credits exhausted — try again later.";
            } catch { /* */ }
            throw new Error(detail);
          }

          const { report } = (await analyzeRes.json()) as { report: BillReport };
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: report.summary,
              billReport: report,
            };
            return copy;
          });
          return;
        }

        // ── Branch B: regular streaming chat.
        const res = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: next }),
          signal: ac.signal,
        });

        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          let errorCode = "";
          try {
            const j = await res.clone().json();
            errorCode = j.error ?? "";
            detail = j.detail ?? `${j.error ?? "error"}${j.stage ? ` @ ${j.stage}` : ""} (req ${j.reqId ?? "?"})`;
          } catch { /* non-JSON */ }
          if (errorCode === "daily_limit_reached") throw new Error(detail);
          if (res.status === 429) throw new Error(`Slow down a moment — ${detail}`);
          if (res.status === 402) throw new Error(`AI credits exhausted — ${detail}`);
          if (res.status === 401) throw new Error(`Please sign back in — ${detail}`);
          throw new Error(detail);
        }
        if (!res.body) throw new Error("Empty response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;
            const payload = trimmedLine.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined =
                json?.choices?.[0]?.delta?.content ??
                json?.choices?.[0]?.message?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                  return copy;
                });
              }
            } catch {
              // ignore non-JSON keepalives
            }
          }
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Something went wrong.");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  return { messages, streaming, error, send, reset };
}
