import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BillReport } from "@/components/deason/BillSavingsReport";
import type { EnergyReportFull, EnergyReportPreview } from "@/hooks/useEnergyReport";

export interface DeasonContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface DeasonEnergyReport {
  preview: EnergyReportPreview;
  full: EnergyReportFull | null;
  entitled: boolean;
}

export interface DeasonMessage {
  role: "user" | "assistant";
  content: string | DeasonContentPart[];
  /** When the assistant attaches a structured bill savings report. */
  billReport?: BillReport;
  /** When the assistant attaches a full energy analysis (bill + contract + PPA/loan). */
  energyReport?: DeasonEnergyReport;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deason-chat`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-bill`;

interface UseDeasonOptions {
  /** When provided, the thread is persisted to the DB. Omit only for explicitly ephemeral chats. */
  threadId?: string | null;
  /** Called when the thread is touched (new user message) so the sidebar can re-sort + auto-title. */
  onThreadTouched?: (firstUserText: string | null) => void;
}

/**
 * Streaming chat hook for Deason. Persists per-thread when `threadId` is set;
 * otherwise it runs as an ephemeral chat. Supports text + image attachments.
 */
export function useDeason(opts: UseDeasonOptions = {}) {
  const { threadId = null, onThreadTouched } = opts;
  const [messages, setMessages] = useState<DeasonMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const titleSetRef = useRef(false);

  // Load persisted messages when threadId changes.
  useEffect(() => {
    abortRef.current?.abort();
    titleSetRef.current = false;
    if (!threadId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    setMessages([]);
    void (async () => {
      const { data, error } = await supabase
        .from("deason_messages")
        .select("role,content,bill_report,energy_report,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        const restored: DeasonMessage[] = data.map((row: any) => ({
          role: row.role,
          content: row.content,
          billReport: row.bill_report ?? undefined,
          energyReport: row.energy_report ?? undefined,
        }));
        setMessages(restored);
        if (restored.some((m) => m.role === "user")) titleSetRef.current = true;
      }
      setLoadingHistory(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  /** Drops the trailing assistant message (if any). Used before regenerate/retry. */
  const popLastAssistant = useCallback(() => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      return last.role === "assistant" ? prev.slice(0, -1) : prev;
    });
  }, []);

  const seedAssistant = useCallback(
    (text: string, extras?: { energyReport?: DeasonEnergyReport; billReport?: BillReport }) => {
      if (!text?.trim() && !extras?.energyReport && !extras?.billReport) return;
      const msg: DeasonMessage = {
        role: "assistant",
        content: text,
        energyReport: extras?.energyReport,
        billReport: extras?.billReport,
      };
      setMessages((prev) => [...prev, msg]);
      setError(null);
      void persistMessageRef.current?.(msg);
    },
    []
  );

  // Ref so seedAssistant (stable identity) can call the latest persistMessage.
  const persistMessageRef = useRef<((m: DeasonMessage) => Promise<void>) | null>(null);

  const persistMessage = useCallback(
    async (msg: DeasonMessage) => {
      if (!threadId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("deason_messages").insert([{
        thread_id: threadId,
        user_id: user.id,
        role: msg.role,
        content: msg.content as any,
        bill_report: (msg.billReport ?? null) as any,
        energy_report: (msg.energyReport ?? null) as any,
      }]);
      // Bump thread updated_at, and set title from first user message.
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (msg.role === "user" && !titleSetRef.current) {
        const text =
          typeof msg.content === "string"
            ? msg.content
            : msg.content.find((p) => p.type === "text")?.text ?? "Energy analysis";
        updates.title = text.slice(0, 60);
        titleSetRef.current = true;
      }
      await supabase.from("deason_threads").update(updates).eq("id", threadId);
    },
    [threadId]
  );

  useEffect(() => { persistMessageRef.current = persistMessage; }, [persistMessage]);

  const send = useCallback(
    async (text: string, imageDataUrl?: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !imageDataUrl) || streaming) return;
      setError(null);

      const userContent: string | DeasonContentPart[] = imageDataUrl
        ? [
            ...(trimmed
              ? [{ type: "text" as const, text: trimmed }]
              : [{ type: "text" as const, text: "Here's my utility bill — can you analyze it and suggest savings?" }]),
            { type: "image_url" as const, image_url: { url: imageDataUrl } },
          ]
        : trimmed;

      const userMsg: DeasonMessage = { role: "user", content: userContent };
      const next: DeasonMessage[] = [...messages, userMsg];
      setMessages([...next, { role: "assistant", content: "" }]);
      setStreaming(true);

      // Persist user message + touch thread.
      void persistMessage(userMsg);
      onThreadTouched?.(trimmed || null);

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

        // ── Branch A: image upload.
        // Route to bill analyzer ONLY when the note (or absence of note) looks
        // bill-shaped. Equipment / troubleshooting photos (inverters, batteries,
        // chargers, error screens, app screenshots) flow into the regular
        // multimodal chat stream so Deason can troubleshoot.
        if (imageDataUrl) {
          const noteLower = trimmed.toLowerCase();
          const billKeywords = /\b(bill|invoice|statement|utility|rate plan|tou|kwh|kilowatt|usage|tier|peak|charges?|due|reliant|octopus|rhythm|pg&?e|sce|sdg&?e|coned|duke|xcel|aps|srp)\b/;
          const troubleshootKeywords = /\b(error|fault|code|light|red|yellow|orange|blink|flash|trouble|broken|fix|issue|problem|offline|down|reset|reboot|firmware|inverter|battery|powerwall|gateway|enphase|solaredge|tesla|wallbox|charger|breaker|panel|meter|screen|app|connect|pair|commission|warning|alarm)\b/;
          const looksLikeBill = noteLower === "" || (billKeywords.test(noteLower) && !troubleshootKeywords.test(noteLower));

          if (looksLikeBill) {
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
            const assistantMsg: DeasonMessage = {
              role: "assistant",
              content: report.summary,
              billReport: report,
            };
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = assistantMsg;
              return copy;
            });
            void persistMessage(assistantMsg);
            return;
          }
          // Otherwise fall through to the multimodal chat stream below —
          // Gemini 2.5 Flash will see the image and troubleshoot.
        }


        // ── Branch B: streaming chat.
        const res = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: next, threadId }),
          signal: ac.signal,
        });

        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          let errorCode = "";
          try {
            const j = await res.clone().json();
            errorCode = j.error ?? "";
            detail = j.detail ?? `${j.error ?? "error"}${j.stage ? ` @ ${j.stage}` : ""} (req ${j.reqId ?? "?"})`;
          } catch { /* */ }
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

        if (assistantContent) {
          void persistMessage({ role: "assistant", content: assistantContent });
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
    [messages, streaming, persistMessage, onThreadTouched]
  );

  return { messages, streaming, error, send, reset, seedAssistant, loadingHistory, popLastAssistant };
}
