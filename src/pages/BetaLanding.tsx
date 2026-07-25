import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import {
  QCScreen,
  QCHeader,
  QCMain,
  QCButton,
} from '@/components/onboarding/quiet/QuietCurrent';

/**
 * beta.zen.solar front door.
 * Minimal Quiet Current landing whose only primary action routes into
 * the passwordless /onboarding flow. No pricing, tokenomics, NFT, store,
 * or demo-mint surfaces here.
 */
export default function BetaLanding() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="ZenSolar Beta — Join the Beta"
        description="ZenSolar connects to your Tesla, solar, and battery to track the clean energy you're already producing — and rewards you for it. Read-only, disconnect anytime."
        url="https://beta.zen.solar"
      />
      <QCScreen>
        <QCHeader
          right={
            <button
              onClick={() => navigate('/onboarding/signin')}
              className="text-sm qc-muted hover:qc-text transition-colors"
              aria-label="Log in"
            >
              Log in
            </button>
          }
        />
        <QCMain className="pt-10">
          <h1 className="text-[30px] leading-[1.1] font-semibold qc-text tracking-tight mb-4">
            Your solar and your Tesla, finally working for you.
          </h1>
          <p className="text-[15px] leading-relaxed qc-muted mb-8">
            ZenSolar connects to your Tesla, solar, and battery to track the
            clean energy you're already producing — and rewards you for it.
            Takes about 3 minutes, read-only, disconnect anytime.
          </p>

          <div className="text-[12px] tracking-[0.14em] uppercase qc-muted mb-8">
            Tesla · Enphase · SolarEdge · Wallbox
          </div>

          <QCButton onClick={() => navigate('/onboarding')}>
            Join the beta
          </QCButton>
          <p className="text-[12px] qc-muted mt-3 text-center">
            We only read your data — never control your devices. You can
            disconnect anytime.
          </p>

          <ol className="mt-12 space-y-3 border-t qc-border pt-8">
            {[
              'Connect your devices',
              'See live energy data',
              'Start the beta',
            ].map((step, i) => (
              <li key={step} className="flex items-baseline gap-3">
                <span className="qc-numeric text-[13px] qc-muted w-5">
                  {i + 1}
                </span>
                <span className="text-[14px] qc-text">{step}</span>
              </li>
            ))}
          </ol>

          <footer className="mt-auto pt-16 flex items-center justify-center gap-5 text-[12px] qc-muted">
            <a
              href="mailto:support@zen.solar"
              className="hover:qc-text transition-colors"
            >
              Support
            </a>
            <span aria-hidden>·</span>
            <a href="/privacy" className="hover:qc-text transition-colors">
              Privacy
            </a>
          </footer>
        </QCMain>
      </QCScreen>
    </>
  );
}
