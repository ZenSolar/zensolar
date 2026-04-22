import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useConfetti, warmAudioContext } from '@/hooks/useConfetti';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { cn } from '@/lib/utils';

/**
 * VIP welcome configuration — keyed by access code.
 * Add new VIPs here to give them a personalized post-NDA celebration.
 */
const VIP_WELCOMES: Record<
  string,
  {
    firstName: string;
    title: string;
    body: string;
    signoff: string;
    cta: string;
  }
> = {
  'TODD-2026': {
    firstName: 'Todd',
    title: 'Welcome back, Todd!',
    body:
      "You believed in ZenSolar from kind of the beginning, but you've been part of my journey in Solar from the beginning. The original ZenSolar LLC dissolved, but the mission didn't. What you're about to see is everything we rebuilt — patent-pending, on-chain, and live. This is the second chapter. Thanks for being here for it.",
    signoff: '— Joe',
    cta: 'Enter the Clean Energy Center',
  },
  'JO-2026': {
    firstName: 'Jo',
    title: 'Welcome, Jo!',
    body:
      "You've watched this whole thing come together from the inside — the late nights, the rebuilds, the wins. This demo is for you to explore at your own pace. Tap anything, mint anything, break anything. It's all yours.",
    signoff: '— Joe',
    cta: 'Enter the Clean Energy Center',
  },
  'LOBV-2026': {
    firstName: 'Toby',
    title: 'Welcome, Toby.',
    body:
      "On November 3, 2023, I started researching the patented technology that became ZenSolar. On November 23, 2023, I finally grew the balls to paste my first block of Grok-generated code into a terminal — no idea what I was doing. 28 months later, you're holding what it became. You're one of the first people outside the inner circle to actually feel it. Tap everything. Break anything. Then tell me what you think.",
    signoff: '— Joe',
    cta: 'Enter the Clean Energy Center',
  },
  'MTNYOTAS-4L': {
    firstName: 'Dwight',
    title: 'Welcome, Dwight.',
    body:
      "Dwight — even though version one of ZenSolar didn't work out the way we hoped, I will never forget your contributions, your energy, and the support you gave me back then. You were truly my first right-hand man when ZS was a completely different business than what it is now.\n\nThis is the evolution. The next chapter. What ZenSolar was always meant to be — patent-pending, on-chain, and live.\n\nYou're one of the first people outside the inner circle to actually feel it. Tap anything. Break anything. Then tell me what you think — if you have the time.\n\nBitcoin is scarce because of PoW (Proof-of-Work) and math. ZenSolar is infinitely productive — and good for civilization — because of PoG (Proof-of-Genesis™), physics, and math. That's exactly why we're going to eclipse Bitcoin's market cap by 5x to 10x.",
    signoff: '— Joe',
    cta: 'Enter the Clean Energy Center',
  },
};

export function getVipWelcomeForCode(code: string | null | undefined) {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return VIP_WELCOMES[upper] ?? null;
}

const SHOWN_KEY_PREFIX = 'zen_vip_welcome_shown:';

interface VipWelcomeScreenProps {
  accessCode: string;
  onContinue: () => void;
}

export function VipWelcomeScreen({ accessCode, onContinue }: VipWelcomeScreenProps) {
  const config = getVipWelcomeForCode(accessCode);
  const { triggerCelebration } = useConfetti();
  const [revealed, setRevealed] = useState(false);
  const firedRef = useRef(false);

  // Mark as shown once mounted so it never re-triggers for this device
  useEffect(() => {
    if (!config) return;
    try {
      localStorage.setItem(`${SHOWN_KEY_PREFIX}${accessCode.toUpperCase()}`, '1');
    } catch {}
  }, [accessCode, config]);

  // Fire confetti + reveal on mount
  useEffect(() => {
    if (!config || firedRef.current) return;
    firedRef.current = true;
    warmAudioContext();
    const t1 = setTimeout(() => setRevealed(true), 80);
    const t2 = setTimeout(() => triggerCelebration(), 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [config, triggerCelebration]);

  // Defensive auto-continue if no config (always called, never conditional)
  useEffect(() => {
    if (!config) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-background overflow-y-auto overscroll-contain">
      {/* Subtle radial glow — fixed so it stays put while content scrolls */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 min-h-full flex items-center justify-center px-5 py-8 sm:py-12"
           style={{
             paddingTop: 'max(2rem, env(safe-area-inset-top))',
             paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
           }}>
        <div
          className={cn(
            'w-full max-w-md flex flex-col items-center text-center transition-all duration-700',
            revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Logo with glow */}
          <img
            src={zenLogo}
            alt="ZenSolar"
            className="h-9 sm:h-10 w-auto mb-5 dark:animate-logo-glow"
            style={{
              filter: 'drop-shadow(0 0 16px hsla(142, 76%, 42%, 0.5))',
            }}
          />

          {/* Sparkle pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-primary">
              VIP Access
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
            {config.title}
          </h1>

          {/* Personal note card */}
          <div className="w-full rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-4 sm:p-5 mb-5 text-left">
            <p className="text-[14px] sm:text-base leading-relaxed text-foreground/90 whitespace-pre-line">
              {config.body}
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">{config.signoff}</p>
          </div>

          {/* "Try this first" tip */}
          <div className="w-full rounded-xl border border-primary/15 bg-primary/5 p-3.5 mb-5 text-left">
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/80 mb-1.5">
              Try this first
            </p>
            <p className="text-[13px] leading-relaxed text-foreground/85">
              Tap any tile in the Clean Energy Center to mint $ZSOLAR. Then check your wallet to watch it land.
            </p>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={onContinue}
          >
            {config.cta}
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* VIP teaser — subtle hint that more is coming for VIP holders */}
          <p className="mt-3 text-[11px] text-muted-foreground/80 italic">
            <span className="text-primary">✦</span> More VIP access features coming soon.
          </p>

          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Patent-Pending · On-Chain · Live
          </p>
        </div>
      </div>
    </div>
  );
}
