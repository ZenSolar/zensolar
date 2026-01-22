import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Coins, 
  Flame, 
  Users, 
  Lock, 
  TrendingUp, 
  Droplets, 
  Building2, 
  Target,
  CheckCircle2,
  Clock,
  Rocket,
  BarChart3,
  Sparkles,
  PiggyBank,
  ArrowRight,
  Zap,
  Shield,
  Award,
  Calculator,
  DollarSign,
  AlertTriangle,
  Gauge
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, BarChart, ReferenceLine, Cell } from "recharts";

// 10B Token Strategy Constants - OPTIMIZED $0.10 LAUNCH FLOOR
const TOKEN_STRATEGY = {
  maxSupply: 10_000_000_000, // 10 billion hard cap
  founderAllocation: { percentage: 2.5, amount: 250_000_000, vestingYears: 3, cliffMonths: 6 },
  treasuryAllocation: { percentage: 7.5, amount: 750_000_000, vestingYears: 2 },
  communityRewards: { percentage: 90, amount: 9_000_000_000 },
  // $300K USDC paired with 3M tokens = $0.10 per token at launch (10x narrative to $1.00)
  initialCirculating: { tokens: 3_000_000, usdc: 300_000, price: 0.10, percentage: "0.03%" },
  targetPriceRange: { min: 0.10, max: 1.00 },
};

// Subscription Constants
const SUBSCRIPTION = {
  price: 9.99,
  lpShare: 0.50, // 50% goes to LP
  lpPerUser: 9.99 * 0.50, // $4.995 per paid user
};

// Mint Distribution - OPTIMIZED 20% BURN
const MINT_DISTRIBUTION = {
  user: 75,
  burn: 20,
  lp: 3,
  treasury: 2,
};

// Transfer Tax - 7% total (3% burn, 2% LP, 2% treasury)
const TRANSFER_TAX = {
  burn: 3,
  lp: 2,
  treasury: 2,
  total: 7,
};

type ViralPresetKey = "ideal" | "conservative" | "base" | "viral";

// Presets now use HARD paying user counts, not conversion rates
const VIRAL_ECONOMICS_PRESETS: Record<
  ViralPresetKey,
  {
    label: string;
    payingUsers: number; // Hard number of paying subscribers
    avgMonthlyActivity: number;
    initialLPSeed: number;
    mintBurnRate: number;
    sellPressure: number;
  }
> = {
  ideal: {
    label: "Ideal (Healthy)",
    payingUsers: 5000,
    avgMonthlyActivity: 500,
    initialLPSeed: 300000, // $300K LP seed for $0.10 floor
    mintBurnRate: 20,
    sellPressure: 15,
  },
  conservative: {
    label: "Conservative (1K Subs)",
    payingUsers: 1000,
    avgMonthlyActivity: 800,
    initialLPSeed: 300000,
    mintBurnRate: 20,
    sellPressure: 15,
  },
  base: {
    label: "Base (5K Subs)",
    payingUsers: 5000,
    avgMonthlyActivity: 1000,
    initialLPSeed: 300000,
    mintBurnRate: 20,
    sellPressure: 20,
  },
  viral: {
    label: "Viral (25K Subs)",
    payingUsers: 25000,
    avgMonthlyActivity: 1000,
    initialLPSeed: 300000,
    mintBurnRate: 20,
    sellPressure: 25,
  },
};

// Milestone Unlocks tied to paying users + Impact Score
// Launch: 3M tokens paired with $300K USDC for $0.10 floor (10x to $1.00)
const UNLOCK_MILESTONES = [
  { milestone: "Launch (TGE)", users: 0, impactScore: 0, tokens: "3M", circulatingSupply: "3M", percentage: "0.03%", cumulative: "0.03%", vesting: "—", mrr: "$0" },
  { milestone: "Early Traction", users: 1000, impactScore: 100000, tokens: "50M", circulatingSupply: "~53M", percentage: "0.5%", cumulative: "0.53%", vesting: "6 months", mrr: "~$10K" },
  { milestone: "Product-Market Fit", users: 5000, impactScore: 500000, tokens: "200M", circulatingSupply: "~253M", percentage: "2%", cumulative: "2.53%", vesting: "6 months", mrr: "~$50K" },
  { milestone: "Scaling Phase 1", users: 10000, impactScore: 1000000, tokens: "500M", circulatingSupply: "~753M", percentage: "5%", cumulative: "7.53%", vesting: "9 months", mrr: "~$100K" },
  { milestone: "Tipping Point", users: 25000, impactScore: 5000000, tokens: "1.5B", circulatingSupply: "~2.25B", percentage: "15%", cumulative: "22.5%", vesting: "12 months", mrr: "~$250K" },
  { milestone: "Mass Adoption", users: 50000, impactScore: 10000000, tokens: "2.75B", circulatingSupply: "~5B", percentage: "27.5%", cumulative: "50%", vesting: "12 months", mrr: "~$500K" },
  { milestone: "Long-Term", users: 100000, impactScore: 50000000, tokens: "5B", circulatingSupply: "10B (Max)", percentage: "50%", cumulative: "100%", vesting: "Governance", mrr: "$1M+" },
];

