import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Battery, Car, Leaf, Hash, Shield, Clock, Zap, Copy, Check, FileText, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { VerifyOnChainDrawer, type VerifyOnChainData } from '@/components/proof/VerifyOnChainDrawer';
import { ProtocolJourney, type ProtocolJourneyData } from '@/components/proof/ProtocolJourney';
import { ProofOfAuthenticityStamp } from '@/components/proof/ProofOfAuthenticityStamp';
import { ProtocolCinematicSequence } from '@/components/proof/ProtocolCinematicSequence';

/**
 * Proof-of-Genesis Receipt — PREVIEW ONLY
 *
 * Per-mint receipt showing the exact device readings used to mint the user's
 * reward + the resulting CO2 offset in tons.
 *
 * NOT linked from any sidebar/nav. Reachable only at:
 *   /proof-of-genesis-receipt-preview
 * (and also /demo/proof-of-genesis-receipt-preview for the gated demo).
 *
 * All data is mocked for preview. When promoted to live, swap mock receipts
 * for queries against energy_production + mint_transactions joined by mint id.
 */

// ---------- mock receipts ----------
type Reading = {
  source: 'solar' | 'battery' | 'ev_charging';
  device_id: string;
  provider: string;
  start_kwh: number;
  end_kwh: number;
  recorded_at: string;
  signature: string;
  // EV-only: how many miles this charging session powered
  miles_driven?: number;
};

type Receipt = {
  id: string;
  mint_id: string;
  tx_hash: string;
  block_number: string;
  minted_at: string;
  tokens_minted: number;
  total_kwh: number;
  // EV-only: total miles driven on the verified energy
  miles_driven?: number;
  // Primary mint source — drives context-aware CO₂ framing
  primary_source: 'solar' | 'battery' | 'ev_charging' | 'mixed';
  readings: Reading[];
  proof_root: string;
};

// ---------- CO₂ constants (source-aware) ----------
// Grid electricity displaced (solar/battery): U.S. EIA avg ≈ 0.709 kg CO₂/kWh
const CO2_KG_PER_KWH_GRID = 0.709;
// EV vs ICE: avg US ICE fuel economy 24.4 mpg (EPA 2022); 8.887 kg CO₂ / gal gasoline (EPA)
// → ~0.364 kg CO₂ avoided per EV mile (vs equivalent ICE trip)
const CO2_KG_PER_EV_MILE_AVOIDED = 0.364;
const GAL_GASOLINE_PER_EV_MILE = 1 / 24.4; // gallons of gas a comparable ICE would burn
// Tesla efficiency baseline (Model Y/3 mixed): ~3.0 mi/kWh
const EV_MI_PER_KWH = 3.0;
// Bitcoin Proof-of-Work emissions per single tx (Cambridge CCAF + Digiconomist range)
// Conservative anchor: ~707 kg CO₂ per BTC tx. We compare per $ZSOLAR mint (1 mint = 1 tx).
const BTC_TX_CO2_KG = 707;

