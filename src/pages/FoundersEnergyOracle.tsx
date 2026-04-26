import { useEffect, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Gauge,
  FileText,
  Globe,
  Database,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Rocket,
  Lock,
  Sparkles,
  AlertTriangle,
  Circle,
  CircleDot,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type PhaseStatus = "todo" | "in_progress" | "done";
const STORAGE_KEY = "founders.energyOracle.checklist.v1";

function useChecklist() {
  const [state, setState] = useState<Record<string, { checked: boolean; status: PhaseStatus }>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  const toggleItem = useCallback((id: string) => {
    setState((s) => ({ ...s, [id]: { ...s[id], checked: !s[id]?.checked, status: s[id]?.status ?? "todo" } }));
  }, []);
  const setStatus = useCallback((id: string, status: PhaseStatus) => {
    setState((s) => ({ ...s, [id]: { checked: s[id]?.checked ?? false, status } }));
  }, []);
  return { state, toggleItem, setStatus };
}
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders → Energy Price Oracle Roadmap.
 *
 * Per-user, utility-verified $/kWh published on-chain so the mint contract
 * can enforce a real-world price floor. Intentionally PARKED for seed —
 * lives here so Joseph + Cheetah can speak to it without diluting the
 * Proof-of-Genesis pitch.
 *
 * Mirrors gating pattern of FoundersVPPRoadmap (FounderRoute + PIN).
 */

export default function FoundersEnergyOracle() {
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
      <OracleContent />
    </VaultPinGate>
  );
}

function OracleContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 pt-4 pb-24 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Vault
          </Link>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-400/90 inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Founders Only
          </span>
        </div>

        {/* Hero */}
        <header className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary">
                Patent Track 2.5 · Parked Roadmap
              </p>
              <h1 className="text-xl font-semibold leading-tight">Energy Price Oracle</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Per-user, utility-verified <span className="text-foreground font-medium">$/kWh</span> published on-chain so the mint contract can enforce a real-world price floor. The piece that makes $ZSOLAR the first token with both <span className="text-foreground">verified production</span> and <span className="text-foreground">verified market price</span>.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">
              <AlertTriangle className="h-3 w-3" /> NOT in seed pitch
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              <Sparkles className="h-3 w-3" /> Series A moat
            </span>
          </div>
        </header>

        {/* Why it exists */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Why we need it (eventually)
          </h2>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Launch price ($0.10)</span> = LP math. We chose $200K USDC ÷ 2M $ZSOLAR. Pure mechanic.
            </p>
            <p>
              <span className="text-foreground font-medium">kWh floor (~$0.15–$0.30)</span> = real-world utility rate + carbon + REC value. Set by the world, not us.
            </p>
            <p>
              Today the kWh floor is a <span className="text-foreground">narrative</span>. The Oracle makes it <span className="text-foreground">code-enforced</span> — the smart contract literally rejects LP swaps below verified backing value.
            </p>
          </div>
        </section>

        {/* Architecture */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Architecture (3 data sources)
          </h2>
          <ul className="space-y-2.5">
            <li className="flex gap-3">
              <Database className="h-4 w-4 text-eco shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">UtilityAPI.com — verified premium</p>
                <p className="text-[11px] text-muted-foreground">OAuth into actual utility account. ~95% US coverage. Highest trust tier.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">Bill upload — already built ✓</p>
                <p className="text-[11px] text-muted-foreground">Reuses <code className="text-[10px] bg-muted/50 px-1 rounded">analyze-bill</code> edge function. Gemini OCR extracts utility, rate plan, $/kWh.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">EIA public dataset — free fallback</p>
                <p className="text-[11px] text-muted-foreground">Monthly avg $/kWh per US utility. No key, no cost. Floor for unverified users.</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Phased plan */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Phased build plan
          </h2>

          <OracleContentPhases />
        </section>

        {/* Already built */}
        <section className="rounded-2xl border border-eco/40 bg-eco/5 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-eco" /> What's already built (~60%)
          </h2>
          <ul className="space-y-1.5 text-xs">
            <BuiltRow done label="analyze-bill edge function (extracts $/kWh)" />
            <BuiltRow done label="Edge functions infra + pg_cron" />
            <BuiltRow done label="RLS, auth, role gating" />
            <BuiltRow label="user_kwh_rates table" />
            <BuiltRow label="EIA fallback function" />
            <BuiltRow label="UtilityAPI integration" />
            <BuiltRow label="EnergyOracle.sol contract" />
            <BuiltRow label="Publisher cron + Merkle root" />
          </ul>
        </section>

        {/* Patent */}
        <section className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-amber-300">
            <ShieldCheck className="h-4 w-4" /> Patent claim — file with Phase 3
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-amber-200/90">Track 2.5:</span> Per-user, utility-verified kilowatt-hour price oracle for cryptocurrency token valuation, with multi-source trust tiering (verified API / OCR'd bill / public dataset fallback) and on-chain Merkle-root publication for gas efficiency.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Pairs with PoG: <span className="text-foreground">PoG proves the kWh happened</span>; the Oracle <span className="text-foreground">proves what it's worth</span> in the user's market.
          </p>
        </section>

        {/* Triggers */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Triggers to start each phase
          </h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><span className="text-foreground">Phase 1:</span> First 100 paying users producing energy</li>
            <li><span className="text-foreground">Phase 2:</span> Seed round closed, runway secured</li>
            <li><span className="text-foreground">Phase 3:</span> Series A deck needs a new "next big thing"</li>
          </ul>
        </section>

        <p className="text-[10px] text-muted-foreground/70 text-center pt-2">
          Memory: <code>mem://roadmap/energy-price-oracle</code>
        </p>
      </div>
    </div>
  );
}

function PhaseCard({
  tag,
  title,
  status,
  bullets,
}: {
  tag: string;
  title: string;
  status: "active" | "next" | "later";
  bullets: string[];
}) {
  const styles = {
    active: "border-eco/50 bg-eco/10",
    next: "border-primary/50 bg-primary/10",
    later: "border-border/60 bg-card/30",
  }[status];
  const tagColor = {
    active: "text-eco",
    next: "text-primary",
    later: "text-muted-foreground",
  }[status];

  return (
    <div className={`rounded-xl border p-3 space-y-1.5 ${styles}`}>
      <p className={`text-[10px] uppercase tracking-widest ${tagColor}`}>{tag}</p>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="space-y-1 pt-1">
        {bullets.map((b, i) => (
          <li key={i} className="text-[11px] text-muted-foreground leading-snug pl-3 relative">
            <span className="absolute left-0 top-1.5 h-1 w-1 rounded-full bg-current opacity-50" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BuiltRow({ done, label }: { done?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-eco shrink-0" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
