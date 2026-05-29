import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Send, Sparkles, RotateCcw, X, Paperclip, Image as ImageIcon, ChevronUp, ChevronDown, History, FileText, ArrowRight, MessageSquare, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeason, type DeasonContentPart } from "@/hooks/useDeason";
import { useUserPersona } from "@/hooks/useUserPersona";
import { BillSavingsReport } from "@/components/deason/BillSavingsReport";
import type { DeasonThread } from "@/hooks/useDeasonThreads";
import { cn } from "@/lib/utils";

interface DeasonChatProps {
  onClose?: () => void;
  compact?: boolean;
  /** When set, the chat is persisted to this DB thread. */
  threadId?: string | null;
  /** Optional saved-chat reset action, used by the floating PWA panel. */
  onNewThread?: () => void;
  /** Called whenever a new user message is sent (lets parents re-sort thread list). */
  onUserMessage?: (text: string | null) => void;
  /** When set, scroll to and highlight the first message containing this query. */
  highlightQuery?: string;
  /** Optional saved threads — when provided, a History panel is shown in the header. */
  threads?: DeasonThread[];
  /** Switch the chat to another saved thread. */
  onSwitchThread?: (id: string) => void;
  /** Optional "open full Deason page" handoff (e.g. from the floating bubble). */
  onViewAllChats?: () => void;
}


const INNER_CIRCLE_PROMPTS = [
  "Why did we move from 10B to 1T tokens?",
  "Walk me through the LP tranche launch.",
  "Why does the patent now cover Starlink + SpaceX?",
  "What's the pitch to Lyndon → Elon?",
];

// Reviewer/investor prompts — used on any /demo* route. Investor-grade
// (capital plan, moat, traction), not raw insider strategy. Safe for NDA'd
// reviewers like Greg without exposing the full founder strategy set.
const REVIEWER_PROMPTS = [
  "What problem is ZenSolar actually solving?",
  "How does the $0.10 LP-tranche launch work?",
  "What's the patent moat — and why now?",
  "Walk me through the 24-month capital plan.",
];

// Beginner-friendly prompts: intriguing enough to pull people in,
// but answerable without any crypto / tokenomics background.
const PUBLIC_PROMPTS = [
  "What is ZenSolar, in plain English?",
  "How do I actually earn $ZSOLAR?",
  "Why should I care about this?",
  "How big could this get one day?",
];

// Shown when Deason is opened *during* onboarding. Scoped to questions
// a user is most likely to have mid-setup — wallet, OEM connections,
// what gets minted, what's safe. Replaces the founder/insider set
// regardless of persona, since the user is actively setting up.
const ONBOARDING_PROMPTS = [
  "What is a wallet, and is mine safe?",
  "Which OEM should I connect first?",
  "I don't know which brand of inverter I have — help.",
  "I don't know which brand of inverter I have — help.",
  "What happens after I connect my devices?",
];

/**
 * Deason chat surface — used by both the full /deason page and the floating bubble.
 * Persona-aware: shows different welcome copy + suggested prompts depending on
 * whether the viewer is inner-circle or a regular demo/beta user.
 */
