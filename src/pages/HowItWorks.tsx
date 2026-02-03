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
import { AppDemoSection } from '@/components/how-it-works/AppDemoSection';

export default function HowItWorks() {
  return (
    <>
      <SEO 
        title="How It Works | ZenSolar"
        url="https://zensolar.lovable.app/how-it-works"
      />
      <div className="min-h-screen">
        {/* Hero with Background */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-primary/5 to-background" />
            
            {/* Radial glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/10 via-primary/5 to-transparent blur-3xl" />
            
            {/* Animated orbs */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-40 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -top-20 right-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
            />
            
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
            {/* Hero Content */}
            <motion.header 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge 
                  variant="outline" 
                  className="px-4 py-1.5 border-accent/40 bg-accent/10 text-accent font-semibold backdrop-blur-sm"
                >
                  <Sun className="h-3.5 w-3.5 mr-2" />
                  Simple & Transparent
                </Badge>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight"
              >
                Turn Clean Energy Into{' '}
                <span className="bg-gradient-to-r from-accent via-accent to-secondary bg-clip-text text-transparent">
                  Real Money
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                No crypto experience required. Connect your solar system or EV, 
                earn rewards automatically, and cash out directly to your bank account.
              </motion.p>
            </motion.header>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-4xl mx-auto px-4 pb-12 space-y-16">
          {/* Section 1: Three Steps */}
          <SimpleThreeSteps />

          {/* Section 2: App Demo */}
          <AppDemoSection />

          {/* Section 3: Value Source */}
          <ValueSourceSection />

          {/* Section 4: Connectivity */}
          <ConnectivityGrid />

          {/* Section 5: Cash Out Path */}
          <CashOutExplainer />

          {/* Section 6: Trust Signals */}
          <TrustSignals />

          {/* Section 7: FAQ */}
          <HowItWorksFAQ />

          {/* Tech Link */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link 
              to="/technology" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/50 border border-border hover:bg-muted hover:border-primary/20 transition-all duration-300 group text-sm"
            >
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Want the technical details?</span>
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                View our Technology
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* CTA */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-5 py-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Start Earning?</h2>
            <p className="text-muted-foreground">
              Join thousands of solar and EV owners already earning rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="hover:bg-muted/50">
                <Link to="/demo">
                  Try the Demo
                </Link>
              </Button>
            </div>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
