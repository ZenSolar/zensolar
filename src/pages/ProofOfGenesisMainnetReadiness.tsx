import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Rocket,
  ShieldCheck,
  Anchor,
  Coins,
  Wallet,
  Network,
  Eye,
  AlertTriangle,
} from 'lucide-react';

/**
 * Mainnet Readiness — sub-page of /proof-of-genesis.
 *
 * The canonical, single-source checklist of what flips on (or off) at the
 * moment we promote from Base Sepolia to Base mainnet. Lives off the
 * cornerstone so investors, auditors, and the founder team all see the same
 * gating list.
 *
 * Items are grouped by domain. `state` = shipped | ready_pending_flip | todo.
 *   - shipped              → enforced on testnet today, no change at flip
 *   - ready_pending_flip   → code is shipped, behaviour changes when env flips
 *   - todo                 → still to build / verify before the flip
 *
 * To add a new item, append to the relevant group. Keep `detail` 1–3 lines.
 */

type ItemState = 'shipped' | 'ready_pending_flip' | 'todo';

type ChecklistItem = {
  label: string;
  detail: string;
  state: ItemState;
};

type Group = {
  title: string;
  icon: typeof Rocket;
  intro: string;
  items: ChecklistItem[];
};

const TESTNET_GROUPS: Group[] = [
  {
    title: 'Pillar enforcement (shipping on testnet)',
    icon: ShieldCheck,
    intro:
      'Every rule on the cornerstone page is live on testnet today. The five pillars run as DB constraints, triggers, RPCs, and the nightly sweep — not as marketing.',
    items: [
      {
        label: 'Pillar 1 · Proof-of-Delta — math invariants + 50-trial fuzz',
        detail: 'Monotonicity / baseline / physical caps enforced in originVerification + nightly verify_user_sum_invariant.',
        state: 'shipped',
      },
      {
        label: 'Pillar 2 · Proof-of-Origin — HMAC envelope + handoff trigger',
        detail: 'origin_proof verified at write time; DELETE→INSERT handoff trigger resets baselines and logs to device_handoff_log.',
        state: 'shipped',
      },
      {
        label: 'Pillar 3 · Mint-on-Proof — three-way reconciliation + Mint Gate',
        detail: 'mint-onchain calls can_user_mint() before every write action; any open critical violation returns 423 mint_gate_blocked.',
        state: 'shipped',
      },
      {
        label: 'Pillar 4 · Anti-Double-Count — fingerprint uniqueness + cross-source detector',
        detail: 'DB-level UNIQUE(user_id, event_fingerprint) on all raw event tables + nightly detect_cross_source_duplicates() that auto-blocks the user via Mint Gate.',
        state: 'shipped',
      },
      {
        label: 'Pillar 5 · Proof-of-Permanence — Merkle anchors + chain integrity',
        detail: 'SHA-256 hash chain, 6-hourly Merkle snapshots, browser-recomputed inclusion proofs, nightly verify_chain_integrity() and check_anchor_freshness() watchdog.',
        state: 'shipped',
      },
    ],
  },
  {
    title: 'Testnet anchor stack',
    icon: Anchor,
    intro:
      'Anchors currently publish to Base Sepolia. This is the surface that physically changes at mainnet flip.',
    items: [
      {
        label: 'anchor-permanence-snapshot deployed on cron (6h)',
        detail: 'Edge function computes Merkle root, writes to proof_of_permanence_anchors, and submits the tx to DeviceWatermarkRegistry on Sepolia.',
        state: 'shipped',
      },
      {
        label: 'Public verifier at /verify/:hash recomputes Merkle in-browser',
        detail: 'crypto.subtle.digest + get_merkle_inclusion_proof() returns the sibling path; auditor never trusts the server.',
        state: 'shipped',
      },
      {
        label: 'Basescan links currently point at sepolia.basescan.org',
        detail: 'Switch happens via env-driven helper, no code change at flip.',
        state: 'ready_pending_flip',
      },
      {
        label: 'Admin Protocol Integrity dashboard (/admin/protocol-integrity)',
        detail: 'KPI drift, invariants, collusion, chain tampers, anchor freshness all surfaced with one-click resolve for staff.',
        state: 'shipped',
      },
    ],
  },
];

