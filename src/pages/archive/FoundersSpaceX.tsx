import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Rocket, Loader2, Satellite, Globe2, Orbit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

export default function FoundersSpaceX() {
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
    <VaultPinGate userId={user.id}>
      <SpaceXContent />
    </VaultPinGate>
  );
}

function SpaceXContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
        <div className="flex items-center justify-between mb-8">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">Founders Only · Draft</span>
        </div>

        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest mb-3">
            <Rocket className="h-3.5 w-3.5" /> SpaceX & Inter-System
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">$ZSOLAR — Off-World Energy</h1>
          <p className="text-lg text-muted-foreground">Starlink uplink-kWh · Starship payload-kWh · Mars colony · Inter-system settlement</p>
          <p className="text-xs text-muted-foreground mt-3">Draft v1 · Internal reference for Joseph & Michael · Not for public distribution</p>
        </header>

        <article className="prose prose-invert max-w-none space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Thesis</h2>
            <p className="text-muted-foreground">
              SpaceX is the off-world distribution layer for the same Mint-on-Proof method that powers terrestrial $ZSOLAR.
              Every measurable unit of orbital or interplanetary energy work — uplink, payload-to-orbit, colony power —
              is a mintable category under Patent v3. $ZSOLAR becomes the native unit of account across the Tesla + SpaceX
              civilizational stack: one token from a Powerwall in Austin to a solar array on Mars.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Eight-Category Moat — Category 8 (Inter-System)</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Aligned with Founder Pack v5.6 §5 numbering. Categories 6 (Robotaxi) and 7 (Optimus) are covered in the main pack;
              this briefing details Category 8 — the orbital and inter-system patent claims (§A.3 claims 6.1, 6.2, 7.5, 7.6).
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Category / Claim</th>
                    <th className="text-left p-3 font-semibold">Phase</th>
                    <th className="text-left p-3 font-semibold">Settlement</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border"><td className="p-3 font-medium text-foreground">8 · 6.1</td><td className="p-3">Starlink uplink-kWh (orbital relay proofs)</td><td className="p-3">2</td><td className="p-3">Orbital (Earth-anchored L2)</td></tr>
                  <tr className="border-t border-border"><td className="p-3 font-medium text-foreground">8 · 6.2</td><td className="p-3">Starship clean-launch credit (payload-kWh)</td><td className="p-3">2</td><td className="p-3">Orbital (Earth-anchored L2)</td></tr>
                  <tr className="border-t border-border"><td className="p-3 font-medium text-foreground">8 · 7.6</td><td className="p-3">Mars-surface clean-energy mint (first off-world)</td><td className="p-3">2</td><td className="p-3">Inter-system relay</td></tr>
                  <tr className="border-t border-border"><td className="p-3 font-medium text-foreground">8 · 7.5</td><td className="p-3">$ZSOLAR inter-system settlement bridge</td><td className="p-3">2</td><td className="p-3">Earth ↔ orbital ↔ Mars</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2"><Satellite className="h-5 w-5 text-amber-400" /> 3. Starlink Uplink-kWh</h2>
            <p className="text-muted-foreground mb-3">
              Each Starlink satellite cluster meters uplink energy at the gateway. A 1-hour rolling window is co-signed
              by the satellite key and a SpaceX relay oracle, then minted into the operator wallet.
            </p>
            <div className="rounded-lg border border-border bg-muted/10 p-5 font-mono text-[13px] leading-relaxed space-y-2">
              <div><span className="text-amber-400">satellite_id</span> + <span className="text-amber-400">cluster_id</span> → bound to operator wallet (lifetime)</div>
              <div><span className="text-amber-400">window</span> : 1-hour rolling · dedupe key <code>(sat_id, window_end)</code></div>
              <div><span className="text-amber-400">uplink_kwh</span> : measured at gateway · co-signed by SpaceX relay</div>
              <div><span className="text-amber-400">rate</span> : 1 $ZSOLAR / kWh · split 75 / 20 / 3 / 2</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2"><Rocket className="h-5 w-5 text-amber-400" /> 4. Starship Payload-kWh</h2>
            <p className="text-muted-foreground mb-3">
              Each Starship flight produces an energy-equivalent payload-to-orbit value. Mint fires only on confirmed
              on-orbit telemetry, co-signed by the vehicle key, SpaceX mission control, and range safety.
            </p>
            <div className="rounded-lg border border-border bg-muted/10 p-5 font-mono text-[13px] leading-relaxed space-y-2">
              <div><span className="text-amber-400">vehicle_id</span> + <span className="text-amber-400">flight_id</span> · bound at manifest</div>
              <div><span className="text-amber-400">payload_kwh</span> : <code>payload_mass_kg × delta_v → energy-equivalent kWh</code></div>
              <div><span className="text-amber-400">trigger</span> : on-orbit confirmation telemetry</div>
              <div><span className="text-amber-400">co-signers</span> : vehicle key + SpaceX mission control + range safety</div>
              <div><span className="text-amber-400">rate</span> : 1 $ZSOLAR / payload-kWh · split 75 / 20 / 3 / 2</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2"><Globe2 className="h-5 w-5 text-amber-400" /> 5. Mars Colony — Solar & Nuclear</h2>
            <p className="text-muted-foreground mb-3">
              Mars colony power — solar arrays plus small modular nuclear — uses the same Mint-on-Proof method. Latency
              constraints (≥ 3 min Earth ↔ Mars) require batched relay attestation and a queued mint that finalizes on
              the Earth contract once the relay envelope arrives.
            </p>
            <div className="rounded-lg border border-border bg-muted/10 p-5 font-mono text-[13px] leading-relaxed space-y-2">
              <div><span className="text-amber-400">colony_array_id</span> bound to colony multisig</div>
              <div><span className="text-amber-400">latency_window</span> : Earth ↔ Mars ≥ 3 min · batched</div>
              <div><span className="text-amber-400">attestation</span> : colony key + Starlink-Mars relay co-sign</div>
              <div><span className="text-amber-400">settlement</span> : queued mint, finalized on Earth contract</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2"><Orbit className="h-5 w-5 text-amber-400" /> 6. Inter-System Settlement</h2>
            <p className="text-muted-foreground">
              $ZSOLAR is denominated identically across Earth, Earth-orbit, and Mars. The Earth contract is the canonical
              ledger; orbital and Mars events finalize there via relay. The result is a single unit of account that spans
              every measurable joule of productive human energy work in the Tesla + SpaceX civilizational stack.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Why This Locks the Moat</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Patent v3 method coverage extends to orbital and inter-system energy attestation.</li>
              <li>Co-signed attestation pattern prevents unilateral mint by any single party — including SpaceX.</li>
              <li>Hardware-bound keys and replay keys make duplication economically irrational.</li>
              <li>Same 75 / 20 / 3 / 2 split keeps user, burn, LP, and treasury aligned across all eight categories.</li>
            </ul>
          </section>

          <section className="border-t border-border pt-6 text-xs text-muted-foreground">
            Confidential. Do not share outside Joseph & Michael. Phase 2 is forward-looking and contingent on
            SpaceX product availability and partnership terms. Numbers reflect current 1T-cap model. Subject to revision.
          </section>
        </article>
      </div>
    </div>
  );
}