const RECEIPTS: Receipt[] = [
  // Apr 23 — EV-only mint (the one the founder just minted)
  // Math: 52 mi @ 3.0 mi/kWh ≈ 17.33 kWh equivalent → 1 token/mile × 0.75 user share = 39.00 $ZSOLAR
  {
    id: 'pog-receipt-001',
    mint_id: 'mint_8a4f...c12d',
    tx_hash: '0xa3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2',
    block_number: '24,891,302',
    minted_at: '2026-04-23T18:42:11Z',
    tokens_minted: 39.0,
    total_kwh: 17.33,
    miles_driven: 52,
    primary_source: 'ev_charging',
    proof_root: '0x7d3e9c1f4a8b2e6d5c9f0a3b7e1d4c8f2a5b9e0d3c6f1a4b7e0d3c6f9a2b5e8',
    readings: [
      {
        source: 'ev_charging',
        device_id: 'tesla-model-y-VIN9XJ',
        provider: 'Tesla Vehicle API',
        start_kwh: 0,
        end_kwh: 17.33,
        recorded_at: '2026-04-23T18:30:00Z',
        signature: '0x4a7c...e9f1',
        miles_driven: 52,
      },
    ],
  },
  // Apr 22 — Wallbox home-charge EV mint (Tschida flow). 28 mi → 21.00 $ZSOLAR
  {
    id: 'pog-receipt-002',
    mint_id: 'mint_3b1e...9f47',
    tx_hash: '0xc7e2f9a4b1d6e3c0f7a4b1d8e5c2f9a6b3d0e7f4a1b8d5e2c9f6a3b0d7e4c1f8',
    block_number: '24,890,118',
    minted_at: '2026-04-22T14:11:03Z',
    tokens_minted: 21.0,
    total_kwh: 9.33,
    miles_driven: 28,
    primary_source: 'ev_charging',
    proof_root: '0x2f8b1e9d4c7a0f3b6e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1f4a7b0e3d6c9f2a5',
    readings: [
      {
        source: 'ev_charging',
        device_id: 'wallbox-pulsar-plus-A41',
        provider: 'Wallbox myWallbox API',
        start_kwh: 0,
        end_kwh: 9.33,
        recorded_at: '2026-04-22T13:42:00Z',
        signature: '0x6d1f...8a3c',
        miles_driven: 28,
      },
    ],
  },
  // Apr 21 — Solar + battery mint (mixed)
  {
    id: 'pog-receipt-003',
    mint_id: 'mint_e9c2...44a1',
    tx_hash: '0x5b8d2e7c4f1a9b6d3e0c7f4a1b8d5e2c9f6a3b0d7e4c1f8a5b2d9e6c3f0a7b4',
    block_number: '24,886,407',
    minted_at: '2026-04-21T09:28:55Z',
    tokens_minted: 23.11,
    total_kwh: 30.81,
    primary_source: 'mixed',
    proof_root: '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
    readings: [
      {
        source: 'solar',
        device_id: 'solaredge-inv-4502',
        provider: 'SolarEdge Monitoring',
        start_kwh: 41207.88,
        end_kwh: 41229.19,
        recorded_at: '2026-04-21T09:00:00Z',
        signature: '0x1e4d...7b9c',
      },
      {
        source: 'battery',
        device_id: 'tesla-powerwall-3-A91',
        provider: 'Tesla Energy',
        start_kwh: 9810.62,
        end_kwh: 9820.12,
        recorded_at: '2026-04-21T09:30:00Z',
        signature: '0x8c3f...2d1e',
      },
    ],
  },
];

