import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Battery,
  Zap,
  Layers,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Coins,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders VPP Roadmap — Phase 2 revenue stream.
 *
 * Frames the ZenSolar VPP program as a deliberate Phase 2 launch (post-mainnet,
 * post-seed). Phase 1 is what's already shipped: Tap-to-Mint™, Daily Auto-Mint
 * (DCA), Proof-of-Genesis™, embedded wallet. Phase 2 layers VPP on top with the
 * 50% → LP injection rule preserved across every new revenue line.
 *
 * Built specifically so Joseph can speak intelligently to Lyndon (and other
 * investors) about the long-tail revenue arc without conflating it with
 * what's launching on day one.
 *
 * Gated identically to every other founders page (FounderRoute + PIN).
 */

export default function FoundersVPPRoadmap() {
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
      <RoadmapContent />
    </VaultPinGate>
  );
}

function RoadmapContent() {
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
            Phase 2 · Internal
          </span>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-widest mb-3">
            <Battery className="h-3.5 w-3.5" /> ZenSolar VPP Roadmap
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            VPP Program — Phase 2 Revenue Stream
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            What launches with mainnet (Phase 1), what comes after seed close (Phase 2),
            and how every new revenue line preserves the{" "}
            <span className="text-primary font-semibold">50% → LP injection</span> rule.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Internal only · Joseph & Michael Tschida · For investor conversations
          </p>
        </header>

        {/* Reality check */}
        <section className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-5 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Honest Status
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>Seed round not yet closed.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>$ZSOLAR not yet on mainnet — no real users, no real monetary value behind mints today.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-1 opacity-70" />
              <span>
                VPP is <strong>not</strong> on the launch checklist. It is a Phase 2 lever
                deliberately held back so Phase 1 ships clean.
              </span>
            </li>
          </ul>
        </section>

        {/* Phase 1 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-eco/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-eco" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Phase 1 — Launch (Now → Mainnet)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Everything that already exists in the app. Ships when seed closes and we
            deploy to mainnet. <strong>No VPP yet.</strong>
          </p>

          <div className="rounded-xl border border-eco/30 bg-eco/[0.05] p-5 space-y-4">
            <SubscriptionRow
              tier="Mint Basic"
              price="$9.99"
              feature="Manual Tap-to-Mint™ at any time"
            />
            <SubscriptionRow
              tier="Mint Pro"
              price="$19.99"
              feature="Manual + Daily Auto-Mint (DCA your energy)"
            />

            <div className="pt-3 border-t border-border/40 text-sm text-foreground/80">
              <p className="mb-2 font-semibold text-eco">What makes this defensible day one:</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Solar kWh produced → $ZSOLAR</li>
                <li>• EV miles driven → $ZSOLAR</li>
                <li>• Battery kWh exported → $ZSOLAR</li>
                <li>• Tesla Supercharger / home charging kWh → $ZSOLAR</li>
                <li>• Proof-of-Genesis™ provenance under every mint</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Phase 2 — VPP Program (Post-Seed)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Layered on top of Phase 1 once we have seed capital + utility partnerships
            (Chariot / Axia model in TX). VPP becomes a separate product line — not
            forced into the minting bundle.
          </p>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-5 space-y-4">
            <SubscriptionRow
              tier="VPP Only"
              price="$19.99"
              feature="Battery dispatch enrollment, no minting"
              accent="primary"
            />
            <SubscriptionRow
              tier="Complete"
              price="$29.99"
              feature="Manual mint + VPP (no auto-mint)"
              accent="primary"
            />
            <SubscriptionRow
              tier="Elite"
              price="$49.99"
              feature="Manual + Daily Auto-Mint + VPP (full stack)"
              accent="primary"
            />

            <div className="pt-3 border-t border-border/40 text-sm text-foreground/80">
              <p className="mb-2 font-semibold text-primary">Anchor: Base Power (TX)</p>
              <p className="text-muted-foreground leading-relaxed">
                Base charges $700 install + $19.99 (1 batt) / $49.99 (2 batt) per month —{" "}
                <strong>and Base owns the battery</strong>. ZenSolar matches their dollar
                amounts but the customer keeps their battery, keeps any REP, and earns
                appreciating $ZSOLAR.
              </p>
            </div>
          </div>
        </section>

        {/* The 50% rule */}
        <section className="mb-10 rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              The 50% → LP Rule (Universal)
            </h2>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
            Every new revenue stream — Phase 1 subscriptions, Phase 2 VPP fees,
            Phase 2 utility revenue share — sends <strong>50%</strong> straight into the
            $ZSOLAR liquidity pool. No exceptions.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Subscription LP / user / yr
              </p>
              <p className="text-lg font-semibold tabular-nums">$60 – $300</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                VPP utility share LP / yr
              </p>
              <p className="text-lg font-semibold tabular-nums">+$90 / user</p>
            </div>
          </div>
        </section>

        {/* Talking points for Lyndon */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Talking Points for Lyndon
            </h2>
          </div>
          <ol className="space-y-3 text-sm text-foreground/90 leading-relaxed list-decimal list-inside">
            <li>
              <strong>Phase 1 is enough to win on its own.</strong> Tap-to-Mint™ + Daily
              Auto-Mint + Proof-of-Genesis™ has no competitive analog today.
            </li>
            <li>
              <strong>Phase 2 unlocks a second revenue stream</strong> using the same
              users, same hardware, same app — VPP just turns the battery into a second
              earnings surface.
            </li>
            <li>
              <strong>The Chariot / Axia VPP model already works in Texas.</strong> $40–60
              monthly bill credit + 9.9¢ 1:1 net metering. ZenSolar plugs into that
              economic structure but pays in appreciating $ZSOLAR instead of fiat credits.
            </li>
            <li>
              <strong>50% of every dollar feeds the LP.</strong> Subscription revenue,
              VPP fees, and utility revenue share are all liquidity-positive by design —
              the more we scale, the deeper the float.
            </li>
            <li>
              <strong>Phase 2 is gated by capital, not by tech risk.</strong> The
              minting + verification engine that runs Phase 1 is the same engine that
              settles VPP dispatch events.
            </li>
          </ol>
        </section>

        {/* Sequencing */}
        <section className="mb-10 rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Suggested Sequencing
            </h2>
          </div>
          <ol className="space-y-2 text-sm text-foreground/90">
            <li>
              <strong>T+0:</strong> Close seed. Deploy mainnet. Launch Phase 1
              (Mint Basic + Mint Pro).
            </li>
            <li>
              <strong>T+3 mo:</strong> Sign first utility / REP partnership LOI.
              Begin VPP pilot in TX (Chariot / Axia model).
            </li>
            <li>
              <strong>T+6 mo:</strong> VPP Only + Complete + Elite tiers go live.
              Begin LP injection from VPP utility share.
            </li>
            <li>
              <strong>T+12 mo:</strong> Multi-state expansion. VPP becomes a material
              ARR contributor.
            </li>
          </ol>
        </section>

        <footer className="pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            Phase 2 details are subject to seed close + partnership negotiations.
            Everything Phase 1 ships day one.
          </p>
        </footer>
      </div>
    </div>
  );
}

function SubscriptionRow({
  tier,
  price,
  feature,
  accent = "eco",
}: {
  tier: string;
  price: string;
  feature: string;
  accent?: "eco" | "primary";
}) {
  const accentClass = accent === "primary" ? "text-primary" : "text-eco";
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-border/30 last:border-0">
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${accentClass}`}>{tier}</p>
        <p className="text-xs text-muted-foreground leading-snug">{feature}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums whitespace-nowrap">
        {price}
        <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
      </p>
    </div>
  );
}
