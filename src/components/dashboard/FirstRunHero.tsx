import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import teslaLogo from '@/assets/logos/tesla-t-icon.svg';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-icon.svg';

interface FirstRunHeroProps {
  firstName?: string;
  hasWallet: boolean;
  hasEnergy: boolean;
  onConnectWallet: () => void;
  onConnectEnergy: () => void;
}

/**
 * Cinematic first-run hero shown only when the user is brand new
 * (no wallet AND no energy account). Replaces the two stacked
 * Compact*Prompt cards with a single high-signal, animated welcome.
 *
 * Design:
 * - Personal greeting with the user's first name (or "your") fading in.
 * - Two-step progress visual: 1) Wallet → 2) Energy.
 * - Branded provider buttons (Tesla / Enphase / SolarEdge / Wallbox)
 *   that feel like app-store integrations.
 * - Subtle ambient glow + rotating value-prop ticker so the empty
 *   dashboard never feels empty.
 *
 * Only renders inside `ZenSolarDashboard` when both wallet and energy
 * are missing; partial-state users still see the lighter Compact prompts.
 */
export function FirstRunHero({
  firstName,
  hasWallet,
  hasEnergy,
  onConnectWallet,
  onConnectEnergy,
}: FirstRunHeroProps) {
  const navigate = useNavigate();
  const greetingName = firstName?.trim() || 'there';

  // Rotating value-prop ticker — keeps the card feeling "alive" before
  // any real data exists.
  const tickerLines = [
    'Average member earns ~47 $ZSOLAR per day from solar alone.',
    'Every kWh you produce becomes a verified, on-chain token.',
    'Your EV miles count. Your battery discharge counts. All of it.',
    'No crypto experience required. Tap once to mint.',
  ];
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setTickerIdx((i) => (i + 1) % tickerLines.length),
      4200,
    );
    return () => clearInterval(id);
  }, [tickerLines.length]);

  const stepDoneClasses =
    'bg-primary text-primary-foreground border-primary';
  const stepActiveClasses =
    'bg-primary/10 text-primary border-primary animate-pulse';
  const stepIdleClasses =
    'bg-muted/40 text-muted-foreground border-border';

  const walletStepClasses = hasWallet
    ? stepDoneClasses
    : stepActiveClasses;
  const energyStepClasses = hasEnergy
    ? stepDoneClasses
    : hasWallet
      ? stepActiveClasses
      : stepIdleClasses;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-[0_0_40px_-12px_hsl(var(--primary)/0.35)]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative p-5 sm:p-6 space-y-5">
        {/* Greeting */}
        <div className="space-y-1.5 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            Welcome aboard
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Let's turn {firstName ? `${greetingName}'s` : 'your'} clean energy
            into currency.
          </h2>
          <p
            key={tickerIdx}
            className="text-sm text-muted-foreground leading-relaxed animate-fade-in"
          >
            {tickerLines[tickerIdx]}
          </p>
        </div>

        {/* Two-step progress */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              walletStepClasses,
            )}
            aria-label={hasWallet ? 'Wallet connected' : 'Connect wallet'}
          >
            {hasWallet ? (
              <Check className="h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
          </div>
          <div
            className={cn(
              'h-0.5 flex-1 rounded-full transition-colors',
              hasWallet ? 'bg-primary' : 'bg-border',
            )}
          />
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              energyStepClasses,
            )}
            aria-label={hasEnergy ? 'Energy connected' : 'Connect energy'}
          >
            {hasEnergy ? (
              <Check className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Active step CTA */}
        {!hasWallet ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">
              Step 1 of 2 · Wallet
            </p>
            <Button
              size="lg"
              className="w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]"
              onClick={onConnectWallet}
            >
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Set up your wallet
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Takes ~20 seconds. We create one for you — no app to install.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">
              Step 2 of 2 · Connect your energy
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ProviderButton
                label="Tesla"
                logoSrc={teslaLogo}
                onClick={onConnectEnergy}
              />
              <ProviderButton
                label="Enphase"
                logoSrc={enphaseLogo}
                onClick={onConnectEnergy}
              />
              <ProviderButton
                label="SolarEdge"
                logoSrc={solaredgeLogo}
                onClick={onConnectEnergy}
              />
              <ProviderButton
                label="Wallbox"
                logoSrc={wallboxLogo}
                onClick={onConnectEnergy}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="block w-full text-center text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              Or manage all connections on your profile →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderButton({
  label,
  logoSrc,
  onClick,
}: {
  label: string;
  logoSrc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_16px_-6px_hsl(var(--primary)/0.5)] active:scale-[0.98]"
    >
      <img
        src={logoSrc}
        alt={`${label} logo`}
        className="h-5 w-5 object-contain transition-transform group-hover:scale-110"
      />
      {label}
    </button>
  );
}
