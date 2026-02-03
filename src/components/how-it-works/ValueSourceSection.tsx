import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, ShoppingBag, PiggyBank, ArrowRight } from 'lucide-react';

const valueFlows = [
  {
    icon: Users,
    title: 'Premium Members',
    description: '$9.99–$19.99/month subscriptions',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace & Store',
    description: 'Product sales and partnerships',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export function ValueSourceSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Where Does the Value Come From?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlike get-rich-quick schemes, ZenSolar rewards come from real business revenue—not new user deposits.
        </p>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-6">
          {/* Value Flow Diagram */}
          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            {/* Revenue Sources */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wide">Revenue Sources</p>
              {valueFlows.map((flow, index) => (
                <motion.div
                  key={flow.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${flow.bgColor} border border-border/50`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${flow.color}`}>
                    <flow.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{flow.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{flow.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Arrow 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden md:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
            </motion.div>

            {/* Reward Pool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-orange-500/30 mb-3">
                <PiggyBank className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold text-foreground">Reward Pool</p>
              <p className="text-xs text-muted-foreground">Funded by real revenue</p>
            </motion.div>

            {/* Arrow 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="hidden md:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
            </motion.div>

            {/* Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg mb-3">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground">Your Rewards</p>
              <p className="text-xs text-muted-foreground">Distributed based on your verified energy activity</p>
            </motion.div>
          </div>

          {/* Mobile Flow */}
          <div className="flex md:hidden justify-center py-4">
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" />
              <span className="text-xs text-muted-foreground">flows into</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 rotate-90" />
            </div>
          </div>

          {/* Key Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
          >
            <p className="text-sm font-medium text-foreground">
              💡 Think of it like credit card rewards—you earn when you use our platform, funded by the business, not by other users.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
