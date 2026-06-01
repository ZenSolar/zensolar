import { Coins } from "lucide-react";

interface Props {
  dollarsSaved: number;
  bonusTokens: number;
}

/**
 * Compact bill-savings strip: $ saved + $ZSOLAR minted equivalent.
 * Surfaces the 401(k)-match framing without exposing backend mint split.
 */
export function BillSavingsStrip({ dollarsSaved, bonusTokens }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent px-3.5 py-2.5">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-amber-300/80">
          You kept in your pocket
        </div>
        <div className="text-xl font-semibold tabular-nums text-foreground">
          ${Math.round(dollarsSaved).toLocaleString()}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-amber-300/80">
          <Coins className="h-3 w-3" /> Bonus
        </div>
        <div className="text-xl font-semibold tabular-nums text-amber-300">
          +{Math.round(bonusTokens).toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground">$ZSOLAR · 1:1 match</div>
      </div>
    </div>
  );
}
