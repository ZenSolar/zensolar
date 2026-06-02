import { AlertCircle, Info, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOemDiagnostics } from '@/hooks/useOemDiagnostics';

/**
 * Friendly banner shown above the dashboard / energy-sources card when Deason
 * has detected OEM connection issues (expired tokens, conflicting sources,
 * Tesla-vehicle + home-charger overlap).
 *
 * Tone: calm, customer-service. Never an error state for routine info finds.
 */
export function OemDiagnosticsBanner() {
  const { diagnostics, loading } = useOemDiagnostics();
  if (loading || diagnostics.length === 0) return null;

  return (
    <div className="space-y-2">
      {diagnostics.map((d, i) => {
        const isWarn = d.severity === 'warn' || d.severity === 'error';
        const Icon = isWarn ? AlertCircle : Info;
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
          </div>
        );
      })}
    </div>
  );
}
