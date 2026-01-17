import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  Zap, 
  Award, 
  BarChart3,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Welcome to ZenSolar",
    description: "ZenSolar rewards you with $ZSOLAR tokens and exclusive NFTs for your clean energy activities. Let's take a quick tour!",
    icon: <Sparkles className="h-8 w-8" />,
  },
  {
    id: 2,
    title: "Connect Your Wallet",
    description: "Link your crypto wallet to receive $ZSOLAR tokens and mint your earned NFTs. We support MetaMask, WalletConnect, and more.",
    icon: <Wallet className="h-8 w-8" />,
    highlight: "connect-wallet",
  },
  {
    id: 3,
    title: "Link Energy Accounts",
    description: "Connect your Tesla, Enphase, SolarEdge, or Wallbox accounts to automatically track your solar production, EV miles, and charging data.",
    icon: <Zap className="h-8 w-8" />,
    highlight: "connect-accounts",
  },
  {
    id: 4,
    title: "Track Your Activity",
    description: "View your real-time energy metrics: solar kWh produced, EV miles driven, battery storage, and charging usage. Each unit earns you tokens!",
    icon: <BarChart3 className="h-8 w-8" />,
    highlight: "activity-metrics",
  },
  {
    id: 5,
    title: "Earn NFT Rewards",
    description: "Reach milestones to unlock exclusive NFTs! From your first solar kWh to legendary achievements, build your collection as you grow.",
    icon: <Award className="h-8 w-8" />,
    highlight: "reward-progress",
  },
];

interface DemoOnboardingGuideProps {
  onComplete?: () => void;
}

export function DemoOnboardingGuide({ onComplete }: DemoOnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has already seen the guide
    const seen = localStorage.getItem('demo-guide-seen');
    if (seen) {
      setIsVisible(false);
      setHasCompleted(true);
    }
  }, []);

  useEffect(() => {
    // Highlight the relevant section
    const step = steps[currentStep];
    if (step?.highlight) {
      const element = document.getElementById(step.highlight);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
        
        return () => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
        };
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setHasCompleted(true);
    localStorage.setItem('demo-guide-seen', 'true');
    
    // Scroll to top of dashboard after completing tour
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    onComplete?.();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
    localStorage.removeItem('demo-guide-seen');
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  if (!isVisible && hasCompleted) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRestart}
        className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
      >
        <Sparkles className="h-4 w-4" />
        Restart Tour
      </Button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={handleComplete}
          />

          {/* Guide Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
          >
            <Card className="border-primary/20 shadow-2xl shadow-primary/10">
              <CardContent className="p-0">
                {/* Progress bar */}
                <Progress value={progress} className="h-1 rounded-t-lg rounded-b-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Step {currentStep + 1} of {steps.length}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleComplete}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="px-4 pb-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {step.icon}
                        </div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between p-4 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {/* Step indicators */}
                  <div className="flex gap-1.5">
                    {steps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          idx === currentStep 
                            ? 'bg-primary w-4' 
                            : idx < currentStep 
                            ? 'bg-primary/50' 
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="gap-1"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
