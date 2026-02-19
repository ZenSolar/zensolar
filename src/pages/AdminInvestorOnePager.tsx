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
  Lock,
  Star,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { ExportButtons } from "@/components/admin/ExportButtons";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Key metrics for investors - UPDATED FOR $0.10 FLOOR MODEL (OPTIMIZED)
const KEY_METRICS = {
  maxSupply: "10B $ZSOLAR",
  launchPrice: "$0.10",
  targetPrice: "$1.00 (10x)",
  launchLP: "$300K USDC + 3M tokens",
  subscriptionPrice: "$9.99/mo",
  lpInjection: "50% of subs → LP",
  mintBurn: "20%",
  transferTax: "7% (3% burn + 2% LP + 2% treasury)",
  sellRateAssumption: "15-25% monthly",
  seedTarget: "$1M-$2M",
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
  { step: 4, title: "Burn on Mint", description: "20% burned immediately", icon: Flame },
  { step: 5, title: "Price Floor Rises", description: "$0.10 → $1.00 trajectory", icon: TrendingUp },
  { step: 6, title: "Viral Referrals", description: "$100-1,000/mo earnings → word of mouth", icon: Rocket },
];

const USE_OF_FUNDS = [
  { category: "Liquidity Pool Seed", amount: "$300K", percentage: 20 },
  { category: "Legal & IP", amount: "$150K", percentage: 10 },
  { category: "Security Audit", amount: "$75K", percentage: 5 },
  { category: "Team (12-18 mo)", amount: "$400K", percentage: 30 },
  { category: "Marketing & Growth", amount: "$200K", percentage: 15 },
  { category: "Mainnet & Infrastructure", amount: "$150K", percentage: 10 },
  { category: "Reserve", amount: "$225K", percentage: 10 },
];

const MOONSHOT_SCENARIOS = [
  { price: "$5", label: "Conservative", subs: "50K+", driver: "Net-negative issuance", color: "amber" },
  { price: "$10", label: "Viral Adoption", subs: "100K+", driver: "Institutional interest", color: "orange" },
  { price: "$20+", label: "ESG Integration", subs: "250K+", driver: "Carbon market adoption", color: "purple" },
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
        <ExportButtons 
          pageTitle="Investor One-Pager" 
          getData={() => [
            ...Object.entries(KEY_METRICS).map(([key, value]) => ({ metric: key.replace(/([A-Z])/g, ' $1'), value })),
            ...USE_OF_FUNDS.map(f => ({ category: f.category, amount: f.amount, percentage: `${f.percentage}%` }))
          ]} 
        />
      </motion.div>

      {/* Tokenization Supercycle Banner */}
      <motion.div {...fadeIn} transition={{ delay: 0.08 }}>
        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-background to-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 shrink-0">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  External Validation · Coinbase / Bernstein · Feb 19, 2026
                </p>
                <p className="text-sm font-medium text-foreground leading-snug">
                  Tokenized assets hit a record{' '}
                  <span className="text-primary font-bold">$24.5B</span>.
                  {' '}Bernstein calls 2026 the start of a tokenization "supercycle" — 
                  BlackRock, JPMorgan &amp; Franklin Templeton are racing to tokenize treasuries, gold &amp; real estate.
                </p>
                <p className="text-xs text-muted-foreground">
                  $ZSOLAR tokenizes clean energy at the kWh level — an entirely uncaptured category. 
                  <em className="ml-1">Bitcoin is scarce because of math. $ZSOLAR is scarce because of physics + math.</em>
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {[
                  { val: '$24.5B', lbl: 'Market' },
                  { val: '2,800%', lbl: 'Stock growth' },
                  { val: '$432M', lbl: 'VC in 2026' },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="text-center">
                    <p className="text-lg font-bold text-primary leading-none">{val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
                <h3 className="font-bold text-lg">$0.10 Launch → $1.00</h3>
                <p className="text-sm text-muted-foreground">
                  $300K USDC seed creates 10x growth narrative
                </p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/20 w-fit mx-auto">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg">$100-$1,000/Month</h3>
                <p className="text-sm text-muted-foreground">
                  User earning potential (1,000 tokens × $0.10-$1.00)
                </p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-amber-500/20 w-fit mx-auto">
                  <Shield className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg">20% Mint Burn</h3>
                <p className="text-sm text-muted-foreground">
                  Aggressive deflation absorbs sell pressure
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
                <p className="text-2xl font-bold text-primary">$0.10</p>
                <p className="text-xs text-muted-foreground">$300K USDC / 3M tokens</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="font-medium text-sm">Target Price</p>
                <p className="text-2xl font-bold text-emerald-600">$1.00</p>
                <p className="text-xs text-muted-foreground">10x growth narrative</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="font-medium text-sm">Mint Burn Rate</p>
                <p className="text-2xl font-bold text-amber-600">20%</p>
                <p className="text-xs text-muted-foreground">Aggressive deflation</p>
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
              Seed Round Use of Funds
              <Badge variant="outline">$1M - $2M</Badge>
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
              <span className="font-bold">$10M - $15M</span>
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

      {/* Moonshot Scenarios */}
      <motion.div {...fadeIn} transition={{ delay: 0.45 }}>
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-amber-500" />
              Moonshot Scenarios
              <Badge className="bg-amber-500/20 text-amber-600 text-xs ml-2">Beyond $1.00</Badge>
            </CardTitle>
            <CardDescription>Aggressive deflation + viral adoption = wealth creation potential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {MOONSHOT_SCENARIOS.map((scenario) => (
                <div 
                  key={scenario.price} 
                  className={`p-4 rounded-xl text-center border ${
                    scenario.color === 'amber' ? 'bg-amber-500/5 border-amber-500/30' :
                    scenario.color === 'orange' ? 'bg-orange-500/5 border-orange-500/30' :
                    'bg-purple-500/5 border-purple-500/30'
                  }`}
                >
                  {scenario.color === 'amber' && <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />}
                  {scenario.color === 'orange' && <Rocket className="h-6 w-6 text-orange-500 mx-auto mb-2" />}
                  {scenario.color === 'purple' && <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />}
                  <p className={`text-2xl font-bold ${
                    scenario.color === 'amber' ? 'text-amber-600' :
                    scenario.color === 'orange' ? 'text-orange-600' :
                    'text-purple-600'
                  }`}>{scenario.price}</p>
                  <p className="font-medium text-sm">{scenario.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{scenario.subs} subscribers</p>
                  <p className="text-xs text-muted-foreground">{scenario.driver}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Wealth Math:</strong> 100K tokens earned over 8 years = 
                <span className="font-mono text-primary"> $100K</span> at $1.00, 
                <span className="font-mono text-amber-600"> $500K</span> at $5.00, 
                <span className="font-mono text-purple-600"> $1M+</span> at $10.00
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer CTA */}
      <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="text-center space-y-4 pb-8">
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
