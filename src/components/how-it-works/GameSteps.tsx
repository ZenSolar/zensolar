import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Link2, Zap, Sparkles, Wallet, Sun, BatteryFull, Car, Plug } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solarEdgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

interface StepProps {
  number: string;
  title: string;
  body: string;
  keyMessage: string;
  icon: React.ElementType;
  children?: React.ReactNode;
  reversed?: boolean;
}

function GameStep({ number, title, body, keyMessage, icon: Icon, children, reversed }: StepProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="py-12 md:py-20"
    >
      <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}>
        {/* Visual side */}
        <div className="flex-1 flex justify-center">
          <motion.div
            whileInView={{ scale: [0.9, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Large step number watermark */}
            <span className="absolute -top-6 -left-4 text-[8rem] md:text-[10rem] font-black text-foreground/[0.03] leading-none select-none pointer-events-none">
              {number}
            </span>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/5">
              <Icon className="h-14 w-14 md:h-18 md:w-18 text-primary" />
            </div>
          </motion.div>
        </div>

        {/* Text side */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Step {number}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            {title}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
            {body}
          </p>
          <p className="text-sm text-accent font-medium italic">
            {keyMessage}
          </p>
          {children}
        </div>
      </div>
    </motion.section>
  );
}

export const GameSteps = forwardRef<HTMLDivElement>(function GameSteps(_, ref) {
  return (
    <div ref={ref} className="container max-w-5xl mx-auto px-4 divide-y divide-border/30">
      {/* Step 1: Connect */}
      <GameStep
        number="1"
        icon={Link2}
        title="Connect Your Gear"
        body="Link your solar panels, Powerwall, or EV in under 60 seconds. We support Tesla, Enphase, SolarEdge, Wallbox, and more. No hardware needed — just sign in with your manufacturer account."
        keyMessage="You already own the equipment. This is effortless."
      >
        {/* Provider logos */}
        <div className="flex items-center gap-5 pt-3 justify-center md:justify-start">
          {[
            { src: teslaLogo, alt: 'Tesla' },
            { src: enphaseLogo, alt: 'Enphase' },
            { src: solarEdgeLogo, alt: 'SolarEdge' },
            { src: wallboxLogo, alt: 'Wallbox' },
          ].map(p => (
            <img key={p.alt} src={p.src} alt={p.alt} className="h-7 md:h-8 object-contain opacity-60 hover:opacity-100 transition-opacity" />
          ))}
        </div>
        <div className="flex items-center gap-6 pt-4 justify-center md:justify-start">
          <AnimatedCounter end={4} suffix="+" label="Providers" duration={1200} />
          <div className="w-px h-8 bg-border/40" />
          <AnimatedCounter end={60} suffix="s" label="Setup Time" duration={1500} />
        </div>
      </GameStep>

      {/* Step 2: Generate */}
      <GameStep
        number="2"
        icon={Zap}
        title="Do What You Already Do"
        body="Every kilowatt-hour your panels produce, every mile your EV drives, every time your battery powers your home — it all counts. We track it automatically, verified and secure."
        keyMessage=""
        reversed
      >
        {/* Mini activity icons */}
        <div className="flex items-center gap-4 pt-2 justify-center md:justify-start">
          {[
            { icon: Sun, label: 'Solar' },
            { icon: BatteryFull, label: 'Battery' },
            { icon: Car, label: 'EV Miles' },
            { icon: Plug, label: 'EV Charging' },
          ].map(d => (
            <div key={d.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/40">
              <d.icon className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        {/* Earning rate lines */}
        <div className="pt-4 max-w-xs mx-auto md:mx-0 space-y-2.5">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <Sun className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">1 kWh</span>
            <span className="text-xs text-muted-foreground">=</span>
            <span className="text-sm font-bold text-primary">1 $ZSOLAR</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-accent/5 border border-accent/20">
            <Car className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-semibold text-foreground">1 EV Mile</span>
            <span className="text-xs text-muted-foreground">=</span>
            <span className="text-sm font-bold text-accent">1 $ZSOLAR</span>
          </div>
        </div>
        <div className="flex items-center gap-6 pt-4 justify-center md:justify-start">
          <AnimatedCounter end={25} suffix=" kWh" label="Daily Solar" duration={1800} />
          <div className="w-px h-8 bg-border/40" />
          <AnimatedCounter end={750} suffix=" kWh" label="Monthly Total" duration={2000} />
        </div>
      </GameStep>

      {/* Step 3: Mint */}
      <GameStep
        number="3"
        icon={Sparkles}
        title="Tap to Mint"
        body="When you're ready, tap one button. Your verified clean energy activity is converted into $ZSOLAR tokens — real digital assets in your Rewards Account. Each token is a permanent, irreversible claim on a specific unit of energy that can never be tokenized again. The 1st kWh your solar system generates — one token. The 500th EV mile — one token. Once claimed, that energy is cryptographically retired forever. Requires a Pro or Elite subscription."
        keyMessage="One tap. Permanent proof. No crypto knowledge required."
      >
        {/* Mint animation hint */}
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 mt-2"
          animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.2)', '0 0 0px hsl(var(--primary) / 0)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Tap to Mint</span>
        </motion.div>
        <div className="flex items-center gap-6 pt-4 justify-center md:justify-start">
          <AnimatedCounter end={562} prefix="+" suffix="" label="$ZSOLAR / Month" duration={2000} />
          <div className="w-px h-8 bg-border/40" />
          <AnimatedCounter end={75} suffix="%" label="To Your Wallet" duration={1200} />
        </div>
      </GameStep>

      {/* Step 4: Cash Out */}
      <GameStep
        number="4"
        icon={Wallet}
        title="Enjoy Your Rewards"
        body="Withdraw to your bank account anytime, or hold your tokens as they grow in value. Your solar panels are now a second income stream."
        keyMessage="Real money. Your choice when."
        reversed
      >
        <div className="flex items-center gap-6 pt-4 justify-center md:justify-start">
          <AnimatedCounter end={56} prefix="$" label="Monthly @ $0.10" duration={2200} />
          <div className="w-px h-8 bg-border/40" />
          <AnimatedCounter end={675} prefix="$" label="Yearly Est." duration={2500} />
        </div>
      </GameStep>
    </div>
  );
});
