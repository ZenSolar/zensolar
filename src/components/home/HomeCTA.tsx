import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

export function HomeCTA() {
  const { mediumTap } = useHaptics();
  return (
    <section className="py-[clamp(4rem,10vw,8rem)]">
      <div className="container max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-solar/10 p-8 md:p-12 text-center"
        >
          {/* Glow effects */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl -z-10" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-solar/10 blur-3xl -z-10" />

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Turn Your Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-solar via-accent to-primary bg-clip-text text-transparent">
              Digital Income
            </span>
            ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
            Join our beta and start earning $ZSOLAR tokens for every kWh your solar panels produce, your battery stores, and your EV drives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" onClick={mediumTap} className="px-10 py-6 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-[1.02]">
                <Zap className="mr-2 h-5 w-5" />
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" onClick={mediumTap} className="px-8 py-6 text-base border-primary/40 hover:bg-primary/10">
                Try the Demo First
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
