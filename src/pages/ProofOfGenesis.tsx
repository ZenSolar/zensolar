import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { ProofOfGenesisThesis } from '@/components/tokenomics/ProofOfGenesisThesis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Coins,
  Layers,
  Award,
  Lock,
  Fingerprint,
  GitBranch,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Proof-of-Genesis™ — cornerstone page
 *
 * Structure (top → bottom):
 *  1. Hero: PoG = the cornerstone
 *  2. What is PoG (explainer)
 *  3. BTC vs ZSOLAR thesis (existing module)
 *  4. The 5 Pillars — each with the actual ENFORCED RULES that make it real
 *  5. Trademark portfolio (secondary — for IP/legal context)
 */

type Rule = {
  label: string;
  detail: string;
};

type Pillar = {
  mark: string;
  tagline: string;
  icon: typeof Sparkles;
  category: string;
  what: string;
  why: string;
  rules: Rule[];
};

const PILLARS: Pillar[] = [
  {
    mark: 'Proof-of-Delta™',
    tagline: 'The math that proves change actually happened.',
    icon: Layers,
    category: 'Pillar 1 · Math',
    what:
      'Every mint corresponds to a verified change in energy state — kWh produced, kWh delivered, miles driven — signed by the device itself. We don\'t trust totals; we prove deltas.',
    why:
      'Without a provable delta, "clean energy crypto" is just a marketing claim. With it, it\'s a settlement layer.',
    rules: [
      {
        label: 'Monotonicity guard (I1)',
        detail:
          'Lifetime counters (solar Wh, battery export, odometer, supercharger kWh) can never decrease. A drop is treated as a device reset, not a negative mint.',
      },
      {
        label: 'Baseline anchoring (I2)',
        detail:
          'Σ(daily deltas) must equal (lifetime_now − stored_baseline). Any drift is reconciled into a residual row, never silently dropped.',
      },
      {
        label: 'Physical caps (I3)',
        detail:
          'Daily deltas are capped by physical plausibility (e.g. solar ≤ system_kW × 14h). API backfills can\'t inflate a day beyond what physics allows.',
      },
      {
        label: 'Counter-rollover handling',
        detail:
          'Tesla / Enphase / SolarEdge counters that reset mid-cycle are detected and re-anchored, not interpreted as a giant negative delta.',
      },
      {
        label: 'Property-tested (50 trials)',
        detail:
          'Vitest property tests fuzz random monotonic series + baselines and assert the Σ-invariant holds within 0.5 kWh tolerance on every run.',
      },
      {
        label: 'Nightly per-user invariant sweep',
        detail:
          'verify_user_sum_invariant() runs every night via pg_cron. It scans every connected device for baseline > lifetime (negative-pending) and every confirmed mint whose reconciliation drift exceeded 1%. Violations land in user_invariant_violations with a critical flag — observable by admins and the user themselves.',
      },
      {
        label: 'KPI-level drift log for production alerts',
        detail:
          'verify_kpi_reconciliation() runs in the same nightly sweep. For every user it recomputes the canonical KPIs (solar_kwh, home_charger_kwh, lifetime_tokens, …) from the source rows and compares them to the headline value the dashboard would emit. Drifts >1% are warn, >5% are critical, and every mismatch is appended to kpi_reconciliation_log (RLS-locked: users see own, dashboard staff see all, only the service role writes). This is the single feed wired into production drift alerts.',
      },
    ],
  },
  {
    mark: 'Proof-of-Origin™',
    tagline: 'Verifies the source — clean, real, and yours.',
    icon: Cpu,
    category: 'Pillar 2 · Source',
    what:
      'Every kWh is bound to a specific verified device, owned by a specific verified user, from a clean source. The "where did this energy come from?" question has one cryptographic answer.',
    why:
      'Eliminates double-mint, greenwashing, and Sybil attacks at the source — before a single token is minted.',
    rules: [
      {
        label: 'OEM OAuth at the source',
        detail:
          'Tesla, SolarEdge, Enphase, and Wallbox sign the data at the provider. We never accept client-asserted production.',
      },
      {
        label: 'Provider whitelist enforced in the database',
        detail:
          'connected_devices.provider and energy_production.provider are CHECK-constrained to the known integration set. A row from any other source is rejected at write time, not at read time.',
      },
      {
        label: 'Device fingerprint uniqueness (DB unique index)',
        detail:
          'A unique index on (provider, device_id) makes it physically impossible for two wallets to claim the same Tesla VIN, Enphase site, SolarEdge inverter, or Wallbox unit. Mirrored client-side in originVerification.ts and on-chain in DeviceWatermarkRegistry.sol.',
      },
      {
        label: 'Handoff trigger auto-resets baseline',
        detail:
          'Device claim is constrained by UNIQUE(provider, device_id), so a handoff is always release → reclaim. A BEFORE DELETE trigger on connected_devices snapshots the prior owner\'s lifetime_totals + baseline_data into _device_release_archive; a BEFORE INSERT trigger detects a reclaim by a different user_id, writes device_handoff_log, zeroes baseline_data + lifetime_totals + last_minted_at, and emits a device_handoff_baseline_reset info event (auto-resolved). The new owner physically cannot inherit a single watt-hour.',
      },
      {
        label: 'Geo-fence sanity check',
        detail:
          'Same device emitting events from locations >500 mph apart (Haversine, sorted chronologically) is physically implausible and flagged. Stationary devices and normal EV travel pass cleanly.',
      },
      {
        label: 'HMAC-signed origin_proof envelope',
        detail:
          'Provider ingests may carry an origin_proof = { provider, key_id, signed_at, payload, signature } envelope. Edge functions verify HMAC-SHA256 against the trusted-key registry in origin_proof_keys, reject expired (>10 min) or replayed signatures, and append-only log every check to origin_proof_verifications. Canonical JSON serialization is byte-identical between src/lib/originProof.ts and supabase/functions/_shared/originProof.ts so a signature minted client-side verifies edge-side without ambiguity.',
      },
      {
        label: 'Property-tested in CI (50-trial fuzz + HMAC round-trip)',
        detail:
          'src/lib/__tests__/originVerification.test.ts runs golden fixtures + a 50-trial fuzz that proves random claim graphs always surface cross-user device collisions. originProof.test.ts adds canonicalization, freshness, constant-time comparison, and Web Crypto round-trip coverage.',
      },
    ],
  },
  {
    mark: 'Mint-on-Proof™',
    tagline: 'No proof, no mint. Period.',
    icon: ShieldCheck,
    category: 'Pillar 3 · Rule',
    what:
      'Minting is a server-side function gated by the proof stack. The client cannot ask for tokens — it can only request that the protocol verify and mint.',
    why:
      'This is the line between "promise-based" tokens and physics-backed tokens. Every $ZSOLAR exists because the protocol said yes, never because a wallet asked nicely.',
    rules: [
      {
        label: 'Server-side reconciliation only',
        detail:
          'The mint-onchain edge function computes the mint amount from verified source rows. Wallet-side amounts are ignored.',
      },
      {
        label: 'Subscription dual-gate',
        detail:
          'Only paying subscribers can mint. An economic gate on top of the technical gate makes Sybil farming structurally unprofitable.',
      },
      {
        label: 'Three-way reconciliation (headline ↔ rows ↔ on-chain)',
        detail:
          'Every mint runs verifyThreeWayMatch(). All three numbers must agree within 1% (with a 0.5 kWh absolute floor for tiny values). Diff and source_breakdown are persisted to mint_reconciliation_log for forensic audit.',
      },
      {
        label: 'Non-negative amount guard (DB CHECK)',
        detail:
          'mint_transactions enforces tokens_minted, kwh_delta, and miles_delta ≥ 0 at the database. A negative-amount mint is physically impossible to record.',
      },
      {
        label: 'tx_hash uniqueness (DB unique index)',
        detail:
          'A single on-chain transaction can never produce two receipts. The same hash inserted twice is rejected at write time.',
      },
      {
        label: 'Idempotency keys per mint window',
        detail:
          'mint_idempotency_keys enforces UNIQUE(user_id, action, window_start). Two parallel taps for the same kWh window can produce at most one mint, ever.',
      },
      {
        label: 'Baseline ≤ lifetime trigger',
        detail:
          'A BEFORE INSERT/UPDATE trigger on connected_devices rejects any state where baseline.{solar_wh, odometer, charging_kwh, …} exceeds lifetime.{…}. Mirrored client-side in verifyBaselineLeLifetime().',
      },
      {
        label: 'Two-tier drift gate (soft 1% / hard 5%)',
        detail:
          'Reconciliation runs BEFORE the transaction is recorded. Drift ≤1% passes silently. Drift >1% is logged. Drift >5% (or a failed on-chain read) records the mint with status="flagged_drift" — visible in the admin console and on the user receipt — so no silent corruption is possible.',
      },
      {
        label: 'NFT actions share the same gate',
        detail:
          'mint-combos and claim-milestone-nfts now also claim a 5-min idempotency key, snapshot owned tokens before/after, and write an append-only mint_reconciliation_log row (category combo_nfts / milestone_nfts). Combos that request a token-id which doesn\'t appear on-chain after the tx are flagged_drift.',
      },
      {
        label: 'Cross-pillar Mint Gate (can_user_mint)',
        detail:
          'Before any write action (register, mint-rewards, claim-milestones, mint-combos), mint-onchain calls the can_user_mint(user_id) RPC. Any unresolved critical row in user_invariant_violations or collusion_signals — produced by ANY pillar\'s sweeper — returns allowed:false and the request fails with HTTP 423 Locked / reason=mint_gate_blocked. Admins clear blocks via resolve_invariant_violation / resolve_collusion_signal from /admin/protocol-integrity, with notes captured for audit.',
      },
      {
        label: 'Property-tested in CI (50-trial fuzz)',
        detail:
          'src/lib/__tests__/mintReconciliation.test.ts runs golden fixtures + a 50-trial fuzz that proves any three-way drift beyond tolerance is always caught.',
      },
    ],
  },
  {
    mark: 'Anti-Double-Count',
    tagline: 'One event. One mint. Ever.',
    icon: Fingerprint,
    category: 'Pillar 4 · Uniqueness',
    what:
      'Every receipt row carries a stable fingerprint. The same charging session, the same solar interval, the same mile — can never be minted twice, even across re-ingests, source overlaps, or provider replays.',
    why:
      'The single largest fraud vector in energy tokens is the same kWh being counted by two systems. We solve it at the database layer, not in a hook.',
    rules: [
      {
        label: 'DB-level event_fingerprint uniqueness',
        detail:
          'Every row in energy_production, charging_sessions, home_charging_sessions, and bidirectional_mint_events carries a trigger-computed event_fingerprint (md5 of provider + device + timestamp + key fields). A per-user UNIQUE index makes re-ingests idempotent at the database layer — the same physical event physically cannot land twice.',
      },
      {
        label: 'One wallet per physical device',
        detail:
          'UNIQUE(provider, device_id) on connected_devices. A single Tesla VIN, Enphase site, or Wallbox serial can only be claimed by one wallet at a time. Handoffs zero baselines via trigger (Pillar 2 · O4).',
      },
      {
        label: 'Cross-source duplicate detector (DB-enforced + auto mint-block)',
        detail:
          'detect_cross_source_duplicates() runs in the nightly sweep and scans the last 24h of home_charging_sessions × charging_sessions × energy_production for same-user, different-provider rows that overlap within 15 min and ±10% kWh. Each hit writes a critical cross_source_dup row to user_invariant_violations with both source row ids and provider names — which immediately blocks the user from minting via the cross-pillar Mint Gate (Pillar 3) until staff resolves it. Client-side verifyNoCrossSourceOverlap() catches the same case at write time so the row never lands; the server sweep is the belt-and-suspenders backstop.',
      },
      {
        label: 'Bidirectional EV split',
        detail:
          'Charging, discharging (V2G), miles driven, and FSD all mint separately with separate proofs and separate fingerprints. A single battery cycle cannot be double-claimed across roles.',
      },
      {
        label: 'Per-session receipts for EV charging',
        detail:
          'Supercharging and home charging are session-keyed (not day-totaled) and fingerprinted on (device, start_time) — every kWh is traceable to a specific plug-in event.',
      },
    ],
  },
  {
    mark: 'Proof-of-Permanence™',
    tagline: 'Every mint is forensically auditable. Forever.',
    icon: GitBranch,
    category: 'Pillar 5 · Receipts',
    what:
      'Every mint produces an on-chain receipt with its source fingerprint, baseline anchor, and CO₂ equivalent. Any third party — auditor, regulator, journalist — can independently re-derive the math.',
    why:
      'Trust collapses when the receipts don\'t exist. We make them permanent, on-chain, and re-derivable by people who don\'t trust us.',
    rules: [
      {
        label: 'On-chain mint receipt',
        detail:
          'Every mint writes the source fingerprint, baseline anchor timestamp, lifetime delta, and CO₂ tons to the chain. Not in a database we control — on Base.',
      },
      {
        label: 'Baseline anchor shown publicly',
        detail:
          'The Proof-of-Genesis receipt displays "minted from X kWh → Y kWh at timestamp Z" so anyone can verify the delta is real.',
      },
      {
        label: 'Proof-of-Permanence™ Merkle anchors',
        detail:
          'Every 6 hours, anchor-permanence-snapshot computes a SHA-256 binary Merkle root (duplicate-last for odd nodes) over every chain_hash ordered by (user_id, chain_seq) and inserts it into proof_of_permanence_anchors. get_mint_receipt returns the covering anchor (oldest snapshot ≥ receipt.created_at) so any auditor can verify a receipt against a fixed, immutable root. Phase 2 publishes each root on Base L2 via DeviceWatermarkRegistry; the on-chain tx hash slots into the same row.',
      },
      {
        label: 'Reconciliation drift telemetry',
        detail:
          'kpi_reconciliation_log captures any drift between headline and receipts across the user base. We see and fix data issues before users do.',
      },
      {
        label: 'SHA-256 hash-chained mint receipts',
        detail:
          'Every row in mint_transactions carries chain_seq, chain_prev_hash, and chain_hash = SHA-256(user, tx_hash, action, tokens, kwh_delta, miles_delta, created_at, prev_hash). A BEFORE INSERT trigger fills the chain; a BEFORE UPDATE trigger blocks any post-hoc tampering (chain fields, tx_hash, user_id, created_at are immutable). Editing any prior receipt breaks every link after it — detectable in one SQL query.',
      },
      {
        label: 'Public verifier — /verify/:hash',
        detail:
          'get_mint_receipt(_chain_hash) is granted to anon + authenticated. The /verify/:hash page and verify-mint-receipt edge function recompute the SHA-256 server-side and return is_valid plus prev/next links so an auditor can walk the entire chain without an account.',
      },
      {
        label: 'Browser-recomputed Merkle inclusion proof',
        detail:
          'get_merkle_inclusion_proof(_chain_hash) returns the sibling path for any receipt. /verify/:hash uses crypto.subtle.digest to recompute the Merkle root in the user\'s own browser from the leaf hash + sibling path and compares against the anchored root — green check on match, red mismatch banner on tamper. The auditor never has to trust the server response.',
      },
      {
        label: 'Nightly chain-integrity sweep',
        detail:
          'verify_chain_integrity() runs in the nightly sweep, recomputes chain_hash for every mint_transactions row from raw inputs, and writes a chain_hash_tamper critical row to user_invariant_violations on any drift. Mint Gate auto-blocks the affected user. Smoke run on the latest sweep: 0 tampers.',
      },
      {
        label: 'Anchor-freshness watchdog',
        detail:
          'check_anchor_freshness() logs a critical alert to kpi_reconciliation_log if proof_of_permanence_anchors hasn\'t advanced in 120 min — surfaces a stalled snapshot job before the on-chain trail goes cold.',
      },
      {
        label: 'Mainnet promotion (TODO at launch)',
        detail:
          'Anchors currently publish to Base Sepolia for testnet. At production launch the anchor wallet is funded, RPC + DeviceWatermarkRegistry address flip to Base mainnet (chain 8453), and the public verifier links switch from sepolia.basescan.org to basescan.org. Tracked in mem://roadmap/mainnet-anchor-switch.',
      },
      {
        label: 'Re-derivable by third parties',
        detail:
          'Every receipt exposes the OEM session/interval ID it came from. A skeptic with API access to Tesla / Enphase can independently verify the mint.',
      },
    ],
  },
];

