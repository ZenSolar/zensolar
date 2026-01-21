import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Coins, 
  Flame, 
  Lock, 
  Zap, 
  Car, 
  Battery, 
  Building2,
  CheckCircle2,
  ArrowRight,
  Target,
  Rocket,
  BarChart3,
  Globe,
  Award,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function InvestmentThesis() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardTitle className="text-destructive">Access Denied</CardTitle>
          <CardDescription className="mt-2">This page is only accessible to administrators.</CardDescription>
        </Card>
      </div>
    );
  }
  const growthProjections = [
    { users: "1,000", monthlyLP: "$1,500", annualLP: "$18,000", tokenBurn: "~500K/mo" },
    { users: "5,000", monthlyLP: "$7,500", annualLP: "$90,000", tokenBurn: "~2.5M/mo" },
    { users: "10,000", monthlyLP: "$15,000", annualLP: "$180,000", tokenBurn: "~5M/mo" },
    { users: "25,000", monthlyLP: "$37,500", annualLP: "$450,000", tokenBurn: "~12.5M/mo" },
    { users: "50,000", monthlyLP: "$75,000", annualLP: "$900,000", tokenBurn: "~25M/mo" },
    { users: "100,000", monthlyLP: "$150,000", annualLP: "$1,800,000", tokenBurn: "~50M/mo" },
  ];

  const competitiveAdvantages = [
    {
      icon: Zap,
      title: "Tesla Integration",
      description: "Direct API access to Solar, Powerwall, and Vehicle data",
      gradient: "from-red-500 to-red-600"
    },
    {
      icon: Building2,
      title: "Enphase Partnership",
      description: "OAuth integration with the #1 microinverter manufacturer",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: BarChart3,
      title: "SolarEdge Connected",
      description: "Real-time monitoring API for solar production data",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Car,
      title: "Wallbox Integration",
      description: "EV charging data from leading smart charger brand",
      gradient: "from-blue-500 to-blue-600"
    }
  ];

  const tokenAllocation = [
    { label: "User Rewards Pool", percentage: "90%", amount: "9B", color: "bg-primary" },
    { label: "Treasury/Operations", percentage: "7.5%", amount: "750M", color: "bg-accent" },
    { label: "Founder", percentage: "2.5%", amount: "250M", color: "bg-muted" },
  ];

  const flywheelSteps = [
    { step: 1, title: "Users Subscribe", description: "$9.99/month for on-chain minting", icon: Users },
    { step: 2, title: "Revenue Split", description: "50% of fees → Liquidity Pool", icon: Coins },
    { step: 3, title: "LP Grows", description: "Continuous floor price support", icon: TrendingUp },
    { step: 4, title: "Token Appreciates", description: "Rising floor attracts investors", icon: Rocket },
    { step: 5, title: "More Users Join", description: "Growth compounds the cycle", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container max-w-6xl mx-auto px-4 py-16 sm:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: -30 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="px-4 py-2 text-sm border-primary/50 bg-primary/10">
              <Target className="h-4 w-4 mr-2" />
              Investment Thesis
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Revenue-Backed
              </span>
              <br />
              <span className="text-foreground">Token Economics</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              $ZSOLAR isn't speculation—it's a utility token with real revenue flowing directly 
              to liquidity. As our user base grows, so does the token's price floor.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Badge className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                50% Subscription → LP
              </Badge>
              <Badge className="px-4 py-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
                <Flame className="h-4 w-4 mr-2" />
                10% Mint Burn + 3.5% Transfer
              </Badge>
              <Badge className="px-4 py-2 bg-blue-500/10 text-blue-600 border-blue-500/30">
                <Lock className="h-4 w-4 mr-2" />
                10B Max Supply
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-4 pb-16 space-y-16">
        {/* The Core Thesis */}
        <motion.section {...fadeIn} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                The Core Thesis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-xl font-medium text-foreground">
                More Users = More Subscription Revenue = Larger Liquidity Pool = Higher Token Floor
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unlike speculative tokens, $ZSOLAR has a direct, on-chain mechanism that converts 
                real business revenue into permanent liquidity. This creates a mathematically 
                rising price floor as the platform scales.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Revenue Flywheel */}
        <motion.section {...fadeIn} transition={{ delay: 0.2 }}>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold">The Revenue Flywheel</h2>
            <p className="text-muted-foreground mt-2">A self-reinforcing cycle of growth</p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {flywheelSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-xs font-bold text-primary mb-1">STEP {step.step}</div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < flywheelSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/50 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Unit Economics */}
        <motion.section {...fadeIn} transition={{ delay: 0.3 }}>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Unit Economics</Badge>
            <h2 className="text-3xl font-bold">Per-User Value Creation</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardDescription>Monthly Subscription</CardDescription>
                <CardTitle className="text-4xl font-bold text-emerald-600">$9.99</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Required for on-chain token minting</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardHeader className="pb-2">
                <CardDescription>LP Contribution (50%)</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">$4.99</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Per user, per month → Liquidity Pool</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardDescription>Annual LP per User</CardDescription>
                <CardTitle className="text-4xl font-bold text-amber-600">$59.88</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Permanent liquidity contribution</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Growth Projections */}
        <motion.section {...fadeIn} transition={{ delay: 0.4 }}>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Growth Projections</Badge>
            <h2 className="text-3xl font-bold">Scaling Economics</h2>
            <p className="text-muted-foreground mt-2">As user base grows, LP injection compounds</p>
          </div>

          <Card className="overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Paying Users</th>
                    <th className="px-6 py-4 text-left font-semibold">Monthly LP Injection</th>
                    <th className="px-6 py-4 text-left font-semibold">Annual LP Growth</th>
                    <th className="px-6 py-4 text-left font-semibold">Est. Token Burn</th>
                  </tr>
                </thead>
                <tbody>
                  {growthProjections.map((row, index) => (
                    <tr key={row.users} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-primary">{row.users}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.monthlyLP}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600">{row.annualLP}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{row.tokenBurn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.section>

        {/* Token Allocation */}
        <motion.section {...fadeIn} transition={{ delay: 0.5 }}>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">Token Distribution</Badge>
              <h2 className="text-3xl font-bold mb-4">$ZSOLAR Allocation</h2>
              <p className="text-muted-foreground mb-6">
                With 90% reserved for user rewards, the vast majority of tokens flow to 
                active participants in the clean energy economy.
              </p>

              <div className="space-y-4">
                {tokenAllocation.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.percentage} ({item.amount})</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: item.percentage }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-muted/50 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Vesting & Lockups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Founder Allocation (2.5%)</span>
                    <Badge variant="outline">3-Year Vest</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    6-month cliff, then linear monthly unlock over 30 months
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Treasury (7.5%)</span>
                    <Badge variant="outline">2-Year Vest</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Linear unlock for marketing, development, partnerships
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Community Rewards (90%)</span>
                    <Badge variant="secondary">Milestone-Gated</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlocked based on paying user milestones (1K → 5K → 10K → 25K → 50K)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Deflationary Mechanics */}
        <motion.section {...fadeIn} transition={{ delay: 0.6 }}>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Deflationary Design</Badge>
            <h2 className="text-3xl font-bold">Multiple Burn Mechanisms</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-500">10%</h3>
                <p className="font-medium mt-1">Mint Burn</p>
                <p className="text-sm text-muted-foreground mt-2">
                  10% of every mint is burned immediately
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-orange-500">3.5%</h3>
                <p className="font-medium mt-1">Transfer Burn</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Every transfer burns 3.5% permanently
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-500">2%</h3>
                <p className="font-medium mt-1">NFT Redemption Burn</p>
                <p className="text-sm text-muted-foreground mt-2">
                  When users redeem NFTs for tokens, 2% is burned
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-dashed">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-500">TBD</h3>
                <p className="font-medium mt-1">Store Redemption Burn</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Planned: Burn tokens when redeeming in the rewards store
                </p>
                <Badge variant="outline" className="mt-2">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Competitive Moat */}
        <motion.section {...fadeIn} transition={{ delay: 0.7 }}>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Competitive Moat</Badge>
            <h2 className="text-3xl font-bold">Barriers to Entry</h2>
            <p className="text-muted-foreground mt-2">
              API partnerships that take months to establish
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {competitiveAdvantages.map((advantage, index) => (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${advantage.gradient} flex items-center justify-center mb-4`}>
                      <advantage.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{advantage.title}</h3>
                    <p className="text-sm text-muted-foreground">{advantage.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-8 bg-gradient-to-r from-primary/10 via-background to-accent/10 border-primary/30">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">First-Mover Advantage</h4>
                  <p className="text-sm text-muted-foreground">
                    ZenSolar is the first platform to directly connect verified clean energy 
                    production with blockchain token rewards—creating a new category in the 
                    intersection of sustainability and Web3.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Security & Roadmap */}
        <motion.section {...fadeIn} transition={{ delay: 0.9 }}>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security & Audits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Smart contracts deployed on Base L2</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>ERC-20 & ERC-1155 OpenZeppelin standards</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Gasless minting via platform wallet</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
                  <Badge variant="outline">Planned</Badge>
                  <span className="text-muted-foreground">Third-party security audit before mainnet</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Roadmap Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Badge className="bg-emerald-500">Live</Badge>
                  <span>Beta on Base Sepolia testnet</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Badge className="bg-blue-500">Q2 2025</Badge>
                  <span>Subscription billing launch</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Badge className="bg-purple-500">Q3 2025</Badge>
                  <span>Mainnet deployment</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Badge className="bg-amber-500">Q4 2025</Badge>
                  <span>Staking & governance launch</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section {...fadeIn} transition={{ delay: 1.0 }}>
          <Card className="bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <CardContent className="py-12 text-center relative">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Power the Clean Energy Economy?
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-6">
                Join thousands of solar producers and EV owners earning real crypto rewards 
                for their sustainable lifestyle.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="px-6 py-3 text-base bg-white/20 hover:bg-white/30 cursor-pointer">
                  <Zap className="h-5 w-5 mr-2" />
                  Connect Your Solar
                </Badge>
                <Badge className="px-6 py-3 text-base bg-white/20 hover:bg-white/30 cursor-pointer">
                  <Car className="h-5 w-5 mr-2" />
                  Link Your EV
                </Badge>
                <Badge className="px-6 py-3 text-base bg-white/20 hover:bg-white/30 cursor-pointer">
                  <Battery className="h-5 w-5 mr-2" />
                  Add Your Battery
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer Note */}
        <motion.div {...fadeIn} transition={{ delay: 1.1 }} className="text-center text-sm text-muted-foreground">
          <Separator className="mb-6" />
          <p>
            This document is for informational purposes only and does not constitute financial advice. 
            Cryptocurrency investments carry risk. Please do your own research.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
