import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Cpu } from 'lucide-react';
import { SEO } from '@/components/SEO';

// Import focused components
import { SimpleThreeSteps } from '@/components/how-it-works/SimpleThreeSteps';
import { ConnectivityGrid } from '@/components/how-it-works/ConnectivityGrid';
import { ValueSourceSection } from '@/components/how-it-works/ValueSourceSection';
import { TrustSignals } from '@/components/how-it-works/TrustSignals';
import { CashOutExplainer } from '@/components/how-it-works/CashOutExplainer';
import { HowItWorksFAQ } from '@/components/how-it-works/HowItWorksFAQ';

export default function HowItWorks() {
  return (
    <>
      <SEO 
        title="How It Works | ZenSolar"
        url="https://zensolar.lovable.app/how-it-works"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5"
        >
          <Badge variant="outline" className="px-4 py-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sun className="h-3.5 w-3.5 mr-2" />
            Simple & Transparent
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Turn Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Real Money
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No crypto experience required. Connect your solar system or EV, 
            earn rewards automatically, and cash out directly to your bank account.
          </p>
        </motion.div>

        {/* Section 1: Three Steps */}
        <SimpleThreeSteps />

        {/* Section 2: Value Source (addresses "too good to be true") */}
        <ValueSourceSection />

        {/* Section 3: Connectivity */}
        <ConnectivityGrid />

        {/* Section 4: Cash Out Path */}
        <CashOutExplainer />

        {/* Section 5: Trust Signals */}
        <TrustSignals />

        {/* Section 6: FAQ */}
        <HowItWorksFAQ />

        {/* Tech Link (for curious users) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Link 
            to="/technology" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border hover:bg-muted transition-all group text-sm"
          >
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Want the technical details?</span>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
              View our Technology
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-4"
        >
          <h2 className="text-2xl font-bold">Ready to Start Earning?</h2>
          <p className="text-muted-foreground">
            Join thousands of solar and EV owners already earning rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 shadow-lg">
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/demo">
                Try the Demo
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
