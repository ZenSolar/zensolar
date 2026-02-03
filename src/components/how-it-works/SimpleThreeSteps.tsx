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
  },
  {
    number: '2',
    icon: Zap,
    title: 'Earn',
    description: 'Every kWh you generate or EV mile you drive earns $ZSOLAR rewards',
    detail: 'Verified automatically from your device APIs',
  },
  {
    number: '3',
    icon: Wallet,
    title: 'Cash Out',
    description: 'Transfer rewards directly to your bank account anytime',
    detail: 'No crypto experience required',
  },
];

const stepColors = [
  { bg: 'bg-primary/10', icon: 'bg-primary', text: 'text-primary' },
  { bg: 'bg-accent/10', icon: 'bg-accent', text: 'text-accent' },
  { bg: 'bg-secondary/10', icon: 'bg-secondary', text: 'text-secondary' },
];

export function SimpleThreeSteps() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-3">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground"
        >
          Three Simple Steps
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm md:text-base"
        >
          From clean energy to real rewards—no crypto knowledge needed
        </motion.p>
      </div>

      <div className="relative">
        {/* Connection Line - Desktop */}
        <div className="hidden md:block absolute top-[5rem] left-[18%] right-[18%] h-0.5 z-0">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full origin-left"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15, duration: 0.4 }}
            >
              <Card className={`h-full border-transparent hover:border-primary/20 transition-all duration-300 ${stepColors[index].bg} backdrop-blur-sm`}>
                <CardContent className="p-6 md:p-8 text-center space-y-5">
                  {/* Step Number + Icon */}
                  <div className="relative inline-block">
                    <motion.div
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${stepColors[index].icon} shadow-xl flex items-center justify-center mx-auto`}
                    >
                      <step.icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
                    </motion.div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md"
                    >
                      <span className="text-sm font-bold text-foreground">{step.number}</span>
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl md:text-3xl font-bold ${stepColors[index].text}`}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>

                  {/* Detail */}
                  <p className="text-xs text-muted-foreground/70 font-medium">
                    {step.detail}
                  </p>

                  {/* Mobile Arrow */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center pt-2">
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
    </motion.section>
  );
}
