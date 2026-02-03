import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Zap, Wallet, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Link2,
    title: 'Connect',
    description: 'Link your Tesla, Enphase, SolarEdge, or Wallbox account in 60 seconds',
    detail: 'Secure OAuth—we never see your password',
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'bg-blue-500/10',
  },
  {
    number: '2',
    icon: Zap,
    title: 'Earn',
    description: 'Every kWh you generate or EV mile you drive earns $ZSOLAR rewards',
    detail: 'Verified automatically from your device APIs',
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
  },
  {
    number: '3',
    icon: Wallet,
    title: 'Cash Out',
    description: 'Transfer rewards directly to your bank account anytime',
    detail: 'No crypto experience required',
    gradient: 'from-emerald-500 to-green-500',
    bgGlow: 'bg-emerald-500/10',
  },
];

export function SimpleThreeSteps() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Three Simple Steps</h2>
        <p className="text-muted-foreground">
          From clean energy to real rewards—no crypto knowledge needed
        </p>
      </div>

      <div className="relative">
        {/* Connection Line - Desktop */}
        <div className="hidden md:block absolute top-[4.5rem] left-[15%] right-[15%] h-1 z-0">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 rounded-full origin-left"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15 }}
            >
              <Card className={`h-full border-2 border-transparent hover:border-primary/20 transition-all ${step.bgGlow}`}>
                <CardContent className="p-6 text-center space-y-4">
                  {/* Step Number + Icon */}
                  <div className="relative inline-block">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-xl flex items-center justify-center mx-auto`}
                    >
                      <step.icon className="h-10 w-10 text-white" />
                    </motion.div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground">{step.number}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Detail */}
                  <p className="text-xs text-muted-foreground/80 italic">
                    {step.detail}
                  </p>

                  {/* Mobile Arrow */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center pt-2">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-6 w-6 text-muted-foreground/40 rotate-90" />
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
