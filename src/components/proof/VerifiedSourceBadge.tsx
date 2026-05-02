import { ShieldCheck, Sun, Battery, Car, Zap, Clock } from 'lucide-react';
import teslaIcon from '@/assets/logos/tesla-t-icon.svg';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.svg';
import wallboxLogo from '@/assets/logos/wallbox-icon.svg';

/**
 * VerifiedSourceBadge — Proof-of-Origin attribution chip.
 *
 * Surfaces the verified energy delivery behind a $ZSOLAR mint:
 *   • OEM source (Tesla / Enphase / SolarEdge / Wallbox)
 *   • Energy delivered (kWh) and/or miles driven
 *   • Timestamp of the verified delivery
 *
 * Renders in two variants:
 *   • "compact" — single-line chip for feeds, list rows, cinematic finale
 *   • "full"    — header card for the Proof-of-Genesis Receipt
 *
 * The badge is the visual proof that ZenSolar mints are NOT speculative —
 * every $ZSOLAR is backed by signed OEM telemetry from a verified clean
 * energy delivery (Proof-of-Origin™).
 */

export type VerifiedSourceProvider =
  | 'tesla'
  | 'tesla_energy'
  | 'tesla_vehicle'
  | 'enphase'
  | 'solaredge'
  | 'wallbox'
  | 'unknown';

export interface VerifiedSourceBadgeProps {
  provider: VerifiedSourceProvider | string;
  /** Display name of the device (e.g. "Powerwall 3", "Model Y", "IQ8 Microinverter") */
  deviceLabel?: string;
  /** kWh delivered for this mint event */
  kwh?: number;
  /** Optional miles (EV charging mints) */
  miles?: number;
  /** ISO timestamp of the verified delivery */
  timestamp?: string;
  /** Visual variant — compact (chip) or full (header card) */
  variant?: 'compact' | 'full';
  /** Optional className for layout overrides */
  className?: string;
  /** Show a "Live" pulse dot for real on-chain mints */
  isLive?: boolean;
  /** When provided, the badge becomes a tappable button (opens Proof-of-Mint modal). */
  onClick?: () => void;
}

type ProviderMeta = {
  label: string;
  logo?: string;
  icon: typeof Sun;
  accent: string;
  bg: string;
  border: string;
  defaultDevice: string;
};

const PROVIDER_META: Record<string, ProviderMeta> = {
  tesla: {
    label: 'Tesla',
    logo: teslaIcon,
    icon: Battery,
    accent: 'text-foreground',
    bg: 'bg-foreground/5',
    border: 'border-foreground/20',
    defaultDevice: 'Powerwall',
  },
  tesla_energy: {
    label: 'Tesla Energy',
    logo: teslaIcon,
    icon: Battery,
    accent: 'text-foreground',
    bg: 'bg-foreground/5',
    border: 'border-foreground/20',
    defaultDevice: 'Powerwall 3',
  },
  tesla_vehicle: {
    label: 'Tesla',
    logo: teslaIcon,
    icon: Car,
    accent: 'text-foreground',
    bg: 'bg-foreground/5',
    border: 'border-foreground/20',
    defaultDevice: 'Model Y',
  },
  enphase: {
    label: 'Enphase',
    logo: enphaseLogo,
    icon: Sun,
    accent: 'text-energy',
    bg: 'bg-energy/10',
    border: 'border-energy/30',
    defaultDevice: 'IQ8 Microinverters',
  },
  solaredge: {
    label: 'SolarEdge',
    logo: solaredgeLogo,
    icon: Sun,
    accent: 'text-energy',
    bg: 'bg-energy/10',
    border: 'border-energy/30',
    defaultDevice: 'Inverter',
  },
  wallbox: {
    label: 'Wallbox',
    logo: wallboxLogo,
    icon: Zap,
    accent: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    defaultDevice: 'Pulsar Plus',
  },
  unknown: {
    label: 'Verified OEM',
    icon: ShieldCheck,
    accent: 'text-muted-foreground',
    bg: 'bg-muted/40',
    border: 'border-border',
    defaultDevice: 'Connected device',
  },
};

