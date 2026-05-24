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
import { ChevronDown, ChevronUp, Fingerprint, ListTree } from 'lucide-react';
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
};

type ApiResponse = {
  found: boolean;
  line_count?: number;
  window_start?: string;
  window_end?: string;
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

interface Props {
  chainHash?: string | null;
  /** Compact = collapsed by default. Standalone = open. */
  defaultOpen?: boolean;
  className?: string;
}

export function ReceiptSourceLines({ chainHash, defaultOpen = false, className }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  const cleanHash = chainHash?.replace(/^0x/, '').toLowerCase() ?? null;
  const isHexHash = !!cleanHash && /^[a-f0-9]{64}$/i.test(cleanHash);

  useEffect(() => {
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
  }, [cleanHash, isHexHash]);

  if (loading || !data?.found || !data.lines || data.lines.length === 0) {
    return null;
  }

  const lines = data.lines;
  const visible = showAll ? lines : lines.slice(0, 8);
  const totalKwh = lines.reduce((sum, l) => sum + (Number(l.kwh) || 0), 0);

  return (
    <Card className={cn('border-border/60', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        </CardContent>
      )}
    </Card>
  );
}
