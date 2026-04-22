import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Check, Circle, Minus, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";

export default function FoundersAppOverhaul() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsFounder(false); return; }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
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
    <VaultBiometricGate userId={user.id}>
      <OverhaulContent />
    </VaultBiometricGate>
  );
}

type Status = "done" | "in_progress" | "todo";

const muskPrinciples: { title: string; promise: string; status: Status }[] = [
  {
    title: "Delete first.",
    promise: "Every screen earns its place. If it doesn't add value, it's gone.",
    status: "in_progress",
  },
  {
    title: "Show the moment, not the menu.",
    promise: "Open the app and instantly see what changed since you were last here.",
    status: "todo",
  },
  {
    title: "One glance, full picture.",
    promise: "A single line at the top tells you everything: sun, battery, car, sync.",
    status: "todo",
  },
  {
    title: "Lead with the magic.",
    promise: "The live energy flow — your home in motion — comes first, not last.",
    status: "in_progress",
  },
  {
    title: "Wait beautifully.",
    promise: "Loading screens feel like part of the brand, never a blank pause.",
    status: "todo",
  },
];

const fre3Act: { act: string; headline: string; body: string; status: Status }[] = [
  {
    act: "Act 1",
    headline: "The Promise",
    body: "One sentence. One image. You instantly understand what ZenSolar does for you — without a single technical word.",
    status: "todo",
  },
  {
    act: "Act 2",
    headline: "The Proof",
    body: "A short, beautiful story of how your home, your car, and your battery already do the work. Real. Honest. Visible.",
    status: "todo",
  },
  {
    act: "Act 3",
    headline: "Your Turn",
    body: "Tap once. Feel the reward before you've connected anything. Then connect — and watch your real life come to life on screen.",
    status: "todo",
  },
];

const elonPrinciples: { title: string; promise: string; status: Status }[] = [
  {
    title: "Question every requirement.",
    promise: "Every screen, button, and label gets cross-examined. If no one defends it, it's deleted.",
    status: "in_progress",
  },
  {
    title: "Delete the part or process.",
    promise: "Welcome banners, manual refresh buttons, decorative dividers — gone before they're optimized.",
    status: "in_progress",
  },
  {
    title: "Simplify and optimize — last.",
    promise: "We only polish what survives the delete pass. No gold-plating dead weight.",
    status: "todo",
  },
  {
    title: "Accelerate cycle time.",
    promise: "Tap-to-Mint must feel instantaneous. Sub-second feedback before the chain even confirms.",
    status: "in_progress",
  },
  {
    title: "Automate — last.",
    promise: "Automation comes after the flow is proven by hand. No premature abstraction.",
    status: "todo",
  },
];

const lyndonWowFactors: { title: string; promise: string; status: Status }[] = [
  {
    title: "\"Since last visit\" ticker.",
    promise: "No 'Welcome, Joseph!' — instead: +4.2 kWh solar · +18 mi charged · +12 $ZSOLAR pending. Live deltas the moment the app opens.",
    status: "todo",
  },
  {
    title: "One-glance telemetry bar.",
    promise: "Monospace top strip: ☀ 4.2 kW · 🔋 87% · 🚗 charging · ⛓ synced 2m ago. Every state visible without scrolling.",
    status: "todo",
  },
  {
    title: "Live energy flow above the fold.",
    promise: "The Sankey diagram — your home in motion — is the first thing he sees. Not buried beneath cards.",
    status: "in_progress",
  },
  {
    title: "Frictionless Tap-to-Mint.",
    promise: "He can feel the mint reward before connecting a wallet. The magic happens, then we ask permission.",
    status: "in_progress",
  },
  {
    title: "On-chain proof, one tap away.",
    promise: "Every KPI links to BaseScan. Real txs. Real burns. Real LP. No 'trust us' — just receipts.",
    status: "in_progress",
  },
  {
    title: "OEM flywheel narrative.",
    promise: "Show how every Tesla, Enphase, SolarEdge install becomes worth more on resale because of ZenSolar history.",
    status: "todo",
  },
  {
    title: "Economic discipline on screen.",
    promise: "1T hard cap, $0.10 LP-tranche launch, 75/20/3/2 mint split — visible, defensible, sober.",
    status: "done",
  },
  {
    title: "Multi-chain optionality.",
    promise: "Base today, Solana-ready tomorrow. Show him we're aligned with where SolarCity-grade scale actually lives.",
    status: "done",
  },
];

const dashboardAudit: { item: string; status: Status }[] = [
  { item: "Replace the welcome line with a 'since last visit' moment", status: "todo" },
  { item: "Add the one-glance status line at the top", status: "todo" },
  { item: "Move the live energy flow above the fold", status: "in_progress" },
  { item: "Combine the two mint actions into one", status: "todo" },
  { item: "Remove the manual refresh (pull-to-refresh already works)", status: "done" },
  { item: "Replace the spinner with a branded loading screen", status: "todo" },
  { item: "Quiet the decorative dividers and ornaments", status: "in_progress" },
];

