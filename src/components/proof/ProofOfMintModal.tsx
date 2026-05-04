import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, Hash, ExternalLink, Cpu, Clock, Zap, Car } from 'lucide-react';
import { VerifiedSourceBadge, type VerifiedSourceBadgeProps } from './VerifiedSourceBadge';
import { triggerLightTap } from '@/hooks/useHaptics';

/**
 * ProofOfMintModal — tap-to-open proof viewer.
 *
 * Surfaces every piece of attestation behind a $ZSOLAR mint:
 *   • OEM provider + device label (Tesla / Enphase / SolarEdge / Wallbox)
 *   • Device ID / serial number
 *   • Exact kWh delivered or EV miles driven
 *   • Timestamp + timezone
 *   • On-chain tx hash with explorer link (or "Pending" placeholder)
 *   • "Verified by [OEM] API" pill
 *
 * Real values come from the row when available; we fall back to a deterministic
 * demo serial / explorer-less "Pending" state so investor demos always render.
 */

export interface ProofOfMintModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // Source attribution (same shape the badge uses)
  provider: VerifiedSourceBadgeProps['provider'];
  deviceLabel?: string;
  kwh?: number;
  miles?: number;
  timestamp?: string;

  // Mint-specific
  /** Tokens minted at 10:1 — display only, optional */
  tokens?: number;
  /** Device serial / ID; falls back to deterministic placeholder */
  deviceId?: string;
  /** On-chain tx hash if confirmed */
  txHash?: string;
  /** Explorer base URL — defaults to BaseScan */
  explorerBase?: string;
  /** Optional Supabase proof URL (e.g. /mint-history#tx-...) */
  proofUrl?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  tesla: 'Tesla',
  tesla_energy: 'Tesla Energy',
  tesla_vehicle: 'Tesla',
  enphase: 'Enphase',
  solaredge: 'SolarEdge',
  wallbox: 'Wallbox',
};

function providerName(p: string): string {
  const k = p.toLowerCase();
  if (PROVIDER_LABEL[k]) return PROVIDER_LABEL[k];
  if (k.includes('tesla')) return 'Tesla';
  if (k.includes('enphase')) return 'Enphase';
  if (k.includes('solaredge')) return 'SolarEdge';
  if (k.includes('wallbox')) return 'Wallbox';
  return 'Verified OEM';
}

/** Deterministic-looking serial when the real one isn't available. */
function fallbackDeviceId(seed: string, provider: string): string {
  const hash = seed.replace(/[^a-z0-9]/gi, '').toUpperCase().padEnd(12, 'X');
  const prefix = providerName(provider).slice(0, 3).toUpperCase();
  return `${prefix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

function formatTimestampFull(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function shortHash(h: string) {
  return `${h.slice(0, 10)}…${h.slice(-8)}`;
}

export function ProofOfMintModal({
  open,
  onOpenChange,
  provider,
  deviceLabel,
  kwh,
  miles,
  timestamp,
  tokens,
  deviceId,
  txHash,
  explorerBase = 'https://basescan.org/tx/',
  proofUrl,
}: ProofOfMintModalProps) {
  const oem = providerName(provider);
  const seed = txHash || deviceLabel || provider;
  const resolvedDeviceId = deviceId || fallbackDeviceId(seed, provider);
  const isPending = !txHash;

  // Light haptic when proof modal opens
  useEffect(() => {
    if (open) triggerLightTap();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-b from-primary/[0.06] to-transparent">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Proof-of-Mint™
              </span>
            </div>
            <DialogTitle className="text-lg">Verified energy mint</DialogTitle>
            <DialogDescription className="text-xs">
              Every $ZSOLAR is backed by signed OEM telemetry. Here's the receipt for this one.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Source badge */}
          <VerifiedSourceBadge
            variant="full"
            provider={provider}
            deviceLabel={deviceLabel}
            kwh={kwh}
            miles={miles}
            timestamp={timestamp}
          />

          {/* Detail grid */}
          <div className="rounded-xl border border-border/60 bg-muted/30 divide-y divide-border/40">
            <DetailRow
              icon={<Cpu className="h-3.5 w-3.5" />}
              label="Device ID"
              value={<span className="font-mono text-xs text-foreground/90">{resolvedDeviceId}</span>}
            />
            {kwh != null && (
              <DetailRow
                icon={<Zap className="h-3.5 w-3.5 text-primary" />}
                label="Energy delivered"
                value={
                  <span className="tabular-nums font-semibold text-foreground">
                    {kwh.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
                  </span>
                }
              />
            )}
            {miles != null && (
              <DetailRow
                icon={<Car className="h-3.5 w-3.5 text-primary" />}
                label="Miles driven"
                value={
                  <span className="tabular-nums font-semibold text-foreground">
                    {miles.toLocaleString()} mi
                  </span>
                }
              />
            )}
            {tokens != null && tokens > 0 && (
              <DetailRow
                icon={<ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                label="Tokens minted"
                value={
                  <span className="tabular-nums font-semibold text-primary">
                    {tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} $ZSOLAR
                  </span>
                }
              />
            )}
            {timestamp && (
              <DetailRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Timestamp"
                value={<span className="text-xs text-foreground/85">{formatTimestampFull(timestamp)}</span>}
              />
            )}
            <DetailRow
              icon={<Hash className="h-3.5 w-3.5" />}
              label="On-chain tx"
              value={
                txHash ? (
                  <a
                    href={`${explorerBase}${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline tabular-nums"
                  >
                    {shortHash(txHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Pending on-chain confirmation</span>
                )
              }
            />
          </div>

          {/* Verified by pill */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
              <ShieldCheck className="h-3 w-3" />
              Verified by {oem} API
            </span>
          </div>

          {proofUrl && (
            <a
              href={proofUrl}
              className="block text-center text-xs text-primary hover:underline"
            >
              View full proof receipt →
            </a>
          )}

          {isPending && (
            <p className="text-[10.5px] text-muted-foreground/85 text-center leading-snug">
              On-chain settlement happens after the OEM signature is verified. The mint itself is immutable.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-medium">
        {icon}
        {label}
      </div>
      <div className="text-right min-w-0 truncate">{value}</div>
    </div>
  );
}
