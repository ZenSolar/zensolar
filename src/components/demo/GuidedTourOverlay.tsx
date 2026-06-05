import { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TourStep } from '@/hooks/useGuidedTour';

interface Props {
  active: boolean;
  step: TourStep | undefined;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect { top: number; left: number; width: number; height: number; }

export function GuidedTourOverlay({ active, step, stepIndex, totalSteps, onNext, onSkip }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !step) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.id}"]`);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const t = window.setInterval(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, step]);

  if (!active || !step) return null;

  const padding = 8;
  const spot = rect
    ? {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  // Caption placement: below spotlight if room, else top.
  const captionTop = spot
    ? spot.top + spot.height + 12 < window.innerHeight - 200
      ? spot.top + spot.height + 12
      : Math.max(16, spot.top - 200)
    : window.innerHeight / 2 - 100;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Dim backdrop with spotlight cutout */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: spot
            ? `radial-gradient(ellipse ${spot.width / 2 + 40}px ${spot.height / 2 + 40}px at ${spot.left + spot.width / 2}px ${spot.top + spot.height / 2}px, transparent 55%, hsl(var(--background) / 0.86) 70%)`
            : 'hsl(var(--background) / 0.86)',
        }}
        onClick={onSkip}
      />
      {/* Spotlight ring */}
      {spot && (
        <div
          className="absolute pointer-events-none rounded-2xl ring-2 ring-secondary/80 shadow-[0_0_0_4px_hsl(var(--secondary)/0.25),0_0_40px_hsl(var(--secondary)/0.45)]"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      )}
      {/* Caption */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[min(92vw,360px)] pointer-events-auto rounded-2xl border border-secondary/40 bg-card/95 backdrop-blur-md shadow-xl p-4"
        style={{ top: captionTop }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-secondary/80 font-semibold">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="h-3 w-3" /> Skip
          </button>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{step.body}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 h-9" onClick={onNext}>
            {stepIndex + 1 >= totalSteps ? 'Finish' : 'Next'}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
