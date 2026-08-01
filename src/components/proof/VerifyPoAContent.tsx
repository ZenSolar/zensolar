/**
 * Shared body of the Proof-of-Genesis receipt — beginner-first redesign.
 *
 * Rendered in TWO contexts:
 *   1. `/verify/:poa` standalone page (variant="page") — full SEO shell.
 *   2. Inside a swipe-down Drawer launched from the dashboard receipts
 *      drawer (variant="sheet") — no page chrome; the parent Drawer owns
 *      the back/close affordance.
 *
 * Design intent (Apple-Wallet-pass feel):
 *   - Hero: ONE big number ($ZSOLAR minted) + ONE emotional payoff (CO₂ avoided)
 *   - Trademark proof badges (Origin / Delta / Authenticity / vs-BTC) as a
 *     compact 4-up strip — the whole TM stack visible at a glance
 *   - Per-source contributing-session rows (Proof-of-Delta) — the audit
 *     trail behind the number, but readable by a normal human
 *   - Cryptographic internals (hashes, Merkle root, Basescan, chain anchor)
 *     all collapse behind ONE "Verification details" toggle
 *
 * Brand: ZenSolar logo gradient (eco green → primary blue), accent amber
 * for milestone/energy moments, accent-warm orange reserved for the
 * vs-Bitcoin PoW comparison.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck, Sparkles, Zap, Sun, Battery, Car, Plug,
  ChevronDown, MapPin, Fingerprint, Award, Hash,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TamperEvidentProofPanel } from '@/components/proof/TamperEvidentProofPanel';
import { MintedForBadge, ReceiptSourceLines, type ApiResponse as SourceLinesResponse } from '@/components/proof/ReceiptSourceLines';
import { ProofOfAuthenticityStamp } from '@/components/proof/ProofOfAuthenticityStamp';

export type VerifyReceipt = {
  found: boolean;
  is_valid?: boolean;
  chain_hash?: string;
  chain_seq?: number;
  tx_hash?: string;
  block_number?: string | null;
  action?: string;
  tokens_minted?: number | string;
  kwh_delta?: number | string | null;
  miles_delta?: number | string | null;
  source_breakdown?: Record<string, number> | null;
  status?: string;
  created_at?: string;
};

// ---- CO₂ math (per-source; see src/lib/co2Math.ts) ----
import { computeCo2, type Co2Stats } from '@/lib/co2Math';

function fmt(n: number, digits = 1): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

// ---- Source row inference from `source_breakdown` JSON ----
type SourceRow = {
  key: string;
  label: string;
  Icon: typeof Sun;
  amount: string;            // "+17.33 kWh" or "+52 mi"
  accentClass: string;       // semantic-token text color
  ringClass: string;         // semantic-token border color
  /** Line.source keys this row maps to inside get_mint_source_lines() */
  lineSources: string[];
};

const SOURCE_DEFS: Record<string, { label: string; Icon: typeof Sun; accent: string; ring: string; unit: 'kwh' | 'mi'; lineSources: string[] }> = {
  solar_kwh:           { label: 'Solar Production',  Icon: Sun,     accent: 'text-accent',       ring: 'border-accent/30',       unit: 'kwh', lineSources: ['solar'] },
  battery_kwh:         { label: 'Battery Discharge', Icon: Battery, accent: 'text-eco',          ring: 'border-eco/30',          unit: 'kwh', lineSources: ['battery'] },
  home_charging_kwh:   { label: 'Home Charging',     Icon: Plug,    accent: 'text-accent-cool',  ring: 'border-accent-cool/30',  unit: 'kwh', lineSources: ['home_charger'] },
  supercharging_kwh:   { label: 'Tesla Supercharging', Icon: Zap,   accent: 'text-primary',      ring: 'border-primary/30',      unit: 'kwh', lineSources: ['supercharger'] },
  ev_kwh:              { label: 'EV Charging',       Icon: Zap,     accent: 'text-primary',      ring: 'border-primary/30',      unit: 'kwh', lineSources: ['supercharger', 'home_charger'] },
  // EV miles come from the vehicle's odometer snapshot — there are no per-trip rows to list.
  ev_miles:            { label: 'EV Driving',        Icon: Car,     accent: 'text-primary',      ring: 'border-primary/30',      unit: 'mi',  lineSources: [] },
};

