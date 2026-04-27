import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Sun,
  ShieldCheck,
  Scale,
  Globe2,
  Coins,
  Zap,
  Quote,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders One-Pager v2 — for Lyndon Rive.
 *
 * Refined pitch:
 *  - "Self-funding either way" posture (legacy ask, not capital ask)
 *  - Composition-of-matter + method patent across 9 jurisdictions
 *  - Qualcomm/CDMA licensing-revenue tease
 *  - $5M broken into specific line items
 *  - $19.99/mo auto-mint subscription + VPP revenue (NEW additive lines
 *    not yet in the model)
 *  - Closer line: "I'd rather have you on the cap table than anyone else
 *    on Earth — but I'm building this either way."
 */

export default function FoundersLyndonPitchV2() {
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
      <PitchContent />
    </VaultPinGate>
  );
}

const JURISDICTIONS = [
  "United States", "European Union", "China", "Japan",
  "South Korea", "Australia", "India", "Brazil", "PCT (150+)",
];

const LINE_ITEMS = [
  {
    amount: "$1.2M",
    label: "International patent prosecution",
    detail: "PCT + 9 national-phase entries, 7-year horizon. Filed before any competitor knows the category exists.",
    icon: <Globe2 className="h-4 w-4" />,
  },
  {
    amount: "$800K",
    label: "Top-tier IP litigation firm on retainer",
    detail: "Fish & Richardson or Wilson Sonsini. Pre-positioned so the first infringer gets a cease-and-desist within 72 hours.",
    icon: <Scale className="h-4 w-4" />,
  },
  {
    amount: "$1.5M",
    label: "18-month founder runway",
    detail: "Joseph + Michael full-time. No more nights-and-weekends. This is the unlock that makes everything else move 5x faster.",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    amount: "$1.0M",
    label: "First two engineering hires",
    detail: "Senior oracle engineer + senior smart-contract engineer. Ship the on-chain Energy Oracle in 9 months instead of 24.",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    amount: "$500K",
    label: "Reg/securities counsel + Swiss/Singapore foundation",
    detail: "Get the token wrapper jurisdictionally bulletproof before the SEC even notices we exist.",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

const NEW_REVENUE = [
  {
    title: "$19.99/mo Auto-Mint Subscription",
    body: "Subscribers get daily automated minting against their connected solar/EV/battery — set it and forget it. At 100K subs that's $24M ARR. At 1M subs it's $240M ARR. This isn't in the model yet.",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    title: "Virtual Power Plant Revenue Share",
    body: "Once subscribers cross ~50K homes we have a dispatchable VPP. Utilities pay $40–80/kW-year for grid services. A 200MW aggregated fleet = $8–16M/year in pure utility-paid revenue, on top of the token economy. Also not in the model yet.",
    icon: <TrendingUp className="h-4 w-4" />,
  },
];

function PitchContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-16"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/founders/lyndon"
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              v1
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
              v2 · Refined
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-eco text-xs uppercase tracking-widest mb-3">
            <Sun className="h-3.5 w-3.5" /> Pitch v2 · For Lyndon Rive
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            I'm Building This Either Way.<br />
            <span className="text-eco">I'd Rather Build It With You.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            This isn't a capital ask. It's a legacy ask. You started the solar revolution.
            I'm finishing it by giving every solar producer a currency — and I'd rather have
            you on the cap table than anyone else on Earth.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Internal · Drafted for Lyndon Rive · Not for distribution
          </p>
        </header>

        {/* The opener */}
        <section className="mb-10 rounded-xl border border-eco/30 bg-eco/[0.06] p-5">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-eco flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                "I'm self-funding ZenSolar even if you pass. But I want you onboard because I
                have a deep respect for you, and I would not be in solar — or here right now —
                without you starting SolarCity."
              </p>
              <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest">
                Open with this. Word for word.
              </p>
            </div>
          </div>
        </section>

        {/* The patent moat — Qualcomm framing */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            The real moat — patent, not product
          </h2>
          <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Composition-of-Matter + Method</h3>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed mb-4">
              We're filing a composition-of-matter and method patent on{" "}
              <span className="font-semibold text-foreground">Proof-of-Delta + Proof-of-Origin</span>{" "}
              as a cryptographic primitive for tokenizing verified physical-world energy flows.
              Any company minting tokens from solar production, EV miles, battery export, or EV
              charging — without licensing from ZenSolar — is in direct infringement.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {JURISDICTIONS.map((j) => (
                <div
                  key={j}
                  className="text-[10px] uppercase tracking-wider text-center py-1.5 px-2 rounded-md bg-background/60 border border-border/60 text-muted-foreground"
                >
                  {j}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              The claim language is deliberately broad enough that any meaningful workaround
              would require abandoning the verified-physical-energy thesis entirely. They'd
              have to invent a fundamentally different primitive — and we already have the prior art.
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">The Qualcomm Parallel</h3>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Once the international patent issues, every competitor who tries to tokenize
              energy — Helium, Daylight, Glow, anyone — has two choices:{" "}
              <span className="font-semibold">stop, or pay us a licensing fee per kWh.</span>{" "}
              That's a second revenue stream that doesn't require us to acquire a single new
              user. Same playbook as Qualcomm's CDMA moat — every phone maker pays Qualcomm
              whether they want to or not.
            </p>
          </div>
        </section>

        {/* New revenue lines not in the model */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Two revenue lines not yet in the model
          </h2>
          <div className="space-y-3">
            {NEW_REVENUE.map((r) => (
              <div key={r.title} className="rounded-xl border border-eco/40 bg-eco/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-eco/10 text-eco">{r.icon}</div>
                  <h3 className="text-sm font-semibold">{r.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Both of these are additive to the token economics already shown. The current model
            assumes neither — they're upside, not dependence.
          </p>
        </section>

        {/* $5M line items */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            $5M · 24-month runway · exactly how it deploys
          </h2>
          <div className="space-y-3">
            {LINE_ITEMS.map((item) => (
              <div key={item.label} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-base font-bold text-foreground">{item.amount}</span>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/[0.05] p-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              <span className="font-semibold text-primary">Total: $5M</span> · 24-month runway ·
              patent moat locked in 9 jurisdictions before competitors even file.
            </p>
          </div>
        </section>

        {/* The closer */}
        <section className="rounded-xl border border-eco/40 bg-gradient-to-br from-eco/[0.08] to-primary/[0.05] p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-eco mb-3">
            The closer
          </h2>
          <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed mb-4">
            "You started the solar revolution. I'm finishing it by giving every solar producer a
            currency. I'd rather have you on the cap table than anyone else on Earth — but I'm
            building this either way."
          </p>
          <p className="text-base sm:text-lg font-semibold text-eco">
            "Tell me if you want in."
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            Companion to <Link to="/founders/lyndon" className="underline hover:text-primary">v1 (homeowner-distribution framing)</Link>.
            Same product, sharper ask.
          </p>
        </footer>
      </div>
    </div>
  );
}
