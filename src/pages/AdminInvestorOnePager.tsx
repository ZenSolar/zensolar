import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Coins, 
  Flame, 
  Users, 
  TrendingUp, 
  Droplets, 
  Target,
  CheckCircle2,
  Rocket,
  Zap,
  Shield,
  Award,
  DollarSign,
  Globe,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Key metrics for investors - UPDATED FOR $0.50 FLOOR MODEL
const KEY_METRICS = {
  maxSupply: "10B $ZSOLAR",
  launchPrice: "$0.50",
  launchLP: "$125K USDC + 250K tokens",
  subscriptionPrice: "$9.99/mo",
  lpInjection: "50% of subs → LP",
  mintBurn: "15%",
  transferTax: "7% (3.5% burn + 3.5% treasury)",
  sellRateAssumption: "15-25% monthly",
};

const TRACTION_HIGHLIGHTS = [
  { metric: "4", label: "Vendor APIs", description: "Tesla, Enphase, SolarEdge, Wallbox" },
  { metric: "100%", label: "Gas Sponsored", description: "Zero friction for users" },
  { metric: "Live", label: "Testnet Mints", description: "$ZSOLAR + NFTs on Base Sepolia" },
  { metric: "Filed", label: "Provisional Patent", description: "April 2025, US jurisdiction" },
];

const FLYWHEEL_STEPS = [
  { step: 1, title: "User Subscribes", description: "$9.99/month for Pro access", icon: Users },
  { step: 2, title: "50% → Liquidity Pool", description: "$4.995 per user to LP", icon: Droplets },
  { step: 3, title: "User Earns $ZSOLAR", description: "~1,000 tokens/month (1:1 kWh/miles)", icon: Coins },
  { step: 4, title: "Burn on Mint", description: "15% burned immediately", icon: Flame },
  { step: 5, title: "Price Floor Rises", description: "LP absorption > sell pressure", icon: TrendingUp },
  { step: 6, title: "Viral Referrals", description: "$400-800/mo earnings → word of mouth", icon: Rocket },
];

const USE_OF_FUNDS = [
  { category: "Legal & IP", amount: "$100-150K", percentage: 20 },
  { category: "Security Audit", amount: "$50-75K", percentage: 12 },
  { category: "Mainnet Launch", amount: "$75-100K", percentage: 15 },
  { category: "Team (12-18 mo)", amount: "$200-300K", percentage: 40 },
  { category: "Marketing", amount: "$50-100K", percentage: 13 },
];

export default function AdminInvestorOnePager() {
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
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-8 max-w-5xl print:max-w-none print:py-2">
      {/* Header */}
      <motion.div {...fadeIn} className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">Investor One-Pager</Badge>
          <Badge className="bg-primary/20 text-primary">Pre-Seed</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">$ZSOLAR</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gamifying clean energy with blockchain rewards. Turn solar production, EV miles, and battery storage into tradable tokens and NFTs.
        </p>
      </motion.div>

      {/* Key Value Prop */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3 text-center">
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-primary/20 w-fit mx-auto">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">$0.50 Price Floor</h3>
                <p className="text-sm text-muted-foreground">
                  $125K USDC paired 1:2 with 250K tokens at launch
                </p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/20 w-fit mx-auto">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg">$400-$800/Month</h3>
                <p className="text-sm text-muted-foreground">
                  User earning potential (1,000 tokens × $0.50-$0.80)
                </p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-amber-500/20 w-fit mx-auto">
                  <Shield className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg">15-25% Sell Rate</h3>
                <p className="text-sm text-muted-foreground">
                  Realistic assumption vs. optimistic models
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Traction */}
      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Traction & Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {TRACTION_HIGHLIGHTS.map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{item.metric}</p>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Flywheel */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Revenue Flywheel
            </CardTitle>
            <CardDescription>Self-reinforcing economics that scale with user growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {FLYWHEEL_STEPS.map((step) => (
                <div key={step.step} className="relative p-3 rounded-lg border bg-card/50 text-center">
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                  <step.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-xs">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tokenomics Summary */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-amber-500" />
                Token Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Max Supply</span>
                <span className="font-mono font-bold">{KEY_METRICS.maxSupply}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Launch Price</span>
                <span className="font-mono font-bold text-emerald-600">{KEY_METRICS.launchPrice}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Initial LP</span>
                <span className="font-mono text-sm">{KEY_METRICS.launchLP}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Mint Burn</span>
                <span className="font-mono font-bold text-destructive">{KEY_METRICS.mintBurn}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Transfer Tax</span>
                <span className="font-mono text-sm">{KEY_METRICS.transferTax}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-purple-500" />
                Token Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Community Rewards</span>
                  <span className="font-bold">90%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "90%" }} />
                </div>
                <p className="text-xs text-muted-foreground">Dual-gate unlocks: Paying Users + Impact Score</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Treasury</p>
                  <p className="font-bold">7.5% <span className="text-xs font-normal text-muted-foreground">(2yr vest)</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground">Founder</p>
                  <p className="font-bold">2.5% <span className="text-xs font-normal text-muted-foreground">(3yr vest)</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Fresh Start Model */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-emerald-500" />
              Fresh Start Model
              <Badge className="bg-emerald-500/20 text-emerald-600 text-xs">Key Innovation</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Users earn tokens only for <strong className="text-foreground">NEW activity</strong> after connecting their device. 
              Historical lifetime data is recognized via non-inflationary <strong className="text-foreground">Pioneer NFTs</strong> (Bronze → Platinum tiers).
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="font-medium text-sm">Launch Floor</p>
                <p className="text-2xl font-bold text-primary">$0.50</p>
                <p className="text-xs text-muted-foreground">$125K USDC / 250K tokens</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="font-medium text-sm">Target Range</p>
                <p className="text-2xl font-bold text-emerald-600">$0.50-$1.00</p>
                <p className="text-xs text-muted-foreground">Balanced for growth</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="font-medium text-sm">Expected Sell Rate</p>
                <p className="text-2xl font-bold text-amber-600">15-25%</p>
                <p className="text-xs text-muted-foreground">Monthly token liquidation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Use of Funds */}
      <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Pre-Seed Use of Funds
              <Badge variant="outline">$500K - $750K</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {USE_OF_FUNDS.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="font-mono">{item.amount}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Target Valuation</span>
              <span className="font-bold">$5M - $7.5M</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Competitive Moat */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Competitive Moat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Globe, title: "Multi-Vendor APIs", description: "Tesla, Enphase, SolarEdge, Wallbox integrations" },
                { icon: Lock, title: "Patent Pending", description: "Provisional filed April 2025" },
                { icon: Zap, title: "Gas Sponsorship", description: "Zero friction, project pays all fees" },
                { icon: Shield, title: "Fresh Start Model", description: "Sustainable tokenomics from day one" },
              ].map((item) => (
                <div key={item.title} className="p-3 rounded-lg border bg-card/50 space-y-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer CTA */}
      <motion.div {...fadeIn} transition={{ delay: 0.45 }} className="text-center space-y-4 pb-8">
        <Separator />
        <p className="text-sm text-muted-foreground">
          For detailed financial models, see the <strong>Admin Tokenomics 10B</strong> and <strong>Investment Thesis</strong> pages.
        </p>
        <p className="text-xs text-muted-foreground italic">
          This document is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy securities.
        </p>
      </motion.div>
    </div>
  );
}
