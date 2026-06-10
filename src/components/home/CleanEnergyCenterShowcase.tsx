import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, BatteryFull, Car, Zap, ChevronRight, Wallet, Sparkles, ArrowRight, Leaf, Navigation } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

const kpiItems = [
  {
    icon: Sun,
    label: 'My Solar Roof Production',
    value: '28,742',
    unit: 'kWh',
    name: '',
    borderColor: 'border-l-solar',
    iconColor: 'text-solar',
    iconBg: 'bg-solar/10',
  },
  {
    icon: BatteryFull,
    label: 'Powerwall 3 Exported kWh',
    value: '2,476',
    unit: 'kWh',
    name: '',
    borderColor: 'border-l-secondary',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
  },
  {
    icon: Car,
    label: 'Model Y EV Miles',
    value: '70,103',
    unit: 'mi',
    name: '',
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: Zap,
    label: 'Tesla Supercharging',
    value: '2,580',
    unit: 'kWh',
    name: '',
    borderColor: 'border-l-energy',
    iconColor: 'text-energy',
    iconBg: 'bg-energy/10',
  },
  {
    icon: Navigation,
    label: 'FSD Miles (Proof-of-Delta™)',
    value: '14,206',
    unit: 'mi',
    name: '',
    borderColor: 'border-l-accent',
    iconColor: 'text-accent-foreground',
    iconBg: 'bg-accent/20',
  },
];

export function CleanEnergyCenterShowcase() {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();

  const pendingKwh = 1284;
  const expectedTokens = 1284;
  const usdValue = '$128.40';
  const co2Lbs = 1812;

  const handleTapToMint = () => {
    mediumTap();
    toast.success(`Proof of Genesis™ engaged · ${expectedTokens.toLocaleString()} $ZSOLAR queued`, {
      description: 'Continue in the live demo to write your proof on-chain.',
    });
    navigate('/demo');
  };

  return (
    <section id="clean-energy-center" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">Clean Energy Center</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-semibold tracking-tight leading-[1.1] mb-3"
          >
            Your Energy Command Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Track every kWh produced, every mile driven, and every battery cycle, all in one place. 
            Your lifetime clean energy impact, always up to date.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <Card className="relative rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
            {/* Proof of Genesis™ glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(120% 80% at 50% -10%, hsl(var(--primary) / 0.18), transparent 60%)',
              }}
            />
            <CardContent className="relative p-5 md:p-8">
              {/* Wallet preview */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/40 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">My Wallet</span>
                    <span className="text-xs text-muted-foreground">314,838 tokens · $0.10</span>
                  </div>
                </div>
                <span className="text-xl md:text-2xl font-bold text-foreground">$31,483</span>
              </div>

              {/* Clean Energy Center header */}
              <div className="flex flex-col items-center text-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Clean Energy Center</h3>
                <span className="text-xs text-muted-foreground mb-2">Last updated 11:19 PM</span>
                <div className="inline-grid grid-cols-2 gap-x-1 gap-y-0 mx-auto" style={{ justifyItems: 'center' }}>
                  <span className="text-[10px] tracking-wider uppercase font-medium text-secondary/70 whitespace-nowrap" style={{ textShadow: '0 0 8px hsl(142 76% 36% / 0.5)' }}>
                    Proof of Genesis™
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-medium whitespace-nowrap" style={{ color: 'hsl(142 76% 50% / 0.85)', textShadow: '0 0 10px hsl(142 76% 45% / 0.6), 0 0 20px hsl(142 76% 45% / 0.3)' }}>
                    Proof-of-Mint™
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-medium whitespace-nowrap" style={{ color: 'hsl(25 95% 60% / 0.85)', textShadow: '0 0 10px hsl(25 95% 55% / 0.6), 0 0 20px hsl(25 95% 55% / 0.3)' }}>
                    Proof-of-Origin™
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-medium whitespace-nowrap" style={{ color: 'hsl(270 80% 68% / 0.85)', textShadow: '0 0 10px hsl(270 80% 60% / 0.6), 0 0 20px hsl(270 80% 60% / 0.3)' }}>
                    Proof-of-Delta™
                  </span>
                </div>
              </div>

              {/* KPI cards */}
              <div className="space-y-3">
                {kpiItems.map((item, i) => (
                  <motion.button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      mediumTap();
                      toast.success(`Tap-to-Mint™ · ${item.label}`, {
                        description: `${item.value} ${item.unit} ready to mint. Continue in the live demo.`,
                      });
                      navigate('/demo');
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-muted/30 border-l-2 border-l-secondary/50 group hover:bg-muted/60 active:scale-[0.99] transition-all`}
                  >
                    <div className={`p-2.5 rounded-xl ${item.iconBg} flex-shrink-0`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground block">{item.name ? `${item.name} ${item.label}` : item.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-foreground">{item.value}</span>
                        <span className="text-sm text-muted-foreground">{item.unit}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </motion.button>
                ))}
              </div>

              {/* Tap to Mint — Proof of Genesis™ CTA */}
              <div className="mt-6 pt-6 border-t border-border/40 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      Expected
                    </div>
                    <div className="mt-1.5 text-2xl font-black text-primary tabular-nums leading-none">
                      {expectedTokens.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                      $ZSOLAR · {usdValue}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Leaf className="h-3 w-3 text-primary" />
                      CO₂ avoided
                    </div>
                    <div className="mt-1.5 text-2xl font-black text-foreground tabular-nums leading-none">
                      {co2Lbs.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">lbs (this mint)</div>
                  </div>
                </div>

                <p className="text-[11px] text-center text-muted-foreground tabular-nums">
                  {pendingKwh.toLocaleString()} kWh pending · 1 kWh = 1 $ZSOLAR
                </p>

                <Button
                  onClick={handleTapToMint}
                  size="lg"
                  className="w-full min-h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold animate-pulse-glow shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tap to Mint
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
