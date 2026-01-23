import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, Zap, Battery, Car, Coins, Shield, TrendingUp, 
  ChevronRight, Sparkles, Globe, ArrowRight
} from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal.png';

const features = [
  {
    icon: Sun,
    title: "Solar Production",
    description: "Earn tokens for every kWh your panels generate",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Car,
    title: "EV Miles",
    description: "Get rewarded for every electric mile driven",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Battery,
    title: "Battery Storage",
    description: "Maximize earnings from home battery systems",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Zap,
    title: "EV Charging",
    description: "Earn from every charge session at home",
    gradient: "from-purple-500 to-pink-500",
  },
];

const benefits = [
  {
    icon: Coins,
    title: "$400-$1,000/Month",
    description: "Transform your clean energy into meaningful passive income",
  },
  {
    icon: Shield,
    title: "Hardware Agnostic",
    description: "Works with Tesla, Enphase, SolarEdge, Wallbox & more",
  },
  {
    icon: TrendingUp,
    title: "10x Growth Potential",
    description: "$0.10 launch floor with clear path to $1.00+",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={zenLogo} alt="ZenSolar" className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/white-paper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              White Paper
            </Link>
            <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Simplified static background - no blur transforms */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div 
            className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(142 76% 36%) 0%, transparent 70%)' }}
          />
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center space-y-8 max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1.5 border-primary/40 bg-primary/10 text-primary font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Now in Beta on Base Network
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Turn Clean Energy Into{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Digital Wealth
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ZenSolar rewards households with $ZSOLAR tokens for every kWh produced, 
              EV mile driven, and battery cycle stored.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                  Start Earning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  Try the Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Patent Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>Built on Base L2</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-24 bg-muted/40 border-y border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Four Ways to Earn
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect your existing clean energy hardware and start earning $ZSOLAR tokens automatically
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <Card className="h-full bg-card border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div>
                <Badge variant="outline" className="mb-4 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Why ZenSolar?
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Beyond Tax Credits—
                  <br />
                  <span className="text-primary">Perpetual Rewards</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Federal incentives are one-time and bureaucratic. $ZSOLAR rewards are ongoing, 
                  automatic, and grow as the token appreciates.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/60 border border-border/60 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Card className="relative bg-gradient-to-br from-card via-card to-muted/80 border-border/60 shadow-xl">
                <CardContent className="p-8 md:p-10">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
                      <Coins className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Average Monthly Earnings</p>
                      <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        $800
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">at $1.00 token price</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/60">
                      <div>
                        <p className="text-2xl font-bold text-primary">10x</p>
                        <p className="text-xs text-muted-foreground">Growth potential</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">$0.10</p>
                        <p className="text-xs text-muted-foreground">Launch price</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-muted/40 border-t border-border/40">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Monetize Your{' '}
              <span className="text-primary">Clean Energy?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Join the ZenSolar community and start earning blockchain rewards for the sustainable 
              lifestyle you're already living.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/white-paper">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  Read White Paper
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto" />
              <span className="text-sm text-muted-foreground">© 2026 ZenSolar. Patent Pending.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/white-paper" className="hover:text-foreground transition-colors">White Paper</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
