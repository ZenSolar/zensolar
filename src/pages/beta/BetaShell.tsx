import { ReactNode } from 'react';
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