function buildSourceRows(r: VerifyReceipt): SourceRow[] {
  const sb = r.source_breakdown ?? {};
  const rows: SourceRow[] = [];
  for (const [key, raw] of Object.entries(sb)) {
    const n = Number(raw);
    if (!n || n <= 0) continue;
    const def = SOURCE_DEFS[key];
    if (!def) continue;
    rows.push({
      key,
      label: def.label,
      Icon: def.Icon,
      amount: def.unit === 'mi' ? `+${fmt(n, 0)} mi` : `+${fmt(n, 2)} kWh`,
      accentClass: def.accent,
      ringClass: def.ring,
      lineSources: def.lineSources,
    });
  }
  if (rows.length > 0) return rows;

  // Fallback: no source_breakdown stored (legacy mint-rewards rows).
  // Per the unified-receipt spec, treat as Tesla Supercharging-only and
  // derive kWh from tokens_minted (canonical 1 token ≈ 1 kWh) when the
  // explicit kwh_delta column is null.
  const tokens = Number(r.tokens_minted ?? 0);
  const milesExplicit = Number(r.miles_delta ?? 0);
  const kwhExplicit = Number(r.kwh_delta ?? 0);
  const kwh = kwhExplicit > 0 ? kwhExplicit : (milesExplicit === 0 ? tokens : 0);
  if (milesExplicit > 0) {
    return [{ key: 'ev_miles', label: 'EV Driving', Icon: Car, amount: `+${fmt(milesExplicit, 0)} mi`, accentClass: 'text-primary', ringClass: 'border-primary/30', lineSources: [] }];
  }
  if (kwh > 0) {
    return [{ key: 'supercharging_kwh', label: 'Tesla Supercharging', Icon: Zap, amount: `+${fmt(kwh, 2)} kWh`, accentClass: 'text-primary', ringClass: 'border-primary/30', lineSources: ['supercharger'] }];
  }
  return [];
}

/**
 * Impact module — category-aware, and silent when it has nothing true to say.
 *
 * Rules:
 *  - Supercharging states ENERGY DELIVERED, never CO₂ avoided. Those kWh came
 *    off the Supercharger network, not off the member's own system, and we do
 *    not restate Tesla's renewable-matching claim as ours.
 *  - CO₂ avoided is stated only for categories where the member's own hardware
 *    displaced something: solar, battery, home charging, EV miles driven.
 *  - Returns null when there is no real, non-zero value — the module then does
 *    not render at all.
 */
type Impact = { label: string; value: string; unit?: string; sub: string | null };

const CO2_ELIGIBLE = new Set(['solar_kwh', 'battery_kwh', 'home_charging_kwh', 'ev_miles']);
const DELIVERED_ONLY = new Set(['supercharging_kwh', 'ev_kwh']);

function impactFor(stats: Co2Stats): Impact | null {
  const eligible = stats.breakdown.filter((b) => CO2_ELIGIBLE.has(b.key) && b.kg > 0);
  if (eligible.length > 0) {
    const kg = eligible.reduce((s, b) => s + b.kg, 0);
    const names = eligible.map((b) => SOURCE_DEFS[b.key]?.label ?? b.key);
    return {
      label: 'Impact',
      value: `${fmt(kg, 2)} kg CO₂`,
      unit: 'Avoided',
      sub: `From ${names.join(' + ')}`,
    };
  }

  const delivered = stats.breakdown
    .filter((b) => DELIVERED_ONLY.has(b.key))
    .reduce((s, b) => s + b.amount, 0);
  if (delivered > 0) {
    return {
      label: 'Energy delivered',
      value: `${fmt(delivered, 2)} kWh`,
      sub: 'Measured against your vehicle’s signed charge counter',
    };
  }

  // Legacy rows with no stored breakdown: state the delivered energy only.
  if (stats.breakdown.length === 0 && stats.kwh > 0) {
    return { label: 'Energy delivered', value: `${fmt(stats.kwh, 2)} kWh`, sub: null };
  }
  return null;
}

