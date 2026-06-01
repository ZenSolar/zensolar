import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  monthLabel: string;
  co2Tons: number;
  dollarsSaved: number;
  bonusTokens: number;
}

/**
 * Share-my-month button. Uses native Web Share API when available,
 * falls back to clipboard. No new dependencies.
 */
export function ShareMonthButton({ monthLabel, co2Tons, dollarsSaved, bonusTokens }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const summary =
    `My ${monthLabel} clean-energy month:\n` +
    `• ${co2Tons.toFixed(2)} tons CO₂ avoided\n` +
    `• $${Math.round(dollarsSaved).toLocaleString()} in bill savings\n` +
    `• +${Math.round(bonusTokens).toLocaleString()} $ZSOLAR minted (1 kWh = 1 $ZSOLAR)\n` +
    `\nTracked with Deason on Zen Solar — https://beta.zen.solar`;

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title: `Zen Solar · ${monthLabel}`, text: summary });
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to clipboard.
    }
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast({ title: "Copied to clipboard", description: "Paste it anywhere to share." });
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't copy",
        description: "Long-press the report to share manually.",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card py-2 text-xs font-medium text-foreground hover:bg-accent"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Share my month"}
    </button>
  );
}