const MAINNET_GROUPS: Group[] = [
  {
    title: 'Anchor wallet & RPC flip',
    icon: Network,
    intro:
      'Mechanical changes to point the anchor pipeline at chain 8453. Captured in mem://roadmap/mainnet-anchor-switch.',
    items: [
      {
        label: 'Fund anchor wallet on Base mainnet',
        detail: 'Bridge ~0.05 ETH initial float, monitor with low-balance alert (threshold 0.01 ETH → admin Slack).',
        state: 'todo',
      },
      {
        label: 'Switch BASE_RPC_URL env to mainnet provider',
        detail: 'Alchemy / QuickNode mainnet key; verify rate limits cover 4 anchor txs/day + the per-mint settlement load.',
        state: 'todo',
      },
      {
        label: 'Deploy DeviceWatermarkRegistry on mainnet, update DEVICE_REGISTRY_ADDRESS',
        detail: 'Same audited contract from Sepolia; re-verify on basescan.org; record deploy tx in /docs/BASESCAN_LP_DEPLOYMENT.md.',
        state: 'todo',
      },
      {
        label: 'Flip basescan link helper to basescan.org',
        detail: 'getExplorerUrl() switches on import.meta.env.VITE_CHAIN_ID; smoke-test by clicking a receipt from /proof-of-genesis.',
        state: 'todo',
      },
      {
        label: 'Smoke-test full path: ingest → mint → anchor → verify',
        detail: 'Run one real Proof of Genesis through Tesla path, confirm chain_hash anchors within 6h, recompute Merkle root in browser, basescan link resolves on mainnet.',
        state: 'todo',
      },
    ],
  },
  {
    title: '$ZSOLAR token + economics',
    icon: Coins,
    intro:
      'The token + LP machinery lives behind the same env flip. Hard cap 1T, mint split 50/25/20/5 already wired in tokenomics.ts.',
    items: [
      {
        label: 'Deploy ZSOLAR.sol on Base mainnet (1T hard cap)',
        detail: 'Verify on basescan.org, transfer ownership to multisig, lock minter role to mint-onchain function wallet only.',
        state: 'todo',
      },
      {
        label: 'Deploy ZenSolarNFT.sol on mainnet',
        detail: 'Same audited contract; backfill milestone metadata URIs from /public/nft-metadata-flat/.',
        state: 'todo',
      },
      {
        label: 'Seed Round-1 LP ($200K USDC + 2M $ZSOLAR at $0.10)',
        detail: 'Uniswap V3 pool, full-range initial position; record tx + price in lp_rounds. NEVER launch at $1 — tranche math only.',
        state: 'todo',
      },
      {
        label: 'Founder pact-lock contract live (Joseph 150B / Michael 50B)',
        detail: 'Family Legacy Pact™ time-locked at $6.67 / $20 trillionaire crossovers, publicly viewable on basescan.',
        state: 'todo',
      },
      {
        label: 'Burn wallet + LP wallet + Treasury wallet addresses recorded',
        detail: 'Surfaced on /admin/contracts and on the public /tokenomics page so the 50/25/20/5 split is independently auditable.',
        state: 'todo',
      },
    ],
  },
  {
    title: 'Wallet + onboarding',
    icon: Wallet,
    intro:
      'Embedded Coinbase Wallet + Reown AppKit already shipped. The flip is mostly chain-id config.',
    items: [
      {
        label: 'wagmi config: chain priority = [base, baseSepolia]',
        detail: 'Currently inverted for testnet; src/lib/wagmi.ts reads VITE_CHAIN_ID. Flip env, redeploy.',
        state: 'ready_pending_flip',
      },
      {
        label: 'Coinbase Smart Wallet paymaster funded for mainnet',
        detail: 'Sponsor first-mint gas so onboarding is truly $0. Top-up alert at 30-day burn forecast.',
        state: 'todo',
      },
      {
        label: 'Beta cohort migration path documented',
        detail: 'Sepolia testnet mints are non-transferable; users start fresh on mainnet. Comms email drafted in /admin/email-templates.',
        state: 'todo',
      },
    ],
  },
  {
    title: 'Observability + go/no-go',
    icon: Eye,
    intro:
      'Pre-flip dashboards must be green for 24h. Post-flip we hold beta-only for 72h before opening waitlist.',
    items: [
      {
        label: '24h green window: 0 unresolved criticals, 0 chain tampers, anchor freshness < 60 min',
        detail: 'Pull from /admin/protocol-integrity. Block flip if any condition fails.',
        state: 'todo',
      },
      {
        label: 'Reconciliation tolerance review (1% soft / 5% hard)',
        detail: 'Confirm last 7 days of mint_reconciliation_log show <0.5% mean drift on testnet before promoting same tolerances to mainnet.',
        state: 'todo',
      },
      {
        label: 'Rollback playbook signed off',
        detail: 'If a critical fires post-flip: pause mint-onchain via feature flag, freeze LP, point UI to /maintenance, decide patch-or-rollback within 30 min.',
        state: 'todo',
      },
      {
        label: 'Public status page live (status.zen.solar)',
        detail: 'Surfaces anchor freshness, last sweep, open criticals — same data as admin, scoped to non-PII.',
        state: 'todo',
      },
    ],
  },
  {
    title: 'Parked for post-launch (NOT mainnet-blocking)',
    icon: AlertTriangle,
    intro:
      'Explicitly out of scope for the mainnet flip. Listed here so nobody sneaks them into the launch SOW.',
    items: [
      {
        label: 'Energy Price Oracle (per-user $/kWh on-chain)',
        detail: 'Patent Track 2.5. Phase 1 post-seed, Phase 3 = Series A moat. See mem://roadmap/energy-price-oracle.',
        state: 'todo',
      },
      {
        label: 'kWh-floor narrative on-chain enforcement',
        detail: 'Launch price ($0.10 via LP rounds) and kWh-floor (utility + carbon + REC) stay independent at seed. Floor is narrative-only until oracle ships.',
        state: 'todo',
      },
      {
        label: 'Receipt line items · Phase 2 — snapshot leaves at mint time',
        detail: 'Persist each per-event row (charging session, daily solar, battery export) into a new mint_receipt_line_items table at the moment of mint, keyed by chain_hash + event_fingerprint. Today Phase 1 reads them live from the source tables inside the Proof-of-Delta window; Phase 2 makes the line items tamper-evident so a later edit or delete to a source row cannot break a historical receipt.',
        state: 'todo',
      },
      {
        label: 'Receipt line items · Phase 3 — per-event Merkle inclusion',
        detail: 'Roll each event_fingerprint into the Merkle leaf set committed on Base alongside the per-receipt chain_hash. Public /verify/:hash will then prove inclusion of an individual Tesla supercharging session or a single day of solar production, not just the aggregate mint. Pairs with the Energy Price Oracle for the Series A moat.',
        state: 'todo',
      },
    ],
  },
];

