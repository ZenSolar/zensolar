import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeason } from "@/hooks/useDeason";
import { cn } from "@/lib/utils";

interface DeasonChatProps {
  onClose?: () => void;
  compact?: boolean;
}

/**
 * Deason chat surface — used by both the full /deason page and the floating bubble.
 */
export function DeasonChat({ onClose, compact = false }: DeasonChatProps) {
  const { messages, streaming, error, send, reset } = useDeason();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input;
    setInput("");
    void send(text);
  };

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
            <div className="text-xs text-muted-foreground">
              Founders-only · ephemeral
            </div>
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
          <div className="mx-auto mt-8 max-w-md text-center">
            <div className="mb-3 text-2xl">👋</div>
            <h2 className="mb-2 text-lg font-semibold">Ask me anything.</h2>
            <p className="text-sm text-muted-foreground">
              I'm Joe's AI twin. I know the app inside-out — the pivot, the 1T tokenomics,
              the patent expansion, the LP rounds, the Lyndon/Elon plan, the vault, all of it.
            </p>
            <div className="mt-4 grid gap-2 text-left text-sm">
              {[
                "Why did we move from 10B to 1T tokens?",
                "Walk me through the LP tranche launch.",
                "Why does the patent now cover Starlink + SpaceX?",
                "What's the pitch to Lyndon → Elon?",
              ].map((q) => (
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
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                  compact ? "text-sm" : "text-[15px]",
                )}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
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
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask Deason anything…"
            rows={1}
            className="min-h-[44px] resize-none"
            disabled={streaming}
          />
          <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Conversations are not saved.
        </p>
      </form>
    </div>
  );
}