type Trademark = {
  mark: string;
  tagline: string;
  icon: typeof Sparkles;
  category: string;
  description: string;
};

const ADDITIONAL_MARKS: Trademark[] = [
  {
    mark: 'Tap-to-Mint™',
    tagline: 'One tap turns real energy into on-chain currency.',
    icon: Zap,
    category: 'User Experience',
    description:
      'The signature consumer interaction. A single tap reads verified device data, runs the proof, and mints $ZSOLAR — collapsing crypto\'s complexity into something a 10-year-old can do.',
  },
  {
    mark: '$ZSOLAR',
    tagline: 'Currency from energy.',
    icon: Coins,
    category: 'Token / Brand',
    description:
      'The native token of the ZenSolar protocol. 1 trillion hard cap. Backed by physics. Distributed by proof.',
  },
  {
    mark: 'ZenSolar®',
    tagline: 'The clean-energy protocol layer.',
    icon: Award,
    category: 'Master Brand',
    description:
      'The umbrella brand. Calm, confident, civilizational. A brand that sounds like a religion and reads like a utility.',
  },
  {
    mark: 'Family Legacy Pact™',
    tagline: 'Founder supply locked to civilization-scale outcomes.',
    icon: Lock,
    category: 'Governance',
    description:
      'A public, immutable lockup binding founder allocations (Joseph 150B / Michael 50B) to long-horizon trillionaire price thresholds — not short-term liquidity events.',
  },
];

