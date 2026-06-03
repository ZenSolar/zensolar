import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

export function HomeCTA() {
  const { mediumTap } = useHaptics();
  return (
    <section className="py-[clamp(3rem,8vw,6rem)] border-t border-border/40">
      <div className="container max-w-3xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-secondary/30 bg-secondary/5 p-7 md:p-10 text-center"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">
            Join the Beta
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-[1.1] text-foreground mb-3">
            Ready to turn your clean energy into digital income?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-7 leading-relaxed">
            Earn $ZSOLAR for every kWh your solar panels produce, your battery stores,
            and your EV drives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              onClick={mediumTap}
              className="w-full sm:w-auto h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-7"
            >
              <Link to="/auth">
                <Zap className="mr-2 h-4 w-4" />
                Start Earning Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              onClick={mediumTap}
              className="w-full sm:w-auto h-11 border-border/60 hover:bg-card/60 px-7"
            >
              <Link to="/demo">Try the Demo First</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm italic text-muted-foreground">
            <Sparkles className="inline h-3.5 w-3.5 text-secondary mr-1.5 -mt-0.5" />
            Bitcoin tokenized scarcity. We&apos;re tokenizing abundance.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
