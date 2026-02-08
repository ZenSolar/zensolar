import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link2, Zap, Sparkles, Wallet } from 'lucide-react';

const steps = [
  { icon: Link2, label: 'Connect' },
  { icon: Zap, label: 'Generate' },
  { icon: Sparkles, label: 'Mint' },
  { icon: Wallet, label: 'Cash Out' },
];

interface StepProgressTimelineProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function StepProgressTimeline({ containerRef }: StepProgressTimelineProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Track which step is active based on scroll progress
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const step = Math.min(3, Math.floor(v * 4));
      setActiveStep(step);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <div className="sticky top-20 z-30 py-4 hidden md:block">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="relative flex items-center justify-between rounded-full bg-muted/60 backdrop-blur-md border border-border/40 px-3 py-2">
          {/* Background track */}
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-1 bg-border/30 rounded-full" />
          {/* Active fill */}
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
            style={{ width: progressWidth }}
          />

          {/* Step dots */}
          {steps.map((step, i) => (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i <= activeStep
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-muted border border-border text-muted-foreground'
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                  i <= activeStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
