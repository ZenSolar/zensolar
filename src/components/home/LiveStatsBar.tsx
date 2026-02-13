import { motion } from 'framer-motion';
import { Users, Zap, Coins, Leaf } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function LiveStatsBar() {
  const stats: StatItem[] = [
    { icon: Users, label: 'Beta Status', value: '🟢 Live', color: 'text-primary' },
    { icon: Zap, label: 'kWh Tracked', value: formatNumber(1028539), color: 'text-solar' },
    { icon: Coins, label: '$ZSOLAR Minted', value: '623K', color: 'text-token' },
    { icon: Leaf, label: 'kg CO₂ Offset', value: formatNumber(431987), color: 'text-secondary' },
  ];

  return (
    <section className="py-6 bg-muted/50 dark:bg-muted/20 border-y border-border/40">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-1"
            >
              <stat.icon className={`h-6 w-6 ${stat.color} mb-1`} />
              <span className="text-lg md:text-2xl font-bold text-foreground tracking-tight">{stat.value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
