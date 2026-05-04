import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bitcoin,
  Sparkles,
  Infinity as InfinityIcon,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';

/**
 * Proof-of-Genesis™ Thesis
 *
 * The headline NDA-only narrative: why $ZSOLAR is built to eclipse Bitcoin's
 * market cap by 5x–10x. Lives at the bottom of the Tokenomics tab as the
 * climax of the page.
 *
 * Numbers are intentionally hardcoded snapshots — bump the three constants
 * below together when you want to refresh.
 */

const BTC_MCAP_LABEL = '$1.9T';
const BTC_MCAP_AS_OF = 'April 2026';

// Honest, defensible target range for $ZSOLAR best-case execution.
// We do NOT need to beat Bitcoin to win — top-5 status is the prize.
const TARGET_LOW_B = 100; // $100B
const TARGET_HIGH_B = 500; // $500B

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
    btc: 'Net-neutral. Burns power to secure value.',
    zen: 'Net-positive. Rewards the energy transition itself.',
  },
  {
    axis: 'Value driver',
    btc: 'Speculation + scarcity narrative',
    zen: 'Physics + math + utility',
  },
];

export function ProofOfGenesisThesis() {

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="space-y-5 sm:space-y-6"
      aria-labelledby="pog-thesis-title"
    >
      {/* ===== Section divider — stacked on mobile, inline on sm+ ===== */}
      <div className="pt-6 sm:pt-8">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-3 py-1 whitespace-nowrap"
          >
            NDA · Confidential Thesis
          </Badge>
          <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {/* Mobile divider — full width below the badge */}
          <div className="sm:hidden h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>

      {/* ===== Headline / Manifesto Card ===== */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(ellipse at top right, hsl(var(--primary) / 0.18), transparent 60%)',
          }}
          aria-hidden
        />
        <CardHeader className="relative pb-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col items-start gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <CardTitle
                id="pog-thesis-title"
                className="text-[22px] sm:text-3xl font-bold leading-[1.15] tracking-tight"
              >
                Proof-of-Genesis™ Thesis
              </CardTitle>
              <p className="text-[13px] sm:text-sm text-muted-foreground leading-snug">
                Why $ZSOLAR has a credible path to{' '}
                <span className="text-primary font-semibold">top-5 status ($100B–$500B)</span> —
                without needing to dethrone Bitcoin.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="text-[14.5px] sm:text-[15px] leading-relaxed text-foreground/90">
            Bitcoin is scarce because of <span className="font-semibold">PoW</span>{' '}
            (Proof-of-Work) and math. ZenSolar is{' '}
            <span className="font-semibold text-primary">
              infinitely productive — and good for civilization
            </span>{' '}
            — because of <span className="font-semibold">PoG™</span> (Proof-of-Genesis),
            physics, and math.
          </p>
          <p className="text-[14.5px] sm:text-[15px] leading-relaxed text-foreground/80">
            Bitcoin secures value by{' '}
            <span className="text-foreground font-medium">burning</span> energy.
            ZenSolar mints value by{' '}
            <span className="text-foreground font-medium">verifying clean energy was created</span>.
            One is extractive. The other is additive. Markets eventually price that difference.
          </p>
        </CardContent>
      </Card>

      {/* ===== Side-by-side Comparison ===== */}
      <Card className="overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
          <CardTitle className="text-[17px] sm:text-xl flex items-center gap-2 leading-tight">
            <Shield className="h-4.5 w-4.5 text-primary shrink-0" />
            Bitcoin vs $ZSOLAR
          </CardTitle>
          <p className="text-[12px] text-muted-foreground mt-1">Head to head, axis by axis.</p>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {/* ---------- Mobile: vertical pairs ---------- */}
          <div className="sm:hidden">
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.axis}
                className={`px-5 py-4 space-y-2.5 ${
                  i !== 0 ? 'border-t border-border/50' : ''
                }`}
              >
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/90">
                  {row.axis}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bitcoin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Bitcoin
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-snug text-foreground/75">{row.btc}</p>
                  </div>
                  <div className="rounded-lg border border-primary/35 bg-primary/[0.07] px-3 py-2.5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.05)]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-primary">
                        $ZSOLAR
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-snug text-foreground font-medium">
                      {row.zen}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ---------- Desktop: 3-column table ---------- */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1fr_1.5fr_1.5fr] gap-px bg-border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Axis
              </div>
              <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Bitcoin
                </span>
              </div>
              <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  $ZSOLAR
                </span>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.axis} className="contents">
                  <div className="bg-card px-4 py-3.5 text-sm font-medium text-foreground/90">
                    {row.axis}
                  </div>
                  <div className="bg-card px-4 py-3.5 text-sm text-foreground/75 leading-snug">
                    {row.btc}
                  </div>
                  <div className="bg-card px-4 py-3.5 text-sm text-foreground leading-snug">
                    {row.zen}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 5x–10x Math — the climax ===== */}
      <Card className="border-primary/25 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at bottom left, hsl(var(--primary) / 0.14), transparent 65%)',
          }}
          aria-hidden
        />
        <CardHeader className="relative px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
          <CardTitle className="text-[17px] sm:text-xl flex items-center gap-2 leading-tight">
            <InfinityIcon className="h-4.5 w-4.5 text-primary shrink-0" />
            The 5x–10x Math
          </CardTitle>
          <p className="text-[11.5px] text-muted-foreground mt-1.5 leading-snug">
            BTC market cap as of {BTC_MCAP_AS_OF} · hardcoded reference snapshot
          </p>
        </CardHeader>

        <CardContent className="relative space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
          {/* Hero number block */}
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent px-5 py-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80 mb-2">
              Target Range
            </p>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent leading-none">
                5–10×
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-2.5 leading-snug">
              Bitcoin's current market capitalization
            </p>
          </div>

          {/* Bars */}
          <div className="space-y-4 pt-1">
            {/* Bitcoin baseline */}
            <BarRow
              label="Bitcoin today"
              value={`~${BTC_MCAP_LABEL}`}
              icon={<Bitcoin className="h-3.5 w-3.5 text-muted-foreground" />}
              widthPct={10}
              barClass="bg-muted-foreground/45"
              labelClass="text-foreground/75"
              valueClass="text-foreground/75"
            />
            {/* 5x */}
            <BarRow
              label="$ZSOLAR · 5× target"
              value={`~$${target5x}T`}
              icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />}
              widthPct={50}
              barClass="bg-gradient-to-r from-primary/70 to-primary"
              labelClass="text-foreground"
              valueClass="text-primary"
            />
            {/* 10x */}
            <BarRow
              label="$ZSOLAR · 10× target"
              value={`~$${target10x}T`}
              icon={<Zap className="h-3.5 w-3.5 text-primary" />}
              widthPct={100}
              barClass="bg-gradient-to-r from-primary via-primary to-accent shadow-[0_0_16px_hsl(var(--primary)/0.45)]"
              labelClass="text-foreground"
              valueClass="text-primary"
              emphasized
            />
          </div>

          {/* "Why this isn't hand-wavy" */}
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3.5 mt-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary mb-1.5">
              Why this isn't hand-wavy
            </p>
            <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-foreground/85">
              Bitcoin's mcap is essentially "the price the market pays for digital scarcity." The
              global energy market is{' '}
              <span className="font-semibold text-foreground">
                orders of magnitude larger
              </span>{' '}
              than digital scarcity — and $ZSOLAR is the first token cryptographically anchored to
              real energy production. Capturing even a sliver of that value flow is what gets us to
              5×–10×.
            </p>
          </div>

          {/* Disclaimer footer */}
          <p className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground/70 text-center pt-1 leading-relaxed">
            Forward-looking thesis · Not financial advice
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> · </span>
            Confidential under NDA
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
}

/* ---------- Sub-components ---------- */

function BarRow({
  label,
  value,
  icon,
  widthPct,
  barClass,
  labelClass,
  valueClass,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  widthPct: number;
  barClass: string;
  labelClass: string;
  valueClass: string;
  emphasized?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">{icon}</span>
          <span className={`text-[12.5px] sm:text-sm font-semibold truncate ${labelClass}`}>
            {label}
          </span>
        </div>
        <span
          className={`text-[15px] sm:text-base font-bold tabular-nums shrink-0 ${valueClass}`}
        >
          {value}
        </span>
      </div>
      <div
        className={`rounded-full bg-muted overflow-hidden ${
          emphasized ? 'h-3.5' : 'h-2.5'
        }`}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${widthPct}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}