function OverhaulContent() {
  const readinessScore = useMemo(() => {
    const all = [...muskPrinciples, ...elonPrinciples, ...lyndonWowFactors, ...fre3Act, ...dashboardAudit];
    const weight = (s: Status) => (s === "done" ? 1 : s === "in_progress" ? 0.5 : 0);
    const total = all.reduce((sum, x) => sum + weight(x.status), 0);
    return Math.round((total / all.length) * 100);
  }, []);

  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Founders Only · Draft
          </span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            App Overhaul · Demo-Day Plan
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5 leading-[1.05]">
            Less app. More moment.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A simpler, quieter ZenSolar — designed so anyone can open it and instantly feel what's happening in their home.
          </p>
        </motion.div>

        {/* Readiness gauge */}
        <ReadinessGauge score={readinessScore} />

        {/* Section: The Five Promises */}
        <Section
          eyebrow="The Five Promises"
          title="How we make it feel effortless."
          intro="Five simple commitments to ourselves about how the app should feel."
        >
          <div className="space-y-3">
            {muskPrinciples.map((p, i) => (
              <PromiseCard
                key={p.title}
                index={i}
                title={p.title}
                body={p.promise}
                status={p.status}
              />
            ))}
          </div>
        </Section>

        {/* Section: Elon's Engineering Algorithm */}
        <Section
          eyebrow="Elon's Engineering Algorithm"
          title="The 5-step gauntlet, applied to the app."
          intro="Musk's algorithm — question, delete, simplify, accelerate, automate — run against every pixel of ZenSolar."
          icon={<Zap className="h-3.5 w-3.5" />}
        >
          <div className="space-y-3">
            {elonPrinciples.map((p, i) => (
              <PromiseCard
                key={p.title}
                index={i}
                title={p.title}
                body={p.promise}
                status={p.status}
              />
            ))}
          </div>
        </Section>

        {/* Section: Lyndon's Wow Factors */}
        <Section
          eyebrow="Lyndon's Wow Factors"
          title="What makes him text Elon in 90 seconds."
          intro="The specific moments engineered to leave Lyndon Rive thinking: 'Elon has to see this.'"
          icon={<Sparkles className="h-3.5 w-3.5" />}
        >
          <div className="space-y-3">
            {lyndonWowFactors.map((p, i) => (
              <PromiseCard
                key={p.title}
                index={i}
                title={p.title}
                body={p.promise}
                status={p.status}
              />
            ))}
          </div>
        </Section>

        {/* Section: First-Run in 3 Acts */}
        <Section
          eyebrow="First-Run Experience"
          title="Three moments. One feeling."
          intro="The first 90 seconds decide everything. Here's the story we tell."
        >
          <div className="space-y-4">
            {fre3Act.map((a, i) => (
              <ActCard key={a.act} index={i} {...a} />
            ))}
          </div>
        </Section>

        {/* Section: Dashboard Audit */}
        <Section
          eyebrow="Dashboard Refinement"
          title="What we're tightening."
          intro="A short, honest list of changes to the home screen."
        >
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
            {dashboardAudit.map((row, i) => (
              <div
                key={row.item}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i !== dashboardAudit.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <StatusDot status={row.status} />
                <span className="text-sm text-foreground/90 flex-1 leading-snug">
                  {row.item}
                </span>
                <StatusLabel status={row.status} />
              </div>
            ))}
          </div>
        </Section>

        {/* Closing note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 mb-8 text-center"
        >
          <p className="text-sm text-muted-foreground italic max-w-md mx-auto leading-relaxed">
            "The best part is no part. The best feature is no feature."
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-3">
            Our north star
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  intro,
  children,
  icon,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mt-20"
    >
      <div className="mb-7">
        <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-2 font-medium">
          {icon}
          {eyebrow}
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          {intro}
        </p>
      </div>
      {children}
    </motion.section>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="rounded-3xl border border-border/50 bg-gradient-to-b from-card/40 to-card/10 backdrop-blur-sm p-8 sm:p-10 mb-4 text-center"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Demo-Day Readiness
      </p>
      <div className="flex items-baseline justify-center gap-1 mb-3">
        <span className="text-6xl sm:text-7xl font-semibold tracking-tight tabular-nums bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent">
          {score}
        </span>
        <span className="text-2xl text-muted-foreground font-light">%</span>
      </div>
      <div className="w-full max-w-xs mx-auto h-1 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-primary/70"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Where we are on the path to a perfect first impression.
      </p>
    </motion.div>
  );
}

function PromiseCard({
  index,
  title,
  body,
  status,
}: {
  index: number;
  title: string;
  body: string;
  status: Status;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 sm:p-6 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 font-mono">
          0{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold tracking-tight mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {body}
          </p>
        </div>
        <StatusDot status={status} />
      </div>
    </motion.div>
  );
}

function ActCard({
  act,
  headline,
  body,
  status,
  index,
}: {
  act: string;
  headline: string;
  body: string;
  status: Status;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 sm:p-7"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-medium">
          {act}
        </span>
        <StatusDot status={status} />
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
        {headline}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {body}
      </p>
    </motion.div>
  );
}

function StatusDot({ status }: { status: Status }) {
  if (status === "done") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0"
        aria-label="Done"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 flex-shrink-0"
        aria-label="In progress"
      >
        <Minus className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/40 text-muted-foreground flex-shrink-0"
      aria-label="Planned"
    >
      <Circle className="h-2 w-2" strokeWidth={2} />
    </span>
  );
}

function StatusLabel({ status }: { status: Status }) {
  const map = {
    done: { text: "Done", color: "text-primary" },
    in_progress: { text: "In progress", color: "text-amber-400" },
    todo: { text: "Planned", color: "text-muted-foreground" },
  } as const;
  const { text, color } = map[status];
  return (
    <span className={`text-[10px] uppercase tracking-widest font-medium ${color} flex-shrink-0`}>
      {text}
    </span>
  );
}
