/**
 * ReceiptSourceLines
 * ------------------
 * Phase 1 of Proof-of-Delta line-item attribution.
 *
 * Renders the raw energy events that fall inside this mint's settlement
 * window (previous mint → this mint) for the same user. Each row carries:
 *   - source type (supercharger, home_charger, solar, bidir_*)
 *   - cryptographic event_fingerprint (already enforced UNIQUE on raw tables)
 *   - kWh value
 *   - occurred_at timestamp
 *
 * Public/anon-safe: served by get_mint_source_lines() which strips
 * wallet, device_id, location, and session metadata.
 *
 * Phase 2 (parked): snapshot leaves at mint time into mint_receipt_line_items
 * so source edits/deletes can't break historical receipts.
 * Phase 3 (parked): roll each fingerprint into the Merkle leaf set anchored
 * on Base so inclusion can be proven per-session, not just per-mint.
 *
 * Both parked items are tracked on /proof-of-genesis/mainnet-readiness.
 */
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Fingerprint, ListTree, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Line = {
  source: string;
  fingerprint: string;
  kwh: number;
  occurred_at: string;
  provider?: string | null;
  device_watermark?: string | null;
};

type ApiResponse = {
  found: boolean;
  line_count?: number;
  window_start?: string;
  window_end?: string;
  attributed_sources?: string[];
  lines?: Line[];
};

const SOURCE_META: Record<string, { label: string; tone: string }> = {
  supercharger:    { label: 'Tesla Supercharging', tone: 'text-red-400 border-red-400/40' },
  home_charger:    { label: 'Home Charging',       tone: 'text-sky-400 border-sky-400/40' },
  solar:           { label: 'Solar Production',    tone: 'text-amber-400 border-amber-400/40' },
  bidir_export:    { label: 'Battery Export (V2G)',tone: 'text-fuchsia-400 border-fuchsia-400/40' },
  bidir_import:    { label: 'Grid Import',         tone: 'text-muted-foreground border-border' },
};

function metaFor(source: string) {
  return SOURCE_META[source] ?? { label: source, tone: 'text-muted-foreground border-border' };
}

/**
 * MintedForBadge — renders the source types this mint actually attributed
 * tokens to. Driven by the same `attributed_sources` array returned from
 * get_mint_source_lines so the receipt header and line-items always agree.
 *
 * Why this exists: a user complained that a Supercharging-only mint receipt
 * appeared to list Solar Production too, because background solar polling
 * had rows in the same time window. The RPC now filters those out, and this
 * badge makes the actual attribution explicit at the top of the receipt.
 */
export function MintedForBadge({
  chainHash,
  className,
  mockResponse,
}: {
  chainHash?: string | null;
  className?: string;
  mockResponse?: ApiResponse;
}) {
  const [sources, setSources] = useState<string[] | null>(mockResponse?.attributed_sources ?? null);
  const cleanHash = chainHash?.replace(/^0x/, '').toLowerCase() ?? null;
  const isHexHash = !!cleanHash && /^[a-f0-9]{64}$/i.test(cleanHash);

  useEffect(() => {
    if (mockResponse) { setSources(mockResponse.attributed_sources ?? null); return; }
    let cancelled = false;
    (async () => {
      if (!isHexHash) return;
      const { data, error } = await supabase.rpc('get_mint_source_lines', { _chain_hash: cleanHash! });
      if (cancelled || error || !data) return;
      const resp = data as ApiResponse;
      setSources(resp.attributed_sources ?? null);
    })();
    return () => { cancelled = true; };
  }, [cleanHash, isHexHash, mockResponse]);

  if (!sources || sources.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Minted for
      </span>
      {sources.map((s) => {
        const m = metaFor(s);
        return (
          <Badge key={s} variant="outline" className={cn('text-[11px] font-semibold', m.tone)}>
            {m.label}
          </Badge>
        );
      })}
    </div>
  );
}

