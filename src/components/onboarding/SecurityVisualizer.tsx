import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, KeyRound, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityVisualizerProps {
  /** Which node is currently "active" */
  activeStep: 0 | 1 | 2 | 3;
  title?: string;
  subtitle?: string;
}

const NODES = [
  { icon: Fingerprint, label: 'Face ID', sub: 'on your device' },
  { icon: KeyRound, label: 'Encrypted Key', sub: 'never leaves device' },
  { icon: BaseMark, label: 'Base Network', sub: 'your wallet, on-chain' },
];

function BaseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="11" />
    </svg>
  );
}

export function SecurityVisualizer({
  activeStep,
  title = 'Creating your wallet',
  subtitle = 'Your Face ID generates a key that only your device can unlock.',
}: SecurityVisualizerProps) {
  return (
    <div className="text-center w-full">
      <div className="relative mx-auto mb-10 max-w-[320px]">
        {/* Connecting rail */}
        <div className="absolute top-7 left-[14%] right-[14%] h-px bg-border/60 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/0 via-primary to-primary/0"
            initial={{ x: '-100%' }}
            animate={{ x: activeStep >= 1 ? '0%' : '-100%' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative grid grid-cols-3 gap-2">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const isDone = activeStep > i;
            const isActive = activeStep === i;
            return (
              <div key={node.label} className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    'relative w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors',
                    isDone
                      ? 'border-primary/60 bg-primary/10'
                      : isActive
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 bg-card/60',
                  )}
                  animate={
                    isActive
                      ? {
                          boxShadow: [
                            '0 0 0 0 hsl(var(--primary) / 0.35)',
                            '0 0 0 14px hsl(var(--primary) / 0)',
                          ],
                        }
                      : { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' }
                  }
                  transition={{ duration: 1.6, repeat: isActive ? Infinity : 0 }}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-colors',
                      isDone || isActive ? 'text-primary' : 'text-muted-foreground/70',
                    )}
                  />
                  <AnimatePresence>
                    {isDone && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <p
                  className={cn(
                    'mt-3 text-[11px] font-medium leading-tight transition-colors',
                    isDone || isActive ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  {node.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">
                  {node.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );
}
