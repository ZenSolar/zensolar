import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Battery, Car, Leaf, Hash, Shield, Clock, Zap, Copy, Check, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { VerifyOnChainDrawer, type VerifyOnChainData } from '@/components/proof/VerifyOnChainDrawer';
import { ProtocolJourney, type ProtocolJourneyData } from '@/components/proof/ProtocolJourney';
import { ProofOfAuthenticityStamp } from '@/components/proof/ProofOfAuthenticityStamp';

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
};

type Receipt = {
  id: string;
  mint_id: string;
  tx_hash: string;
  block_number: string;
  minted_at: string;
  tokens_minted: number;
  total_kwh: number;
  co2_offset_tons: number;
  readings: Reading[];
  proof_root: string;
};

// 1 kWh of grid electricity ≈ 0.000709 metric tons CO2 displaced (US avg)
const CO2_TONS_PER_KWH = 0.000709;

const RECEIPTS: Receipt[] = [
  {
    id: 'pog-receipt-001',
    mint_id: 'mint_8a4f...c12d',
    tx_hash: '0xa3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2',
    block_number: '24,891,302',
    minted_at: '2026-04-23T18:42:11Z',
    tokens_minted: 47.32,
    total_kwh: 14.2,
    co2_offset_tons: 14.2 * CO2_TONS_PER_KWH,
    proof_root: '0x7d3e9c1f4a8b2e6d5c9f0a3b7e1d4c8f2a5b9e0d3c6f1a4b7e0d3c6f9a2b5e8',
    readings: [
      {
        source: 'solar',
        device_id: 'enphase-envoy-7821',
        provider: 'Enphase Enlighten',
        start_kwh: 18342.41,
        end_kwh: 18353.18,
        recorded_at: '2026-04-23T18:00:00Z',
        signature: '0x4a7c...e9f1',
      },
      {
        source: 'battery',
        device_id: 'tesla-powerwall-3-A91',
        provider: 'Tesla Energy',
        start_kwh: 9821.06,
        end_kwh: 9824.49,
        recorded_at: '2026-04-23T18:30:00Z',
        signature: '0x9b2e...c4a8',
      },
    ],
  },
  {
    id: 'pog-receipt-002',
    mint_id: 'mint_3b1e...9f47',
    tx_hash: '0xc7e2f9a4b1d6e3c0f7a4b1d8e5c2f9a6b3d0e7f4a1b8d5e2c9f6a3b0d7e4c1f8',
    block_number: '24,890,118',
    minted_at: '2026-04-22T14:11:03Z',
    tokens_minted: 29.85,
    total_kwh: 8.95,
    co2_offset_tons: 8.95 * CO2_TONS_PER_KWH,
    proof_root: '0x2f8b1e9d4c7a0f3b6e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1f4a7b0e3d6c9f2a5',
    readings: [
      {
        source: 'ev_charging',
        device_id: 'tesla-model-y-VIN9XJ',
        provider: 'Tesla Vehicle API',
        start_kwh: 0,
        end_kwh: 8.95,
        recorded_at: '2026-04-22T13:42:00Z',
        signature: '0x6d1f...8a3c',
      },
    ],
  },
  {
    id: 'pog-receipt-003',
    mint_id: 'mint_e9c2...44a1',
    tx_hash: '0x5b8d2e7c4f1a9b6d3e0c7f4a1b8d5e2c9f6a3b0d7e4c1f8a5b2d9e6c3f0a7b4',
    block_number: '24,886,407',
    minted_at: '2026-04-21T09:28:55Z',
    tokens_minted: 102.7,
    total_kwh: 30.81,
    co2_offset_tons: 30.81 * CO2_TONS_PER_KWH,
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
function formatTons(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
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

  const totalTrees = useMemo(
    () => Math.round(receipt.co2_offset_tons * 16.5), // ~0.06 t CO2 absorbed/tree/year → 1t ≈ 16.5 trees
    [receipt.co2_offset_tons],
  );

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
            className="space-y-3"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                <Sparkle /> Proof-of-Genesis™ Receipt
              </Badge>
              <Link
                to={`/verify/${receipt.tx_hash.slice(2, 66)}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.1] transition-colors"
                title="Public Proof-of-Authenticity™ verification"
              >
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">PoA</span>
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {receipt.tx_hash.slice(2, 9)}
                </span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
              The exact readings behind your mint.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-snug max-w-2xl">
              Every $ZSOLAR mint is backed by signed, time-stamped readings from your physical devices. This is the
              audit trail — the kWh, the device, the signature, the on-chain proof, and the CO₂ you offset.
            </p>
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
                {new Date(r.minted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {formatKwh(r.total_kwh)} kWh
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
            <StatCard
              icon={Sun}
              accent="text-energy"
              bg="bg-energy/10"
              label="Verified Energy"
              value={`${formatKwh(receipt.total_kwh)}`}
              suffix="kWh"
            />
            <StatCard
              icon={Leaf}
              accent="text-secondary"
              bg="bg-secondary/10"
              label="CO₂ Offset"
              value={`${formatTons(receipt.co2_offset_tons)}`}
              suffix="metric tons"
              footnote={`≈ ${totalTrees} trees absorbing CO₂ for one year`}
            />
          </motion.section>

          {/* ===== Protocol Journey — the 5 trademarked primitives behind this mint ===== */}
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