export function DeasonChat({ onClose, compact = false, threadId = null, onNewThread, onUserMessage, highlightQuery, threads, onSwitchThread, onViewAllChats }: DeasonChatProps) {
  const { messages, streaming, error, send, reset, seedAssistant, loadingHistory } = useDeason({
    threadId,
    onThreadTouched: onUserMessage,
  });
  const { isInnerCircle } = useUserPersona();
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ dataUrl: string; name: string; kind: "image" | "pdf" } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Array<HTMLDivElement | null>>([]);


  // All message indices matching highlightQuery.
  const matchIndices = useMemo(() => {
    const q = highlightQuery?.trim().toLowerCase();
    if (!q || messages.length === 0) return [] as number[];
    const out: number[] = [];
    messages.forEach((m, i) => {
      const text = typeof m.content === "string"
        ? m.content
        : m.content.map((p) => (p.type === "text" ? p.text ?? "" : "")).join(" ");
      if (text.toLowerCase().includes(q)) out.push(i);
    });
    return out;
  }, [highlightQuery, messages]);

  const [activeMatch, setActiveMatch] = useState(0);
  // Reset cursor when the query or match set changes.
  useEffect(() => {
    setActiveMatch(0);
  }, [highlightQuery, matchIndices.length]);

  const highlightIndex = matchIndices[activeMatch] ?? -1;

  useEffect(() => {
    if (highlightIndex >= 0 && !loadingHistory) {
      const el = messageRefs.current[highlightIndex];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, highlightIndex, loadingHistory]);

  const goPrevMatch = () =>
    setActiveMatch((i) => (matchIndices.length ? (i - 1 + matchIndices.length) % matchIndices.length : 0));
  const goNextMatch = () =>
    setActiveMatch((i) => (matchIndices.length ? (i + 1) % matchIndices.length : 0));

  // Listen for `deason:seed` events from elsewhere in the app (e.g. the
  // OAuth error toast's "Ask Deason" handoff). Pushes a hand-written
  // assistant message into the transcript without a model call.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ assistant?: string }>).detail;
      if (detail?.assistant) seedAssistant(detail.assistant);
    };
    window.addEventListener("deason:seed", handler as EventListener);
    return () => window.removeEventListener("deason:seed", handler as EventListener);
  }, [seedAssistant]);


  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      alert("Please attach a photo (JPG/PNG) or a PDF bill.");
      e.target.value = "";
      return;
    }
    const limitMb = isPdf ? 10 : 8;
    if (file.size > limitMb * 1024 * 1024) {
      alert(`File must be under ${limitMb} MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedFile({
      dataUrl: reader.result as string,
      name: file.name || (isPdf ? "bill.pdf" : "photo"),
      kind: isPdf ? "pdf" : "image",
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input;
    const file = attachedFile;
    setInput("");
    setAttachedFile(null);
    void send(text, file?.dataUrl);
  };


  // /demo* surface is the investor/reviewer context. Force reviewer prompts
  // there regardless of who's logged in (founders viewing the demo see what
  // reviewers see, not the raw insider set).
  const location = useLocation();
  const isDemoSurface = useMemo(
    () => location.pathname === "/demo" || location.pathname.startsWith("/demo/"),
    [location.pathname]
  );

  const isOnboardingSurface = useMemo(
    () => location.pathname.startsWith("/onboarding"),
    [location.pathname]
  );

  const prompts = isOnboardingSurface
    ? ONBOARDING_PROMPTS
    : isDemoSurface
    ? REVIEWER_PROMPTS
    : isInnerCircle
    ? INNER_CIRCLE_PROMPTS
    : PUBLIC_PROMPTS;
  const persistenceLabel = threadId ? "saved" : "ephemeral";
  const headerSubtitle = isOnboardingSurface
    ? `Setup helper · ${persistenceLabel}`
    : isDemoSurface
    ? `Investor preview · ${persistenceLabel}`
    : isInnerCircle
    ? `Inner circle · ${persistenceLabel}`
    : `ZenSolar concierge · ${persistenceLabel}`;
  const welcomeTitle = isOnboardingSurface
    ? "Need a hand setting up?"
    : isDemoSurface
    ? "Ask the founder anything."
    : isInnerCircle
    ? "Ask me anything."
    : "Hey 👋 — how can I help?";
  const welcomeBody = isOnboardingSurface
    ? "I'll walk you through wallets, picking the right OEM, and what happens once your devices are connected. Ask anything — your spot in setup is saved."
    : isDemoSurface
    ? "I'm Joe's AI twin. I'll walk you through the thesis, the tokenomics, the patent moat, and the capital plan — in plain English, on your time."
    : isInnerCircle
    ? "I'm Joe's AI twin. I know the app inside-out — the pivot, the 1T tokenomics, the patent expansion, the LP rounds, the Lyndon/Elon plan, the vault, all of it."
    : "I'm Deason, your ZenSolar guide. Ask me about your tokens, your utility rate plan, or upload a bill and I'll find ways to save you money.";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Deason</div>
            <div className="text-xs text-muted-foreground">{headerSubtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {threads && threads.length > 0 && onSwitchThread && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen((v) => !v)}
              title="Saved conversations"
              className={cn(historyOpen && "bg-amber-500/10 text-amber-600")}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {(!threadId || onNewThread) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={threadId && onNewThread ? onNewThread : reset}
              title={threadId && onNewThread ? "New saved chat" : "New chat"}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Saved conversations panel (floating bubble surface) */}
      {historyOpen && threads && onSwitchThread && (
        <div className="border-b border-border bg-card/80 backdrop-blur px-2 py-2 max-h-[40%] overflow-y-auto">
          <div className="flex items-center justify-between px-1.5 pb-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saved conversations
            </div>
            {onViewAllChats && (
              <button
                type="button"
                onClick={() => { setHistoryOpen(false); onViewAllChats(); }}
                className="flex items-center gap-1 text-[11px] text-amber-600 hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <ul className="space-y-0.5">
            {threads.slice(0, 8).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => { onSwitchThread(t.id); setHistoryOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    t.id === threadId
                      ? "bg-amber-500/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {t.pinned ? (
                    <Pin className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{t.title || "Untitled"}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {new Date(t.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {threads.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No saved chats yet.
            </div>
          )}
        </div>
      )}


      {/* Search match navigator */}
      {matchIndices.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-amber-500/5 px-3 py-1.5 text-xs">
          <div className="text-muted-foreground">
            Match <span className="font-medium text-foreground">{activeMatch + 1}</span> of{" "}
            <span className="font-medium text-foreground">{matchIndices.length}</span>
            {highlightQuery && (
              <span className="ml-2 hidden sm:inline">
                for &ldquo;<span className="text-foreground">{highlightQuery}</span>&rdquo;
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goPrevMatch}
              disabled={matchIndices.length < 2}
              title="Previous match"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goNextMatch}
              disabled={matchIndices.length < 2}
              title="Next match"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingHistory && (
          <div className="flex justify-center py-10">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="mx-auto mt-6 max-w-md text-center">
            <div className="mb-3 text-2xl">{isInnerCircle ? "👋" : "☀️"}</div>
            <h2 className="mb-2 text-lg font-semibold">{welcomeTitle}</h2>
            <p className="text-sm text-muted-foreground">{welcomeBody}</p>
            <div className="mt-4 grid gap-2 text-left text-sm">
              {prompts.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-left hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              ref={(el) => { messageRefs.current[i] = el; }}
              className={cn(
                "flex scroll-mt-20 rounded-xl transition-shadow",
                m.role === "user" ? "justify-end" : "justify-start",
                i === highlightIndex && "ring-2 ring-amber-500/60"
              )}
            >
              <div className={cn("space-y-2", m.role === "user" ? "max-w-[85%]" : "w-full max-w-[92%]")}>
                {(m.content || m.role === "user" || !m.billReport) && (
                  <div
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                      compact ? "text-sm" : "text-[15px]",
                    )}
                  >
                    <MessageContent content={m.content} streaming={streaming && i === messages.length - 1} />
                  </div>
                )}
                {m.billReport && <BillSavingsReport report={m.billReport} />}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="border-t border-border bg-card px-3 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
            {attachedFile.kind === "image" ? (
              <img src={attachedFile.dataUrl} alt={attachedFile.name} className="h-12 w-12 rounded object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-xs text-muted-foreground">
              <div className="truncate font-medium text-foreground">{attachedFile.name}</div>
              <div>
                {attachedFile.kind === "pdf"
                  ? "PDF attached — I'll read it and look for savings."
                  : "Photo attached — add a note so I know what to look for."}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachedFile(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          {!isInnerCircle && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="hidden"
                onChange={onPickFile}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                title="Attach a bill (PDF/photo) or equipment photo"
                disabled={streaming}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={isInnerCircle ? "Ask Deason anything…" : "Ask about your tokens, rate plan, or attach a bill/photo…"}
            rows={1}
            className="min-h-[44px] resize-none"
            disabled={streaming}
          />
          <Button type="submit" size="icon" disabled={streaming || (!input.trim() && !attachedFile)}>
            <Send className="h-4 w-4" />
          </Button>

        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {threadId
            ? (isInnerCircle ? "Saved to your account." : "Saved to your account · 50 messages/day")
            : (isInnerCircle ? "Conversations are not saved." : "Conversations are not saved · 50 messages/day")}
        </p>
      </form>
    </div>
  );
}

function MessageContent({
  content,
  streaming,
}: {
  content: string | DeasonContentPart[];
  streaming: boolean;
}) {
  if (typeof content === "string") {
    return <>{content || (streaming ? "…" : "")}</>;
  }
  return (
    <div className="space-y-2">
      {content.map((part, idx) => {
        if (part.type === "text") return <div key={idx}>{part.text}</div>;
        if (part.type === "image_url" && part.image_url?.url) {
          return (
            <div key={idx} className="flex items-center gap-2 text-xs opacity-80">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Bill image attached</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