export default function ProofOfGenesisMainnetReadiness() {
  return (
    <>
      <SEO
        title="Mainnet Readiness · Proof-of-Genesis | ZenSolar"
        description="The canonical pre-flight checklist for promoting ZenSolar from Base Sepolia testnet to Base mainnet. Five-pillar enforcement status, anchor stack, token deployment, and go/no-go criteria."
      />

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
          <Link to="/proof-of-genesis">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Proof-of-Genesis
          </Link>
        </Button>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
          >
            Sub-page · Mainnet Readiness
          </Badge>
          <h1 className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight">
            What flips on at mainnet launch.
          </h1>
          <p className="text-[14px] sm:text-base text-muted-foreground leading-snug max-w-2xl">
            The five pillars are already enforced on testnet. This page is the canonical checklist
            of every mechanical change required to promote the protocol from Base Sepolia to Base
            mainnet — and the items we are explicitly <em>not</em> shipping at launch.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2 text-[11px]">
            <LegendChip state="shipped" label="Shipped on testnet" />
            <LegendChip state="ready_pending_flip" label="Ready · awaits env flip" />
            <LegendChip state="todo" label="To do before flip" />
          </div>
        </motion.section>

        {/* Testnet status */}
        <section className="space-y-4 pt-2">
          <SectionHeader
            kicker="Today · Testnet"
            title="What is already enforced."
            sub="Five pillars + observability stack are live on Base Sepolia. No code changes required at mainnet flip — just env."
          />
          <div className="space-y-3">
            {TESTNET_GROUPS.map((g) => (
              <GroupCard key={g.title} group={g} />
            ))}
          </div>
        </section>

        {/* Mainnet flip checklist */}
        <section className="space-y-4 pt-4 border-t border-border/50">
          <SectionHeader
            kicker="At launch · Mainnet flip"
            title="The mechanical changes."
            sub="Every item must close before we burn the mainnet token deployment tx. Grouped by domain so engineering, finance, and ops can own their lanes in parallel."
          />
          <div className="space-y-3">
            {MAINNET_GROUPS.map((g) => (
              <GroupCard key={g.title} group={g} />
            ))}
          </div>
        </section>

        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 text-center pt-4 leading-relaxed">
          Single source of truth · Confidential under NDA · Update as items close
        </p>
      </div>
    </>
  );
}

/* ---------- Sub-components ---------- */

function SectionHeader({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="space-y-1.5">
      <Badge
        variant="outline"
        className="border-border bg-card text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
      >
        {kicker}
      </Badge>
      <h2 className="text-[20px] sm:text-2xl font-bold tracking-tight leading-tight">{title}</h2>
      <p className="text-[13px] sm:text-[14px] text-muted-foreground leading-snug max-w-2xl">{sub}</p>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const Icon = group.icon;
  const shipped = group.items.filter((i) => i.state === 'shipped').length;
  const total = group.items.length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/70">
        <CardHeader className="px-5 pt-5 pb-2.5 sm:px-6 sm:pt-6 space-y-2">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/12 border border-primary/25 shrink-0">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-[16px] sm:text-lg leading-tight">{group.title}</CardTitle>
              <p className="text-[12.5px] sm:text-[13px] text-muted-foreground mt-1 leading-snug">
                {group.intro}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold tabular-nums shrink-0">
              {shipped}/{total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1">
          <ul className="space-y-2.5">
            {group.items.map((item) => (
              <li key={item.label} className="flex gap-2.5">
                <StateIcon state={item.state} />
                <div className="min-w-0">
                  <p className="text-[13.5px] sm:text-sm font-semibold text-foreground/90 leading-snug">
                    {item.label}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StateIcon({ state }: { state: ItemState }) {
  if (state === 'shipped') {
    return <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
  }
  if (state === 'ready_pending_flip') {
    return <Rocket className="h-4 w-4 text-accent shrink-0 mt-0.5" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />;
}

function LegendChip({ state, label }: { state: ItemState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-card text-foreground/80">
      <StateIcon state={state} />
      {label}
    </span>
  );
}
