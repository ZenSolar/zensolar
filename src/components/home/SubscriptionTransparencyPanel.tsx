import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Building2, Receipt, ArrowDownUp, TrendingUp } from 'lucide-react';

// Two-tier subscription assumptions
const BASE_PRICE = 9.99;
const AUTOMINT_PRICE = 19.99;
const AUTOMINT_ATTACH = 0.30; // 30% of subs choose Auto-Mint
const BLENDED_ARPU =
  BASE_PRICE * (1 - AUTOMINT_ATTACH) + AUTOMINT_PRICE * AUTOMINT_ATTACH; // $12.99

// LP seed mechanics (per memory: $200K USDC + 2M $ZSOLAR per launch tranche; $0.10 floor)
const SEED_USDC = 200_000;
const SEED_ZSOLAR_LP = 2_000_000;
const TRANCHE_USDC = 200_000;
const TRANCHE_ZSOLAR = 2_000_000;

// Conservative floor projection:
// - One new LP tranche per wave (matches launch model)
// - 1yr of subs LP injection at each wave's user count adds USDC (no new ZSOLAR on that side)
// - Floor = cumulative USDC / cumulative LP-side ZSOLAR
type Wave = { id: string; name: string; users: number };
const WAVES: Wave[] = [
  { id: 'W1', name: 'Genesis', users: 1_000 },
  { id: 'W2', name: 'Founders', users: 5_000 },
  { id: 'W3', name: 'Pioneers', users: 25_000 },
  { id: 'W4', name: 'Builders', users: 100_000 },
  { id: 'W5', name: 'Network', users: 300_000 },
  { id: 'W6', name: 'Expansion', users: 600_000 },
  { id: 'W7', name: 'Mass', users: 1_000_000 },
];

function buildWaveMath() {
  let usdc = SEED_USDC;
  let zsolarLp = SEED_ZSOLAR_LP;
  return WAVES.map((w) => {
    usdc += TRANCHE_USDC;
    zsolarLp += TRANCHE_ZSOLAR;
    const lpInjectYr = w.users * BLENDED_ARPU * 12 * 0.5;
    usdc += lpInjectYr;
    const floor = usdc / zsolarLp;
    return { ...w, lpInjectYr, cumUsdc: usdc, cumZsolar: zsolarLp, floor };
  });
}
const WAVE_MATH = buildWaveMath();
const FLOOR_AT_1M = WAVE_MATH[WAVE_MATH.length - 1].floor;

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtFloor = (n: number) =>
  n >= 10 ? `$${n.toFixed(2)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;

const fmtNum = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)}K`
    : n.toString();


export function SubscriptionTransparencyPanel() {
  return (
    <section className="py-[clamp(2rem,6vw,4rem)]">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <Badge
            variant="outline"
            className="px-3 py-1 border-eco/40 bg-eco/10 text-eco font-medium mb-3"
          >
            Full Transparency
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Where Your Subscription Goes
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Every dollar splits cleanly in two. Half builds the floor under{' '}
            <span className="text-foreground font-medium">$ZSOLAR</span>. Half
            keeps the lights on. No mystery, no marketing budgets, no executive
            bonuses — the math is the same whether you pay $9.99 or $19.99.
          </p>
        </div>

        {/* The 50/50 split visual */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <Card className="p-5 md:p-6 border-border/60 bg-gradient-to-br from-card via-card to-muted/10">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-4">
              <Receipt className="h-3.5 w-3.5" />
              Your $1 Subscription Dollar
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* LP side */}
              <div className="rounded-xl border border-eco/40 bg-eco/[0.06] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-eco" />
                  <span className="text-[10px] uppercase tracking-widest text-eco font-semibold">
                    50% → Liquidity Pool
                  </span>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  $0.50
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Injected as USDC into the $ZSOLAR LP. Raises the price floor
                  for every holder — including you.
                </p>
              </div>

              {/* Fiat side */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-foreground/80" />
                  <span className="text-[10px] uppercase tracking-widest text-foreground/80 font-semibold">
                    50% → Company Ops
                  </span>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  $0.50
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Engineering, hardware integrations, patent, legal, support —
                  plus <span className="text-foreground font-medium">gas sponsorship</span>{' '}
                  so users never pay to mint. Pure runway, no VC, no dilution.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ArrowDownUp className="h-3 w-3" />
              <span>
                Same split applies to the{' '}
                <span className="text-foreground font-medium">$9.99 Base</span>{' '}
                and{' '}
                <span className="text-foreground font-medium">
                  $19.99 Auto-Mint
                </span>{' '}
                tiers
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Per-wave math table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-4 md:p-5 border-border/60">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                The Math · 7 Waves to 1M Users
              </p>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Blended ARPU{' '}
                <span className="text-foreground font-semibold">$12.99/mo</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-[11px] md:text-xs tabular-nums">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[9px] md:text-[10px]">
                  <tr>
                    <th className="text-left px-2 md:px-3 py-2">Wave</th>
                    <th className="text-right px-2 md:px-3 py-2">Subs</th>
                    <th className="text-right px-2 md:px-3 py-2">Mo Rev</th>
                    <th className="text-right px-2 md:px-3 py-2 text-eco">
                      → LP/mo
                    </th>
                    <th className="text-right px-2 md:px-3 py-2">→ Co/mo</th>
                    <th className="hidden sm:table-cell text-right px-2 md:px-3 py-2 text-eco">
                      LP/yr
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {WAVES.map((w) => {
                    const monthly = w.users * BLENDED_ARPU;
                    const lpMo = monthly * 0.5;
                    const coMo = monthly * 0.5;
                    const lpYr = lpMo * 12;
                    return (
                      <tr key={w.id} className="border-t border-border/40">
                        <td className="px-2 md:px-3 py-2">
                          <span className="text-muted-foreground font-mono mr-1.5">
                            {w.id}
                          </span>
                          <span className="text-foreground">{w.name}</span>
                        </td>
                        <td className="text-right px-2 md:px-3 py-2 text-foreground">
                          {fmtNum(w.users)}
                        </td>
                        <td className="text-right px-2 md:px-3 py-2 text-foreground">
                          {fmtUsd(monthly)}
                        </td>
                        <td className="text-right px-2 md:px-3 py-2 text-eco font-semibold">
                          {fmtUsd(lpMo)}
                        </td>
                        <td className="text-right px-2 md:px-3 py-2 text-foreground">
                          {fmtUsd(coMo)}
                        </td>
                        <td className="hidden sm:table-cell text-right px-2 md:px-3 py-2 text-eco font-semibold">
                          {fmtUsd(lpYr)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Big numbers at scale */}
            <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3 text-center">
              <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  ARR @ 1M
                </div>
                <div className="text-base md:text-lg font-bold text-foreground">
                  $155.9M
                </div>
              </div>
              <div className="rounded-md border border-eco/40 bg-eco/[0.05] p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-eco">
                  LP Inject/yr
                </div>
                <div className="text-base md:text-lg font-bold text-eco">
                  $77.9M
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Company/yr
                </div>
                <div className="text-base md:text-lg font-bold text-foreground">
                  $77.9M
                </div>
              </div>
            </div>

            <p className="text-[10px] md:text-xs text-muted-foreground/80 mt-4 italic leading-relaxed text-center">
              At full scale, ~$6.5M/month of continuous USDC flows into the LP
              from subscriber revenue alone — automatic floor defense, no
              founder rounds required.
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
