import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DeasonMessage {
  role: "user" | "assistant";
  content: string;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deason-chat`;

/**
 * Streaming chat hook for Deason. Ephemeral — nothing persisted.
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
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      setError(null);

      const next: DeasonMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setStreaming(true);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        // Try cached session first, then force-refresh from server if missing.
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("[Deason] No cached session, attempting refresh…");
          const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
          if (refreshErr) console.warn("[Deason] refreshSession error:", refreshErr.message);
          session = refreshed?.session ?? null;
        }
        if (!session) {
          const { data: userData } = await supabase.auth.getUser();
          throw new Error(
            userData?.user
              ? "Session expired — please reload the page."
              : "Not signed in. Open Deason from a logged-in tab."
          );
        }

        const res = await fetch(FUNCTIONS_URL, {
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
          try {
            const j = await res.clone().json();
            detail = `${j.error ?? "error"}${j.stage ? ` @ ${j.stage}` : ""}${j.detail ? `: ${j.detail}` : ""} (req ${j.reqId ?? "?"})`;
          } catch { /* non-JSON */ }
          if (res.status === 429) throw new Error(`Rate limited — ${detail}`);
          if (res.status === 402) throw new Error(`AI credits exhausted — ${detail}`);
          if (res.status === 403) throw new Error(`Founders only — ${detail}`);
          if (res.status === 401) throw new Error(`Auth rejected by server — ${detail}`);
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
        setMessages((prev) => prev.slice(0, -1)); // drop empty assistant bubble
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  return { messages, streaming, error, send, reset };
}