const SOURCE_META = {
  solar: { label: 'Solar Production', icon: Sun, accent: 'text-energy', bg: 'bg-energy/10', border: 'border-energy/30' },
  battery: { label: 'Battery Discharge', icon: Battery, accent: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' },
  ev_charging: { label: 'EV Charging', icon: Car, accent: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
} as const;

function formatKwh(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function formatNumber(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// ---------- derived CO₂ helpers (context-aware per primary source) ----------
type CO2Story = {
  primary_label: string;
  primary_value: string;
  primary_suffix: string;
  primary_footnote: string;
  pow_delta_kg: number; // emissions an equivalent BTC PoW tx would have caused
  detail: string;
};

function buildCo2Story(receipt: Receipt): CO2Story {
  const pow_delta_kg = BTC_TX_CO2_KG; // 1 mint = 1 tx

  if (receipt.primary_source === 'ev_charging' && receipt.miles_driven) {
    const gallons = receipt.miles_driven * GAL_GASOLINE_PER_EV_MILE;
    const co2_kg = receipt.miles_driven * CO2_KG_PER_EV_MILE_AVOIDED;
    return {
      primary_label: 'Gasoline Avoided',
      primary_value: formatNumber(gallons, 2),
      primary_suffix: 'gallons',
      primary_footnote: `≈ ${co2_kg.toFixed(2)} kg CO₂ a comparable ICE would have emitted`,
      pow_delta_kg,
      detail: `You drove ${receipt.miles_driven} miles on sunshine — the same trip in an average gas car (24.4 mpg) would have burned ${gallons.toFixed(2)} gallons of gasoline and put ${co2_kg.toFixed(2)} kg of CO₂ into the atmosphere. Instead you minted clean and earned $ZSOLAR.`,
    };
  }

  // solar / battery / mixed → grid displacement framing
  const co2_kg = receipt.total_kwh * CO2_KG_PER_KWH_GRID;
  return {
    primary_label: 'Grid CO₂ Displaced',
    primary_value: formatNumber(co2_kg, 2),
    primary_suffix: 'kg CO₂',
    primary_footnote: `${formatKwh(receipt.total_kwh)} kWh that the grid did not have to burn fuel to produce`,
    pow_delta_kg,
    detail: `You verifiably displaced ${co2_kg.toFixed(2)} kg of grid CO₂ in this single mint — energy your panels and battery produced instead of a fossil-fuel power plant.`,
  };
}

function shortHash(h: string, head = 10, tail = 6) {
  if (h.length <= head + tail + 3) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {/* noop */}
      }}
      className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ProofOfGenesisReceiptPreview() {
  const [activeId, setActiveId] = useState(RECEIPTS[0].id);
  const receipt = useMemo(() => RECEIPTS.find((r) => r.id === activeId)!, [activeId]);

  const co2Story = useMemo(() => buildCo2Story(receipt), [receipt]);

  // ===== Cinematic Protocol Sequence: hardened auto-play guards =====
  //
  // The cinematic must NEVER interrupt a user unexpectedly. It auto-plays
  // exactly once, only when ALL of the following are true:
  //   (1) First visit this session (sessionStorage key not set)
  //   (2) Receipt is in a valid "success" state (has tokens minted, tx hash,
  //       proof root, and at least one reading) — never on partial/error data
  //   (3) User has not signaled `prefers-reduced-motion`
  //   (4) The current URL does NOT have `?nocinematic=1` (escape hatch for
  //       embedded views, screenshot tools, and reviewer playback)
  //   (5) The page is actually visible (not a prerender / background tab)
  //
  // Otherwise the user must explicitly click "Replay protocol" to see it.
  const [cinematicOpen, setCinematicOpen] = useState(false);
  const autoPlayedRef = useRef(false);

  const isReceiptSuccess = useMemo(() => {
    return (
      receipt.tokens_minted > 0 &&
      typeof receipt.tx_hash === 'string' &&
      receipt.tx_hash.startsWith('0x') &&
      receipt.tx_hash.length >= 10 &&
      typeof receipt.proof_root === 'string' &&
      receipt.proof_root.startsWith('0x') &&
      Array.isArray(receipt.readings) &&
      receipt.readings.length > 0
    );
  }, [receipt]);

  useEffect(() => {
    if (autoPlayedRef.current) return;

    // Guard 2: only on success receipts
    if (!isReceiptSuccess) return;

    // Guard 4: explicit opt-out via query param
    try {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('nocinematic') === '1') return;
      }
    } catch { /* noop */ }

    // Guard 3: respect prefers-reduced-motion (the cinematic itself also
    // collapses, but skipping auto-play entirely is the kindest default)
    try {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
    } catch { /* noop */ }

    // Guard 5: only when the tab is visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    // Guard 1: first visit this session only
    let shouldPlay = false;
    try {
      const key = 'pog-cinematic-seen';
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        shouldPlay = true;
      }
    } catch {
      // sessionStorage unavailable (private mode, etc.) — do NOT auto-play.
      // Better to under-trigger than surprise the user.
      shouldPlay = false;
    }

    if (!shouldPlay) return;

    autoPlayedRef.current = true;
    // Small delay so the page paints first and the cinematic feels intentional
    const t = setTimeout(() => setCinematicOpen(true), 400);
    return () => clearTimeout(t);
  }, [isReceiptSuccess]);

  return (
    <>
      <SEO
        title="Proof-of-Genesis Receipt — Preview"
        description="Per-mint receipt showing the exact verified energy readings and CO2 offset for a $ZSOLAR mint."
        url="https://beta.zen.solar/proof-of-genesis-receipt-preview"
      />

      <div className="min-h-screen bg-background pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* Preview banner */}
        <div className="sticky top-0 z-40 border-b border-primary/20 bg-primary/5 backdrop-blur-md">
          <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase tracking-wider shrink-0">
                Preview
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                Proof-of-Genesis receipt — not linked from nav, mocked data
              </span>
            </div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
              <ArrowLeft className="h-3 w-3" /> Exit
            </Link>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-5 sm:gap-6"
          >
            <div className="space-y-3 min-w-0 flex-1">
              <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                <Sparkle /> Proof-of-Genesis™ Receipt
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
                The exact readings behind your mint.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-snug max-w-2xl">
                Every $ZSOLAR mint is backed by signed, time-stamped readings from your physical devices. This is the
                audit trail — the kWh, the device, the signature, the on-chain proof, and the CO₂ you offset.
              </p>
            </div>

            {/* Proof-of-Authenticity™ embossed watermark stamp */}
            <div className="shrink-0 self-center sm:self-start">
              <ProofOfAuthenticityStamp
                poaHashShort={receipt.tx_hash.slice(2, 9)}
                poaHashFull={receipt.tx_hash.slice(2, 66)}
                issuedAt={receipt.minted_at}
                variant="stamp"
              />
            </div>
          </motion.header>

          {/* Receipt selector */}
          <div className="flex flex-wrap gap-2">
            {RECEIPTS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  r.id === activeId
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {new Date(r.minted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {r.primary_source === 'ev_charging' && r.miles_driven ? `${r.miles_driven} mi` : `${formatKwh(r.total_kwh)} kWh`}
              </button>
            ))}
          </div>

          {/* Hero stats */}
          <motion.section
            key={receipt.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <StatCard
              icon={Zap}
              accent="text-primary"
              bg="bg-primary/10"
              label="Tokens Minted"
              value={`${formatKwh(receipt.tokens_minted)}`}
              suffix="$ZSOLAR"
            />
            {receipt.primary_source === 'ev_charging' && receipt.miles_driven ? (
              <StatCard
                icon={Car}
                accent="text-primary"
                bg="bg-primary/10"
                label="Miles Driven"
                value={`${receipt.miles_driven}`}
                suffix="mi"
                footnote={`on ${formatKwh(receipt.total_kwh)} kWh of verified clean energy`}
              />
            ) : (
              <StatCard
                icon={Sun}
                accent="text-energy"
                bg="bg-energy/10"
                label="Verified Energy"
                value={`${formatKwh(receipt.total_kwh)}`}
                suffix="kWh"
              />
            )}
            <StatCard
              icon={Leaf}
              accent="text-secondary"
              bg="bg-secondary/10"
              label={co2Story.primary_label}
              value={co2Story.primary_value}
              suffix={co2Story.primary_suffix}
              footnote={co2Story.primary_footnote}
            />
          </motion.section>

          {/* PoW comparison chip — Proof-of-Genesis as the regenerative inverse of Proof-of-Work */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-lg border border-secondary/30 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 p-3 sm:p-4 flex items-start gap-3"
          >
            <div className="h-8 w-8 rounded-md bg-secondary/15 flex items-center justify-center shrink-0">
              <Leaf className="h-4 w-4 text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                vs. Bitcoin Proof-of-Work
              </div>
              <div className="text-sm sm:text-base text-foreground/90 leading-snug">
                One equivalent BTC transaction would have emitted{' '}
                <span className="font-bold text-secondary">~{co2Story.pow_delta_kg} kg CO₂</span>{' '}
                just to settle. Your Proof-of-Genesis™ mint emitted essentially{' '}
                <span className="font-bold text-primary">zero</span> — and proved real clean energy in the same step.
              </div>
            </div>
          </motion.div>

          {/* ===== Protocol Journey — the 5 trademarked primitives behind this mint ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  Protocol Journey
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  The five trademarked primitives that produced this mint.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCinematicOpen(true)}
                className="shrink-0 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Replay protocol
              </Button>
            </div>
            <ProtocolJourney
              data={{
                tapAt: receipt.minted_at,
                totalKwh: receipt.total_kwh,
                primaryProvider: receipt.readings[0]?.provider ?? 'Unknown',
                primaryDeviceId: receipt.readings[0]?.device_id ?? 'unknown',
                deltaProof: receipt.proof_root,
                originDeviceHash: receipt.readings[0]
                  ? `0x${receipt.readings[0].device_id.padEnd(60, '0').slice(0, 60)}`
                  : '0x0000',
                tokensMinted: receipt.tokens_minted,
                mintTxHash: receipt.tx_hash,
                blockNumber: receipt.block_number,
                permanenceRoot:
                  '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
                permanenceAnchoredAt: receipt.minted_at,
              } satisfies ProtocolJourneyData}
            />
          </div>

          {/* Readings */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Source readings
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Every reading below was signed by the device, time-stamped, and bundled into the on-chain proof.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {receipt.readings.map((r, i) => {
                const meta = SOURCE_META[r.source];
                const Icon = meta.icon;
                const delta = r.end_kwh - r.start_kwh;
                return (
                  <div
                    key={i}
                    className={`rounded-lg border ${meta.border} ${meta.bg} p-3 sm:p-4 space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`h-4 w-4 ${meta.accent} shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight">{meta.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{r.provider}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-semibold ${meta.accent}`}>+{formatKwh(delta)} kWh</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {new Date(r.recorded_at).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                      <KV label="Start reading" value={`${formatKwh(r.start_kwh)} kWh`} />
                      <KV label="End reading" value={`${formatKwh(r.end_kwh)} kWh`} />
                      <KV label="Device ID" value={r.device_id} mono />
                      <KV label="Device signature" value={r.signature} mono copy />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* On-chain proof */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                On-chain proof
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                The mint and its proof root are permanent on Base L2. Anyone can verify.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <ProofRow label="Mint ID" value={receipt.mint_id} />
              <ProofRow label="Transaction hash" value={receipt.tx_hash} short />
              <ProofRow label="Block number" value={receipt.block_number} />
              <ProofRow label="Proof root (Merkle)" value={receipt.proof_root} short />
              <ProofRow
                label="Minted at"
                value={new Date(receipt.minted_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <div className="pt-3 flex flex-wrap gap-2">
                <VerifyOnChainDrawer
                  data={{
                    poaHashShort: receipt.tx_hash.slice(2, 9),
                    poaHashFull: receipt.tx_hash.slice(2, 66),
                    deltaProof: receipt.proof_root,
                    originDeviceHash: receipt.readings[0]
                      ? `0x${receipt.readings[0].device_id.padEnd(60, '0').slice(0, 60)}`
                      : '0x0000',
                    mintTxHash: receipt.tx_hash,
                    blockNumber: receipt.block_number,
                    permanenceRoot:
                      '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
                    permanenceAnchoredAt: '2026-04-24T00:00:00Z',
                    segiProvider: receipt.readings[0]?.provider ?? 'Unknown',
                    tapToMint: true,
                    explorerUrl: `https://basescan.org/tx/${receipt.tx_hash}`,
                  } satisfies VerifyOnChainData}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Shield className="h-3.5 w-3.5 mr-1.5" />
                      Verify on-chain
                    </Button>
                  }
                />
                <Button variant="outline" size="sm" disabled className="opacity-60">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  View on Basescan (preview)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CO2 storytelling */}
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold">Why this matters</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                You verifiably displaced <span className="font-semibold text-secondary">{formatTons(receipt.co2_offset_tons)} metric tons</span>{' '}
                of grid CO₂ in this single mint. That's roughly the same as{' '}
                <span className="font-semibold">{totalTrees} trees</span> doing a full year of work — except yours
                happened in seconds, was cryptographically proven, and earned you <span className="font-semibold text-primary">{formatKwh(receipt.tokens_minted)} $ZSOLAR</span>.
              </p>
              <p className="text-[11px] text-muted-foreground italic">
                CO₂ figure uses the U.S. EIA grid average of 0.000709 metric tons per kWh displaced. Tree
                equivalency uses 0.06 metric tons of CO₂ absorbed per mature tree per year.
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-[11px] text-muted-foreground pt-2">
            Preview screen · not linked from any sidebar · safe to share with internal reviewers only
          </p>
        </div>
      </div>

      {/* Cinematic protocol sequence — auto-plays once per session, replayable via header button */}
      <ProtocolCinematicSequence
        open={cinematicOpen}
        onClose={() => setCinematicOpen(false)}
        onComplete={() => setCinematicOpen(false)}
        tapAtIso={receipt.minted_at}
        finaleTokenCount={receipt.tokens_minted}
        finaleSubtitle={`${formatKwh(receipt.tokens_minted)} $ZSOLAR minted · ${formatKwh(receipt.total_kwh)} kWh verified`}
        backendTimestamps={{
          tap: receipt.minted_at,
          // Origin = first device reading recorded_at (clean source verified at this moment)
          origin: receipt.readings[0]?.recorded_at,
          // Delta = latest device reading recorded_at (Δ kWh frame closes here)
          delta: receipt.readings[receipt.readings.length - 1]?.recorded_at,
          // Mint and Permanence both anchor to the receipt's mint timestamp
          mint: receipt.minted_at,
          permanence: receipt.minted_at,
        }}
      />
    </>
  );
}

// ---------- small subcomponents ----------

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 mr-1" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z" />
    </svg>
  );
}

function StatCard({
  icon: Icon, accent, bg, label, value, suffix, footnote,
}: {
  icon: typeof Zap;
  accent: string;
  bg: string;
  label: string;
  value: string;
  suffix?: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-md ${bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl sm:text-3xl font-bold ${accent}`}>{value}</span>
        {suffix && <span className="text-xs text-muted-foreground font-medium">{suffix}</span>}
      </div>
      {footnote && <p className="text-[11px] text-muted-foreground leading-snug">{footnote}</p>}
    </div>
  );
}

function KV({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</div>
      <div className="flex items-center gap-1">
        <span className={`text-foreground/90 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function ProofRow({ label, value, short }: { label: string; value: string; short?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-mono text-foreground/90 truncate">
          {short ? shortHash(value) : value}
        </span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