function resolveProvider(provider: string): ProviderMeta {
  const key = provider.toLowerCase();
  if (PROVIDER_META[key]) return PROVIDER_META[key];
  // Fuzzy match common variants from device_id / provider strings
  if (key.includes('tesla') && key.includes('vehicle')) return PROVIDER_META.tesla_vehicle;
  if (key.includes('tesla') && (key.includes('energy') || key.includes('powerwall'))) return PROVIDER_META.tesla_energy;
  if (key.includes('tesla')) return PROVIDER_META.tesla;
  if (key.includes('enphase')) return PROVIDER_META.enphase;
  if (key.includes('solaredge') || key.includes('solar-edge')) return PROVIDER_META.solaredge;
  if (key.includes('wallbox')) return PROVIDER_META.wallbox;
  return PROVIDER_META.unknown;
}

function formatKwh(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatTimestamp(iso: string, mode: 'compact' | 'full') {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (mode === 'compact') {
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function VerifiedSourceBadge({
  provider,
  deviceLabel,
  kwh,
  miles,
  timestamp,
  variant = 'compact',
  className = '',
  isLive = false,
  onClick,
}: VerifiedSourceBadgeProps) {
  const meta = resolveProvider(provider);
  const Icon = meta.icon;
  const device = deviceLabel || meta.defaultDevice;
  const interactive = typeof onClick === 'function';

  if (variant === 'compact') {
    const Tag: any = interactive ? 'button' : 'div';
    return (
      <Tag
        type={interactive ? 'button' : undefined}
        onClick={interactive ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onClick!(); } : undefined}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${meta.border} ${meta.bg} text-[10.5px] sm:text-[11px] leading-none ${interactive ? 'cursor-pointer hover:bg-foreground/10 hover:border-primary/40 active:scale-[0.98] transition-all touch-manipulation' : ''} ${className}`}
        aria-label={`${interactive ? 'View proof — ' : 'Verified source: '}${meta.label} ${device}${kwh ? `, ${formatKwh(kwh)} kWh` : ''}${timestamp ? `, ${formatTimestamp(timestamp, 'compact')}` : ''}`}
      >
        {isLive && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" aria-hidden />
        )}
        {meta.logo ? (
          <img
            src={meta.logo}
            alt=""
            aria-hidden
            className="h-3 w-3 sm:h-3.5 sm:w-3.5 object-contain shrink-0"
          />
        ) : (
          <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${meta.accent} shrink-0`} aria-hidden />
        )}
        <span className="font-semibold text-foreground/90 truncate">{meta.label}</span>
        <span className="text-muted-foreground/70">·</span>
        <span className="text-foreground/75 truncate">{device}</span>
        {(kwh != null || miles != null) && (
          <>
            <span className="text-muted-foreground/70">·</span>
            <span className="tabular-nums font-medium text-foreground/90">
              {miles != null ? `${miles.toLocaleString()} mi` : `${formatKwh(kwh!)} kWh`}
            </span>
          </>
        )}
        {timestamp && (
          <>
            <span className="text-muted-foreground/70 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-muted-foreground tabular-nums">
              {formatTimestamp(timestamp, 'compact')}
            </span>
          </>
        )}
      </Tag>
    );
  }

  // Full variant — header card
  return (
    <div
      className={`rounded-xl border ${meta.border} ${meta.bg} p-3 sm:p-4 ${className}`}
      aria-label={`Proof of Origin: verified by ${meta.label} ${device}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 h-11 w-11 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center overflow-hidden`}>
          {meta.logo ? (
            <img src={meta.logo} alt="" aria-hidden className="h-7 w-7 object-contain" />
          ) : (
            <Icon className={`h-5 w-5 ${meta.accent}`} aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
            <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-primary">
              Proof-of-Origin™ — Verified Source
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold text-foreground truncate">
            {meta.label} <span className="text-foreground/70 font-medium">· {device}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            {kwh != null && (
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <Zap className="h-3 w-3 text-primary" aria-hidden />
                <span className="tabular-nums font-semibold">{formatKwh(kwh)}</span>
                <span>kWh delivered</span>
              </span>
            )}
            {miles != null && (
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <Car className="h-3 w-3 text-primary" aria-hidden />
                <span className="tabular-nums font-semibold">{miles.toLocaleString()}</span>
                <span>mi driven</span>
              </span>
            )}
            {timestamp && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                <span className="tabular-nums">{formatTimestamp(timestamp, 'full')}</span>
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[10.5px] text-muted-foreground/85 leading-snug">
            This $ZSOLAR was minted from cryptographically signed OEM telemetry — not a balance entry.
            The energy was delivered first, then the token was issued.
          </p>
        </div>
      </div>
    </div>
  );
}