// Burn Mechanics
const BURN_MECHANICS = [
  { type: "Mint Burns", rate: "20%", description: "20% of newly minted tokens are burned immediately (aggressive)" },
  { type: "Transfer Burns", rate: "3%", description: "Every token transfer permanently burns 3%" },
  { type: "LP Tax", rate: "2%", description: "2% of transfers auto-route to Liquidity Pool" },
  { type: "Treasury Tax", rate: "2%", description: "2% of transfers fund operations treasury" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function AdminTokenomics10B() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  // Viral Economics Calculator State - NOW USING HARD PAYING USER COUNTS
  const DEFAULT_PRESET: ViralPresetKey = "ideal";
  const [scenarioPreset, setScenarioPreset] = useState<ViralPresetKey>(DEFAULT_PRESET);
  const [payingUsers, setPayingUsers] = useState(VIRAL_ECONOMICS_PRESETS[DEFAULT_PRESET].payingUsers);
  const [avgMonthlyActivity, setAvgMonthlyActivity] = useState(VIRAL_ECONOMICS_PRESETS[DEFAULT_PRESET].avgMonthlyActivity);
  const [initialLPSeed, setInitialLPSeed] = useState(VIRAL_ECONOMICS_PRESETS[DEFAULT_PRESET].initialLPSeed);
  const [mintBurnRate, setMintBurnRate] = useState(VIRAL_ECONOMICS_PRESETS[DEFAULT_PRESET].mintBurnRate);
  const [sellPressure, setSellPressure] = useState(VIRAL_ECONOMICS_PRESETS[DEFAULT_PRESET].sellPressure);

  // Starting price is $0.10 ($300K USDC / 3M tokens) - 10x narrative to $1.00
  const STARTING_PRICE = 0.10;

  const applyScenarioPreset = (key: ViralPresetKey) => {
    const preset = VIRAL_ECONOMICS_PRESETS[key];
    setScenarioPreset(key);
    setPayingUsers(preset.payingUsers);
    setAvgMonthlyActivity(preset.avgMonthlyActivity);
    setInitialLPSeed(preset.initialLPSeed);
    setMintBurnRate(preset.mintBurnRate);
    setSellPressure(preset.sellPressure);
  };

  const userShareForBurn = (burnRate: number) => {
    // User receives remaining mint after burn + LP + treasury
    return (100 - burnRate - MINT_DISTRIBUTION.lp - MINT_DISTRIBUTION.treasury) / 100;
  };

  const maxActivityForCoverage = (targetCoverage: number, burnRate: number, sellRate: number) => {
    const userShare = userShareForBurn(burnRate);
    const sell = sellRate / 100;
    const denom = targetCoverage * userShare * sell * STARTING_PRICE;
    if (denom <= 0) return Number.POSITIVE_INFINITY;
    return SUBSCRIPTION.lpPerUser / denom;
  };

  const activityStep = 25;
  const activityMin = 50;
  const activityMax = 2000;
  const healthyActivityCap = useMemo(() => {
    const raw = maxActivityForCoverage(0.7, mintBurnRate, sellPressure);
    const snapped = Math.floor(raw / activityStep) * activityStep;
    return Math.max(activityMin, Math.min(activityMax, snapped));
  }, [mintBurnRate, sellPressure]);

  const keepHealthyAfterParamChange = (next: { burnRate?: number; sellRate?: number }) => {
    const nextBurn = next.burnRate ?? mintBurnRate;
    const nextSell = next.sellRate ?? sellPressure;
    const raw = maxActivityForCoverage(0.7, nextBurn, nextSell);
    const snapped = Math.floor(raw / activityStep) * activityStep;
    const cap = Math.max(activityMin, Math.min(activityMax, snapped));
    if (avgMonthlyActivity > cap) setAvgMonthlyActivity(cap);
  };

  // Calculate the viral economics model
  // Key insight: LP injection + cumulative growth must defend $0.50 floor
  const viralEconomics = useMemo(() => {
    // Monthly Revenue from paying subscribers
    const mrr = payingUsers * SUBSCRIPTION.price;
    const monthlyLPInjection = payingUsers * SUBSCRIPTION.lpPerUser;
    
    // Token Minting (only paid users can mint)
    const grossTokensMinted = payingUsers * avgMonthlyActivity;
    const tokensBurned = grossTokensMinted * (mintBurnRate / 100);
    const tokensToUsers = grossTokensMinted * ((100 - mintBurnRate - 3 - 2) / 100); // Subtract burn, LP, treasury
    const tokensToLP = grossTokensMinted * 0.03;
    const tokensToTreasury = grossTokensMinted * 0.02;
    
    // Sell Pressure Calculation at $0.50 floor price
    const tokensSold = tokensToUsers * (sellPressure / 100);
    const sellPressureUSDC = tokensSold * STARTING_PRICE;
    
    // LP Coverage ratio: Does subscription LP injection cover the sell pressure?
    const lpCoverage = sellPressureUSDC > 0 ? (monthlyLPInjection / sellPressureUSDC) : 10;
    
    // Price calculation using constant product AMM (k = x * y)
    // Initial: k = 125,000 USDC * 250,000 tokens = 31.25B
    const initialK = initialLPSeed * (initialLPSeed / STARTING_PRICE);
    
    // After LP injection adds USDC
    let lpUSDC = initialLPSeed + monthlyLPInjection;
    
    // After sell pressure removes USDC
    lpUSDC = Math.max(lpUSDC - sellPressureUSDC, initialLPSeed * 0.5);
    
    // New token count from k = lpUSDC * lpTokens
    const lpTokens = initialK / lpUSDC;
    
    // Price = USDC / Tokens
    let priceAfterSell = lpUSDC / lpTokens;
    priceAfterSell = Math.min(1.00, Math.max(0.25, priceAfterSell));
    
    // Net monthly flow
    const netLPFlow = monthlyLPInjection - sellPressureUSDC;
    
    // Sustainability Score: 100% means LP fully covers sell pressure
    const sustainabilityScore = Math.min(lpCoverage, 2);
    
    // Health thresholds:
    // >= 1.0 = Optimal (LP injection covers ALL sell pressure, price rises)
    // >= 0.7 = Healthy (LP covers most, price stable around $0.50)
    // < 0.7 = At Risk (price pressure below floor)
    const isOptimal = lpCoverage >= 1.0;
    const isHealthy = lpCoverage >= 0.7;
    
    // Reward Value Analysis (what users actually earn in USD terms)
    const effectiveRewardValue = priceAfterSell * avgMonthlyActivity * ((100 - mintBurnRate - 5) / 100);
    
    // CO2 Impact Score (0.7 kg per kWh)
    const monthlyImpactScore = payingUsers * avgMonthlyActivity * 0.7;
    const annualImpactTons = (monthlyImpactScore * 12) / 1000;
    
    return {
      payingUsers,
      mrr,
      monthlyLPInjection,
      grossTokensMinted,
      tokensBurned,
      tokensToUsers,
      tokensToLP,
      tokensToTreasury,
      tokensSold,
      sellPressureUSDC,
      netLPFlow,
      lpRatio: lpCoverage,
      priceAfterSell,
      sustainabilityScore,
      effectiveRewardValue,
      monthlyImpactScore,
      annualImpactTons,
      isHealthy,
      isOptimal,
    };
  }, [payingUsers, avgMonthlyActivity, initialLPSeed, mintBurnRate, sellPressure]);

  // Price projection data - starting at $0.50 floor price (Fresh Start Model)
  // Math: Price = USDC / Tokens in LP
  // $125,000 USDC / 250,000 tokens = $0.50 per token
  const projectionData = useMemo(() => {
    const data = [];
    const initialLPUSDC = initialLPSeed;
    const initialLPTokens = initialLPUSDC / STARTING_PRICE;
    
    // Total circulating includes LP + unlocked tokens outside LP
    let circulatingSupply = initialLPTokens * 1.5; // Start with 150% of LP tokens circulating
    let lpUSDC = initialLPUSDC;
    let lpTokens = initialLPTokens;
    let totalBurned = 0;
    
    // AMM constant product: k = lpUSDC * lpTokens
    let k = lpUSDC * lpTokens;
    
    // Target paying users at end of projection
    const targetPayingUsers = payingUsers;
    
    for (let month = 0; month <= 36; month++) {
      // Price from constant product AMM: price = lpUSDC / lpTokens
      const price = lpTokens > 0 ? lpUSDC / lpTokens : 0;
      
      // Monthly activity assumptions (scaling with time toward target users)
      const monthlyPaidUsers = Math.min(100 + month * (targetPayingUsers / 36), targetPayingUsers);
      const subRevenue = monthlyPaidUsers * SUBSCRIPTION.price;
      const lpInjection = subRevenue * 0.5; // 50% to LP (USDC side)
      
      // Burns from transactions (3.5% of volume)
      const txVolume = monthlyPaidUsers * 5 * 50; // 5 tx/user, $50 avg at $0.50 price
      const txTokens = price > 0 ? txVolume / price : 0;
      const burnFromTx = txTokens * 0.035;
      
      // Mint burns from new minting
      const newTokensMinted = monthlyPaidUsers * avgMonthlyActivity;
      const mintBurn = newTokensMinted * (mintBurnRate / 100);
      
      data.push({
        month,
        price: price,
        marketCap: price * circulatingSupply,
        lpUSDC,
        totalBurned,
        users: monthlyPaidUsers,
        circulatingSupply,
      });
      
      // Apply LP injection (adds USDC to LP)
      lpUSDC += lpInjection;
      // Recalculate lpTokens based on constant product (price goes up as USDC increases)
      lpTokens = k / lpUSDC;
      
      // Apply burns to circulating supply
      totalBurned += burnFromTx + mintBurn;
      
      // Milestone unlocks add to circulating (simplified linear unlock)
      const monthlyUnlock = month > 0 ? 50_000 : 0; // 50K tokens unlocked monthly
      circulatingSupply = Math.max(circulatingSupply + monthlyUnlock - burnFromTx - mintBurn + (newTokensMinted * 0.80), initialLPTokens);
    }
    
    return data;
  }, [initialLPSeed, payingUsers, avgMonthlyActivity, mintBurnRate, STARTING_PRICE]);

  // Scaling milestones data for chart
  const scalingData = useMemo(() => {
    return [
      { users: 100, paidUsers: 40, lpInjection: 200, tokensToUsers: 34000, ratio: 170, sustainable: true },
      { users: 1000, paidUsers: 400, lpInjection: 1998, tokensToUsers: 340000, ratio: 170, sustainable: true },
      { users: 10000, paidUsers: 4000, lpInjection: 19980, tokensToUsers: 3400000, ratio: 170, sustainable: true },
      { users: 50000, paidUsers: 20000, lpInjection: 99900, tokensToUsers: 17000000, ratio: 170, sustainable: true },
      { users: 100000, paidUsers: 40000, lpInjection: 199800, tokensToUsers: 34000000, ratio: 170, sustainable: true },
    ].map(d => ({
      ...d,
      label: d.users >= 1000 ? `${d.users / 1000}K` : d.users.toString(),
      sellPressure5pct: d.tokensToUsers * 0.05,
      coverage: d.lpInjection / (d.tokensToUsers * 0.05) * 100,
    }));
  }, []);

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
      <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 pt-4 pb-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <Badge variant="outline" className="text-primary border-primary">
          <Coins className="h-3 w-3 mr-1" />
          10B Strategy
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">$ZSOLAR 10B Tokenomics</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Revenue-backed token economics • <span className="text-primary font-semibold">$0.10 Launch Floor → $1.00 Target</span> • 20% Mint Burn
        </p>
        <Badge variant="secondary" className="text-xs">Admin Only • Strategic Planning</Badge>
      </motion.div>

      {/* Core Principles */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Core Principles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Sparkles, title: "Utility-First Emissions", desc: "Mints driven by verified energy data, not arbitrary schedules", color: "text-amber-500" },
                { icon: Flame, title: "Deflationary Design", desc: "Burns outpace supply at scale, targeting >5% annual deflation", color: "text-red-500" },
                { icon: Droplets, title: "Revenue Flywheel", desc: "50% of subscription revenue auto-flows to LP", color: "text-blue-500" },
                { icon: Lock, title: "Scarcity Narrative", desc: "10B hard cap; start with 1-2% circulating", color: "text-purple-500" },
                { icon: TrendingUp, title: "Risk Mitigation", desc: "Slow unlocks, vesting, and anti-abuse caps", color: "text-emerald-500" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                  <item.icon className={`h-5 w-5 ${item.color} mt-0.5`} />
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Distribution */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Token Distribution (at Launch)
              </CardTitle>
              <CardDescription>10 billion max supply, hard cap enforced in contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">Community/Rewards</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">90%</p>
                    <p className="text-xs text-muted-foreground">9B tokens</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">Treasury</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent">7.5%</p>
                    <p className="text-xs text-muted-foreground">750M (2yr vest)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Founder</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">2.5%</p>
                    <p className="text-xs text-muted-foreground">250M (3yr vest, 6mo cliff)</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Initial Circulating</span>
                  <Badge className="bg-primary/20 text-primary">250K tokens</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seeded into LP with $125K USDC for $0.50 starting price floor
                </p>
              </div>
              
              {/* Launch Price Explainer */}
              <div className="p-4 rounded-lg border bg-amber-500/5 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Rocket className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">$0.50 Launch Price Model</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>At TGE:</strong> 250,000 $ZSOLAR tokens seeded into the Liquidity Pool against $125,000 USDC, 
                      establishing a <span className="text-primary font-semibold">$0.50 starting price</span> ($125K ÷ 250K = $0.50/token).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Target Range:</strong> The $0.50-$1.00 band creates a balanced floor where users earn 
                      <strong className="text-foreground"> $400-$800/month</strong> (800-1,000 tokens × $0.50-$0.80), 
                      driving organic word-of-mouth while subscription LP flow maintains stability.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-destructive" />
                Mint Distribution
              </CardTitle>
              <CardDescription>How newly minted tokens are distributed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> User Rewards
                    </span>
                    <span className="font-bold text-primary">{MINT_DISTRIBUTION.user}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${MINT_DISTRIBUTION.user}%` }} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Flame className="h-5 w-5 text-destructive mx-auto mb-1" />
                    <p className="text-xl font-bold text-destructive">{MINT_DISTRIBUTION.burn}%</p>
                    <p className="text-xs text-muted-foreground">Burned</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-500">{MINT_DISTRIBUTION.lp}%</p>
                    <p className="text-xs text-muted-foreground">LP</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Building2 className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-500">{MINT_DISTRIBUTION.treasury}%</p>
                    <p className="text-xs text-muted-foreground">Treasury</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Transfer Tax: {TRANSFER_TAX.total}%</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>🔥 {TRANSFER_TAX.burn}% burn</span>
                  <span>🏛️ {TRANSFER_TAX.treasury}% treasury</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Milestone Unlock Schedule */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Milestone-Based Unlock Schedule
            </CardTitle>
            <CardDescription>Unlocks gated by verified paying subscribers ($9.99/mo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead className="text-right">Paying Users</TableHead>
                    <TableHead className="text-right">Tokens Unlocked</TableHead>
                    <TableHead className="text-right">Circulating Supply</TableHead>
                    <TableHead className="text-right">% of Max</TableHead>
                    <TableHead className="text-right">Vesting</TableHead>
                    <TableHead className="text-right">Projected MRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {UNLOCK_MILESTONES.map((row, index) => (
                    <TableRow key={row.milestone} className={index === 0 ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index === 0 ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                          {row.milestone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.users.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{row.tokens}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600">{row.circulatingSupply}</TableCell>
                      <TableCell className="text-right">{row.percentage}</TableCell>
                      <TableCell className="text-right">{row.vesting}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">{row.mrr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Each unlock vests linearly over the specified period. 50% flows to LP pool, 50% to treasury operations.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Burn Mechanics */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              Burn & Deflation Mechanics
            </CardTitle>
            <CardDescription>Multiple burn sources targeting &gt;5% annual net deflation post-50K users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {BURN_MECHANICS.map((burn) => (
                <div key={burn.type} className="p-4 rounded-lg border bg-gradient-to-br from-destructive/5 to-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="h-5 w-5 text-destructive" />
                    <Badge variant="destructive" className="text-lg">{burn.rate}</Badge>
                  </div>
                  <p className="font-semibold text-sm">{burn.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{burn.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-amber-600" />
                <p className="font-semibold text-amber-600">Target Outcome</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Annual net burn exceeds new mints post-50K users, creating genuine scarcity and sustainable price appreciation.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fresh Start Model - Official Launch Strategy */}
      <motion.div {...fadeIn} transition={{ delay: 0.45 }}>
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Fresh Start Model
                  <Badge className="bg-emerald-500/20 text-emerald-600">Official Launch Strategy</Badge>
                </CardTitle>
                <CardDescription>Mainnet token minting begins from zero baseline at device connection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Core Principle */}
            <div className="p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Core Principle</p>
                  <p className="text-sm text-muted-foreground">
                    When a user connects their Tesla, Enphase, SolarEdge, or Wallbox account, the system captures their 
                    <strong className="text-foreground"> current lifetime readings as baseline</strong>. Users earn tokens 
                    <strong className="text-foreground"> only for NEW activity</strong> generated after connection—ensuring 
                    token supply scales with actual ongoing clean energy behavior, not historical accumulation.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Why Fresh Start */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-sm">$0.50 Price Floor</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  $125K USDC paired with 250K tokens establishes the floor. With 5K paying subs generating 
                  $25K/mo LP injection, the system absorbs 15-25% sell rates while maintaining stability.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <p className="font-semibold text-sm">LP Sustainability</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  At 20% sell rate, monthly sell pressure (~$400K at 5K users) is offset by LP injection + burns.
                  The model targets LP coverage ≥ 0.7x to maintain "Healthy" status.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <p className="font-semibold text-sm">Viral Potential</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Users earning ~$400-$800/month in $ZSOLAR (1,000 tokens × $0.50-$0.80) creates 
                  compelling social proof that drives referrals and organic growth.
                </p>
              </div>
            </div>
            
            {/* Technical Implementation */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Technical Implementation
              </p>
              <div className="space-y-2 text-xs font-mono text-muted-foreground">
                <p>1. User connects device account (OAuth flow)</p>
                <p>2. Edge function captures: <code className="bg-background px-1 rounded">baseline_data = current_lifetime_totals</code></p>
                <p>3. On sync: <code className="bg-background px-1 rounded">pending = lifetime_totals - baseline_data</code></p>
                <p>4. On mint: <code className="bg-background px-1 rounded">baseline_data = new_lifetime_totals</code></p>
                <p>5. Next cycle: <code className="bg-background px-1 rounded">pending = 0</code> until new activity occurs</p>
              </div>
            </div>
            
            {/* Beta User Recognition */}
            <div className="p-4 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">Beta User Recognition: Pioneer NFTs</p>
                  <p className="text-xs text-muted-foreground">
                    To honor beta users' historical contributions without creating sell pressure, users with significant 
                    lifetime data receive exclusive <strong className="text-foreground">Pioneer NFTs</strong> (Bronze/Silver/Gold/Platinum tiers). 
                    These are non-tradeable recognition badges that unlock future governance perks and VIP benefits—
                    not inflationary token rewards.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Viral Economics Calculator */}
      <motion.div {...fadeIn} transition={{ delay: 0.47 }}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Viral Economics Calculator
                  <Badge className={viralEconomics.isOptimal ? "bg-emerald-500/20 text-emerald-600" : viralEconomics.isHealthy ? "bg-amber-500/20 text-amber-600" : "bg-destructive/20 text-destructive"}>
                    {viralEconomics.isOptimal ? "Optimal" : viralEconomics.isHealthy ? "Healthy" : "At Risk"}
                  </Badge>
                </CardTitle>
                <CardDescription>Model sustainability at $0.50 floor with 15-25% monthly sell rate</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-medium">Scenario Preset</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => applyScenarioPreset("ideal")}
                  >
                    Reset to Ideal
                  </Button>
                  <Select value={scenarioPreset} onValueChange={(v) => applyScenarioPreset(v as ViralPresetKey)}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ideal">Ideal (Healthy)</SelectItem>
                      <SelectItem value="conservative">1K Subs (Conservative)</SelectItem>
                      <SelectItem value="base">5K Subs (Base)</SelectItem>
                      <SelectItem value="viral">25K Subs (Viral Stress)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Input Controls */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Paying Subscribers
                  </Label>
                  <span className="font-mono text-sm font-bold">{payingUsers.toLocaleString()}</span>
                </div>
                <Slider
                  value={[payingUsers]}
                  onValueChange={([v]) => setPayingUsers(v)}
                  min={100}
                  max={50000}
                  step={100}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {[1000, 5000, 10000, 25000].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={payingUsers === v ? "default" : "outline"}
                      onClick={() => setPayingUsers(v)}
                    >
                      {v >= 1000 ? `${v / 1000}K` : v}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Active $9.99/mo subscribers</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Avg Monthly Activity
                  </Label>
                  <span className="font-mono text-sm font-bold">{avgMonthlyActivity.toLocaleString()}</span>
                </div>
                <Slider
                  value={[avgMonthlyActivity]}
                  onValueChange={([v]) => setAvgMonthlyActivity(v)}
                  min={activityMin}
                  max={activityMax}
                  step={activityStep}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={avgMonthlyActivity === healthyActivityCap ? "default" : "outline"}
                    onClick={() => setAvgMonthlyActivity(healthyActivityCap)}
                  >
                    Max Healthy ({healthyActivityCap})
                  </Button>
                  {[50, 100, 250, 500, 1000].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={avgMonthlyActivity === v ? "default" : "outline"}
                      onClick={() => setAvgMonthlyActivity(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reward issuance proxy per paid subscriber / month. To avoid <strong>At Risk</strong> at {sellPressure}% sell + {mintBurnRate}% burn, keep ≤ <strong>{healthyActivityCap}</strong>.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Initial LP Seed
                  </Label>
                  <span className="font-mono text-sm font-bold">${(initialLPSeed / 1000).toFixed(0)}K</span>
                </div>
                <Slider
                  value={[initialLPSeed]}
                  onValueChange={([v]) => setInitialLPSeed(v)}
                  min={250000}
                  max={2000000}
                  step={25000}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {[250000, 500000, 1000000, 2000000].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={initialLPSeed === v ? "default" : "outline"}
                      onClick={() => setInitialLPSeed(v)}
                    >
                      ${(v / 1000).toFixed(0)}K
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">USDC paired 1:2 for $0.50 floor</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Mint Burn Rate
                  </Label>
                  <span className="font-mono text-sm font-bold">{mintBurnRate}%</span>
                </div>
                <Slider
                  value={[mintBurnRate]}
                  onValueChange={([v]) => setMintBurnRate(v)}
                  min={10}
                  max={25}
                  step={1}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {[15, 20, 25].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={mintBurnRate === v ? "default" : "outline"}
                      onClick={() => {
                        setMintBurnRate(v);
                        keepHealthyAfterParamChange({ burnRate: v });
                      }}
                    >
                      {v}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Tokens burned at mint (15% recommended)</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Monthly Sell Rate
                  </Label>
                  <span className="font-mono text-sm font-bold">{sellPressure}%</span>
                </div>
                <Slider
                  value={[sellPressure]}
                  onValueChange={([v]) => setSellPressure(v)}
                  min={5}
                  max={35}
                  step={1}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {[15, 20, 25].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant={sellPressure === v ? "default" : "outline"}
                      onClick={() => {
                        setSellPressure(v);
                        keepHealthyAfterParamChange({ sellRate: v });
                      }}
                    >
                      {v}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">% of minted tokens sold (expect 15-25%)</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{viralEconomics.payingUsers.toLocaleString()} paying</Badge>
                </div>
                <p className="text-2xl font-bold">${viralEconomics.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
              </div>
              
              <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-500/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <Badge variant="outline">50% of subs</Badge>
                </div>
                <p className="text-2xl font-bold">${viralEconomics.monthlyLPInjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">Monthly LP Injection</p>
              </div>
              
              <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-500/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <Badge variant="outline">{(viralEconomics.tokensBurned / viralEconomics.grossTokensMinted * 100).toFixed(0)}% burned</Badge>
                </div>
                <p className="text-2xl font-bold">{(viralEconomics.tokensToUsers / 1000000).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground">Tokens to Users/Month</p>
              </div>
              
              <div className={`p-4 rounded-lg border ${viralEconomics.isOptimal ? "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30" : viralEconomics.isHealthy ? "bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30" : "bg-gradient-to-br from-destructive/10 to-transparent border-destructive/30"}`}>
                <div className="flex items-center justify-between mb-2">
                  <Gauge className="h-5 w-5" />
                  <Badge className={viralEconomics.isOptimal ? "bg-emerald-500/20 text-emerald-600" : viralEconomics.isHealthy ? "bg-amber-500/20 text-amber-600" : "bg-destructive/20 text-destructive"}>
                    {viralEconomics.lpRatio.toFixed(2)}:1
                  </Badge>
                </div>
                <p className="text-2xl font-bold">${viralEconomics.priceAfterSell.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Price After Sell Pressure</p>
              </div>
            </div>
            
            {/* Viral Sweet Spot Analysis */}
            <div className={`p-4 rounded-lg border-2 ${viralEconomics.isOptimal ? "border-emerald-500/30 bg-emerald-500/5" : viralEconomics.isHealthy ? "border-amber-500/30 bg-amber-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-start gap-3">
                {viralEconomics.isOptimal ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : viralEconomics.isHealthy ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="space-y-2 flex-1">
                  <p className={`font-semibold text-sm ${viralEconomics.isOptimal ? "text-emerald-600" : viralEconomics.isHealthy ? "text-amber-600" : "text-destructive"}`}>
                    {viralEconomics.isOptimal ? "✅ Viral Economics Achieved" : viralEconomics.isHealthy ? "⚠️ Manageable but Tight" : "❌ Unsustainable - Adjust Parameters"}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 text-xs text-muted-foreground">
                    <div>
                      <p><strong>Sell Pressure:</strong> ${viralEconomics.sellPressureUSDC.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC worth</p>
                      <p><strong>LP Coverage:</strong> {(viralEconomics.lpRatio * 100).toFixed(0)}% of sell pressure absorbed</p>
                      <p><strong>Impact Score:</strong> {viralEconomics.monthlyImpactScore.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO2/month</p>
                    </div>
                    <div>
                      <p><strong>User Reward Value:</strong> ${viralEconomics.effectiveRewardValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month</p>
                      <p><strong>Annual CO2 Offset:</strong> {viralEconomics.annualImpactTons.toLocaleString(undefined, { maximumFractionDigits: 0 })} tons</p>
                      <p><strong>Sustainability Score:</strong> {(viralEconomics.sustainabilityScore * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Strategic Recommendations */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Optimal Sweet Spot for Viral Growth
              </p>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Optimal Configuration:</strong>
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                    <li>5,000+ paying subscribers ($50K+/mo MRR)</li>
                    <li>$125K initial LP seed for $0.50 floor</li>
                    <li>15% mint burn for sustainable deflation</li>
                    <li>15-25% monthly sell rate (realistic expectation)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Viral Trigger Point:</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When users consistently earn <strong className="text-primary">$400-$800/month</strong> in $ZSOLAR 
                    at $0.50-$0.80/token (1,000 kWh + miles typical), social sharing + referrals compound. 
                    Each referral adds $4.99/mo to LP, creating a sustainable flywheel.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakeven Analysis Card */}
      <motion.div {...fadeIn} transition={{ delay: 0.48 }}>
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Target className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle>Breakeven Analysis</CardTitle>
                <CardDescription>Minimum paying subscribers needed to maintain $0.50 floor at different sell rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Breakeven Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sell Rate</th>
                    <th className="px-4 py-3 text-right font-semibold">Min Subs for Floor</th>
                    <th className="px-4 py-3 text-right font-semibold">Monthly LP Injection</th>
                    <th className="px-4 py-3 text-right font-semibold">Sell Pressure Absorbed</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sellRate: 15, minSubs: 2500, lpInjection: 12488, sellAbsorbed: 15000, status: "Healthy" },
                    { sellRate: 20, minSubs: 4000, lpInjection: 19980, sellAbsorbed: 20000, status: "Optimal" },
                    { sellRate: 25, minSubs: 6250, lpInjection: 31219, sellAbsorbed: 31250, status: "Optimal" },
                    { sellRate: 30, minSubs: 9000, lpInjection: 44955, sellAbsorbed: 45000, status: "Optimal" },
                  ].map((row, index) => (
                    <tr key={row.sellRate} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-medium">{row.sellRate}%</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{row.minSubs.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${row.lpInjection.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${row.sellAbsorbed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={row.status === "Optimal" ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Key Insight:</strong> At the expected 20% sell rate, you need 
                <strong className="text-primary"> ~4,000 paying subscribers</strong> generating $20K/mo LP injection to fully 
                absorb sell pressure and maintain the $0.50 floor. Below this, price will drift but stabilize due to reduced 
                selling incentive at lower prices.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Trajectory Timeline */}
      <motion.div {...fadeIn} transition={{ delay: 0.49 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Price Trajectory: $0.50 → $1.00
            </CardTitle>
            <CardDescription>Milestone-based path to target price range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Bar */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-emerald-500 to-amber-500 rounded-full" />
              
              <div className="space-y-8 ml-4">
                {[
                  { 
                    phase: "Launch", 
                    price: "$0.50", 
                    subs: "0", 
                    lp: "$125K",
                    description: "TGE: 250K tokens + $125K USDC seeded in LP",
                    color: "bg-primary"
                  },
                  { 
                    phase: "Early Traction", 
                    price: "$0.55", 
                    subs: "1,000", 
                    lp: "$130K",
                    description: "First 1K paying subs, LP growing from subscriptions",
                    color: "bg-blue-500"
                  },
                  { 
                    phase: "Product-Market Fit", 
                    price: "$0.65", 
                    subs: "5,000", 
                    lp: "$175K",
                    description: "LP injection exceeds sell pressure, price rising",
                    color: "bg-emerald-500"
                  },
                  { 
                    phase: "Scaling", 
                    price: "$0.80", 
                    subs: "15,000", 
                    lp: "$350K",
                    description: "Viral referrals driving growth, burns accelerating",
                    color: "bg-teal-500"
                  },
                  { 
                    phase: "Target Range", 
                    price: "$1.00", 
                    subs: "25,000+", 
                    lp: "$500K+",
                    description: "Users earning $800-$1,000/mo, max viral potential",
                    color: "bg-amber-500"
                  },
                ].map((milestone, index) => (
                  <div key={milestone.phase} className="relative flex items-start gap-6 pl-4">
                    {/* Dot */}
                    <div className={`absolute left-0 w-5 h-5 rounded-full ${milestone.color} border-4 border-background shadow-lg -translate-x-[6px]`} />
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{milestone.phase}</span>
                        <Badge className="bg-primary/20 text-primary font-mono">{milestone.price}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        <span><Users className="h-3 w-3 inline mr-1" />{milestone.subs} subs</span>
                        <span><Droplets className="h-3 w-3 inline mr-1" />{milestone.lp} LP</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Projection Chart */}
      <motion.div {...fadeIn} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              36-Month Price Projection
            </CardTitle>
            <CardDescription>Modeled with $0.50 launch price, 50% sub→LP, 15% mint burn, 3.5% transfer burn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(v) => `M${v}`}
                    className="text-xs"
                  />
                  <YAxis 
                    yAxisId="price"
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                    className="text-xs"
                    domain={[0, 'auto']}
                  />
                  <YAxis 
                    yAxisId="users"
                    orientation="right"
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'price') return [`$${value.toFixed(4)}`, 'Token Price'];
                      if (name === 'users') return [value.toLocaleString(), 'Users'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  <Area 
                    yAxisId="price"
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Token Price"
                  />
                  <Area 
                    yAxisId="users"
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))" 
                    fillOpacity={0.2}
                    name="Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Starting Price</p>
                <p className="text-lg font-bold">${projectionData[0]?.price.toFixed(4) || '0.0005'}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                <p className="text-xs text-muted-foreground">Month 12 Price</p>
                <p className="text-lg font-bold text-emerald-600">${projectionData[12]?.price.toFixed(4) || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground">Month 24 Price</p>
                <p className="text-lg font-bold text-primary">${projectionData[24]?.price.toFixed(4) || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                <p className="text-xs text-muted-foreground">Month 36 Price</p>
                <p className="text-lg font-bold text-amber-600">${projectionData[36]?.price.toFixed(4) || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Short-Term & Long-Term Tactics */}
      <motion.div {...fadeIn} transition={{ delay: 0.6 }}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                Short-Term Tactics (Months 1-12)
              </CardTitle>
              <CardDescription>Ramp to $0.50-$1.00</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Launch fair (no pre-sales) via app beta mints",
                "Bootstrap LP: $50K-$100K USDC on Uniswap/Base",
                "Hype via X: \"Mint $1K/month from your solar\"",
                "Airdrop 0.5-1% to beta users for viral shares",
                "Target 20-30% subscription conversion rate",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Long-Term Tactics (Years 1-3)
              </CardTitle>
              <CardDescription>Stabilize at $1-$2, potential $5+</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Expand to subscription tiers ($4.99/$9.99/$19.99)",
                "Launch DAO governance post-25K users",
                "Target Coinbase listing (utility proof)",
                "In-app swaps: $ZSOLAR → BTC/ETH/USDC",
                "Scale unlocks to hybrid (users + kWh minted)",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Risks & Legal */}
      <motion.div {...fadeIn} transition={{ delay: 0.7 }}>
        <Card className="border-dashed bg-muted/30">
          <CardHeader>
            <CardTitle className="text-muted-foreground">⚠️ Risks & Mitigations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { risk: "Dilution", mitigation: "Slow unlocks + vesting prevent dumps" },
                { risk: "Low Adoption", mitigation: "Early scarcity builds hype; subs provide baseline revenue" },
                { risk: "Volatility", mitigation: "LP injections from subs stabilize price" },
                { risk: "Regulatory", mitigation: "Utility focus (energy rewards) over speculation for compliance" },
              ].map((item) => (
                <div key={item.risk} className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                  <Badge variant="outline" className="shrink-0">{item.risk}</Badge>
                  <p className="text-sm text-muted-foreground">{item.mitigation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
