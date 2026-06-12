import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
  ArrowDownUp,
  Car,
  Home as HomeIcon,
  Plug,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Database,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders Patent Expansion — bi-directional EV charging (V2G/V2H/V2L)
 * + FSD autonomous miles. Documents the patent claim additions Joseph wants
 * his attorney to file as dependent claims off the existing
 * Proof-of-Delta™ + Proof-of-Origin™ method.
 *
 * Internal only. Gated identically to every other founders page.
 */

export default function FoundersPatentExpansion() {
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
      <PatentExpansionContent />
    </VaultPinGate>
  );
}

function PatentExpansionContent() {
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
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Patent · Internal
          </span>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-widest mb-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Patent Claim Expansion
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Bi-Directional EV Charging + FSD Miles
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Dependent claims to add to the existing $ZSOLAR patent covering
            tokenization of <span className="text-primary font-semibold">V2G</span>,{" "}
            <span className="text-primary font-semibold">V2H</span>,{" "}
            <span className="text-primary font-semibold">V2L</span>, and{" "}
            <span className="text-primary font-semibold">FSD autonomous miles</span> —
            extending Proof-of-Delta™ and Proof-of-Origin™.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Internal only · For patent counsel · Do not publish externally
          </p>
        </header>

        {/* Disclosure caution */}
        <section className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-5 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Disclosure Caution
            </h2>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            File first, talk later. Patent strength comes from priority date.
            High-level mention to investors is fine — never publish technical
            claim language publicly until counsel confirms filing is complete.
          </p>
        </section>

        {/* The three flows */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Three Bi-Directional Flows
          </h2>
          <div className="grid gap-3">
            <FlowCard
              icon={<Zap className="h-4 w-4" />}
              acronym="V2G"
              name="Vehicle-to-Grid"
              desc="EV battery exports kWh back to the utility grid. Highest grid value — paid by utility for peak/dispatch services."
            />
            <FlowCard
              icon={<HomeIcon className="h-4 w-4" />}
              acronym="V2H"
              name="Vehicle-to-Home"
              desc="EV battery powers the home (backup or peak shaving). Replaces or augments stationary battery."
            />
            <FlowCard
              icon={<Plug className="h-4 w-4" />}
              acronym="V2L"
              name="Vehicle-to-Load"
              desc="EV powers an external device or appliance directly. Already shipping on Hyundai/Kia E-GMP."
            />
          </div>
        </section>

        {/* Why now */}
        <section className="mb-10 rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Car className="h-4 w-4" /> Why File Now
          </h2>
          <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>Ford F-150 Lightning, Cybertruck, GM Ultium, Hyundai/Kia E-GMP — bi-directional hardware shipping today.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>Tesla V2G expected 2026 — Elon publicly committed.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>By Phase 2 launch, bi-directional will be table stakes. Patent now or someone else owns it.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>App feature ships in Phase 3 (post-VPP). No engineering required today.</span>
            </li>
          </ul>
        </section>

        {/* Claim hierarchy */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4" /> Recommended Claim Hierarchy
          </h2>
          <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4 text-sm leading-relaxed">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Independent Claim (existing)
              </p>
              <p className="text-foreground/90 italic">
                "A method for tokenizing verified kilowatt-hours from a connected
                energy device, wherein the device's identity is cryptographically
                bound to a Proof-of-Origin signature…"
              </p>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-primary mb-1">
                New Dependent Claims (to add)
              </p>
              <ul className="space-y-2 text-foreground/90">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">N+1.</span>
                  <span>…wherein the connected device is an electric vehicle, and the verified kWh represent energy exported from the vehicle's battery to a utility grid (V2G).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">N+2.</span>
                  <span>…wherein the energy is exported from the vehicle's battery to a residence (V2H).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">N+3.</span>
                  <span>…wherein the energy is exported from the vehicle's battery to an external load or appliance (V2L).</span>
                </li>
              </ul>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-eco mb-1">
                Killer Method Claim
              </p>
              <p className="text-foreground/90 italic">
                "A method for distinguishing energy flow direction in a
                bi-directional EV charging session, wherein imported kWh and
                exported kWh are independently verified, timestamped, and
                tokenized as separate mint events within the same session."
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Two mint events per charging cycle. Owns the separation method.
              </p>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-primary mb-1">
                Adjacent Claim (FSD)
              </p>
              <p className="text-foreground/90 italic">
                "…wherein verified kWh or verified miles are attributed to
                autonomous operation of the vehicle (e.g. Tesla FSD), creating a
                distinct mintable event class for self-driven distance."
              </p>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-eco mb-1">
                VPP Dispatch Metering Claim
              </p>
              <p className="text-foreground/90 italic">
                "A method for tokenizing verified kilowatt-hours discharged from
                a connected energy storage device in response to a grid-operator
                dispatch signal, wherein the dispatch event, the discharged kWh,
                and the resulting token mint are cryptographically bound into a
                single auditable settlement record minted to the device owner's
                wallet within seconds of dispatch completion."
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Owns the link between an OpenADR-class grid signal, the verified
                discharge event, and real-time on-chain settlement. Distinct
                from passive energy production claims.
              </p>
            </div>
          </div>
        </section>

        {/* Implementation anchor */}
        <section className="mb-10 rounded-xl border border-eco/30 bg-eco/[0.05] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-eco mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" /> Implementation Anchor
          </h2>
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            A real database table now backs the bi-directional claim — strengthens
            the patent by showing the method is reduced to practice, not
            speculative.
          </p>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-[11px] text-muted-foreground space-y-1">
            <div><span className="text-eco">table</span> · bidirectional_mint_events</div>
            <div><span className="text-eco">direction</span> · import | export</div>
            <div><span className="text-eco">flow_type</span> · charge | v2g | v2h | v2l</div>
            <div><span className="text-eco">claim_ref</span> · ZSOLAR-BIDIR-V1</div>
          </div>
        </section>

        {/* Mintable surfaces */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4" /> Total Mintable Surface (9 events)
          </h2>
          <div className="rounded-xl border border-border bg-card/40 p-5 text-sm space-y-2 leading-relaxed">
            <p className="text-[10px] uppercase tracking-widest text-primary">Phase 1 (live)</p>
            <ul className="space-y-1 text-foreground/90 ml-1">
              <li>· Solar production · Battery export · Supercharger · Home charging · EV miles driven</li>
            </ul>
            <p className="text-[10px] uppercase tracking-widest text-amber-400 mt-3">Phase 3 (patent now, ship later)</p>
            <ul className="space-y-1 text-foreground/90 ml-1">
              <li>· V2G export · V2H export · V2L export · FSD autonomous miles</li>
            </ul>
          </div>
        </section>

        {/* Action checklist */}
        <section className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Next Actions
          </h2>
          <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">1.</span>
              <span>Send this page to patent counsel for inclusion in next provisional / continuation filing.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">2.</span>
              <span>Prior art sweep on V2G + tokenization claims.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">3.</span>
              <span>Anchor priority date — bidirectional_mint_events schema is timestamped today.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">4.</span>
              <span>When Tesla V2G API ships in 2026, plug into existing Proof-of-Delta engine. No re-architecture.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function FlowCard({
  icon,
  acronym,
  name,
  desc,
}: {
  icon: React.ReactNode;
  acronym: string;
  name: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          {icon}
        </span>
        <span className="text-sm font-bold tracking-wide">{acronym}</span>
        <span className="text-xs text-muted-foreground">· {name}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
