import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu } from 'lucide-react';

export function ReadyToPlayCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl mx-auto px-4 text-center space-y-8">
        {/* Tech link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/technology"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/50 border border-border hover:bg-muted hover:border-primary/20 transition-all duration-300 group text-sm"
          >
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Curious about the tech?</span>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
              See the Tech
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-5 pt-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Start?
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Start turning your clean energy into real rewards today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow text-base px-8">
              <Link to="/auth">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="hover:bg-muted/50 text-base px-8">
              <Link to="/demo">
                Try the Demo
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