interface Props {
  chainHash?: string | null;
  /** Compact = collapsed by default. Standalone = open. Ignored if `open` is provided. */
  defaultOpen?: boolean;
  /** Controlled open state (overrides internal state when provided). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Restrict lines to specific source keys (e.g. ['supercharger']). */
  sourceFilter?: string[];
  /**
   * Embedded mode: skip the outer Card/header chevron and render the list
   * inline. Used when a parent row already owns the expand/collapse affordance.
   */
  embedded?: boolean;
  /** Mock data bypass — when provided, skips the RPC call. */
  mockResponse?: ApiResponse;
}

export function ReceiptSourceLines({
  chainHash,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  sourceFilter,
  embedded = false,
  mockResponse,
}: Props) {
  const [data, setData] = useState<ApiResponse | null>(mockResponse ?? null);
  const [loading, setLoading] = useState(!mockResponse);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [showAll, setShowAll] = useState(false);

  const cleanHash = chainHash?.replace(/^0x/, '').toLowerCase() ?? null;
  const isHexHash = !!cleanHash && /^[a-f0-9]{64}$/i.test(cleanHash);

  useEffect(() => {
    if (mockResponse) { setData(mockResponse); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      if (!isHexHash) { setLoading(false); return; }
      const { data: rpcData, error } = await supabase.rpc('get_mint_source_lines', {
        _chain_hash: cleanHash!,
      });
      if (cancelled) return;
      if (error || !rpcData) { setLoading(false); return; }
      setData(rpcData as ApiResponse);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [cleanHash, isHexHash, mockResponse]);

  if (loading || !data?.found || !data.lines || data.lines.length === 0) {
    return null;
  }

  const allLines = data.lines;
  const lines = sourceFilter && sourceFilter.length > 0
    ? allLines.filter((l) => sourceFilter.includes(l.source))
    : allLines;

  if (lines.length === 0) return null;

  const visible = showAll ? lines : lines.slice(0, 8);
  const totalKwh = lines.reduce((sum, l) => sum + (Number(l.kwh) || 0), 0);

  // ----- Line list body (shared between embedded + card variants) -----
  const linesList = (
    <>
      <p className="text-[11px] text-muted-foreground leading-snug">
        Every line below is an individual device-signed energy event that rolled into this mint.
        Fingerprints are SHA-derived from the raw row and enforced unique at the database level,
        so the same session can never be double-counted.
      </p>

      {data.window_start && data.window_end && (
        <div className="text-[10px] text-muted-foreground/80 font-mono">
          Window: {new Date(data.window_start).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          {' → '}
          {new Date(data.window_end).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      )}

      <ul className="divide-y divide-border/40 rounded-lg border border-border/40 bg-muted/10">
        {visible.map((line) => {
          const meta = metaFor(line.source);
          return (
            <li key={line.fingerprint} className="p-2.5 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-[10px]', meta.tone)}>
                  {meta.label}
                </Badge>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {Number(line.kwh).toFixed(2)} kWh
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {new Date(line.occurred_at).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              {(line.provider || line.device_watermark) && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 shrink-0 text-eco" />
                  <span className="font-semibold uppercase tracking-wide text-foreground/80">
                    {line.provider ?? 'device'}
                  </span>
                  {line.device_watermark && (
                    <span
                      className="font-mono text-foreground/70"
                      title={`On-chain device watermark · ${line.device_watermark}`}
                    >
                      · wm:{line.device_watermark}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <Fingerprint className="h-3 w-3 shrink-0" />
                <span className="truncate" title={line.fingerprint}>{line.fingerprint}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {lines.length > 8 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Show fewer' : `Show all ${lines.length} events`}
        </Button>
      )}
    </>
  );

  if (embedded) {
    return <div className={cn('space-y-2', className)}>{linesList}</div>;
  }

  return (
    <Card className={cn('border-border/60', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center gap-2 text-left hover:bg-muted/30 transition-colors rounded-t-xl"
        aria-expanded={open}
      >
        <ListTree className="h-4 w-4 text-primary" />
        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary uppercase tracking-[0.14em]">
          Proof-of-Delta™ · Sources
        </Badge>
        <span className="text-xs text-muted-foreground ml-1">
          {lines.length} event{lines.length === 1 ? '' : 's'} · {totalKwh.toFixed(2)} kWh
        </span>
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <CardContent className="pt-0 pb-3 space-y-2">
          {linesList}
        </CardContent>
      )}
    </Card>
  );
}
