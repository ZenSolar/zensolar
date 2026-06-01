import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-energy/10" />
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Plug in.{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-energy bg-clip-text text-transparent">
              Start minting.
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-base md:text-lg">
            Connect your Tesla, Enphase, SolarEdge, or Wallbox in under a minute.
            Every verified kWh from that moment on becomes $ZSOLAR.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base border-primary/40 hover:bg-primary/10">
                <Play className="mr-2 h-4 w-4" />
                View Live Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
