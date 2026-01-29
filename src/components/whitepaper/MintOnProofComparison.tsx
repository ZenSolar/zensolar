import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Zap, Shield, CheckCircle2, Coins, 
  ArrowRight, Sparkles, Play, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MintOnProofComparisonProps {
  autoPlay?: boolean;
  showControls?: boolean;
  compact?: boolean;
}

const mintOnProofSteps = [
  { id: 'energy', emoji: '☀️', label: 'Energy Generated', color: 'from-amber-400 to-orange-500' },
  { id: 'verify', icon: Shield, label: 'SEGI Verifies', color: 'from-primary to-emerald-500' },
  { id: 'mint', emoji: '🪙', label: 'Token Minted', color: 'from-emerald-400 to-green-500' },
  { id: 'wallet', emoji: '👛', label: 'Your Wallet', color: 'from-blue-400 to-cyan-500' },
];

export function MintOnProofComparison({ 
  autoPlay = true, 
  showControls = true,
  compact = false 
}: MintOnProofComparisonProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= mintOnProofSteps.length - 1) {
          // Reset after completing
          return -1;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setActiveStep(-1);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setActiveStep(-1);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coins className="h-3.5 w-3.5 mr-2" />
          Token Distribution Model
        </Badge>
        <h2 className="text-2xl font-bold">
          <span className="text-primary">Mint-on-Proof</span> vs Pre-Minted Pools
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          See how ZenSolar's architecture fundamentally differs from legacy reward systems
        </p>
      </div>

      <div className={`grid ${compact ? 'gap-4' : 'md:grid-cols-2 gap-4'}`}>
        {/* Traditional Pre-Minted Pool */}
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-xs border-red-500/30 text-red-500 bg-red-500/10">
              Legacy Approach
            </Badge>
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-red-500">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Database className="h-5 w-5" />
              </div>
              Pre-Minted Pool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Static visual */}
            <div className="relative bg-muted/50 rounded-xl p-4 border border-red-500/10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏦</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-dashed border-red-300 flex items-center justify-center text-xs">👤</div>
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-dashed border-red-300 flex items-center justify-center text-xs">👤</div>
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-dashed border-red-300 flex items-center justify-center text-xs">👤</div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Tokens distributed from central reserve</p>
            </div>
            
            {/* Drawbacks */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="text-muted-foreground">Tokens created <strong className="text-foreground">before</strong> energy is verified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="text-muted-foreground">Central authority controls distribution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="text-muted-foreground">Supply inflation risk from over-minting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="text-muted-foreground">No direct link between energy and token creation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Mint-on-Proof with Animation */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 relative overflow-hidden ring-2 ring-primary/20">
          <div className="absolute top-3 right-3">
            <Badge className="text-xs bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              ZenSolar
            </Badge>
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-primary">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5" />
              </div>
              Mint-on-Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Animated visual */}
            <div className="relative bg-muted/50 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
                {mintOnProofSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <motion.div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg relative`}
                      animate={{
                        scale: activeStep === index ? 1.15 : 1,
                        opacity: activeStep >= index || activeStep === -1 ? 1 : 0.4,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {step.emoji ? (
                        <span className="text-lg sm:text-xl">{step.emoji}</span>
                      ) : step.icon ? (
                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      ) : null}
                      
                      {/* Pulse ring when active */}
                      <AnimatePresence>
                        {activeStep === index && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-white"
                            initial={{ scale: 1, opacity: 0.8 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    {index < mintOnProofSteps.length - 1 && (
                      <motion.div
                        className="mx-0.5 sm:mx-1"
                        animate={{
                          opacity: activeStep > index ? 1 : 0.3,
                        }}
                      >
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Step label */}
              <div className="h-5">
                <AnimatePresence mode="wait">
                  {activeStep >= 0 && activeStep < mintOnProofSteps.length && (
                    <motion.p
                      key={activeStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-center text-primary font-medium"
                    >
                      {mintOnProofSteps[activeStep].label}
                    </motion.p>
                  )}
                  {activeStep === -1 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center text-muted-foreground"
                    >
                      Energy → Verify → Mint → Your Wallet
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Controls */}
            {showControls && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-xs h-7 px-2"
                >
                  {isPlaying ? 'Pause' : <><Play className="h-3 w-3 mr-1" /> Play</>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs h-7 px-2"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              </div>
            )}
            
            {/* Benefits */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Reward tokens created <strong className="text-foreground">only after</strong> energy verified</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Smart contracts mint directly to your wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">1:1 backing—every reward token tied to real activity</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">One-tap minting from within the app</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Summary callout - Updated to be accurate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-emerald-500/10 to-amber-500/10 border border-primary/20 text-center"
      >
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">The Bottom Line:</strong> With <span className="text-primary font-semibold">Mint-on-Proof</span>, 
          user reward tokens are only created after clean energy activity is cryptographically verified—ensuring every reward you earn is 
          <strong className="text-foreground"> backed by real, verified impact</strong>.
        </p>
      </motion.div>
    </div>
  );
}
