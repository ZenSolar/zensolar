import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, Zap, Battery, Car, Coins, Shield, TrendingUp, 
  ChevronRight, Sparkles, Globe, ArrowRight
} from 'lucide-react';
import zenLogo from '@/assets/zen-logo.png';

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <section className="relative py-20 md:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
              Now in Beta on Base Network
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Turn Clean Energy Into{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Digital Wealth
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              ZenSolar rewards households with $ZSOLAR tokens for every kWh produced, 
              EV mile driven, and battery cycle stored. Your sustainability, your rewards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/25">
                  Start Earning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Try the Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
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
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Four Ways to Earn
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect your existing clean energy hardware and start earning $ZSOLAR tokens automatically
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <Badge variant="outline" className="mb-4 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                  Why ZenSolar?
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Beyond Tax Credits—
                  <br />
                  <span className="text-primary">Perpetual Rewards</span>
                </h2>
                <p className="text-muted-foreground">
                  Federal incentives are one-time and bureaucratic. $ZSOLAR rewards are ongoing, 
                  automatic, and grow as the token appreciates—a renewable income for renewable energy.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50"
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
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-gradient-to-br from-card to-muted border-border/50">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-600">
                      <Coins className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Average Monthly Earnings</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                        $800
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">at $1.00 token price</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
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
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Monetize Your{' '}
              <span className="text-primary">Clean Energy?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join the ZenSolar community and start earning blockchain rewards for the sustainable 
              lifestyle you're already living.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/25">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/white-paper">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
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
              <span className="text-sm text-muted-foreground">© 2024 ZenSolar. Patent Pending.</span>
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
