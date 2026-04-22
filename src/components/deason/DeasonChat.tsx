import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RotateCcw, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeason, type DeasonContentPart } from "@/hooks/useDeason";
import { useUserPersona } from "@/hooks/useUserPersona";
import { cn } from "@/lib/utils";

interface DeasonChatProps {
  onClose?: () => void;
  compact?: boolean;
}

const INNER_CIRCLE_PROMPTS = [
  "Why did we move from 10B to 1T tokens?",
  "Walk me through the LP tranche launch.",
  "Why does the patent now cover Starlink + SpaceX?",
  "What's the pitch to Lyndon → Elon?",
];

const PUBLIC_PROMPTS = [
  "Where does the value of $ZSOLAR come from?",
  "Is it smarter to hold or sell my tokens?",
  "What utility rate plan should I be on?",
  "Help me find savings on my electric bill.",
];

/**
 * Deason chat surface — used by both the full /deason page and the floating bubble.
 * Persona-aware: shows different welcome copy + suggested prompts depending on
 * whether the viewer is inner-circle or a regular demo/beta user.
 */
export function DeasonChat({ onClose, compact = false }: DeasonChatProps) {
  const { messages, streaming, error, send, reset } = useDeason();
  const { isInnerCircle } = useUserPersona();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Bill image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input;
    const image = attachedImage;
    setInput("");
    setAttachedImage(null);
    void send(text, image ?? undefined);
  };

  const prompts = isInnerCircle ? INNER_CIRCLE_PROMPTS : PUBLIC_PROMPTS;
  const headerSubtitle = isInnerCircle ? "Inner circle · ephemeral" : "ZenSolar concierge · ephemeral";
  const welcomeTitle = isInnerCircle ? "Ask me anything." : "Hey 👋 — how can I help?";
  const welcomeBody = isInnerCircle
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
          <Button variant="ghost" size="icon" onClick={reset} title="New chat">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
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
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  compact ? "text-sm" : "text-[15px]",
                )}
              >
                <MessageContent content={m.content} streaming={streaming && i === messages.length - 1} />
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
      <form onSubmit={onSubmit} className="border-t border-border bg-card p-3">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
            <img src={attachedImage} alt="Attached bill" className="h-12 w-12 rounded object-cover" />
            <div className="flex-1 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Bill attached</div>
              <div>I'll analyze it and look for savings.</div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachedImage(null)}>
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
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                title="Upload utility bill"
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
            placeholder={isInnerCircle ? "Ask Deason anything…" : "Ask about your tokens, rate plan, or bill…"}
            rows={1}
            className="min-h-[44px] resize-none"
            disabled={streaming}
          />
          <Button type="submit" size="icon" disabled={streaming || (!input.trim() && !attachedImage)}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {isInnerCircle ? "Conversations are not saved." : "Conversations are not saved · 50 messages/day"}
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
