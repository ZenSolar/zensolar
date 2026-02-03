import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, ShoppingBag, PiggyBank, ArrowRight, Coins, TrendingUp } from 'lucide-react';

const valueFlows = [
  {
    icon: Users,
    title: 'Premium Members',
    description: '$9.99–$19.99/mo subscriptions',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace & Store',
    description: 'Product sales & partnerships',
  },
];

export function ValueSourceSection() {
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
          Where Does the Value Come From?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base"
        >
          Unlike get-rich-quick schemes, ZenSolar rewards come from real business revenue—not new user deposits.
        </motion.p>
      </div>

      {/* Value Flow Diagram */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-center">
            {/* Revenue Sources */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">
                Revenue Sources
              </p>
              {valueFlows.map((flow, index) => (
                <motion.div
                  key={flow.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <flow.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{flow.title}</p>
                    <p className="text-xs text-muted-foreground">{flow.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Arrow 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden md:flex items-center justify-center"
            >
              <div className="relative">
                <ArrowRight className="h-6 w-6 text-primary/60" />
                {/* Animated flow dots */}
                <motion.div
                  animate={{ x: [0, 24, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary"
                />
              </div>
            </motion.div>

            {/* Reward Pool */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="p-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/30 mb-4"
              >
                <PiggyBank className="h-8 w-8 text-accent-foreground" />
              </motion.div>
              <p className="font-bold text-foreground text-lg">Reward Pool</p>
              <p className="text-xs text-muted-foreground mt-1">Funded by real revenue</p>
              
              {/* Animated dollars flowing in */}
              <div className="relative mt-3 h-8 w-full">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0],
                      y: [-20, 0, 0, 20],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeInOut"
                    }}
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ left: `${30 + i * 20}%` }}
                  >
                    <DollarSign className="h-4 w-4 text-secondary" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Arrow 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="hidden md:flex items-center justify-center"
            >
              <div className="relative">
                <ArrowRight className="h-6 w-6 text-primary/60" />
                <motion.div
                  animate={{ x: [0, 24, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                />
              </div>
            </motion.div>

            {/* Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg shadow-secondary/30 mb-4">
                <DollarSign className="h-7 w-7 text-secondary-foreground" />
              </div>
              <p className="font-bold text-foreground text-lg">Your Rewards</p>
              <p className="text-xs text-muted-foreground mt-1">Based on verified energy activity</p>
            </motion.div>
          </div>

          {/* Mobile Flow Indicators */}
          <div className="flex md:hidden flex-col items-center py-4 gap-2">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-5 w-5 text-primary/60 rotate-90" />
            </motion.div>
          </div>

          {/* Credit Card Analogy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center"
          >
            <p className="text-sm font-medium text-foreground">
              💡 Think of it like credit card rewards—you earn when you use our platform, funded by the business, not by other users.
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* Token Value Explainer */}
      <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 to-card">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20 flex-shrink-0"
            >
              <Coins className="h-6 w-6 text-accent-foreground" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="font-bold text-foreground text-lg md:text-xl">
                Why Does $ZSOLAR Have a Dollar Value?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When we launch $ZSOLAR, we pair it with real US dollars in a trading pool. 
                This instantly creates a market price—similar to how a gift card has value 
                because actual money backs it.
              </p>
            </div>
          </div>

          {/* Visual Equation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-6 rounded-2xl bg-card border border-border"
          >
            <div className="text-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center mx-auto mb-2"
              >
                <DollarSign className="h-8 w-8 text-secondary" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground">Real Dollars</p>
            </div>
            
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-bold text-muted-foreground/50"
            >
              +
            </motion.span>
            
            <div className="text-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-2"
              >
                <Coins className="h-8 w-8 text-accent" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground">$ZSOLAR</p>
            </div>
            
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="text-2xl font-bold text-muted-foreground/50"
            >
              =
            </motion.span>
            
            <div className="text-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-2"
              >
                <TrendingUp className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground">Market Price</p>
            </div>
          </motion.div>

          {/* Animated Growing Pool Visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative p-4 rounded-xl bg-gradient-to-r from-secondary/5 via-accent/10 to-primary/5 border border-border overflow-hidden"
          >
            {/* Flowing dollars animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: '-10%', opacity: 0 }}
                  animate={{ 
                    x: '110%',
                    opacity: [0, 0.6, 0.6, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "linear"
                  }}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ top: `${20 + i * 15}%` }}
                >
                  <DollarSign className="h-4 w-4 text-secondary/40" />
                </motion.div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed text-center relative z-10">
              As subscription revenue flows into the pool, the backing grows—which can increase the token's value over time. 
              <span className="block mt-1 font-medium text-foreground">
                This isn't speculation; it's straightforward economics.
              </span>
            </p>
          </motion.div>

          {/* Subtle Reassurance */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Your rewards are backed by real business revenue, not promises.</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
