import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  Battery,
  Car,
  Thermometer,
  Sun,
  Brain,
  Bell,
  TrendingUp,
  ShieldCheck,
  Zap,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * FoundersDeasonV3 — Founders-only capability map for Deason's "wow stack".
 * Lives at /founders/deason-v3 and is linked from the sidebar Founders group
 * just below "v2 App Sandbox". Mirrors the gating pattern of FoundersAppOverhaul.
 */
export default function FoundersDeasonV3() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
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
    return () => {
      cancelled = true;
    };
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
      <DeasonV3Content />
    </VaultPinGate>
  );
}

type Phase = "live" | "next" | "later";

const phaseStyles: Record<Phase, string> = {
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  next: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  later: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const phaseLabel: Record<Phase, string> = {
  live: "LIVE",
  next: "NEXT",
  later: "LATER",
};

type Capability = {
  icon: typeof Sparkles;
  title: string;
  oneLiner: string;
  what: string;
  how: string;
  why: string;
  phase: Phase;
};

const pillars: { title: string; intro: string; items: Capability[] }[] = [
  {
    title: "1 · The Conversational Layer",
    intro:
      "One Deason for everyone. He flips between patient educator (wallets, tokens, blockchain) and wow-factor expert (bill analysis, battery dispatch) automatically based on context — users never pick a mode.",
    items: [
      {
        icon: MessageCircle,
        title: "Unified Concierge",
        oneLiner: "Single AI agent, dual personality.",
        what:
          "One Deason endpoint serves demo, beta, and live users. Tone is upbeat, academic, confidence-building. Every response: acknowledge → answer → educate → momentum. Hard cap: 4 paragraphs.",
        how:
          "System prompt enforces structure + tone. Email allowlist still routes inner-circle to the strategic prompt (Lyndon, LP rounds, etc.); everyone else gets the public concierge prompt.",
        why:
          "Users hate choosing between bots. One personality = one trusted relationship that compounds across every interaction.",
        phase: "live",
      },
      {
        icon: Brain,
        title: "Crypto-Onboarding Educator",
        oneLiner: "Defines every term the first time it's used.",
        what:
          "Wallets, tokens, gas, mints, burns — Deason explains each in plain English with grounded analogies (frequent flyer miles, savings accounts) before any jargon.",
        how:
          "Built into the prompt. Reinforced by celebrating first-time milestones: first mint, first bill upload, first optimization.",
        why:
          "Most users have never touched crypto. Confidence is the bottleneck — not capability.",
        phase: "live",
      },
    ],
  },
  {
    title: "2 · The Wow Stack — Bill Intelligence",
    intro:
      "Drop a utility bill in chat. Deason extracts the rate plan, identifies the top three savings levers, and quantifies them in both dollars and $ZSOLAR.",
    items: [
      {
        icon: FileText,
        title: "Bill Savings Report",
        oneLiner: "Top 3 actions, $ saved, kWh shifted, $ZSOLAR earned.",
        what:
          "Upload any utility bill (image or PDF). Gemini vision extracts utility, rate plan, peak/off-peak windows, $/kWh, NEM tier, total kWh. Returns a structured card inline in chat.",
        how:
          "`analyze-bill` edge function calls Gemini with a tool-calling schema, returns JSON. `<BillSavingsReport>` renders the card with three ranked actions and an NFT-unlock progress bar.",
        why:
          "Quantified savings + token earnings in the same recommendation is something no concierge has ever done. This is the demo moment.",
        phase: "live",
      },
      {
        icon: TrendingUp,
        title: "Bill-vs-Bill Delta",
        oneLiner: "Did our advice actually save money?",
        what:
          "When a user uploads a second bill, Deason compares it to the first: peak kWh shifted, $ saved vs predicted, accuracy of last month's recommendations.",
        how:
          "Persist extracted bill JSON per user. Diff engine computes deltas; Deason narrates the win and adjusts next month's plan.",
        why:
          "Closes the loop. Turns Deason from advisor → accountable partner. Builds compounding trust.",
        phase: "next",
      },
    ],
  },
  {
    title: "3 · The Wow Stack — Live Optimization",
    intro:
      "Read the user's actual hardware (Tesla, Powerwall, Wallbox, Enphase, SolarEdge) and recommend specific settings — not generic tips.",
    items: [
      {
        icon: Battery,
        title: "Battery Dispatch Coach",
        oneLiner: "Exact charge/discharge schedule for your rate plan.",
        what:
          "Reads Powerwall mode, reserve %, and grid-import history. Recommends: pre-charge from solar by 3:55pm, full discharge through peak (4–9pm), specific reserve % based on outage risk in their zip.",
        how:
          "Pulls from `connected_devices.lifetime_totals` + rate plan from bill. Deason renders a daily timeline card.",
        why:
          "Battery is the #1 dollar lever for solar+battery+EV households — typically $40–120/mo when set correctly.",
        phase: "next",
      },
      {
        icon: Car,
        title: "EV Charging Window Optimizer",
        oneLiner: "Move kWh from peak to super off-peak.",
        what:
          "Reads Tesla / Wallbox session history. Identifies how many kWh per month are charging in expensive windows. Provides exact 'Scheduled Departure' settings for the Tesla app or Wallbox schedule.",
        how:
          "Cross-references session timestamps with rate plan windows. Deason emits a copy-paste-ready schedule.",
        why:
          "Easy $20–60/mo win, plus shifts charging onto solar hours which mints bonus $ZSOLAR (EV-on-solar reward).",
        phase: "next",
      },
      {
        icon: Thermometer,
        title: "HVAC Pre-Conditioning Plan",
        oneLiner: "Pre-cool before peak. Drift through it.",
        what:
          "Given climate zone + rate plan, suggests pre-cool/pre-heat setpoints and drift ranges. Works for any thermostat (Nest, ecobee, manual).",
        how:
          "Static rules engine driven by climate zone + peak window. Deason narrates the schedule and quantifies expected savings.",
        why:
          "$15–40/mo with zero hardware investment. Highest ratio of savings to effort.",
        phase: "next",
      },
      {
        icon: Sun,
        title: "Solar Tilt & Shade Diagnostics",
        oneLiner: "Is your array under-producing?",
        what:
          "Compares actual production curve vs expected for the user's panel count, tilt, and zip code. Flags shade events, soiling, or inverter issues.",
        how:
          "Pulls Enphase/SolarEdge production data. Vision-analyzes optional rooftop photos for shading. Deason flags + suggests action (clean panels, contact installer).",
        why:
          "Most homeowners never know their array is underperforming. This protects their core $ZSOLAR earning rate.",
        phase: "later",
      },
    ],
  },
  {
    title: "4 · The Proactive Layer",
    intro:
      "Deason doesn't just answer — he reaches out at the right moment with the right insight.",
    items: [
      {
        icon: Bell,
        title: "Nightly Optimizer Push",
        oneLiner: "Tomorrow's plan, delivered at 9pm.",
        what:
          "Each night Deason runs the optimization engine for every connected user and pushes a single-card summary: tomorrow's battery schedule, EV charge window, and weather-adjusted setpoints.",
        how:
          "Cron-triggered edge function → web push notification + in-app card. One concise paragraph + one tap to apply.",
        why:
          "Turns passive earnings into active mastery. Users wake up feeling like the system is working *for* them.",
        phase: "later",
      },
      {
        icon: Zap,
        title: "Live Event Coach",
        oneLiner: "Heatwave? Outage warning? Rate event? Deason pings.",
        what:
          "Real-time alerts: 'PG&E flex alert tomorrow 4–9pm — pre-cool to 70°F by 3pm, your battery is set to discharge fully.'",
        how:
          "Polls utility flex APIs + NWS weather. Pushes contextual recommendations only when stakes are high.",
        why:
          "Demonstrates ZenSolar isn't a passive ledger — it's an active partner in the user's energy life.",
        phase: "later",
      },
      {
        icon: ShieldCheck,
        title: "Confidence Reports",
        oneLiner: "Monthly receipt: kWh produced, $ saved, $ZSOLAR earned.",
        what:
          "End-of-month digest with the full picture: clean energy generated, dollars saved vs grid-only baseline, tokens minted, and where each came from.",
        how:
          "Aggregated from existing tables + bill analysis. Renders as a beautiful one-pager in chat and email.",
        why:
          "Users see undeniable proof that ZenSolar is contributing real, measurable value to their financial life.",
        phase: "later",
      },
    ],
  },
];

function DeasonV3Content() {
  return (
    <div className="min-h-[100svh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/founders"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vault
          </Link>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400">
            <Sparkles className="h-3 w-3 mr-1" />
            Founders only
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400/30 to-primary/30 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Deason V3 — The Wow Stack</h1>
              <p className="text-muted-foreground text-sm">
                One agent. Two hats. World-class energy + crypto concierge.
              </p>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-card to-card/40 border-amber-500/20">
            <CardContent className="p-6 space-y-3 text-[15px] leading-relaxed">
              <p>
                <strong className="text-amber-300">The thesis:</strong> Most ZenSolar users are
                meeting blockchain, tokens, and wallets for the first time. They need an educator.
                But they also own real solar, real batteries, and real EVs that produce real
                kWh — they need an expert. We deliver both through{" "}
                <strong>one Deason</strong> who reads the room and switches modes invisibly.
              </p>
              <p className="text-muted-foreground">
                Voice is upbeat, academic, and confidence-building. Every reply follows
                acknowledge → answer → educate → momentum, capped at four short paragraphs.
                The wow comes from quantified, hardware-specific advice no other concierge can give.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Pillars */}
        {pillars.map((pillar, pi) => (
          <motion.section
            key={pillar.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: pi * 0.05 }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-foreground">{pillar.title}</h2>
              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {pillar.intro}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pillar.items.map((cap) => {
                const Icon = cap.icon;
                return (
                  <Card
                    key={cap.title}
                    className="bg-card/60 border-border/60 hover:border-amber-500/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Icon className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <CardTitle className="text-base leading-tight">
                            {cap.title}
                          </CardTitle>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold tracking-wider ${phaseStyles[cap.phase]}`}
                        >
                          {phaseLabel[cap.phase]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground italic pt-1">
                        {cap.oneLiner}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-sm leading-relaxed">
                      <p>
                        <span className="text-amber-300 font-semibold">What it does. </span>
                        {cap.what}
                      </p>
                      <p>
                        <span className="text-sky-300 font-semibold">How it works. </span>
                        <span className="text-muted-foreground">{cap.how}</span>
                      </p>
                      <p>
                        <span className="text-emerald-300 font-semibold">Why it wins. </span>
                        <span className="text-muted-foreground">{cap.why}</span>
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.section>
        ))}

        {/* Footer nav */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-border/40 pt-8 flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <div className="text-muted-foreground">
            Built on Lovable AI · Gemini vision · ZenSolar device graph
          </div>
          <div className="flex gap-3">
            <Link
              to="/founders/v2app"
              className="text-amber-300 hover:text-amber-200 transition-colors"
            >
              ← v2 App Sandbox
            </Link>
            <Link
              to="/deason"
              className="text-amber-300 hover:text-amber-200 transition-colors"
            >
              Open Deason →
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
