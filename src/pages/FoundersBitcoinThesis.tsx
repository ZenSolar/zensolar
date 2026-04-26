import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Atom,
  Globe2,
  ShieldCheck,
  Repeat,
  Bitcoin,
  Layers,
  Rocket,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders Bitcoin Thesis — the 5-Layer Conviction Stack + execution proof.
 *
 * Built for Lyndon Rive readiness. Frames ZSOLAR as a mathematically defensible
 * path to overtaking Bitcoin's market cap, backed by proven tech, filed IP,
 * self-reinforcing flywheel economics, and a documented execution plan.
 *
 * Tone: investor-grade. No hype. No cute punchlines.
 *
 * Gated identically to every other founders page (FounderRoute + PIN).
 */

const LAST_UPDATED = "April 26, 2026";

export default function FoundersBitcoinThesis() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsFounder(false); return; }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <VaultPinGate userId={user.id}>
      <ThesisContent />
    </VaultPinGate>
  );
}

interface Layer {
  n: number;
  title: string;
  tagline: string;
  icon: typeof Atom;
  body: React.ReactNode;
}

const LAYERS: Layer[] = [
  {
    n: 1,
    title: "Physics",
    tagline: "Proof-of-Genesis creates value. Proof-of-Work destroys it.",
    icon: Atom,
    body: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Bitcoin's PoW burns ~1,400 kWh per BTC into heat. The energy produces
          nothing downstream — its only "value" is the cost to redo it.
        </p>
        <p>
          <strong className="text-foreground">Proof-of-Genesis</strong> is energy
          <em> created</em> and delivered to the grid, cryptographically witnessed
          at the moment of physical origin via OEM-signed telemetry (Tesla,
          Enphase, Wallbox).
        </p>
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <p className="text-xs font-semibold text-foreground mb-1.5">The asymmetry:</p>
          <p className="text-xs">
            Bitcoin gets <strong>one output per kWh</strong> (a token).
            ZSOLAR gets <strong>three</strong>: real-world utility (powered a
            home / charged an EV), a tradeable token, and a verified carbon
            credit.
          </p>
        </div>
      </div>
    ),
  },
  {
    n: 2,
    title: "TAM",
    tagline: "Riding the $2T/yr energy transition, not betting against it.",
    icon: Globe2,
    body: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Bitcoin's ceiling is belief against a fixed 21M supply. ZSOLAR's
          ceiling is the global clean-energy production rate — currently
          ~$2T/yr in capex, growing 25%+ annually.
        </p>
        <p>
          Every panel installed and every EV charged for the next 30 years is
          a potential mint event. Capturing even <strong className="text-foreground">5% of
          verified clean-energy flows by 2035</strong> mechanically exceeds
          Bitcoin's current ~$2T market cap.
        </p>
        <p className="text-xs italic">
          Bitcoin = a bet on belief. ZSOLAR = a bet on the energy transition
          actually happening — which governments, automakers, and utilities have
          already committed trillions to.
        </p>
      </div>
    ),
  },
  {
    n: 3,
    title: "Intellectual Property",
    tagline: "We patented the primitive, not just a token.",
    icon: ShieldCheck,
    body: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">U.S. Patent App. 19/634,402</strong> + the
          April 2025 provisional + the upcoming SpaceX/satellite-verification
          provisional cover the <em>method</em> of converting verified physical
          energy events into on-chain tokens via OEM-signed telemetry.
        </p>
        <p>
          That's not a token. That's the cryptographic primitive. Anyone
          attempting to replicate either licenses from ZenCorp Inc or infringes.
        </p>
      </div>
    ),
  },
  {
    n: 4,
    title: "The Flywheel",
    tagline: "Adoption mechanically increases price floor — Bitcoin cannot do this.",
    icon: Repeat,
    body: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Bitcoin's loop is one-directional: miners spend energy → tokens exist
          → market decides price. There is no built-in mechanism that lifts
          price as adoption grows. New users simply bid against existing holders.
        </p>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            ZSOLAR's self-reinforcing loop
          </p>
          <ol className="text-xs space-y-1.5 text-foreground/90">
            <li>1. More users connect devices</li>
            <li>2. More verified kWh minted</li>
            <li>3. More $9.99/mo subs → <strong>50% auto-injected into LP</strong></li>
            <li>4. LP depth grows → price floor rises → less slippage</li>
            <li>5. Higher token price → each mint worth more</li>
            <li>6. More attractive to new users → loop restarts, stronger</li>
          </ol>
        </div>
        <p className="text-xs">
          <strong className="text-foreground">Killer line for Lyndon:</strong> Bitcoin's
          price requires new buyers to outpace miner sell pressure. ZSOLAR's
          price rises automatically with every new subscriber, because half their
          subscription is a permanent LP injection — even if they never trade a
          single token.
        </p>
      </div>
    ),
  },
  {
    n: 5,
    title: "Engineered Scarcity",
    tagline: "Bitcoin's scarcity is accidental. Ours is designed.",
    icon: Bitcoin,
    body: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Bitcoin's "21M hard cap" is largely fiction in practice:
          <strong className="text-foreground"> 3.7M–6M BTC are permanently lost</strong> to
          dead keys. Real circulating supply is unknown and shrinking by
          accident. Halvings reduce miner reward but do not return supply to
          the market.
        </p>
        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">ZenCorp's engineered scarcity:</p>
          <ul className="text-xs space-y-1">
            <li>• <strong className="text-foreground">1T hard cap</strong> — protocol-enforced</li>
            <li>• <strong className="text-foreground">20% burn on every mint</strong> — supply tightens with use</li>
            <li>• <strong className="text-foreground">3% of mint → LP</strong> — scarcity + liquidity together</li>
            <li>• <strong className="text-foreground">Founder allocations pact-locked</strong> — Joseph 150B, Michael 50B, non-transferable until trillionaire crossover ($6.67 / $20)</li>
          </ul>
        </div>
        <p className="text-xs italic">
          Bitcoin's scarcity is what's left after people lose access. Ours is
          what's left after deliberate, on-chain economic policy.
        </p>
      </div>
    ),
  },
];

