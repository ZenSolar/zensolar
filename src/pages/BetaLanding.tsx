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
        description="Your Tesla and solar panels already generate real value. ZenSolar links to the systems you already own and provides a precise way to see — and be rewarded for — your clean energy contributions."
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
            A new way to be rewarded for using solar and driving a Tesla —$ZSOLAR.
          </h1>
          <p className="text-[15px] leading-relaxed qc-muted mb-8">
            Your Tesla and solar panels already generate real value. ZenSolar
            links to the systems you already own and provides a&nbsp;precise way to
            see — and be rewarded for — your clean energy contributions.
          </p>

          <div className="text-[12px] tracking-[0.14em] uppercase qc-muted mb-8">
            &nbsp; &nbsp;TESLA · ENPHASE · SOLAREDGE · WALLBOX
          </div>

          <QCButton onClick={() => navigate('/onboarding')}>
            Join the beta
          </QCButton>
          <p className="text-[12px] qc-muted mt-3 text-center">
            Read-only access.&nbsp;We observe, never control your
            devices&nbsp;and you can disconnect anytime.
          </p>

          <ol className="mt-12 space-y-3 border-t qc-border pt-8">
            {[
              'Connect your devices',
              'See your kWh and EV data, live',
              'Earn your rewards',
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
