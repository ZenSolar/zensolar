import { AlertCircle, Info, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOemDiagnostics } from '@/hooks/useOemDiagnostics';
import { useDismissedDiagnostics } from '@/hooks/useDismissedDiagnostics';

/**
 * Friendly banner shown above the dashboard / energy-sources card when Deason
 * has detected OEM connection issues (expired tokens, conflicting sources,
 * Tesla-vehicle + home-charger overlap).
 *
 * Tone: calm, customer-service. Never an error state for routine info finds.
 *
 * Info-severity diagnostics are dismissable (per-user, per-device via
 * localStorage). Warn/error diagnostics stay non-dismissable — they need
 * action, not acknowledgment.
 */
export function OemDiagnosticsBanner() {
  const { diagnostics, loading } = useOemDiagnostics();
  const { isDismissed, dismiss } = useDismissedDiagnostics();

  if (loading) return null;

  const visible = diagnostics.filter((d) => !(d.severity === 'info' && isDismissed(d.key)));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((d, i) => {
        const isWarn = d.severity === 'warn' || d.severity === 'error';
        const Icon = isWarn ? AlertCircle : Info;
        const dismissable = d.severity === 'info';
        return (
          <div
            key={`${d.key}-${i}`}
            className={`rounded-xl border p-3 flex items-start gap-3 ${
              isWarn
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-primary/20 bg-primary/5'
            }`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isWarn ? 'text-amber-400' : 'text-primary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{d.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{d.detail}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {d.cta && (
                  <Link
                    to={d.cta.href}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    {d.cta.label} →
                  </Link>
                )}
                <Link
                  to={`/deason?topic=oem&provider=${encodeURIComponent(d.provider)}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3 w-3" />
                  Ask Deason
                </Link>
              </div>
            </div>
            {dismissable && (
              <button
                type="button"
                onClick={() => dismiss(d.key)}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 -m-1 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
