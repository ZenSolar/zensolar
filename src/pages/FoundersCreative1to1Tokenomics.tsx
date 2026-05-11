import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Code2,
  Eye,
  Scale,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

export default function FoundersCreative1to1Tokenomics() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const preview = isPreviewMode();

  if (!preview && (isLoading || !ready)) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!preview && !user) return <Navigate to="/auth" replace />;
  if (!preview && !isFounder) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Vault
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
            <Lock className="h-3 w-3" /> Founders Only
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3 inline-flex items-center gap-2">
          <Lightbulb className="h-3 w-3" /> Creative Tokenomics · Internal
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          1:1 <span className="italic text-primary">Smart Contract Rules</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Creative smart contract rules to enable a true 1:1 kWh → $ZSOLAR mint ratio
          while keeping the UI/UX and math extremely simple for normal Tesla/solar/EV users.
        </p>
      </section>

      {/* Rules */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12 space-y-8">

        <RuleCard
          number={1}
          title="Mandatory 12-month linear vesting on all newly minted tokens"
          contract="All newly minted tokens are automatically locked in a vesting contract with linear unlock over 12 months (e.g. 1/365th unlocked daily)."
          ux="Dashboard shows “You earned 1,000 tokens this month. 83 tokens unlocked today, the rest vest over the next 12 months.”"
          pros="Dramatically reduces immediate sell pressure while keeping the 1:1 narrative alive."
          cons="Users have to wait for full liquidity."
        />

        <RuleCard
          number={2}
          title="Strong staking program with LP fee share + subscription revenue yield + mint multipliers"
          contract="Stakers receive a portion of LP trading fees + a slice of subscription revenue + a mint multiplier for longer locks (e.g. 12-month stake = 1.5× future mints)."
          ux="“Stake your tokens to earn extra rewards and higher future mints.”"
          pros="Encourages long-term holding and creates real yield."
          cons="Requires users to take an extra step."
        />

        <RuleCard
          number={3}
          title="2–4% early sell tax (decreasing over time) with 50% burned + 50% to LP"
          contract="Tokens sold within the first 12 months incur a decreasing tax. 50% of tax burned, 50% added to LP."
          ux="Clear warning before sell: “Selling now incurs a 3% tax (50% burned, 50% to LP)”."
          pros="Discourages early selling, adds deflation and liquidity."
          cons="Can feel punitive if not explained well."
        />

        <RuleCard
          number={4}
          title="Protocol revenue share to stakers"
          contract="A portion of the 50% treasury subscription revenue is distributed to stakers as yield (in USDC or extra $ZSOLAR)."
          ux="“Stake to earn a share of subscription revenue.”"
          pros="Real yield for holders, strong incentive to stake."
          cons="Reduces treasury funds for other uses."
        />

        <RuleCard
          number={5}
          title="Loyalty / Production Score multiplier"
          contract="Users who consistently produce clean energy for 3+ consecutive months get a permanent “Producer Score” that gives them a small extra mint multiplier (1.05× to 1.20×)."
          ux="“Your Producer Score is 1.15× — you’ll earn 15% more tokens next month because you’ve been consistent.”"
          pros="Rewards real long-term producers."
          cons="Slightly complex to track."
        />

        <RuleCard
          number={6}
          title="25% monthly sell cap rule"
          contract="No user can sell more than 25% of their active (unlocked) token holdings in any 30-day period."
          ux="“You can sell up to 25% of your unlocked tokens this month.”"
          pros="Directly caps sell pressure."
          cons="May frustrate users during big price moves."
        />

        <RuleCard
          number={7}
          title="Tiered vesting by subscription tier"
          contract="Base = 12 mo vesting, Regular = 9 mo, Power = 6 mo + bonuses."
          ux="“Because you’re on Power tier, your tokens unlock faster.”"
          pros="Rewards paying users."
          cons="Adds tier complexity."
        />

        <RuleCard
          number={8}
          title="Hold-to-Earn auto-multiplier"
          contract="Unlocked tokens that stay in the wallet for 30+ days get a permanent mint multiplier."
          ux="“Your tokens are earning a 1.3× multiplier because you’ve held them for 4 months.”"
          pros="Passive incentive to hold."
          cons="Requires tracking."
        />

        <RuleCard
          number={9}
          title="Redemption-First Rule (Store Priority)"
          contract="When selling, the contract first checks for store credit and routes to redeem in the $ZSOLAR Store with bonus discounts before allowing USDC withdrawal."
          ux="“You have $87 in store credit — redeem first for 15% bonus?”"
          pros="Keeps tokens in the ecosystem."
          cons="Adds a step for selling."
        />

      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Founders · Confidential
      </footer>
    </div>
  );
}

function RuleCard({
  number,
  title,
  contract,
  ux,
  pros,
  cons,
}: {
  number: number;
  title: string;
  contract: string;
  ux: string;
  pros: string;
  cons: string;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/40 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug">{title}</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-5">
          <DetailBlock
            icon={Code2}
            label="Smart contract"
            text={contract}
          />
          <DetailBlock
            icon={Eye}
            label="User UX"
            text={ux}
          />
        </div>
        <div className="space-y-5">
          <DetailBlock
            icon={CheckCircle2}
            label="Pros"
            text={pros}
            tone="eco"
          />
          <DetailBlock
            icon={XCircle}
            label="Cons"
            text={cons}
            tone="muted"
          />
        </div>
      </div>
    </div>
  );
}

function DetailBlock({
  icon: Icon,
  label,
  text,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
  tone?: "default" | "eco" | "muted";
}) {
  const toneClasses = {
    default: {
      border: "border-border/60",
      bg: "bg-muted/30",
      icon: "text-primary",
      iconBg: "bg-primary/10",
    },
    eco: {
      border: "border-eco/30",
      bg: "bg-eco/5",
      icon: "text-eco",
      iconBg: "bg-eco/10",
    },
    muted: {
      border: "border-border/40",
      bg: "bg-muted/20",
      icon: "text-muted-foreground",
      iconBg: "bg-muted/40",
    },
  };
  const t = toneClasses[tone];

  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-6 w-6 rounded-md ${t.iconBg} flex items-center justify-center`}>
          <Icon className={`h-3.5 w-3.5 ${t.icon}`} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
    </div>
  );
}
