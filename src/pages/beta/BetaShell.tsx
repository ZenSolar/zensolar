import { ReactNode, useEffect } from 'react';
import { QCScreen, QCHeader, QCMain, QCProgress, type QCStage } from '@/components/onboarding/quiet/QuietCurrent';

interface Props {
  children: ReactNode;
  onBack?: () => void;
  eyebrow?: string;
  stage?: QCStage;
  ambient?: boolean;
}

/**
 * Shared chrome for every unified-onboarding screen.
 * Wraps content in the Quiet Current premium layer: graphite canvas,
 * cross-fade + upward drift entrance, thin progress rail.
 */
export function BetaShell({ children, onBack, eyebrow, stage, ambient = true }: Props) {
  // Ensure every onboarding screen mounts at the top — prevents the eyebrow /
  // heading from being clipped when a step transition inherits the previous
  // page's scroll position (e.g. signup → 8-digit code screen on mobile).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [eyebrow, stage]);
  return (
    <QCScreen ambient={ambient}>
      <div className="flex flex-col min-h-screen">
        <QCHeader onBack={onBack} />
        {stage && <QCProgress stage={stage} />}
        <QCMain>
          {eyebrow && (
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] qc-muted mb-3">
              {eyebrow}
            </p>
          )}
          {children}
        </QCMain>
      </div>
    </QCScreen>
  );
}