export function VerifyPoAContent({ poa, mockReceipt, mockSourceLines }: { poa: string | undefined; mockReceipt?: VerifyReceipt; mockSourceLines?: SourceLinesResponse }) {
  const [data, setData] = useState<VerifyReceipt | null>(mockReceipt ?? null);
  const [loading, setLoading] = useState(!mockReceipt);
  const [proofOpen, setProofOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [expandedSourceKey, setExpandedSourceKey] = useState<string | null>(null);
  const sessionsRef = useRef<HTMLDivElement | null>(null);
  const deltaProofRef = useRef<HTMLDivElement | null>(null);
  const [lineCounts, setLineCounts] = useState<Record<string, number> | null>(null);
  const verifyRef = useRef<HTMLDivElement | null>(null);

  const isHexHash = !!poa && /^[a-f0-9]{64}$/i.test(poa);

  useEffect(() => {
    if (mockReceipt) { setData(mockReceipt); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      if (!poa || !isHexHash) { setData(null); setLoading(false); return; }
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_mint_receipt', {
        _chain_hash: poa.toLowerCase(),
      });
      if (cancelled) return;
      if (error) { setData({ found: false }); setLoading(false); return; }
      setData(rpcData as VerifyReceipt);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [poa, isHexHash, mockReceipt]);

  const stats = useMemo(() => computeCo2({
    tokens_minted: data?.tokens_minted,
    kwh_delta: data?.kwh_delta,
    miles_delta: data?.miles_delta,
    source_breakdown: data?.source_breakdown,
  }), [data]);

  const sourceRows = useMemo(() => (data ? buildSourceRows(data) : []), [data]);
  const impact = useMemo(() => impactFor(stats), [stats]);

  /**
   * Badge truthfulness (fix 7): VERIFIED DELTA may only claim what per-reading
   * rows actually back. We count the delta rows this receipt can produce, per
   * source, and gate both the badge and the "View sessions" control on it.
   */
  useEffect(() => {
    const cleanHash = data?.chain_hash?.replace(/^0x/, '').toLowerCase() ?? null;
    if (mockSourceLines) {
      const counts: Record<string, number> = {};
      for (const l of mockSourceLines.lines ?? []) counts[l.source] = (counts[l.source] ?? 0) + 1;
      setLineCounts(counts);
      return;
    }
    if (!cleanHash || !/^[a-f0-9]{64}$/i.test(cleanHash)) { setLineCounts({}); return; }
    let cancelled = false;
    (async () => {
      const { data: rpcData, error } = await supabase.rpc('get_mint_source_lines', { _chain_hash: cleanHash });
      if (cancelled) return;
      if (error || !rpcData) { setLineCounts({}); return; }
      const counts: Record<string, number> = {};
      for (const l of ((rpcData as SourceLinesResponse).lines ?? [])) {
        counts[l.source] = (counts[l.source] ?? 0) + 1;
      }
      setLineCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [data?.chain_hash, mockSourceLines]);

  function scrollToRef(ref: React.RefObject<HTMLDivElement>, openProof = false, offset: ScrollLogicalPosition = 'start') {
    if (openProof) setProofOpen(true);
    // wait one frame so the collapsed panel is in the DOM before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: offset });
      });
    });
  }

  function openSourceEvidence() {
    setSessionsOpen(true);
    scrollToRef(sessionsRef, false, 'center');
  }

  function openDeltaEvidence() {
    setSessionsOpen(true);
    scrollToRef(deltaProofRef, true, 'start');
  }


  // ---- invalid / loading / not-found shells -------------------------------
  if (!isHexHash && !mockReceipt) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-sm text-muted-foreground">
        That verification link is invalid. Receipt hashes are 64-character SHA-256 hex.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/60 p-10 text-center text-sm text-muted-foreground">
        Loading receipt…
      </div>
    );
  }
  if (!data?.found) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center text-sm text-muted-foreground">
        No mint found with this receipt hash.
      </div>
    );
  }

  return (
    <div className="rounded-[32px] overflow-hidden border border-border/60 bg-card/80 shadow-2xl shadow-eco/5 backdrop-blur-sm">
      {/* ============== PROOF-OF-AUTHENTICITY HEADER (V1 carryover) ============== */}
      <div className="relative px-5 py-3 bg-gradient-to-r from-eco/15 via-primary/10 to-accent-cool/15 border-b border-border/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-background/70 border border-eco/30 flex items-center justify-center shrink-0 shadow-inner">
          <Fingerprint className="h-4.5 w-4.5 text-eco" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
            Proof-of-Authenticity
          </div>
          <div className="text-xs font-semibold text-foreground/90 truncate">
            Cryptographically signed · Anchored on Base
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 text-eco shrink-0" />
      </div>

      {/* ============== HERO ============== */}
      <div className="relative px-6 pt-6 pb-6 text-center overflow-hidden">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-eco/15 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        {/* ============== PoA SEAL — moved to top so it reads as the notary mark ============== */}
        {data.chain_hash && data.created_at && (
          <div className="relative flex justify-center mb-4">
            <ProofOfAuthenticityStamp
              poaHashShort={data.chain_hash.slice(0, 7)}
              poaHashFull={data.chain_hash}
              issuedAt={data.created_at}
              variant="stamp"
            />
          </div>
        )}

        <Badge
          variant="outline"
          className="relative border-eco/40 bg-eco/10 text-eco text-[10px] uppercase tracking-[0.18em] font-semibold gap-1.5"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-eco opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-eco" />
          </span>
          Mint Verified
        </Badge>

        <h1 className="relative mt-4 text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-eco via-primary to-accent-cool bg-clip-text text-transparent leading-none">
          {fmt(stats.tokens, stats.tokens >= 100 ? 0 : 2)}
        </h1>
        <p className="relative mt-1 text-base font-medium text-muted-foreground">$ZSOLAR Minted</p>

        {/*
          Single-source "Minted from <X>" pill — ONLY render when there is
          exactly one source row. With multiple sources the pill below
          (`MintedForBadge`) lists them all; the single pill was miscrediting
          multi-source mints to whichever source sorted first (usually Solar).
        */}
        {sourceRows.length === 1 && (() => {
          const TopIcon = sourceRows[0].Icon;
          return (
            <div className="relative mt-3 flex justify-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border ${sourceRows[0].ringClass}`}>
                <TopIcon className={`h-3.5 w-3.5 ${sourceRows[0].accentClass}`} />
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
                  Minted from
                </span>
                <span className={`text-xs font-bold ${sourceRows[0].accentClass}`}>
                  {sourceRows[0].label}
                </span>
              </div>
            </div>
          );
        })()}

        {impact && (
          <div className="relative mt-7">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 font-semibold">
              {impact.label}
            </div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {impact.value}
              {impact.unit && (
                <span className="text-muted-foreground font-normal"> {impact.unit}</span>
              )}
            </div>
            {impact.sub && (
              <p className="mt-1 text-xs text-muted-foreground italic">{impact.sub}</p>
            )}
          </div>
        )}

        {data.chain_hash && (
          <div className="relative mt-4">
            <MintedForBadge chainHash={data.chain_hash} className="justify-center" mockResponse={mockSourceLines} />
          </div>
        )}
      </div>


      {/* ============== TM PROOF BADGE STRIP — tap to jump to evidence ============== */}
      <div className="px-6 pb-6">
        <div className="text-center pb-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
            Tap a badge to verify
          </span>
        </div>
        <div className="flex justify-between gap-2 bg-muted/40 p-3 rounded-2xl border border-border/40">
          <TmBadge
            Icon={MapPin} label="Origin" tint="primary" active
            onClick={openSourceEvidence}
            title="Open device watermark evidence for Proof-of-Origin"
          />
          <TmBadge
            Icon={Sparkles} label="Delta" tint="eco" active
            onClick={openDeltaEvidence}
            title="Open individual sessions for Proof-of-Delta"
          />
          <TmBadge
            Icon={Fingerprint} label="Authentic" tint="accent-cool" active
            onClick={() => scrollToRef(verifyRef, true)}
            title="Open cryptographic verification details"
          />
        </div>
      </div>



      {/* ============== CONTRIBUTING SESSIONS (Proof-of-Delta + Proof-of-Origin) ============== */}
      <div ref={sessionsRef} className="px-6 pb-6 space-y-3 scroll-mt-4">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            Contributing Sessions
          </h3>
          {sourceRows.length > 1 && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Tap a source to expand
            </span>
          )}
        </div>

        {sourceRows.length > 0 && sourceRows.map((row) => {
          const Icon = row.Icon;
          /**
           * deltaRows = number of per-reading rows this receipt can actually
           * produce for this source. Zero means the mint came from a counter
           * delta with no listable readings — the VERIFIED DELTA badge and the
           * "View sessions" control both stay hidden rather than claim rows
           * that do not exist.
           */
          const deltaRows = row.lineSources.reduce((s, k) => s + (lineCounts?.[k] ?? 0), 0);
          const expandable = deltaRows > 0 && !!data.chain_hash;
          const isOpen = expandedSourceKey === row.key;
          const toggle = () =>
            setExpandedSourceKey((cur) => (cur === row.key ? null : row.key));

          return (
            <div
              key={row.key}
              className={`bg-muted/40 rounded-2xl border overflow-hidden transition-colors ${
                isOpen ? 'border-primary/40' : 'border-border/40'
              }`}
            >
              <button
                type="button"
                onClick={expandable ? toggle : undefined}
                disabled={!expandable}
                aria-expanded={isOpen}
                aria-controls={`pog-source-${row.key}`}
                className={`w-full p-4 flex items-center gap-4 text-left ${
                  expandable ? 'active:bg-muted/60 touch-manipulation' : 'cursor-default'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center border ${row.ringClass} shrink-0`}>
                  <Icon className={`h-5 w-5 ${row.accentClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1 gap-2 flex-wrap">
                    <p className="text-sm font-semibold leading-tight break-words">{row.label}</p>
                    <p className={`text-sm font-bold tabular-nums whitespace-nowrap ${row.accentClass}`}>
                      {row.amount}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-md">
                      <MapPin className="w-2.5 h-2.5 text-primary" />
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Verified Origin</span>
                    </div>
                    {deltaRows > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-eco/10 rounded-md">
                        <Award className="w-2.5 h-2.5 text-eco" />
                        <span className="text-[9px] font-bold text-eco uppercase tracking-wider">Verified Delta</span>
                      </div>
                    )}
                    {expandable && (
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider underline underline-offset-2 decoration-dotted">
                        {isOpen ? 'Hide sessions' : 'View sessions'}
                      </span>
                    )}
                    {!expandable && (
                      <span className="text-[9px] font-semibold text-muted-foreground/80 italic">
                        {row.key === 'ev_miles'
                          ? 'Odometer snapshot · no per-trip rows'
                          : 'Counter reading · no per-session rows attributed'}
                      </span>
                    )}
                  </div>
                </div>
                {expandable && (
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </button>

              {expandable && isOpen && (
                <div
                  id={`pog-source-${row.key}`}
                  className="px-4 pb-4 pt-1 border-t border-border/40 bg-background/30"
                >
                  <ReceiptSourceLines
                    chainHash={data.chain_hash!}
                    sourceFilter={row.lineSources}
                    embedded
                    mockResponse={mockSourceLines}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>





      {/* ============== VERIFICATION DETAILS (collapsed) ============== */}
      <div ref={verifyRef} className="border-t border-border/40 scroll-mt-4">
        <button
          type="button"
          onClick={() => setProofOpen((v) => !v)}
          aria-expanded={proofOpen}
          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/40 active:bg-muted/60 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">Verification details</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.16em] mt-0.5">
                Hashes · Merkle root · Basescan
              </div>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${proofOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {proofOpen && (
          <div className="px-4 sm:px-6 pb-6 pt-1 space-y-3">
            {/* compact at-a-glance metadata strip before the deep panel */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 grid grid-cols-2 gap-3 text-[11px]">
              <Meta label="Receipt #" value={`${data.chain_seq ?? '—'}`} />
              <Meta label="Status" value={data.status ?? '—'} />
              <Meta label="Block" value={data.block_number ?? 'Pending'} />
              <Meta
                label="Minted at"
                value={data.created_at
                  ? new Date(data.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                  : '—'}
              />
              {data.tx_hash && (
                <Meta
                  label="Tx"
                  value={`${data.tx_hash.slice(0, 8)}…${data.tx_hash.slice(-6)}`}
                  mono
                />
              )}
              <Meta label="Wallet" value="0x••…" mono />
            </div>

            <TamperEvidentProofPanel
              chainHash={poa!}
              txHashFallback={data.tx_hash ?? null}
              variant="standalone"
              showSourceLines={false}
            />

            {/* Per-session line items (device-signed events with fingerprints) */}
            {data.chain_hash && (
              <div ref={deltaProofRef} className="scroll-mt-4">
                <ReceiptSourceLines
                  chainHash={data.chain_hash}
                  open={sessionsOpen}
                  onOpenChange={setSessionsOpen}
                  mockResponse={mockSourceLines}
                />
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic text-center pt-1">
              Patent-pending. App. 19/634,402.
            </p>
          </div>
        )}
      </div>

      {/* Brand gradient hairline footer */}
      <div className="h-1 w-full bg-gradient-to-r from-eco via-primary to-accent-cool" />
    </div>
  );
}

/**
 * Compact 4-up Trademark proof badge.
 * Uses semantic tokens so dark/light/branded themes stay consistent.
 */
function TmBadge({
  Icon, label, tint, active, onClick, title,
}: {
  Icon: typeof Sparkles;
  label: string;
  tint: 'primary' | 'eco' | 'accent-cool' | 'accent-warm';
  active: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const tintMap: Record<typeof tint, { bg: string; text: string; ring: string; hover: string }> = {
    primary:       { bg: 'bg-primary/15',      text: 'text-primary',      ring: 'border-primary/30',      hover: 'hover:bg-primary/25' },
    eco:           { bg: 'bg-eco/15',          text: 'text-eco',          ring: 'border-eco/30',          hover: 'hover:bg-eco/25' },
    'accent-cool': { bg: 'bg-accent-cool/15',  text: 'text-accent-cool',  ring: 'border-accent-cool/30',  hover: 'hover:bg-accent-cool/25' },
    'accent-warm': { bg: 'bg-accent-warm/15',  text: 'text-accent-warm',  ring: 'border-accent-warm/30',  hover: 'hover:bg-accent-warm/25' },
  };
  const t = tintMap[tint];
  const clickable = active && !!onClick;
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={title}
      aria-label={title ?? label}
      className={`group flex flex-col items-center gap-1.5 flex-1 rounded-lg p-1 -m-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? '' : 'opacity-50 grayscale cursor-not-allowed'} ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl ${t.bg} border ${t.ring} flex items-center justify-center transition-colors ${clickable ? t.hover : ''}`}>
        <Icon className={`h-4 w-4 ${t.text}`} />
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-tight ${active ? t.text : 'text-muted-foreground'} ${clickable ? 'underline underline-offset-2 decoration-dotted' : ''}`}>
        {label}
      </span>
    </button>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{label}</div>
      <div className={`text-[12px] font-semibold text-foreground/90 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}

// kept for backwards-compat with the StatTile import in older callers
export {};
