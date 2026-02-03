import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Fragment } from 'react';

const steps = [
  {
    icon: Sparkles,
    title: 'Earn $ZSOLAR',
    description: 'Rewards accumulate automatically as you generate energy',
  },
  {
    icon: Wallet,
    title: 'Built-in Wallet',
    description: 'Created for you during signup—no apps to download',
  },
  {
    icon: Building2,
    title: 'Cash Out',
    description: 'Transfer directly to your bank account anytime',
  },
];

const benefits = [
  { icon: '🚫', text: 'No seed phrases to remember' },
  { icon: '🚫', text: 'No external wallet apps' },
  { icon: '✅', text: 'Direct bank transfers' },
];

export function CashOutExplainer() {
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
          From Rewards to Real Money
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base"
        >
          No crypto apps needed. We handle everything so you can focus on earning.
        </motion.p>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            {steps.map((step, index) => (
              <Fragment key={step.title}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.15 }}
                  className="text-center p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-flex p-3 rounded-xl bg-primary/10 mb-4"
                  >
                    <step.icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <p className="font-semibold text-foreground text-lg">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{step.description}</p>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.15 }}
                    className="hidden md:flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-5 w-5 text-primary/60" />
                    </motion.div>
                  </motion.div>
                )}
              </Fragment>
            ))}
          </div>

          {/* Mobile Arrows */}
          <div className="flex md:hidden flex-col items-center gap-2 py-4">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-5 w-5 text-primary/60 rotate-90" />
            </motion.div>
          </div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid sm:grid-cols-3 gap-3"
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 text-sm"
              >
                <span className="text-lg">{benefit.icon}</span>
                <span className="text-muted-foreground font-medium">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-5 rounded-xl bg-accent/10 border border-accent/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-accent/20 flex-shrink-0">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Already have a crypto wallet?</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Great! You can connect MetaMask, Coinbase Wallet, Rainbow, or any WalletConnect-compatible wallet 
              to receive $ZSOLAR directly. It's optional—our built-in wallet works for everyone.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