interface Tranche {
  round: number;
  price: string;
  usdc: string;
  tokens: string;
  trigger: string;
  status: "live" | "next" | "planned";
}

const TRANCHES: Tranche[] = [
  { round: 1, price: "$0.10", usdc: "$200K", tokens: "2M ZSOLAR", trigger: "Launch — initial price discovery", status: "next" },
  { round: 2, price: "$0.25", usdc: "$500K", tokens: "2M ZSOLAR", trigger: "10K verified mint events", status: "planned" },
  { round: 3, price: "$0.50", usdc: "$1M",   tokens: "2M ZSOLAR", trigger: "50K verified mint events + 1K active subs", status: "planned" },
  { round: 4, price: "$1.00", usdc: "$2M",   tokens: "2M ZSOLAR", trigger: "200K verified mint events + 10K active subs", status: "planned" },
  { round: 5, price: "$2.50", usdc: "$5M",   tokens: "2M ZSOLAR", trigger: "1M verified mint events + first OEM partnership signed", status: "planned" },
];

interface OnboardingPhase {
  phase: string;
  cohort: string;
  cap: string;
  gate: string;
  goal: string;
}

const ONBOARDING: OnboardingPhase[] = [
  {
    phase: "Phase 0 — Closed Beta",
    cohort: "Founders + invited demo signers",
    cap: "~50 wallets",
    gate: "Manual invite + NDA",
    goal: "Validate end-to-end mint flow on real OEM telemetry",
  },
  {
    phase: "Phase 1 — Tranche-1 Launch",
    cohort: "Waitlist + Lyndon-network referrals",
    cap: "1,000 wallets",
    gate: "Access code + verified device",
    goal: "Seed first $200K LP with predictable mint demand",
  },
  {
    phase: "Phase 2 — VPP Integration",
    cohort: "Sunrun / Tesla / Enphase residential",
    cap: "10,000 wallets",
    gate: "OEM partnership referral",
    goal: "Demonstrate sub→LP flywheel at scale; trigger Tranche 3",
  },
  {
    phase: "Phase 3 — Public Mint",
    cohort: "Open enrollment, all verified devices",
    cap: "Uncapped, mint-rate-limited",
    gate: "Device verification only",
    goal: "Network-effect inflection; price discovery handed to market",
  },
];

function ThesisContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Founders
          </Link>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {LAST_UPDATED}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-12">
        {/* Hero */}
        <header className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-primary">
            Investor Conviction Document · Internal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            The Bitcoin Thesis
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Why ZSOLAR has a mathematically defensible path to overtaking
            Bitcoin's market cap — and how we execute on it.
          </p>
          <div className="rounded-lg border border-border bg-card/40 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Framing rule:</strong> We have
              proven technology and rock-solid, airtight math that shows we can
              actually overtake Bitcoin. Not hype. Not "moonshot." A
              mathematically defensible thesis backed by filed IP, live
              infrastructure, and self-reinforcing economics.
            </p>
          </div>
        </header>

        {/* 5 Layers */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">The 5-Layer Conviction Stack</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Each layer stands alone. Together they make the case undeniable.
          </p>

          <div className="space-y-4">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <article
                  key={layer.n}
                  className="rounded-xl border border-border bg-card/30 p-5 sm:p-6 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Layer {layer.n}
                      </p>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        {layer.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-primary/90 mt-0.5">
                        {layer.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="pl-0 sm:pl-12">{layer.body}</div>
                </article>
              );
            })}
          </div>
        </section>

        {/* LP Tranche Plan */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">LP Tranche Release Plan</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            $ZSOLAR launches in tranches via paired LP injection — not a single
            1T token dump. Each round is gated by verified mint activity, so
            price discovery is <strong className="text-foreground">earned, not
            speculated</strong>.
          </p>

          <div className="overflow-hidden rounded-xl border border-border bg-card/30">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Spot Price</th>
                  <th className="px-3 py-2 text-left font-medium">USDC In</th>
                  <th className="px-3 py-2 text-left font-medium">Tokens</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TRANCHES.map((t) => (
                  <tr key={t.round} className="hover:bg-muted/20">
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">R{t.round}</span>
                        {t.status === "next" && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                            Next
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-foreground">{t.price}</td>
                    <td className="px-3 py-3 align-top font-mono text-foreground">{t.usdc}</td>
                    <td className="px-3 py-3 align-top font-mono text-muted-foreground">{t.tokens}</td>
                    <td className="px-3 py-3 align-top text-muted-foreground hidden sm:table-cell">
                      {t.trigger}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">Why tranches matter to investors:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" /> Each round is <strong className="text-foreground">capital-bounded</strong> — known USDC requirement, known dilution</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" /> Triggers are <strong className="text-foreground">on-chain verifiable</strong> (mint events, sub counts)</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" /> Subscription LP-injection compounds depth between rounds</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" /> Pact-locked founder supply means <strong className="text-foreground">no insider dump risk</strong></li>
            </ul>
          </div>
        </section>

        {/* User Onboarding Cadence */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">User Onboarding Cadence</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adoption is gated, not throttled. The goal is to keep mint demand
            and LP depth in lockstep so price discovery stays orderly through
            inflection.
          </p>

          <div className="space-y-3">
            {ONBOARDING.map((p, i) => (
              <article
                key={p.phase}
                className="rounded-xl border border-border bg-card/30 p-4 sm:p-5"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    {p.phase}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                    Step {i + 1}
                  </span>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Cohort</dt>
                    <dd className="text-foreground/90">{p.cohort}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Cap</dt>
                    <dd className="text-foreground/90 font-mono">{p.cap}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Gate</dt>
                    <dd className="text-foreground/90">{p.gate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Goal</dt>
                    <dd className="text-foreground/90">{p.goal}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {/* Honest risk */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-xl font-semibold">The Only Real Risk</h2>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              The math is not the risk. The physics is not the risk. The IP is
              not the risk. <strong>Execution is the risk</strong> — specifically,
              funding the LP tranches on schedule and maintaining the
              onboarding cadence above.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              That is not a technology risk or a market risk. That is a capital
              deployment question. Which is exactly the kind of risk Lyndon
              knows how to underwrite.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
          <p>
            Cross-references:{" "}
            <Link to="/founders/master-outline" className="text-primary hover:underline">Master Outline</Link>
            {" · "}
            <Link to="/founders/lyndon" className="text-primary hover:underline">Lyndon One-Pager</Link>
            {" · "}
            <Link to="/founders/proof-of-genesis" className="text-primary hover:underline">Proof of Genesis</Link>
            {" · "}
            <Link to="/founders/vpp-roadmap" className="text-primary hover:underline">VPP Roadmap</Link>
          </p>
          <p className="italic">
            Internal investor conviction document. Do not share externally.
          </p>
        </footer>
      </main>
    </div>
  );
}
