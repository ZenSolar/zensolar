import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function OnboardingProgress({ 
  currentStep, 
  totalSteps,
  stepLabels = ['Wallet', 'Energy', 'Done']
}: OnboardingProgressProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50 pt-safe">
      <div className="w-full max-w-sm mx-auto px-6 py-3">
        {/* ZenSolar Logo */}
        <div className="flex justify-center mb-2.5">
          <img
            src={zenLogo}
            alt="ZenSolar"
            className="h-6 w-auto dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          />
        </div>

        {/* Progress bar */}
        <div className="flex items-center">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber;
            
            return (
              <div key={index} className="flex items-center flex-1 last:flex-none">
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-300 flex-shrink-0
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : isCurrent 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-md shadow-primary/20' 
                        : 'bg-muted text-muted-foreground border border-border'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    stepNumber
                  )}
                </motion.div>
                
                {/* Connector line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="h-full bg-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Step label */}
        <div className="text-center mt-1.5">
          <p className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}
            <span className="mx-1.5 text-border">•</span>
            <span className="font-medium text-foreground">{stepLabels[currentStep - 1]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
