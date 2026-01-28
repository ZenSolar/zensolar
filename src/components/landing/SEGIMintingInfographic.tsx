import { motion } from 'framer-motion';
import { Link2, ShieldCheck, Hexagon, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect',
    subtitle: 'Your Devices',
    description: 'Link your Tesla, Enphase, SolarEdge, or Wallbox with secure OAuth—no passwords shared.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
    bgGlow: 'bg-blue-500/10',
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Verify',
    subtitle: 'Via SEGI™',
    description: 'Our patent-pending system validates your energy production with cryptographic timestamps.',
    gradient: 'from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/30',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    number: '03',
    icon: Hexagon,
    title: 'Mint',
    subtitle: 'In-App',
    description: 'Tap once to mint $ZSOLAR tokens & milestone NFTs directly to your wallet—gasless!',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/30',
    bgGlow: 'bg-amber-500/10',
  },
];

interface SEGIMintingInfographicProps {
  showCTA?: boolean;
  compact?: boolean;
}

export function SEGIMintingInfographic({ showCTA = true, compact = false }: SEGIMintingInfographicProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <Badge variant="outline" className="px-4 py-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Patent-Pending SEGI Technology
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold">
            How In-App Minting Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps from clean energy to blockchain rewards
          </p>
        </motion.div>
      )}

      {/* Steps Flow */}
      <div className="relative">
        {/* Connection Lines - Desktop */}
        <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-1 -translate-y-1/2 z-0">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full origin-left"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.5 }}
            >
              <Card className={`h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden group ${step.bgGlow}`}>
                <CardContent className="p-6 text-center space-y-4 relative">
                  {/* Step Number Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`text-4xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-30 group-hover:opacity-50 transition-opacity`}>
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-xl ${step.glow}`}
                  >
                    <step.icon className="h-8 w-8 text-white" />
                  </motion.div>

                  {/* Title */}
                  <div>
                    <h3 className={`text-2xl font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                      {step.title}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground">{step.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center pt-2">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90" />
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Result Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/10 border border-primary/20 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-orange-500/5" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center border-2 border-background">
                <span className="text-lg">🪙</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center border-2 border-background">
                <span className="text-lg">🎨</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">Tokens + NFTs = Digital Income</p>
              <p className="text-sm text-muted-foreground">Minted directly to your wallet, forever yours</p>
            </div>
          </div>
          
          {showCTA && (
            <Link to="/demo">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-lg shadow-orange-500/20">
                Try It Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Learn More Link */}
      {showCTA && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Link 
            to="/technology" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Learn more about SEGI technology
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
