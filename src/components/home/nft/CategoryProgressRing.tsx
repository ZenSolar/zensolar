import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface CategoryProgressRingProps {
  icon: LucideIcon;
  label: string;
  earned: number;
  total: number;
  accentFrom: string;
  accentTo: string;
  delay?: number;
}

export function CategoryProgressRing({
  icon: Icon,
  label,
  earned,
  total,
  accentFrom,
  accentTo,
  delay = 0,
}: CategoryProgressRingProps) {
  const pct = (earned / total) * 100;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="5"
          />
          {/* Progress */}
          <motion.circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={`url(#grad-${label.replace(/\s/g, '')})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ delay: delay + 0.3, duration: 1.2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentFrom} />
              <stop offset="100%" stopColor={accentTo} />
            </linearGradient>
          </defs>
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-6 w-6 text-foreground/70" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{earned}</span>/{total}
        </p>
      </div>
    </motion.div>
  );
}
