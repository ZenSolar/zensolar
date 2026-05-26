import { motion } from 'framer-motion';
import { Diamond } from 'lucide-react';

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className = '' }: SectionDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 1, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, ease: [1, 0, 0, 1] as const }}
      className={`relative flex items-center justify-center my-1 ${className}`}
    >
      {/* Left glow line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/10" />
      
      {/* Center diamond with glow */}
      <div className="relative mx-3 flex items-center justify-center">
        {/* Outer glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rotate-45 bg-primary/10 blur-md" />
        </div>
        {/* Inner diamond */}
        <div className="relative h-2.5 w-2.5 rotate-45 border border-primary/40 bg-background/80 flex items-center justify-center">
          <Diamond className="h-1.5 w-1.5 text-primary/60 -rotate-45" />
        </div>
      </div>
      
      {/* Right glow line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/10" />
      
      {/* Optional label */}
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="absolute -bottom-5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground/50 font-medium"
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
