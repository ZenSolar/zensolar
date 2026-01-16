import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface WatchAssetAttempt {
  timestamp: number;
  provider: 'wagmi' | 'walletClient' | 'window.ethereum' | 'none';
  success: boolean;
  error?: string;
  params?: {
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  };
}

interface WatchAssetDiagnosticsProps {
  attempts: WatchAssetAttempt[];
  onClear?: () => void;
}

export function WatchAssetDiagnostics({ attempts, onClear }: WatchAssetDiagnosticsProps) {
  const [expanded, setExpanded] = useState(false);

  if (attempts.length === 0) {
    return null;
  }

  const lastAttempt = attempts[attempts.length - 1];
  const hasSuccess = attempts.some((a) => a.success);
  const hasError = attempts.some((a) => !a.success && a.error);

  return (
    <div className="mt-4 border border-border rounded-lg bg-muted/30 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <span className="flex items-center gap-2 font-medium text-muted-foreground">
          <Bug className="h-4 w-4" />
          wallet_watchAsset Diagnostics
          <span className="text-muted-foreground/70">({attempts.length} attempt{attempts.length !== 1 ? 's' : ''})</span>
        </span>
        <span className="flex items-center gap-2">
          {hasSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {hasError && !hasSuccess && <XCircle className="h-4 w-4 text-destructive" />}
          {!hasSuccess && !hasError && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50">
          {attempts.map((attempt, idx) => (
            <div
              key={idx}
              className={cn(
                'p-2 rounded border text-xs font-mono',
                attempt.success
                  ? 'border-green-500/30 bg-green-500/10'
                  : attempt.error
                  ? 'border-destructive/30 bg-destructive/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">
                  #{idx + 1} — {attempt.provider}
                </span>
                <span className="text-muted-foreground">
                  {new Date(attempt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className={attempt.success ? 'text-green-600' : 'text-destructive'}>
                  {attempt.success ? '✓ Success' : '✗ Failed'}
                </span>
                {attempt.error && (
                  <span className="ml-2 text-destructive break-all">— {attempt.error}</span>
                )}
              </div>
              {attempt.params && (
                <div className="mt-1 text-muted-foreground/80 break-all">
                  <div>address: {attempt.params.address}</div>
                  <div>symbol: {attempt.params.symbol}</div>
                  <div>decimals: {attempt.params.decimals}</div>
                  <div>image: {attempt.params.image}</div>
                </div>
              )}
            </div>
          ))}

          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="w-full mt-2">
              Clear Diagnostics
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
