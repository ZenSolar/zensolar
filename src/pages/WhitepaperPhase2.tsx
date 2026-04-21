import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Rocket, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";

export default function WhitepaperPhase2() {
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
      <Phase2Content />
    </VaultBiometricGate>
  );
}

function Phase2Content() {
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
            <Rocket className="h-3.5 w-3.5" /> White Paper · Phase 2
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">$ZSOLAR — Phase 2</h1>
          <p className="text-lg text-muted-foreground">Optimus, FSD/Robotaxi, SpaceX, Starlink & Inter-System Settlement</p>
          <p className="text-xs text-muted-foreground mt-3">Draft v1 · Internal reference for Joseph & Michael · Not for public distribution</p>
        </header>

        <article className="prose prose-invert max-w-none space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Abstract</h2>
            <p className="text-muted-foreground">
              Phase 2 expands $ZSOLAR from terrestrial clean-energy to the full Tesla + SpaceX work economy and
              ultimately to inter-system settlement. The same Mint-on-Proof method extended to humanoid labor
              (Optimus), autonomous mobility (FSD / Robotaxi), orbital infrastructure (Starlink uplink-kWh,
              Starship payload-kWh), and Mars-colony solar / nuclear kWh. $ZSOLAR becomes the native unit of
              account for off-world energy economics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. From 6 to 8 Categories — The Patent Moat</h2>
            <p className="text-muted-foreground mb-3">
              Patent v3 expands the method claim to eight protected categories. Phase 1 covers six terrestrial categories.
              Phase 2 adds two new orbital + inter-system categories:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3 font-semibold">Phase</th>
                    <th className="text-left p-3 font-semibold">Categories</th>
                    <th className="text-left p-3 font-semibold">Settlement Layer</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium text-foreground">Phase 1</td>
                    <td className="p-3">Solar · Battery · EV charging · EV miles · FSD miles · Optimus preview</td>
                    <td className="p-3">Earth (Base L2)</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium text-foreground">Phase 2a</td>
                    <td className="p-3">Starlink uplink-kWh · Starship payload-kWh</td>
                    <td className="p-3">Orbital (Earth-anchored L2)</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium text-foreground">Phase 2b</td>
                    <td className="p-3">Mars-colony solar kWh · Mars nuclear kWh</td>
                    <td className="p-3">Inter-system (Earth ↔ Mars relay)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Optimus & FSD / Robotaxi</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Optimus work-hours</strong> — verified humanoid labor minted as $ZSOLAR proportional to attested work-hour deltas.</li>
              <li><strong className="text-foreground">FSD-supervised miles</strong> — multiplier on base EV mile rewards (Phase 1 bridge → Phase 2 full claim).</li>
              <li><strong className="text-foreground">Robotaxi revenue-miles</strong> — autonomous fleet earnings proof-chained to the ride and the vehicle wallet.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. SpaceX & Orbital Infrastructure</h2>
            <p className="text-muted-foreground mb-3">
              SpaceX products produce measurable energy work in orbit. Two new categories tokenize that work:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Starlink uplink-kWh</strong> — verified orbital uplink energy attested per satellite cluster.</li>
              <li><strong className="text-foreground">Starship payload-kWh</strong> — energy-equivalent payload-to-orbit minted on launch confirmation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Mars & Inter-System Settlement</h2>
            <p className="text-muted-foreground">
              Mars colony power — solar arrays and small modular nuclear — mints $ZSOLAR on the same Mint-on-Proof
              method, with Earth ↔ Mars relay attestation. $ZSOLAR becomes the inter-system settlement currency:
              the same token that pays for a Powerwall discharge in Austin pays for a Starship payload-kWh and a
              Mars colony solar kWh. One unit of account across the entire Tesla + SpaceX civilizational stack.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Patent v3 — Eight-Category Moat</h2>
            <p className="text-muted-foreground">
              The method claim covers: device claim → baseline snapshot → signed delta → cryptographic attestation →
              proportional mint with 75/20/3/2 split → on-chain settlement. The eight protected categories give
              ZenSolar exclusive method coverage across the Tesla + SpaceX work economy through inter-system scope.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Phase 2 Roadmap</h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Optimus work-hour pilot — attested mint with first deployed units</li>
              <li>Robotaxi revenue-mile mint integration</li>
              <li>Starlink uplink-kWh attestation pilot</li>
              <li>Starship payload-kWh on launch confirmation</li>
              <li>Mars-colony power mint + Earth ↔ Mars relay (long-horizon)</li>
            </ol>
          </section>

          <section className="border-t border-border pt-6 text-xs text-muted-foreground">
            Confidential. Do not share outside Joseph & Michael. Phase 2 is forward-looking and contingent on
            Tesla/SpaceX product availability. Numbers and structure reflect current 1T-cap model. Subject to revision.
          </section>
        </article>
      </div>
    </div>
  );
}
