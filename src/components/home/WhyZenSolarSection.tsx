import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, TrendingUp, Gamepad2, Flame, Award, DollarSign, ArrowRight } from 'lucide-react';

export function WhyZenSolarSection() {
  return (
    <section id="why-zensolar" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium mb-4">
              Why ZenSolar?
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Your Clean Energy is a{' '}
            <span className="bg-gradient-to-r from-solar via-accent to-primary bg-clip-text text-transparent">
              Game Worth Playing
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Every kWh you produce, store, and drive is a move in the game. ZenSolar tracks your impact, rewards your progress, and turns sustainable living into a rewarding experience.
          </motion.p>
        </div>

        {/* Gamification pillars */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: Target, title: 'Track Your Impact', desc: 'See your solar production, battery cycles, and EV miles in real-time. Every action is measured, verified, and added to your clean energy score.', color: 'text-primary', border: 'border-primary/20', bg: 'from-primary/5' },
            { icon: Trophy, title: 'Earn Tokens & NFTs', desc: 'Hit milestones, unlock achievement NFTs, and earn $ZSOLAR tokens automatically. The more you contribute, the more you earn.', color: 'text-solar', border: 'border-solar/20', bg: 'from-solar/5' },
            { icon: TrendingUp, title: 'Level Up Over Time', desc: 'Build streaks, climb leaderboards, and compound your rewards. Your clean energy lifestyle gets more valuable every day.', color: 'text-secondary', border: 'border-secondary/20', bg: 'from-secondary/5' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`h-full border ${item.border} bg-gradient-to-br ${item.bg} to-card hover:shadow-lg transition-shadow`}>
                <CardContent className="p-5 flex gap-4">
                  <item.icon className={`h-6 w-6 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* The rewards engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-secondary/5 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium mb-4">
                  The Rewards Engine
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  Built to Keep You{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Motivated & Rewarded
                  </span>
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Unlike one-time government incentives, ZenSolar delivers continuous, compounding rewards — turning your daily clean energy habits into lasting value.
                </p>
              </div>

              {/* Game mechanics */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[
                  { icon: Gamepad2, title: 'Daily Challenges', desc: 'Complete energy goals and unlock bonus token multipliers' },
                  { icon: Flame, title: 'Streak Rewards', desc: 'Maintain consecutive days of production for escalating bonuses' },
                  { icon: Award, title: 'Achievement NFTs', desc: 'Earn unique collectibles for milestones like 1 MWh produced' },
                  { icon: TrendingUp, title: 'Compounding Value', desc: 'Your $ZSOLAR grows as the ecosystem and token demand expand' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/50"
                  >
                    <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Earning projection */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-8 p-6 rounded-xl border border-solar/30 bg-gradient-to-r from-solar/10 via-transparent to-solar/10 text-center"
              >
                <DollarSign className="h-8 w-8 text-solar mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Projected annual earnings for a typical Solar + Battery + EV household</p>
                <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  $8,000 – $19,875
                  <span className="text-lg text-muted-foreground font-normal">/year</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on average US solar production, battery cycling, and EV usage at projected $1.00 $ZSOLAR target price
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
