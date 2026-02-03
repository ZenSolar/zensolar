import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

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
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber;
            
            return (
              <div key={index} className="flex items-center flex-1">
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-colors duration-300
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isCurrent 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </motion.div>
                
                {/* Connector line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Step label */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}: <span className="font-medium text-foreground">{stepLabels[currentStep - 1]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
