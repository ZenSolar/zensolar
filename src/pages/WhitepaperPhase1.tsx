import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";

export default function WhitepaperPhase1() {
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
      <Phase1Content />
    </VaultBiometricGate>
  );
}

function Phase1Content() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">Founders Only · Draft</span>
        </div>

        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest mb-3">
            <FileText className="h-3.5 w-3.5" /> White Paper · Phase 1
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">$ZSOLAR — Phase 1</h1>
          <p className="text-lg text-muted-foreground">Tap-to-Mint™ Solar, EV, and Home Energy</p>
          <p className="text-xs text-muted-foreground mt-3">Draft v1 · Internal reference for Joseph & Michael · Not for public distribution</p>
        </header>

        <article className="prose prose-invert max-w-none space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Abstract</h2>
            <p className="text-muted-foreground">
              ZenSolar introduces $ZSOLAR, a Base L2 ERC-20 token that mints proportionally to verified clean-energy
              production and clean-mile travel. Phase 1 covers the Tesla and home-energy ecosystem: rooftop solar
              (SolarEdge, Enphase, Tesla Solar), home batteries (Powerwall), EV charging (Tesla, Wallbox), and EV miles
              driven. The protocol pairs cryptographic mint-on-proof with a hard 1T cap, LP-seeded tranche releases at
              a $0.10 launch price, and a 75/20/3/2 mint split (user / burn / LP / treasury).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. The Problem</h2>
            <p className="text-muted-foreground">
              Clean energy assets — solar panels, batteries, EVs — produce verifiable real-world value every day. Today
              that value is invisible to capital markets. Owners receive utility credits at best, and the underlying
              clean-energy work product is never tokenized, traded, or composable. Existing carbon credits are opaque,
              non-cryptographic, and divorced from the asset that produced them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. The Six Phase-1 Categories</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Solar kWh</strong> — rooftop production verified via SolarEdge / Enphase / Tesla APIs.</li>
              <li><strong className="text-foreground">Battery kWh</strong> — Powerwall discharge cycles supplying home or grid.</li>
              <li><strong className="text-foreground">EV charging kWh</strong> — home and supercharger sessions, deduped by session ID.</li>
              <li><strong className="text-foreground">EV miles</strong> — odometer delta from Tesla fleet API, capped per epoch.</li>
              <li><strong className="text-foreground">FSD-supervised miles</strong> — autonomy hours as a multiplier on base mile rewards.</li>
              <li><strong className="text-foreground">Optimus work-hours (preview)</strong> — bridge category to Phase 2.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Mint-on-Proof Architecture</h2>
            <p className="text-muted-foreground">
              Each mint event requires a cryptographic proof chain: device claim (one device → one wallet, lifetime),
              baseline snapshot, signed delta, and edge-function attestation. The contract enforces the split:
              75% to the user wallet, 20% burned, 3% routed to the LP, 2% to treasury. Patent v3 covers the method
              claim across all eight categories (six Phase 1 + two Phase 2 — see Phase 2 paper).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Tokenomics</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Hard cap: <strong className="text-foreground">1,000,000,000,000 $ZSOLAR</strong></li>
              <li>Founder allocation: Joseph 150B (15%), Michael 50B (5%) — pact-locked, 4yr vest, 12mo cliff</li>
              <li>Treasury: 75B (7.5%) · Team pool: 25B (2.5%) · Community mint pool: 700B (70%)</li>
              <li>Launch price: <strong className="text-foreground">$0.10 USDC</strong> via paired LP tranches (e.g. $200K USDC + 2M $ZSOLAR per round)</li>
              <li>$1T market-cap crossover prices: Joseph $6.67 · Michael $20.00</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Phase 1 Roadmap</h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Beta mint with verified Tesla / SolarEdge / Enphase / Wallbox connections</li>
              <li>Public LP seed at $0.10 — Round 1 tranche</li>
              <li>Mobile PWA general availability (iOS / Android via Chrome)</li>
              <li>Patent v3 filing covering eight categories</li>
              <li>Bridge to Phase 2 (Optimus, FSD/Robotaxi, SpaceX) — see companion paper</li>
            </ol>
          </section>

          <section className="border-t border-border pt-6 text-xs text-muted-foreground">
            Confidential. Do not share outside Joseph & Michael. Numbers reflect current Phase 1 model
            (1T cap · $0.10 launch · 75/20/3/2). Subject to revision.
          </section>
        </article>
      </div>
    </div>
  );
}
