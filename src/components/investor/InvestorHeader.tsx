import { Link } from 'react-router-dom';
import zenIcon from '@/assets/zen-icon-transparent.png';

/**
 * InvestorHeader — premium glowing logo header used across all
 * investor-facing subpages. Dark gradient "curtain" backdrop,
 * centered glowing orb logo, and the "zensolar" wordmark.
 */
export function InvestorHeader({
  /** Optional small line of text shown under the wordmark (e.g. "Investor Access"). */
  eyebrow,
  /** When false, the header doesn't link to /investor (useful on /investor itself). */
  linkHome = true,
  /** Tighter vertical padding for sub-pages that have their own hero. */
  compact = false,
}: {
  eyebrow?: string;
  linkHome?: boolean;
  compact?: boolean;
}) {
  const inner = (
    <div className="relative flex flex-col items-center text-center">
      {/* Spotlight halo behind the orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-6 h-40 w-40 md:h-48 md:w-48 rounded-full blur-3xl opacity-70"
        style={{
          background:
            'radial-gradient(circle at center, hsl(var(--secondary) / 0.55), hsl(var(--secondary) / 0.15) 45%, transparent 70%)',
        }}
      />
      {/* Orb logo */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-xl opacity-80"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--secondary) / 0.75), transparent 65%)',
          }}
        />
        <img
          src={zenIcon}
          alt="ZenSolar"
          width="64"
          height="64"
          loading="eager"
          decoding="async"
          className="relative h-14 w-14 md:h-16 md:w-16 drop-shadow-[0_0_18px_hsl(var(--secondary)/0.6)]"
        />
      </div>
      {/* Wordmark */}
      <div
        className="relative mt-3 text-[18px] md:text-[20px] font-medium tracking-[0.04em] text-secondary"
        style={{
          textShadow:
            '0 0 14px hsl(var(--secondary) / 0.45), 0 0 28px hsl(var(--secondary) / 0.25)',
        }}
      >
        zensolar
      </div>
      {eyebrow && (
        <div className="relative mt-2 text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </div>
      )}
    </div>
  );

  return (
    <header
      className={`relative overflow-hidden border-b border-border/40 bg-background ${
        compact ? 'py-10 md:py-12' : 'py-14 md:py-20'
      }`}
    >
      {/* Dark curtain gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--secondary) / 0.18), transparent 70%), linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background)) 60%, hsl(var(--background) / 0.95))',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5">
        {linkHome ? (
          <Link to="/investor" aria-label="ZenSolar investor home" className="block">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
    </header>
  );
}

export default InvestorHeader;
