import { useCallback, useState } from 'react';
import { Coins, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadyToMintCardProps {
  onMint: () => void;
  firstName?: string;
}

const DISMISS_KEY = 'zs_ready_to_mint_dismissed';

/**
 * Celebration card shown when a user has connected both wallet and energy
 * but hasn't minted their first $ZSOLAR yet.
 *
 * - Big primary CTA → opens the token mint dialog
 * - Can be manually dismissed (persists via localStorage)
 * - Auto-disappears permanently after the first successful mint
 */
export function ReadyToMintCard({ onMint, firstName }: ReadyToMintCardProps) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  }, []);

  const handleMint = useCallback(() => {
    onMint();
  }, [onMint]);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card shadow-[0_0_50px_-12px_hsl(var(--primary)/0.45)]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.5)]">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              You're ready to mint!
            </h2>
            <p className="text-sm text-muted-foreground">
              {firstName
                ? `Great work, ${firstName}. Your energy is verified and your wallet is set.`
                : 'Your energy is verified and your wallet is set.'}
            </p>
          </div>
        </div>

        {/* Value prop */}
        <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
          <Coins className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-foreground/90 leading-snug">
            Every kWh you produce, every mile you drive, every battery discharge — it all becomes
            <span className="font-semibold text-primary"> on-chain $ZSOLAR</span>.
          </p>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.65)] animate-pulse"
          onClick={handleMint}
        >
          <span className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Mint your first $ZSOLAR
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          This card will disappear after your first mint. You can always mint from the Energy Command Center below.
        </p>
      </div>
    </div>
  );
}
