import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, CreditCard, ArrowRight, Sparkles, Building2 } from 'lucide-react';

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

export function CashOutExplainer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">From Rewards to Real Money</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          No crypto apps needed. We handle everything so you can focus on what matters—earning.
        </p>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            {steps.map((step, index) => (
              <>
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.15 }}
                  className="text-center p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="hidden md:flex items-center justify-center"
                  >
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                  </motion.div>
                )}
              </>
            ))}
          </div>

          {/* Mobile Arrows */}
          <div className="flex md:hidden flex-col items-center gap-2 py-4">
            <ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" />
          </div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 grid sm:grid-cols-3 gap-4"
          >
            {[
              { icon: '🚫', text: 'No seed phrases to remember' },
              { icon: '🚫', text: 'No external wallet apps' },
              { icon: '✅', text: 'Direct bank transfers' },
            ].map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm"
              >
                <span>{benefit.icon}</span>
                <span className="text-muted-foreground">{benefit.text}</span>
              </div>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">Already have a crypto wallet?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Great! You can connect MetaMask, Coinbase Wallet, Rainbow, or any WalletConnect-compatible wallet 
              to receive $ZSOLAR directly. It's optional—our built-in wallet works for everyone.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
