import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline error/retry card shown when the floating-bubble thread couldn't be
 * prepared. Gives the user a clean retry path AND a degraded "ephemeral mode"
 * fallback so they can still talk to Deason without saved history.
 */
export function BubbleErrorCard({
  onRetry,
  onContinueEphemeral,
  message,
}: {
  onRetry: () => void;
  onContinueEphemeral: () => void;
  message?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-5 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-medium">Couldn't start a saved chat</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {message ?? "Network hiccup or the chat service didn't respond. You can retry, or continue in ephemeral mode — this conversation just won't be saved."}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Button
          size="sm"
          className="h-8 bg-amber-500 text-black hover:bg-amber-400"
          onClick={onRetry}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try again
        </Button>
        <button
          type="button"
          onClick={onContinueEphemeral}
          className="inline-flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-3 w-3" /> Continue without saving
        </button>
      </div>
    </div>
  );
}
