import { useMemo, useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

/**
 * $ZSOLAR Appreciation Calculator — illustrative, not a forecast.
 * Slider sets a sample stake size; table projects value at the four
 * canonical price points from locked tokenomics.
 */
const PRICE_POINTS: Array<{ label: string; price: number; note: string }> = [
  { label: 'Launch', price: 0.10, note: 'LP-seeded' },
  { label: '$1', price: 1, note: '10×' },
  { label: '$6.67', price: 6.67, note: 'Founder unlock #1' },
  { label: '$20', price: 20, note: 'Founder unlock #2' },
];

export function AppreciationCalculator() {
  const [stake, setStake] = useState<number>(10_000);

  const rows = useMemo(
    () => PRICE_POINTS.map((p) => ({
      ...p,
      value: stake * p.price,
    })),
    [stake]
  );

  return (
    <section className="mx-auto max-w-3xl px-5 pb-12">
      <div className="rounded-3xl border border-border/60 bg-card/40 p-6 md:p-7">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-secondary" />
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            $ZSOLAR Appreciation Calculator
          </h2>
        </div>
        <p className="text-[12px] text-muted-foreground mt-1">
          Move the slider to see how a sample $ZSOLAR position projects at four canonical price points.
        </p>

        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Sample stake</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {stake.toLocaleString()} <span className="text-xs text-muted-foreground">$ZSOLAR</span>
            </span>
          </div>
          <Slider
            value={[stake]}
            min={1_000}
            max={1_000_000}
            step={1_000}
            onValueChange={(v) => setStake(v[0] ?? 10_000)}
            aria-label="Sample stake"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1K</span><span>250K</span><span>500K</span><span>1M</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 overflow-hidden">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 ${i < rows.length - 1 ? 'border-b border-border/40' : ''} ${i === rows.length - 1 ? 'bg-secondary/5' : ''}`}
            >
              <div>
                <div className="text-[13px] font-medium text-foreground">{r.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{r.note}</div>
              </div>
              <div className="text-[12px] text-muted-foreground tabular-nums">${r.price.toFixed(2)}</div>
              <div className="text-[14px] font-semibold tabular-nums text-secondary inline-flex items-center gap-1">
                {i > 0 && <TrendingUp className="h-3 w-3" />}
                ${r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground/80">
          Illustrative only — not a forecast or offer to sell securities. $ZSOLAR is a utility token; future price is not guaranteed.
        </p>
      </div>
    </section>
  );
}
