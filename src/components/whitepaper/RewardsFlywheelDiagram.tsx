import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Droplets, TrendingUp, Coins, Repeat, DollarSign } from "lucide-react";

const steps = [
  {
    icon: Users,
    label: 'Subscribers Pay',
    sub: '$9.99–$19.99/mo subscriptions',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: DollarSign,
    label: '50% → Liquidity Pool',
    sub: 'Automatic USDC injection via bridge',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Droplets,
    label: 'Deeper Liquidity',
    sub: 'Token floor price rises continuously',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: TrendingUp,
    label: 'Higher Token Value',
    sub: '$ZSOLAR appreciates toward $1.00+',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Coins,
    label: 'More Valuable Rewards',
    sub: 'User earnings compound with price',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
];

export function RewardsFlywheelDiagram() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-emerald-500/5 via-background to-primary/5 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-emerald-500">
            <Repeat className="h-5 w-5 text-white" />
          </div>
          Revenue-Backed Flywheel
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Subscription revenue fuels a self-reinforcing loop that strengthens with every new user.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vertical flow */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-6 top-6 bottom-6 w-px border-l-2 border-dashed border-border/40 z-0" />

          <div className="space-y-3 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                className={`flex items-center gap-4 p-4 rounded-xl border ${step.border} ${step.bg} backdrop-blur-sm`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center`}>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Loop indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Repeat className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              More users → deeper LP → higher floor → repeat
            </span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
