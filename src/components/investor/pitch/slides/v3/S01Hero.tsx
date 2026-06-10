import { SlideLayout, SlideFooter } from '../../SlideLayout';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function S01Hero() {
  return (
    <SlideLayout variant="dark">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.18), transparent 60%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-24 text-center">
        <p className="text-[18px] font-mono tracking-[0.32em] uppercase text-secondary/80 mb-10">
          Investor Pitch · v3 · Seed Round · Part 1 of 2 · Confidential
        </p>

        <img
          src={zenLogo}
          alt="ZenSolar"
          className="h-[140px] w-auto object-contain mb-12"
          style={{
            filter:
              'drop-shadow(0 0 60px hsl(var(--secondary) / 0.35)) drop-shadow(0 0 20px hsl(var(--primary) / 0.2))',
          }}
        />

        <h1 className="text-[120px] font-semibold leading-[1] tracking-tight text-white">
          Creating Currency
          <br />
          <span className="text-secondary">From Energy.</span>
        </h1>

        <p className="mt-10 text-[28px] text-white/60 leading-relaxed max-w-[1400px]">
          The first patent-pending protocol turning verified clean-energy
          production into a hard-capped digital currency — built on the
          first-ever unified multi-manufacturer monitoring app, live today
          across{' '}
          <span className="text-white">
            Tesla, Enphase, SolarEdge, and Wallbox.
          </span>
        </p>

        <p className="mt-6 text-[24px] text-white/75 leading-relaxed max-w-[1400px]">
          Part 1 launches the token and ignites the flywheel. Part 2 scales once
          traction is proven — with the goal of reaching self-sustainability
          without needing a traditional Series A.
        </p>

        <div className="mt-14 grid grid-cols-3 gap-5 w-full max-w-[1100px]">
          {[
            { k: '$2.5M – $3.5M', v: 'Part 1 — Now' },
            { k: 'Two-Part', v: 'Seed strategy' },
            { k: 'Convertible Note', v: 'Instrument' },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl border border-border/60 bg-card/40 px-6 py-6"
            >
              <div className="text-[44px] font-semibold leading-none text-white">
                {s.k}
              </div>
              <div className="text-[15px] uppercase tracking-[0.22em] text-white/45 mt-3">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-[18px] font-mono tracking-[0.22em] uppercase text-white/35">
          Co-founded by Joseph Maushart &amp; Michael Tschida
        </p>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
