import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Send, Sparkles, RotateCcw, X, Paperclip, Image as ImageIcon, ChevronUp, ChevronDown, Save, FileText, ArrowRight, MessageSquare, Pin, PinOff, Pencil, Trash2, Check } from "lucide-react";

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
  /** Rename a saved thread. */
  onRenameThread?: (id: string, title: string) => void | Promise<void>;
  /** Delete a saved thread. */
  onDeleteThread?: (id: string) => void | Promise<void>;
  /** Toggle pin on a saved thread. */
  onTogglePinThread?: (id: string) => void | Promise<void>;
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
export function DeasonChat({ onClose, compact = false, threadId = null, onNewThread, onUserMessage, highlightQuery, threads, onSwitchThread, onViewAllChats, onRenameThread, onDeleteThread, onTogglePinThread }: DeasonChatProps) {
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

  const activeThread = threads?.find((t) => t.id === threadId);
  const headerTitle = activeThread?.title || "Deason";

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{headerTitle}</div>
            <div className="truncate text-[11px] text-muted-foreground leading-tight">{headerSubtitle}</div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {threads && threads.length > 0 && onSwitchThread && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen((v) => !v)}
              title="Saved conversations"
              className={cn("h-9 w-9", historyOpen && "bg-amber-500/10 text-amber-600")}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          {(!threadId || onNewThread) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={threadId && onNewThread ? onNewThread : reset}
              title={threadId && onNewThread ? "New saved chat" : "New chat"}
              className="h-9 w-9"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} title="Close" className="h-9 w-9">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

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
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={goPrevMatch} disabled={matchIndices.length < 2} title="Previous match">
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={goNextMatch} disabled={matchIndices.length < 2} title="Next match">
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        {loadingHistory && (
          <div className="flex justify-center py-10">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="mx-auto mt-4 max-w-md text-center">
            <div className="mb-3 text-2xl">{isInnerCircle ? "👋" : "☀️"}</div>
            <h2 className="mb-2 text-lg font-semibold">{welcomeTitle}</h2>
            <p className="text-sm text-muted-foreground">{welcomeBody}</p>
            <div className="mt-4 grid gap-2 text-left text-sm">
              {prompts.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
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
              <div className={cn("space-y-2", m.role === "user" ? "max-w-[85%]" : "w-full")}>
                {(m.content || m.role === "user" || !m.billReport) && (
                  <div
                    className={cn(
                      "whitespace-pre-wrap leading-relaxed",
                      m.role === "user"
                        ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground"
                        : "text-foreground",
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
          {streaming && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content && (
            <div className="flex items-center gap-1.5 px-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" />
            </div>
          )}
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
        className="border-t border-border/60 bg-card px-3 pt-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.625rem)" }}
      >
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
            {attachedFile.kind === "image" ? (
              <img src={attachedFile.dataUrl} alt={attachedFile.name} className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                <FileText className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-xs text-muted-foreground">
              <div className="truncate font-medium text-foreground">{attachedFile.name}</div>
              <div className="truncate">
                {attachedFile.kind === "pdf"
                  ? "PDF attached — I'll read it and look for savings."
                  : "Photo attached — add a note so I know what to look for."}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachedFile(null)} className="h-7 w-7">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-background px-1.5 py-1 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 transition-colors">
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
            title="Attach a bill, equipment photo, or error-code screenshot (PDF or image)"
            disabled={streaming}
            className="h-9 w-9 flex-shrink-0 rounded-full"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={isInnerCircle ? "Ask Deason anything…" : "Ask about tokens, your rate plan, or attach a bill…"}
            rows={1}
            className="min-h-[40px] max-h-32 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={streaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={streaming || (!input.trim() && !attachedFile)}
            className="h-9 w-9 flex-shrink-0 rounded-full bg-amber-500 text-black hover:bg-amber-400 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          {threadId
            ? (isInnerCircle ? "Saved to your account." : "Saved to your account · 50 messages/day")
            : (isInnerCircle ? "Conversations are not saved." : "Conversations are not saved · 50 messages/day")}
        </p>
      </form>

      {/* Saved conversations — slide-in overlay (does NOT compress the transcript) */}
      {historyOpen && threads && onSwitchThread && (
        <>
          <button
            type="button"
            aria-label="Close saved conversations"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 z-30 bg-background/60 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="absolute inset-x-0 top-0 z-40 flex max-h-full flex-col border-b border-border bg-card shadow-xl animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Saved conversations</span>
                <span className="text-xs text-muted-foreground">({threads.length})</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryOpen(false)} title="Close">
                <X className="h-4 w-4" />
              </Button>
            <ul className="flex-1 overflow-y-auto p-2">
              {threads.length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-muted-foreground">No saved chats yet.</li>
              )}
              {threads.map((t) => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  active={t.id === threadId}
                  onSelect={() => { onSwitchThread(t.id); setHistoryOpen(false); }}
                  onRename={onRenameThread ? (title) => onRenameThread(t.id, title) : undefined}
                  onDelete={onDeleteThread ? () => onDeleteThread(t.id) : undefined}
                  onTogglePin={onTogglePinThread ? () => onTogglePinThread(t.id) : undefined}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function ThreadRow({
  thread: t,
  active,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}: {
  thread: DeasonThread;
  active: boolean;
  onSelect: () => void;
  onRename?: (title: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onTogglePin?: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(t.title || "Untitled");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const commit = async () => {
    const next = draft.trim();
    if (next && next !== t.title && onRename) await onRename(next);
    setEditing(false);
  };

  return (
    <li>
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
          active ? "bg-amber-500/15 text-foreground" : "text-foreground/90 hover:bg-accent",
        )}
      >
        {t.pinned ? (
          <Pin className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
        ) : (
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commit();
                if (e.key === "Escape") { setEditing(false); setDraft(t.title || "Untitled"); }
              }}
              className="flex-1 min-w-0 rounded bg-background/60 px-1.5 py-1 text-sm outline-none ring-1 ring-amber-500/40 focus:ring-amber-500"
              maxLength={80}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void commit()} title="Save name">
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(false); setDraft(t.title || "Untitled"); }} title="Cancel">
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSelect}
              className="flex flex-1 min-w-0 items-center gap-2 text-left"
            >
              <span className="flex-1 truncate">{t.title || "Untitled"}</span>
              <span className="text-[10px] text-muted-foreground/70">
                {new Date(t.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </button>
            {onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                onClick={(e) => { e.stopPropagation(); void onTogglePin(); }}
                title={t.pinned ? "Unpin" : "Pin"}
              >
                {t.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </Button>
            )}
            {onRename && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                title="Rename"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", confirmDelete ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirmDelete) { void onDelete(); setConfirmDelete(false); }
                  else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); }
                }}
                title={confirmDelete ? "Tap again to confirm" : "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </li>
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
