import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Compass,
  Shield,
  Coins,
  ScrollText,
  Layers,
  Plug,
  Cpu,
  TrendingUp,
  Users,
  Lock,
  Map,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders Master Outline — gated to founders + PIN.
 *
 * The single cornerstone source of truth for the entire ZenSolar product +
 * ZenCorp Inc business. Updated as we build, decide, and evolve. Every
 * section links back to deeper memory/code/docs where relevant.
 *
 * If you change something here that contradicts memory, also update memory.
 * If you change memory, also update here. They are mirror twins.
 */

const LAST_UPDATED = "April 25, 2026";
const VERSION = "v1.0";

type SectionKey =
  | "brand"
  | "thesis"
  | "tokenomics"
  | "ip"
  | "surfaces"
  | "oem"
  | "stack"
  | "business"
  | "people"
  | "decisions"
  | "roadmap"
  | "open";

interface OutlineSection {
  key: SectionKey;
  number: number;
  title: string;
  icon: typeof Compass;
  tagline: string;
  body: React.ReactNode;
  lastUpdated: string;
  memoryLinks?: { label: string; path: string }[];
}

const SECTIONS: OutlineSection[] = [
  {
    key: "brand",
    number: 1,
    title: "Brand & Naming",
    icon: Compass,
    tagline: "Two names, one strategy.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [{ label: "mem://brand/naming", path: "brand/naming" }],
    body: (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Product brand: ZenSolar</h4>
          <p className="text-sm text-foreground/80">
            One word. Capital Z, capital S. Used everywhere user-facing — marketing, app UI,
            investor demo, white paper, social. Never <em>Zen Solar</em>, <em>Zensolar</em>, or{" "}
            <em>zensolar</em>.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Legal entity: ZenCorp Inc</h4>
          <p className="text-sm text-foreground/80">
            The corporation that holds IP, contracts, and equity. Appropriate contexts only:
            footer fine print (<em>© 2026 ZenCorp Inc.</em>), terms/privacy, cap table, employment
            docs, investor legal docs, SAFE/SAFT paperwork. <strong>Never</strong> in product UI or
            marketing headlines.
          </p>
        </div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.04] p-3">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
            The joke (preserve it)
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>"ZenCorp Inc"</strong> is a deliberate sarcastic wink. Only an incorporated
            entity can IPO on a public exchange — and ZenSolar will <strong>never IPO</strong>. The
            $ZSOLAR token <em>is</em> the liquidity event, replacing the traditional IPO path.
            We stuck the most corporate-sounding name possible ("Corp Inc") onto the most
            anti-corporate exit strategy possible. Crypto-natives will catch it. Future
            writers/designers — this is intentional irony, not a typo to "fix."
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "thesis",
    number: 2,
    title: "The Thesis",
    icon: Sparkles,
    tagline: "Creating Currency From Energy. The 5-Layer Conviction Stack.",
    lastUpdated: "Apr 26, 2026",
    memoryLinks: [
      { label: "mem://features/proof-of-genesis", path: "features/proof-of-genesis" },
    ],
    body: (
      <div className="space-y-5 text-sm text-foreground/85 leading-relaxed">
        <p>
          ZenSolar turns verified, real-world clean-energy production and electrification activity
          into a tokenized currency on Base L2. Every $ZSOLAR minted is backed by a cryptographic
          proof tied to a physical device and an immutable on-chain registry.
        </p>
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">
          The 5-Layer Conviction Stack — memorize in order
        </p>

        {/* LAYER 1 */}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-2">
          <h4 className="text-sm font-bold text-foreground">Layer 1 — Physics: PoG &gt; PoW</h4>
          <p>
            Bitcoin's PoW is energy <em>destroyed</em> to prove computational waste —
            roughly <strong>~1.4 million kWh</strong> of grid electricity burned as heat to mint
            a single BTC.<sup className="text-primary">[1]</sup> Its value is purely the cost to redo it.
          </p>
          <p>
            Proof-of-Genesis is energy <em>created and delivered</em>, cryptographically witnessed
            at physical origin: <strong>Proof-of-Origin</strong> (verified hardware signs real
            production), <strong>Proof-of-Delta</strong> (measured kWh change between timestamps),
            <strong> Proof-of-Permanence</strong> (immutable on-chain Merkle snapshots).
          </p>
          <p className="text-foreground font-medium">
            ZSOLAR mints 1 $ZSOLAR from just <strong>10 kWh</strong> of clean energy that already
            powered a home, battery, or EV.<sup className="text-primary">[2]</sup> Same unit (the kWh),
            opposite physics: PoW destroys, PoG creates. Every $ZSOLAR mint is real-world utility —
            currency created from renewable energy that was never wasted.
          </p>

          {/* Energy vs Token explainer callout */}
          <div className="mt-2 rounded-md border border-primary/40 bg-background/60 p-3">
            <p className="text-[11px] uppercase tracking-widest text-primary font-semibold mb-2">
              Energy vs Token — at a glance
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-1.5 pr-2 font-semibold"></th>
                    <th className="py-1.5 pr-2 font-semibold">Bitcoin (PoW)</th>
                    <th className="py-1.5 font-semibold text-primary">ZSOLAR (PoG)</th>
                  </tr>
                </thead>
                <tbody className="text-foreground/85">
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-2 text-muted-foreground">Energy in per token</td>
                    <td className="py-1.5 pr-2">~1,400,000 kWh / BTC</td>
                    <td className="py-1.5">10 kWh / $ZSOLAR</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-2 text-muted-foreground">What happens to that energy</td>
                    <td className="py-1.5 pr-2">Destroyed as waste heat</td>
                    <td className="py-1.5">Delivered as useful power first, then minted</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-2 text-muted-foreground">Energy source</td>
                    <td className="py-1.5 pr-2">Any grid electricity (mostly fossil)</td>
                    <td className="py-1.5">Verified clean energy only</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 text-muted-foreground">Net effect per token</td>
                    <td className="py-1.5 pr-2">CO₂ emitted</td>
                    <td className="py-1.5">Real-world utility delivered</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground italic mt-2">
              Bitcoin requires roughly <strong>140,000×</strong> more energy per token than ZSOLAR —
              and that energy is wasted, not used. That's the digital-photosynthesis asymmetry.
            </p>
          </div>

          {/* Footnotes */}
          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground leading-snug">
            <p>
              <sup className="text-primary">[1]</sup> Derived from public network estimates:
              Cambridge Centre for Alternative Finance (<a href="https://ccaf.io/cbnsi/cbeci" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">CBECI</a>)
              annualized Bitcoin electricity consumption ÷ annual BTC issuance, cross-checked against
              Digiconomist's <a href="https://digiconomist.net/bitcoin-energy-consumption" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Bitcoin Energy Consumption Index</a>.
              Figure rounds to ~1.4M kWh per newly minted BTC at current network hashrate; varies with
              difficulty and miner efficiency.
            </p>
            <p>
              <sup className="text-primary">[2]</sup> ZenSolar mint ratio is a protocol parameter
              locked in SSoT v2.1 (May 2 2026): <strong>10 kWh = 1 $ZSOLAR</strong> (and 10 EV miles =
              1 $ZSOLAR). Energy must be cryptographically verified at origin via OEM-signed telemetry
              (Proof-of-Genesis). No CO₂ destruction is required or claimed — the value comes from
              real-world utility delivered before the mint event.
            </p>
          </div>
        </div>

        {/* LAYER 2 */}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-2">
          <h4 className="text-sm font-bold text-foreground">Layer 2 — TAM: Tokenized Energy Transition</h4>
          <p>
            Bitcoin's ceiling = belief × 21M cap. ZSOLAR's ceiling = global clean energy
            production rate. Solar+EV is ~$2T/yr capex, growing 25%+ annually. Every panel
            installed and every EV charged for the next 30 years is a potential mint event.
          </p>
          <p className="text-foreground font-medium">
            Capture even 5% of verified clean energy flows globally by 2035 and market cap
            mechanically exceeds Bitcoin's current ~$2T. Not speculation — tokenized GDP.
          </p>
        </div>

        {/* LAYER 3 */}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-2">
          <h4 className="text-sm font-bold text-foreground">Layer 3 — IP: The Patented Primitive</h4>
          <p>
            Patent App. <strong>19/634,402</strong> + April 2025 provisional + upcoming
            SpaceX/satellite-verification provisional cover the <em>method</em> of converting
            verified physical energy events into on-chain tokens via OEM-signed telemetry.
          </p>
          <p className="text-foreground font-medium">
            Anyone trying to copy this either licenses from ZenCorp Inc or infringes. The token
            isn't the moat — the primitive is.
          </p>
        </div>

        {/* LAYER 4 — THE FLYWHEEL */}
        <div className="rounded-lg border border-primary/50 bg-primary/[0.08] p-3 space-y-2">
          <h4 className="text-sm font-bold text-foreground">
            Layer 4 — The Self-Reinforcing Flywheel <span className="text-primary">(Bitcoin literally cannot do this)</span>
          </h4>
          <p>
            Bitcoin's economic loop is one-directional: miners spend energy → tokens exist →
            market decides price. <strong>No mechanism makes price rise as adoption grows.</strong>{" "}
            New users just bid against existing holders.
          </p>
          <p className="text-foreground font-medium">ZSOLAR's loop is self-reinforcing on every axis:</p>
          <pre className="text-xs bg-background/60 border border-border rounded p-2 overflow-x-auto leading-snug">
{`More users connect devices
   ↓
More verified kWh minted (real production)
   ↓
More $9.99/mo subscriptions → 50% auto-injected into LP
   ↓
LP depth grows → price floor rises → less slippage
   ↓
Higher token price → each kWh mint worth more
   ↓
More attractive to new users → loop restarts, stronger`}
          </pre>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-1.5 pr-2 font-semibold">Mechanism</th>
                  <th className="py-1.5 pr-2 font-semibold">Effect</th>
                  <th className="py-1.5 font-semibold text-muted-foreground">BTC Equivalent</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-1.5 pr-2">50% of subs → LP</td>
                  <td className="py-1.5 pr-2">Every paying user permanently deepens liquidity</td>
                  <td className="py-1.5 text-muted-foreground">None</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 pr-2">Mint burn (20%) + LP (3%)</td>
                  <td className="py-1.5 pr-2">Every mint tightens supply AND deepens LP</td>
                  <td className="py-1.5 text-muted-foreground">Burns only via lost keys</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 pr-2">Tranched LP rounds</td>
                  <td className="py-1.5 pr-2">Price discovery managed up, not speculated</td>
                  <td className="py-1.5 text-muted-foreground">Pure auction</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 pr-2">Subscription revenue floor</td>
                  <td className="py-1.5 pr-2">Real USDC flowing in monthly</td>
                  <td className="py-1.5 text-muted-foreground">Miners are sellers</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2">Verified utility per token</td>
                  <td className="py-1.5 pr-2">Each token = real kWh = carbon credit = grid value</td>
                  <td className="py-1.5 text-muted-foreground">Narrative only</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-foreground font-medium pt-1">
            Killer line for Lyndon: <em>"Bitcoin's price requires new buyers to outpace miner sell
            pressure. ZSOLAR's price rises automatically with every new subscriber, because half
            their subscription is a permanent LP injection — even if they never trade a single
            token. Adoption mechanically increases price floor. Bitcoin can't do that. Nothing can
            without our patent."</em>
          </p>
        </div>

        {/* LAYER 5 — THE BITCOIN ASYMMETRIES (HALVING + LOST COINS) */}
        <div className="rounded-lg border border-destructive/40 bg-destructive/[0.06] p-3 space-y-2">
          <h4 className="text-sm font-bold text-foreground">
            Layer 5 — The Bitcoin Scarcity Lie (Halving + Lost Coins)
          </h4>
          <p className="text-foreground/85">
            Most people — including most investors — don't realize this. Bitcoin's "21M hard cap"
            is a marketing fiction. The real circulating ceiling is dramatically lower, and
            <strong> the network is structurally incapable of reaching its own cap.</strong>
          </p>
          <ul className="space-y-2 pl-1">
            <li>
              <strong className="text-foreground">The Halving:</strong> Every 4 years, mining
              rewards halve. Issuance approaches zero asymptotically — the final BTC won't be
              minted until ~2140. Meanwhile miner revenue collapses each cycle, forcing reliance
              on transaction fees the network can't reliably generate. <em>Halving is a slow
              suffocation of the security budget.</em>
            </li>
            <li>
              <strong className="text-foreground">The Lost Coin Problem:</strong> Chainalysis,
              Glassnode, and Cane Island estimate <strong>3.7M – 6M+ BTC are permanently lost</strong>
              {" "}(dead wallets, lost keys, Satoshi's ~1M untouched). That's 17–28% of total supply
              gone forever. <strong>Bitcoin will never have 21M circulating. Period.</strong> The
              practical cap is closer to 15–17M, and shrinking every year as more keys are lost.
            </li>
            <li>
              <strong className="text-foreground">Why this matters for us:</strong> Bitcoin's
              scarcity is <em>accidental and lossy</em>. Our scarcity is <em>engineered and
              productive</em>:
              <ul className="pl-4 pt-1.5 space-y-1">
                <li>• <strong>1T hard cap</strong> — codified, audited, immutable</li>
                <li>• <strong>20% burn on every mint</strong> — programmatic deflation tied to real activity</li>
                <li>• <strong>Pact-locked founder allocations</strong> (Joseph 150B / Michael 50B) — non-circulating by design, not by accident</li>
                <li>• <strong>Tranched LP releases</strong> — circulating supply is governed, not random</li>
                <li>• <strong>Subscription burn pressure</strong> — every paying user creates upward price pressure via the flywheel</li>
              </ul>
            </li>
          </ul>
          <p className="text-foreground font-medium pt-1">
            Punchline: <em>"Bitcoin's scarcity is what's left after people lose their keys. Ours
            is what's left after we burn it on purpose. One is decay. The other is design."</em>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Investor framing cheat sheet
          </p>
          <p>
            <strong className="text-foreground">For Lyndon:</strong> Lead with Layer 4 (Flywheel)
            + Layer 5 (Halving/Lost Coins). He underwrote Sunrun on flywheel economics — he'll
            see this pattern instantly.
          </p>
          <p>
            <strong className="text-foreground">For Joe / Toby / Brady:</strong> Use the Netflix
            analogy: <em>"Imagine if every new Netflix subscriber automatically made Netflix stock
            more valuable by contract, not sentiment. That's what we built. Half of every
            subscription dollar permanently goes into the token's liquidity pool. The token
            literally cannot stay flat as we grow — it's mathematically forced upward."</em>
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "tokenomics",
    number: 3,
    title: "Tokenomics",
    icon: Coins,
    tagline: "1T hard cap. $0.10 launch via tranched LP rounds.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [
      { label: "mem://features/tokenomics", path: "features/tokenomics" },
      { label: "mem://features/launch-model", path: "features/launch-model" },
      {
        label: "mem://features/strategic-introductions-allocation",
        path: "features/strategic-introductions-allocation",
      },
    ],
    body: (
      <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Hard parameters</h4>
          <ul className="space-y-1.5">
            <li>• <strong>1,000,000,000,000</strong> $ZSOLAR max supply (1 trillion, hard cap)</li>
            <li>• <strong>Launch price:</strong> $0.10 USDC via LP-seeded tranches (e.g. $200K USDC + 2M $ZSOLAR per round). NEVER "launch at $1."</li>
            <li>• <strong>Mint split per kWh:</strong> 75% user · 20% burn · 3% LP · 2% treasury</li>
            <li>• <strong>VPP earnings split:</strong> 50% LP · 30% user cash · 15% ops · 5% user tokens (tokens real-time, cash monthly on the 1st)</li>
            <li>• <strong>Transfer tax:</strong> see active <code className="text-xs bg-muted px-1 rounded">tokenomics_models</code> row (v3 active)</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Founder allocations (pact-locked)</h4>
          <ul className="space-y-1.5">
            <li>• <strong>Joseph Maushart:</strong> 150,000,000,000 (15%) — pact-locked, $6.67 trillionaire crossover</li>
            <li>• <strong>Michael Tschida:</strong> 50,000,000,000 (5%) — pact-locked, $20.00 trillionaire crossover</li>
            <li>• <strong>Family Legacy Pact:</strong> active — see <code className="text-xs bg-muted px-1 rounded">vault_state</code></li>
          </ul>
        </div>
        <div className="rounded-lg border border-eco/30 bg-eco/[0.04] p-3">
          <p className="text-xs uppercase tracking-widest text-eco font-semibold mb-2">
            Strategic Introductions bucket (NEW Apr 25)
          </p>
          <ul className="space-y-1.5 text-sm">
            <li>• <strong>100,000,000 $ZSOLAR</strong> (0.01% of supply), carved from team pool</li>
            <li>• Default reward per Lyndon-tier intro: <strong>1,000,000 $ZSOLAR</strong></li>
            <li>• Default vesting: 12 months linear, 3-month cliff</li>
            <li>• <strong>These are pre-launch tokens, NOT equity</strong> — no voting rights, no anti-dilution, no claim on ZenCorp Inc</li>
            <li>• First earmarked: whoever sets the Lyndon meeting (Jo Ferriter has first right of refusal)</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground italic">
          Every change to tokenomics is versioned in <code className="text-xs bg-muted px-1 rounded">tokenomics_models</code> and archived to <code className="text-xs bg-muted px-1 rounded">tokenomics_archive</code> with a reason. Full audit trail, never overwritten.
        </p>
      </div>
    ),
  },
  {
    key: "ip",
    number: 4,
    title: "Intellectual Property",
    icon: Shield,
    tagline: "Filed patent + 2 new provisionals queued + 7-mark trademark roadmap.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [
      { label: "mem://legal/patent-update-checklist", path: "legal/patent-update-checklist" },
      { label: "mem://features/trademark-roadmap", path: "features/trademark-roadmap" },
    ],
    body: (
      <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Filed</h4>
          <ul className="space-y-1.5">
            <li>• <strong>Provisional 63/782,397</strong> — filed Apr 2 2025 ("Gamifying and Tokenizing Sustainable Behaviors") — priority date locked</li>
            <li>• <strong>Non-Provisional Utility Patent App. No. 19/634,402</strong>, Confirmation #4783, Attorney Docket ZEN-001 — 13 claims, 12 figures</li>
            <li>• <strong>July 2, 2026</strong> — Preliminary Amendment safe-harbor deadline (37 CFR §1.115(b)(3)). Cannot add new matter; can add formal drawings + clarifying claims.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">3-track filing strategy</h4>
          <ul className="space-y-2">
            <li>
              <strong>Track 1 — Preliminary Amendment by July 2 2026:</strong> Robotaxi/Cybercab fleet miles, FSD dual-mode separation, Proof-of-Permanence™ rename, Tap-to-Mint™ embodiment, formal drawings FIG. 1–12
            </li>
            <li>
              <strong>Track 2 — New Provisionals (genuinely new matter):</strong> Tesla Optimist humanoid robot tokenization, Starlink/SpaceX orbital telemetry tokenization
            </li>
            <li>
              <strong>Track 3 — CIP candidates (attorney decision):</strong> Producer-gated LP rounds (ZPPA), embedded Coinbase Wallet integration
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Trademark roadmap</h4>
          <ul className="space-y-1.5">
            <li>• <strong>Tier 1 (file immediately):</strong> Proof-of-Permanence™, Genesis Anchor™, Proof-of-Custody™</li>
            <li>• <strong>Tier 2 (Q3 2026):</strong> SEGI™, ZPPA, Tap-to-Mint™, Proof-of-Genesis™</li>
            <li>• <strong>Tier 3 (post-attorney clearance):</strong> Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™</li>
          </ul>
        </div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.04] p-3">
          <p className="text-xs text-foreground/85">
            <strong>Open attorney questions:</strong> Confirm non-provisional file date relative to Apr 2 2026 (affects safe-harbor); rule on Proof-of-Permanence™ rename (Track 1 vs Track 3); decide on combined vs split provisionals for Optimist + Starlink.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "surfaces",
    number: 5,
    title: "Product Surfaces",
    icon: Layers,
    tagline: "What users actually see and tap.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [
      { label: "mem://features/dashboard", path: "features/dashboard" },
      { label: "mem://features/bidirectional-ev-minting", path: "features/bidirectional-ev-minting" },
      { label: "mem://features/vpp-settlement", path: "features/vpp-settlement" },
      { label: "mem://features/demo-gate", path: "features/demo-gate" },
    ],
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <ul className="space-y-2">
          <li>• <strong>Tap-to-Mint™</strong> — the headline action. User taps, verified energy delta becomes $ZSOLAR.</li>
          <li>• <strong>Clean Energy Center (Dashboard)</strong> — mobile-first home base. Lifetime totals, today's mint, device status, leaderboards.</li>
          <li>• <strong>Proof-of-Genesis Receipt</strong> — every mint generates a cryptographic birth certificate (context-aware: Miles for EV, Verified Energy for solar/battery, CO₂ avoided, vs Bitcoin PoW comparison).</li>
          <li>• <strong>VPP (Virtual Power Plant)</strong> — tokens auto-mint real-time per dispatch (30–60s), cash settles monthly on the 1st. 50/30/15/5 split.</li>
          <li>• <strong>Bi-Directional EV Minting (Phase 3)</strong> — V2G/V2H/V2L + FSD as patent-anchored mintable surfaces.</li>
          <li>• <strong>Investor Demo Gate</strong> — code-gated, NDA-tracked, IP-logged. Live mirror of the real product.</li>
          <li>• <strong>Founders Vault</strong> — gated by FounderRoute + VaultPinGate (PIN + WebAuthn). This page lives here.</li>
          <li>• <strong>Embedded Coinbase Wallet + Reown AppKit</strong> — no extension required, hard redirects for OAuth.</li>
        </ul>
      </div>
    ),
  },
  {
    key: "oem",
    number: 6,
    title: "Live OEM Integrations",
    icon: Plug,
    tagline: "Real device data flowing through real APIs.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [{ label: "mem://features/oem-live-status", path: "features/oem-live-status" }],
    body: (
      <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
        <ul className="space-y-2">
          <li>• ✅ <strong>Tesla</strong> — verified live (vehicle + Powerwall + solar)</li>
          <li>• ✅ <strong>Enphase</strong> — verified live (solar + battery)</li>
          <li>• ✅ <strong>Wallbox</strong> — verified live via Tschida (charging)</li>
          <li>• ⏳ <strong>SolarEdge</strong> — integration built, awaiting first live user</li>
        </ul>
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
            Planned (patent-anchored)
          </p>
          <ul className="space-y-1.5">
            <li>• <strong>Tesla Optimist</strong> — humanoid robot task tokenization (new provisional)</li>
            <li>• <strong>Starlink / SpaceX</strong> — orbital telemetry tokenization (new provisional)</li>
            <li>• <strong>Cybercab / Robotaxi</strong> — fleet miles under unsupervised mode (Track 1 amendment)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    key: "stack",
    number: 7,
    title: "Tech Stack & Infrastructure",
    icon: Cpu,
    tagline: "Already built. Already running. Already scaled.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [
      { label: "mem://technical/architecture", path: "technical/architecture" },
      { label: "mem://technical/data-integrity-hardening", path: "technical/data-integrity-hardening" },
    ],
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <ul className="space-y-1.5">
          <li>• <strong>Frontend:</strong> React 18, Vite, Tailwind, mobile-first (390x844)</li>
          <li>• <strong>Backend:</strong> Lovable Cloud (Supabase) — <strong>51 production tables</strong> with RLS, foreign keys, security-definer functions</li>
          <li>• <strong>Chain:</strong> Base L2</li>
          <li>• <strong>Wallet:</strong> Embedded Coinbase Wallet, Reown AppKit, hard redirects for OAuth</li>
          <li>• <strong>Auth:</strong> 5-role system (admin/user/editor/viewer/founder) with <code className="text-xs bg-muted px-1 rounded">user_roles</code> + <code className="text-xs bg-muted px-1 rounded">has_role()</code></li>
          <li>• <strong>Founder gating:</strong> FounderRoute + VaultPinGate (PIN + WebAuthn credentials)</li>
          <li>• <strong>Email infra:</strong> queue, send log, opens, clicks, suppressed, unsubscribe tokens — full deliverability stack</li>
          <li>• <strong>Push notifications:</strong> subscriptions, templates, logs, dismissals — operational</li>
          <li>• <strong>AI assistant:</strong> "Deason" — gated, rate-limited, inner-circle access</li>
          <li>• <strong>Founders' working tools:</strong> work_journal, tokenomics_framework_responses, yc_application_content, vault_access_log</li>
        </ul>
        <p className="text-xs text-muted-foreground italic">
          Display rules: dark theme, "Less is More", emerald primary, 100svh/100dvh, no crypto jargon. All share/preview/demo URLs use <code className="text-xs bg-muted px-1 rounded">https://beta.zen.solar</code> — never lovable.app/lovable.dev.
        </p>
      </div>
    ),
  },
  {
    key: "business",
    number: 8,
    title: "Business Model & Liquidity",
    icon: TrendingUp,
    tagline: "The token IS the IPO.",
    lastUpdated: "Apr 25, 2026",
    memoryLinks: [
      { label: "mem://features/launch-model", path: "features/launch-model" },
      { label: "mem://features/zppa", path: "features/zppa" },
      { label: "mem://features/liquidity-pools-narrative", path: "features/liquidity-pools-narrative" },
      { label: "mem://features/producer-gated-lp-rounds", path: "features/producer-gated-lp-rounds" },
    ],
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <ul className="space-y-2">
          <li>• <strong>Launch mechanics:</strong> $0.10 launch price via tranched LP rounds (e.g. $200K USDC + 2M $ZSOLAR per round). Limited supply per round, not full 1T at once.</li>
          <li>• <strong>ZPPA (Zen Power Purchase Agreement):</strong> Producer-gated LP access — verified-kWh holders earn the right to buy into LP rounds. Patent CIP candidate.</li>
          <li>• <strong>VPP settlement:</strong> Tokens auto-mint real-time per dispatch (30–60s); cash pays monthly on the 1st. 50% LP / 30% user cash / 15% ops / 5% user tokens.</li>
          <li>• <strong>Mint flywheel:</strong> Every kWh verified → 75% user / 20% burn / 3% LP / 2% treasury. Burn pressure + LP feed = supply tightens as adoption grows.</li>
          <li>• <strong>Liquidity event:</strong> The $ZSOLAR token IS the exit. There is no traditional IPO. ZenCorp Inc holds IP and contracts; value accrues to token holders.</li>
        </ul>
      </div>
    ),
  },
  {
    key: "people",
    number: 9,
    title: "People, Roles & Network",
    icon: Users,
    tagline: "Who's in, who's pitching, who's next.",
    lastUpdated: "Apr 25, 2026",
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Founders</h4>
          <ul className="space-y-1">
            <li>• <strong>Joseph Deason</strong> — Founder, 150B allocation, $6.67 crossover</li>
            <li>• <strong>Michael Tschida</strong> — Co-founder, 50B allocation, $20.00 crossover</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Active intros in flight</h4>
          <ul className="space-y-1">
            <li>• <strong>Jo Ferriter</strong> — first right of refusal on the Lyndon intro. Speaking by phone Tue (week of Apr 25). Earns 1M $ZSOLAR if she sets the meeting.</li>
            <li>• <strong>Lyndon</strong> — primary first-investor target. Right ear because he won't pattern-match this to "another energy token."</li>
            <li>• <strong>Backup intro path</strong> — separate friend can also connect to Lyndon if Jo passes.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Role hierarchy (in DB)</h4>
          <p className="text-sm">
            <code className="text-xs bg-muted px-1 rounded">admin · founder · editor · viewer · user</code> — enforced via <code className="text-xs bg-muted px-1 rounded">user_roles</code> + <code className="text-xs bg-muted px-1 rounded">has_role()</code>.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Inner circles</h4>
          <ul className="space-y-1">
            <li>• <strong>Founder Vault Access</strong> — explicit allowlist (table: <code className="text-xs bg-muted px-1 rounded">founder_vault_access</code>)</li>
            <li>• <strong>Deason Inner Circle</strong> — AI assistant inner-circle access</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    key: "decisions",
    number: 10,
    title: "Strategic Decisions Locked",
    icon: Lock,
    tagline: "Defensive log against revisionism. Append-only.",
    lastUpdated: "Apr 25, 2026",
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <p className="text-xs text-muted-foreground italic">
          Newest first. Each entry: <strong>date · decision · why</strong>.
        </p>
        <ul className="space-y-3">
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 25, 2026 — Strategic Introductions bucket created (100M $ZSOLAR).</strong>
            <br />
            <span className="text-xs text-muted-foreground">Carved from team pool. 1M default per Lyndon-tier intro, vested 1yr/3mo cliff. Frame as tokens, NOT equity.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 24, 2026 — "ZenCorp Inc" locked as legal entity name.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Deliberate sarcastic wink: only incorporated entities can IPO; we never will. Token IS the exit.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 22, 2026 — Wallbox confirmed as 3rd verified-live OEM.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Tesla + Enphase + Wallbox all live with real users. SolarEdge pending.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 2026 — Receipt CO₂ framing rule.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Context-aware per source (gasoline avoided for EV, grid CO₂ displaced for solar/battery). Always show vs Bitcoin PoW comparison chip.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 2026 — VPP split locked: 50/30/15/5.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Tokens real-time per dispatch; cash monthly on the 1st. Replaces older single-payout model.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>Apr 2026 — Launch price locked at $0.10 USDC via tranched LP rounds.</strong>
            <br />
            <span className="text-xs text-muted-foreground">NEVER "launch at $1." Prevents pump-and-dump optics; lets producer/community accumulate first.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>2025 — Founder pact-locked allocations: Joseph 150B, Michael 50B.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Family Legacy Pact active. Trillionaire crossovers $6.67 / $20.00.</span>
          </li>
          <li className="border-l-2 border-eco/40 pl-3">
            <strong>2025 — 1T hard cap; mint split 75/20/3/2.</strong>
            <br />
            <span className="text-xs text-muted-foreground">Hard cap protects long-term scarcity. Burn percentage tightens supply as adoption grows.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: "roadmap",
    number: 11,
    title: "Active Roadmap",
    icon: Map,
    tagline: "What's next, in order.",
    lastUpdated: "Apr 25, 2026",
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Now (next 7 days)</h4>
          <ul className="space-y-1">
            <li>• Jo Ferriter call (Tue) — frame the Lyndon intro + 1M $ZSOLAR reward</li>
            <li>• Continue updating this Master Outline + Founders Changelog as we ship</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Near-term (next 30–60 days)</h4>
          <ul className="space-y-1">
            <li>• Lyndon meeting + pitch refinement</li>
            <li>• Tier 1 trademark filings: Proof-of-Permanence™, Genesis Anchor™, Proof-of-Custody™</li>
            <li>• Attorney session: confirm Track 1 vs Track 3 questions</li>
            <li>• SolarEdge first live user</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Pre-July 2 2026</h4>
          <ul className="space-y-1">
            <li>• File Preliminary Amendment to App 19/634,402 (formal drawings + clarifying claims)</li>
            <li>• Draft + file new provisionals: Tesla Optimist, Starlink/SpaceX</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">Phase 2 / Phase 3</h4>
          <ul className="space-y-1">
            <li>• VPP at scale (real dispatch + monthly cash settlement live for users)</li>
            <li>• Bi-Directional EV Minting (V2G/V2H/V2L + FSD)</li>
            <li>• ZPPA producer-gated LP rounds operational</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    key: "open",
    number: 12,
    title: "Open Questions",
    icon: HelpCircle,
    tagline: "What we're still deciding. Honest list.",
    lastUpdated: "Apr 25, 2026",
    body: (
      <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
        <ul className="space-y-2">
          <li>• <strong>Lyndon intro path:</strong> If Jo passes after Tuesday's call, when do we activate the backup connector?</li>
          <li>• <strong>Patent attorney session:</strong> Does Proof-of-Permanence™ rename qualify as Track 1 (clarifying) or Track 3 (CIP)?</li>
          <li>• <strong>Optimist vs Starlink provisionals:</strong> One filing or two separate dockets (ZEN-002, ZEN-003)?</li>
          <li>• <strong>Tap-to-Mint™ patent embodiment:</strong> Track 1 amendment or its own provisional?</li>
          <li>• <strong>Trademark coordination:</strong> Do Tier 1 TMs file alongside the patent amendment or independently?</li>
          <li>• <strong>Securities posture for Strategic Introductions tokens:</strong> Confirm with counsel that vested pre-launch tokens to a non-broker introducer doesn't trip finders-fee securities rules.</li>
        </ul>
      </div>
    ),
  },
];