function PillarCard({ pillar, index }: { pillar: Pillar; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const Icon = pillar.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.2) }}
    >
      <Card className="border-border/70 hover:border-primary/40 transition-colors duration-300 overflow-hidden">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/12 border border-primary/25 shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <Badge
              variant="secondary"
              className="text-[9.5px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 shrink-0"
            >
              {pillar.category}
            </Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-[18px] sm:text-xl leading-tight">{pillar.mark}</CardTitle>
            <p className="text-[12.5px] sm:text-[13px] text-primary/90 italic leading-snug">
              {pillar.tagline}
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
          <p className="text-[13.5px] sm:text-sm text-foreground/85 leading-relaxed">{pillar.what}</p>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary mb-1">
              Why it matters
            </p>
            <p className="text-[12.5px] sm:text-[13px] text-foreground/85 leading-snug">{pillar.why}</p>
          </div>

          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/70 hover:border-primary/40 bg-card/50 px-3 py-2.5 transition-colors group">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/80 group-hover:text-primary transition-colors">
                {pillar.rules.length} enforced rules
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <ul className="mt-3 space-y-2.5">
                {pillar.rules.map((rule) => (
                  <li
                    key={rule.label}
                    className="flex gap-2.5 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[12.5px] sm:text-[13px] font-semibold text-foreground leading-snug">
                        {rule.label}
                      </p>
                      <p className="text-[12px] sm:text-[12.5px] text-foreground/70 leading-snug">
                        {rule.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProofOfGenesis() {
  return (
    <>
      <SEO
        title="Proof-of-Genesis™ — The Cornerstone of ZenSolar"
        url="https://beta.zen.solar/demo/proof-of-genesis"
      />

      <div className="container max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-8 sm:space-y-10">
        {/* ===== Hero ===== */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
          >
            The Cornerstone
          </Badge>
          <h1 className="text-[26px] sm:text-4xl font-bold tracking-tight leading-[1.1]">
            Proof-of-Genesis™
          </h1>
          <p className="text-[14px] sm:text-base text-muted-foreground leading-snug max-w-2xl">
            ZenSolar is not a Web3 energy app. It is a verification system that happens to mint a
            token. Proof-of-Genesis is the cryptographic primitive that makes every $ZSOLAR
            traceable to a real, verified, clean kWh — and the five pillars below are the rules
            that make it real.
          </p>
        </motion.header>

        {/* ===== What is PoG ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card relative">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at top left, hsl(var(--primary) / 0.16), transparent 60%)',
              }}
              aria-hidden
            />
            <CardHeader className="relative px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 mb-3">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <CardTitle className="text-[20px] sm:text-2xl leading-tight">
                What is Proof-of-Genesis?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 text-[14.5px] sm:text-[15px] leading-relaxed text-foreground/85">
              <p>
                <span className="font-semibold text-foreground">Proof-of-Genesis (PoG™)</span>{' '}
                is the consensus mechanism that powers $ZSOLAR. Where Bitcoin's Proof-of-Work
                secures value by{' '}
                <span className="text-foreground font-medium">burning</span> electricity,
                Proof-of-Genesis mints value by{' '}
                <span className="text-foreground font-medium">
                  verifying clean electricity was created or productively used
                </span>
                . One is extractive. The other is additive.
              </p>
              <p>
                PoG isn't a slogan. It's a stack of cryptographic, database, and economic rules
                — every one of which is shipping today. The five pillars below name those rules
                out loud, so users, auditors, and investors can see the system policing itself.
              </p>
              <p className="italic text-foreground/75 border-l-2 border-primary/40 pl-3">
                Tagline:{' '}
                <span className="text-primary font-semibold not-italic">digital photosynthesis.</span>
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* ===== BTC vs ZSOLAR thesis ===== */}
        <ProofOfGenesisThesis />

        {/* ===== The 5 Pillars ===== */}
        <section className="space-y-5 sm:space-y-6 pt-4">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
            >
              The Five Pillars
            </Badge>
            <h2 className="text-[22px] sm:text-3xl font-bold tracking-tight leading-tight">
              The rules that make PoG real.
            </h2>
            <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-snug max-w-2xl">
              Tap any pillar to see the enforced rules behind it. These are not marketing
              claims — they are the invariants, indexes, and reconciliation checks shipping in
              production today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            {PILLARS.map((p, i) => (
              <PillarCard key={p.mark} pillar={p} index={i} />
            ))}
          </div>
        </section>

        {/* ===== Additional trademark portfolio (secondary) ===== */}
        <section className="space-y-5 sm:space-y-6 pt-6 border-t border-border/50">
          <div className="space-y-2 pt-2">
            <Badge
              variant="outline"
              className="border-border bg-card text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
            >
              Supporting Marks
            </Badge>
            <h2 className="text-[20px] sm:text-2xl font-bold tracking-tight leading-tight">
              The brand portfolio around PoG.
            </h2>
            <p className="text-[13.5px] sm:text-[14.5px] text-muted-foreground leading-snug max-w-2xl">
              Beyond the five pillars, these are the additional marks ZenSolar owns to protect
              the product, the token, the brand, and founder alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {ADDITIONAL_MARKS.map((tm, i) => {
              const Icon = tm.icon;
              return (
                <motion.div
                  key={tm.mark}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.16) }}
                >
                  <Card className="h-full border-border/70 hover:border-primary/40 transition-colors duration-300">
                    <CardHeader className="px-5 pt-5 pb-2.5 sm:px-6 sm:pt-6 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/12 border border-primary/25 shrink-0">
                          <Icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[9.5px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 shrink-0"
                        >
                          {tm.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-[17px] sm:text-lg leading-tight">{tm.mark}</CardTitle>
                        <p className="text-[12.5px] sm:text-[13px] text-primary/90 italic leading-snug">
                          {tm.tagline}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                      <p className="text-[13.5px] sm:text-sm text-foreground/85 leading-relaxed">
                        {tm.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 text-center pt-3 leading-relaxed">
            Trademark filings in progress · Confidential under NDA
          </p>
        </section>
      </div>
    </>
  );
}
