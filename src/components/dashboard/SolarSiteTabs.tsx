/**
 * v5 — Compact multi-PV site selector for the Live Energy card.
 *
 * Renders a horizontal segmented control above the scene whenever the
 * user has more than one connected PV system. Single-site users see
 * nothing (component returns null). Style matches the existing card
 * pill aesthetic (rounded-full, primary-tinted).
 */
import type { CachedTelemetry } from '@/hooks/useDeviceTelemetry';

export interface SolarSiteTabsProps {
  sites: CachedTelemetry[];
  activeSiteId: string | null;
  onSelect: (siteId: string) => void;
  className?: string;
}

function siteLabel(t: CachedTelemetry, idx: number): string {
  if (t.device_name) return t.device_name;
  const oem = t.oem.charAt(0).toUpperCase() + t.oem.slice(1);
  return `${oem} #${idx + 1}`;
}

export function SolarSiteTabs({ sites, activeSiteId, onSelect, className }: SolarSiteTabsProps) {
  if (!sites || sites.length <= 1) return null;
  return (
    <div
      role="tablist"
      aria-label="Solar systems"
      className={`mb-3 flex items-center gap-1 overflow-x-auto rounded-full border border-primary/15 bg-background/40 p-1 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] ${className ?? ''}`}
    >
      {sites.map((s, i) => {
        const active = (activeSiteId ?? sites[0]?.site_id) === s.site_id;
        return (
          <button
            key={`${s.oem}-${s.site_id}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(s.site_id)}
            className={[
              'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
              active
                ? 'bg-primary/20 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {siteLabel(s, i)}
          </button>
        );
      })}
    </div>
  );
}
