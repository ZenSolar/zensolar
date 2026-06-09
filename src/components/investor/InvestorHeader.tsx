import { Link } from 'react-router-dom';
import zenIcon from '@/assets/zen-icon-transparent.png';

type InvestorHeaderProps = {
  eyebrow?: string;
  compact?: boolean;
  linkHome?: boolean;
};

export function InvestorHeader({
  eyebrow = 'Investor Materials',
  compact = false,
  linkHome = true,
}: InvestorHeaderProps) {
  const mark = (
    <div className="relative inline-flex flex-col items-center gap-3 text-center">
      <div
        aria-hidden
        className="absolute -inset-x-16 -top-8 h-28 rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--secondary) / 0.28), hsl(var(--primary) / 0.16) 38%, transparent 72%)',
        }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="relative grid place-items-center rounded-full"
          style={{
            width: compact ? 48 : 62,
            height: compact ? 48 : 62,
            boxShadow:
              '0 0 22px hsl(var(--secondary) / 0.55), 0 0 72px hsl(var(--primary) / 0.28)',
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, hsl(var(--secondary) / 0.38), transparent 68%)',
            }}
          />
          <img
            src={zenIcon}
            alt=""
            className="relative h-[78%] w-[78%] object-contain"
            loading="eager"
            decoding="async"
          />
        </span>
        <span
          className="relative text-[28px] font-semibold leading-none text-secondary md:text-[34px]"
          style={{ textShadow: '0 0 18px hsl(var(--secondary) / 0.5)' }}
        >
          zensolar
        </span>
      </div>
      <span className="relative text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </span>
    </div>
  );

  return (
    <header className="relative overflow-hidden border-b border-border/40 bg-background">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.16), transparent 58%), linear-gradient(180deg, hsl(var(--background)), hsl(var(--card) / 0.72) 55%, hsl(var(--background)))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 opacity-70"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--secondary) / 0.12), transparent)',
        }}
      />
      <div className={`relative mx-auto flex max-w-5xl justify-center px-5 ${compact ? 'py-7' : 'py-9 md:py-11'}`}>
        {linkHome ? (
          <Link to="/investor" aria-label="ZenSolar investor home" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70">
            {mark}
          </Link>
        ) : (
          mark
        )}
      </div>
    </header>
  );
}