export default function FoundersMasterOutline() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsFounder(false);
      return;
    }
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
      <OutlineContent />
    </VaultPinGate>
  );
}

function OutlineContent() {
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
            Founders Only
          </span>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-widest mb-3">
            <Compass className="h-3.5 w-3.5" /> Master Outline
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            ZenSolar — Master Project Outline
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            The cornerstone source of truth for the entire ZenSolar product and ZenCorp Inc business.
            Every critical component — brand, thesis, tokenomics, IP, surfaces, integrations, stack,
            people, decisions, roadmap — lives here. Updated as we build.
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
            <span>
              Version <strong className="text-foreground">{VERSION}</strong>
            </span>
            <span>·</span>
            <span>
              Last updated <strong className="text-foreground">{LAST_UPDATED}</strong>
            </span>
            <span>·</span>
            <span>Internal — Joseph &amp; Michael Tschida only</span>
          </div>
        </header>

        {/* Table of contents */}
        <nav className="mb-12 rounded-xl border border-border bg-card/40 p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
            Sections
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.key}>
                  <a
                    href={`#section-${s.key}`}
                    className="inline-flex items-center gap-2 text-foreground/85 hover:text-primary transition-colors"
                  >
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {String(s.number).padStart(2, "0")}
                    </span>
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    <span>{s.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <article
                key={section.key}
                id={`section-${section.key}`}
                className="scroll-mt-20"
              >
                <header className="flex items-baseline justify-between gap-3 pb-3 mb-5 border-b border-border/60">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
                        {String(section.number).padStart(2, "0")}
                      </span>
                      <Icon className="h-4 w-4 text-primary" />
                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {section.tagline}
                    </p>
                  </div>
                  <time className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {section.lastUpdated}
                  </time>
                </header>

                <div className="rounded-xl border border-border bg-card/40 p-5">
                  {section.body}
                </div>

                {section.memoryLinks && section.memoryLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {section.memoryLinks.map((m) => (
                      <span
                        key={m.path}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground font-mono"
                      >
                        <ScrollText className="h-3 w-3" />
                        {m.label}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-border/60 text-center space-y-2">
          <p className="text-[11px] text-muted-foreground">
            This document is the mirror twin of project memory. Update both together, never one alone.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            © 2026 ZenCorp Inc. · ZenSolar™ · Internal — Founders Only
          </p>
        </footer>
      </div>
    </div>
  );
}
