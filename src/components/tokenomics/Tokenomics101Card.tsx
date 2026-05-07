import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, TrendingUp, Lock, Sparkles } from 'lucide-react';
import { HowItWorksCTA } from '@/components/how-it-works/HowItWorksCTA';

interface Tokenomics101CardProps {
  className?: string;
  /** Compact = drops the heading, useful inside dashboards */
  compact?: boolean;
}

const rows = [
  {
    icon: Coins,
    text: 'Pick a plan: Base, Regular, or Power. Each one earns you $ZSOLAR for your clean energy.',
    color: 'text-token',
    bg: 'bg-token/10',
  },
  {
    icon: TrendingUp,
    text: 'Half of every subscription dollar automatically strengthens the token.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Lock,
    text: 'Your new tokens are locked for 12 months so the price can grow stronger.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Sparkles,
    text: 'Hold or stake longer and earn extra rewards.',
    color: 'text-solar',
    bg: 'bg-solar/10',
  },
];

export function Tokenomics101Card({ className = '', compact = false }: Tokenomics101CardProps) {
  return (
    <Card
      className={`border-border/60 bg-card/70 backdrop-blur-md shadow-sm overflow-hidden ${className}`}
    >
      <CardContent className="p-5 space-y-4">
        {!compact && (
          <div>
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Tokenomics 101</p>
            <h3 className="text-lg font-bold text-foreground mt-1">How $ZSOLAR works in 4 lines</h3>
          </div>
        )}

        <ul className="space-y-3">
          {rows.map((row, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg ${row.bg}`}>
                <row.icon className={`h-4 w-4 ${row.color}`} />
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{row.text}</p>
            </motion.li>
          ))}
        </ul>

        <HowItWorksCTA />
      </CardContent>
    </Card>
  );
}
