import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bitcoin, Sparkles, ArrowRight, Infinity as InfinityIcon } from 'lucide-react';

/**
 * Proof-of-Genesis™ Thesis
 *
 * The headline NDA-only narrative: why $ZSOLAR is built to eclipse Bitcoin's
 * market cap by 5x–10x. Lives at the bottom of the Tokenomics tab as the
 * climax of the page.
 *
 * Numbers are intentionally hardcoded snapshots — bump `BTC_MCAP_LABEL`
 * and `BTC_MCAP_AS_OF` together when you want to refresh.
 */

const BTC_MCAP_LABEL = '$1.9T';
const BTC_MCAP_AS_OF = 'April 2026';
const BTC_MCAP_NUMERIC = 1.9; // trillions, used for the math display

const COMPARISON_ROWS: Array<{
  axis: string;
  btc: string;
  zen: string;
}> = [
  {
    axis: 'Consensus',
    btc: 'PoW (Proof-of-Work)',
    zen: 'PoG™ (Proof-of-Genesis)',
  },
  {
    axis: 'Anchored to',
    btc: 'Compute + electricity burn',
    zen: 'Verified clean energy production',
  },
  {
    axis: 'Supply behavior',
    btc: 'Scarce — capped at 21M',
    zen: 'Infinitely productive — capped at 1T, minted only by real kWh',
  },
  {
    axis: 'Civilizational impact',
    btc: 'Net-neutral. Consumes power to secure value.',
    zen: 'Net-positive. Rewards the energy transition itself.',
  },
  {
    axis: 'Value driver',
    btc: 'Speculation + scarcity narrative',
    zen: 'Physics + math + utility',
  },
];

export function ProofOfGenesisThesis() {
  const target5x = (BTC_MCAP_NUMERIC * 5).toFixed(1);
  const target10x = (BTC_MCAP_NUMERIC * 10).toFixed(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
      aria-labelledby="pog-thesis-title"
    >
      {/* Section divider */}
      <div className="flex items-center gap-4 pt-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/5 text-primary uppercase tracking-widest text-[10px] font-bold px-3 py-1"
        >
          NDA · Confidential Thesis
        </Badge>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Headline card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(ellipse at top right, hsl(var(--primary) / 0.18), transparent 60%)',
          }}
        />
        <CardHeader className="relative">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-primary/15 border border-primary/30 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle
                id="pog-thesis-title"
                className="text-2xl sm:text-3xl font-bold leading-tight"
              >
                Proof-of-Genesis™ Thesis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5">
                Why $ZSOLAR is engineered to eclipse Bitcoin's market cap by{' '}
                <span className="text-primary font-semibold">5x to 10x</span>.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <p className="text-[15px] leading-relaxed text-foreground/90">
            Bitcoin is scarce because of <span className="font-semibold">PoW</span> (Proof-of-Work)
            and math. ZenSolar is{' '}
            <span className="font-semibold text-primary">infinitely productive — and good for civilization</span>{' '}
            — because of <span className="font-semibold">PoG™</span> (Proof-of-Genesis), physics, and math.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80">
            Bitcoin secures value by burning energy. ZenSolar mints value by{' '}
            <span className="text-foreground font-medium">verifying clean energy was created</span>.
            One is extractive. The other is additive. Markets eventually price that difference.
          </p>
        </CardContent>
      </Card>

      {/* Side-by-side comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Bitcoin vs $ZSOLAR — head to head</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Mobile: stacked rows. Desktop: 3-column grid */}
          <div className="divide-y sm:divide-y-0 sm:hidden">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.axis} className="px-4 py-4 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {row.axis}
                </p>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Bitcoin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Bitcoin
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">{row.btc}</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/[0.06] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      $ZSOLAR
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{row.zen}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1fr_1.5fr_1.5fr] gap-px bg-border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Axis
              </div>
              <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Bitcoin
                </span>
              </div>
              <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  $ZSOLAR
                </span>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <>
                  <div key={`${row.axis}-axis`} className="bg-card px-4 py-3 text-sm font-medium text-foreground/90">
                    {row.axis}
                  </div>
                  <div key={`${row.axis}-btc`} className="bg-card px-4 py-3 text-sm text-foreground/75">
                    {row.btc}
                  </div>
                  <div key={`${row.axis}-zen`} className="bg-card px-4 py-3 text-sm text-foreground">
                    {row.zen}
                  </div>
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5x–10x math visual */}
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <InfinityIcon className="h-5 w-5 text-primary" />
            The 5x–10x Math
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            BTC market cap as of {BTC_MCAP_AS_OF} · hardcoded reference snapshot
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Bitcoin baseline bar */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground/80">Bitcoin today</span>
              </div>
              <span className="text-base font-bold text-foreground/80 tabular-nums">
                ~{BTC_MCAP_LABEL}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[10%] bg-muted-foreground/40 rounded-full" />
            </div>
          </div>

          {/* 5x target */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">$ZSOLAR · 5x target</span>
              </div>
              <span className="text-base font-bold text-primary tabular-nums">
                ~${target5x}T
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[50%] bg-gradient-to-r from-primary/60 to-primary rounded-full" />
            </div>
          </div>

          {/* 10x target */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">$ZSOLAR · 10x target</span>
              </div>
              <span className="text-base font-bold text-primary tabular-nums">
                ~${target10x}T
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
            </div>
          </div>

          {/* Why-it-lands footer */}
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 mt-4">
            <p className="text-[13px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-primary">Why this isn't hand-wavy:</span>{' '}
              Bitcoin's mcap is essentially "the price the market pays for digital scarcity." The
              global energy market is{' '}
              <span className="font-semibold text-foreground">orders of magnitude larger</span>{' '}
              than digital scarcity — and $ZSOLAR is the first token cryptographically anchored to
              real energy production. Capturing even a sliver of that value flow is what gets us to
              5x–10x.
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 text-center pt-1">
            Forward-looking thesis · Not financial advice · Confidential under NDA
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
}
