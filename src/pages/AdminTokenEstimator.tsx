import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { motion } from "framer-motion";
import { 
  Building2, Calculator, Coins, DollarSign, Droplets, Flame, Info, Loader2, 
  TrendingUp, Users, Zap, Shield, Target, Gauge, AlertTriangle, CheckCircle2, 
  BarChart3, Sparkles, RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Bar, BarChart, Cell, ReferenceLine } from "recharts";
import { ExportButtons } from "@/components/admin/ExportButtons";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// OPTIMIZED TOKEN ECONOMICS - $0.10 FLOOR MODEL
const TOKENOMICS = {
  maxSupply: 10_000_000_000,
  launchPrice: 0.10,
  lpSeedUSDC: 300_000,
  lpSeedTokens: 3_000_000,
  subscriptionFee: 9.99,
  subscriptionToLP: 0.50,
  mintBurnRate: 0.20, // 20% burn on mint
  transferBurn: 0.03, // 3% transfer burn
  treasuryTax: 0.02, // 2% treasury
  lpTax: 0.02, // 2% to LP
};

type ScenarioPreset = "conservative" | "base" | "growth" | "viral" | "custom";

const PRESETS: Record<ScenarioPreset, { 
  label: string; 
  payingUsers: number; 
  avgActivity: number; 
  sellRate: number; 
  lpSeed: number;
  burnRate: number;
}> = {
  conservative: { label: "Conservative (1K)", payingUsers: 1000, avgActivity: 800, sellRate: 15, lpSeed: 300000, burnRate: 20 },
  base: { label: "Base Case (5K)", payingUsers: 5000, avgActivity: 1000, sellRate: 20, lpSeed: 300000, burnRate: 20 },
  growth: { label: "Growth (10K)", payingUsers: 10000, avgActivity: 1000, sellRate: 20, lpSeed: 500000, burnRate: 20 },
  viral: { label: "Viral (25K)", payingUsers: 25000, avgActivity: 1000, sellRate: 25, lpSeed: 500000, burnRate: 20 },
  custom: { label: "Custom", payingUsers: 5000, avgActivity: 1000, sellRate: 20, lpSeed: 300000, burnRate: 20 },
};

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function AdminTokenEstimator() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();

  // Scenario state
  const [preset, setPreset] = useState<ScenarioPreset>("base");
  const [payingUsers, setPayingUsers] = useState(PRESETS.base.payingUsers);
  const [avgActivity, setAvgActivity] = useState(PRESETS.base.avgActivity);
  const [sellRate, setSellRate] = useState(PRESETS.base.sellRate);
  const [lpSeed, setLpSeed] = useState(PRESETS.base.lpSeed);
  const [burnRate, setBurnRate] = useState(PRESETS.base.burnRate);
  const [projectionMonths, setProjectionMonths] = useState(24);

  const applyPreset = (key: ScenarioPreset) => {
    if (key === "custom") return;
    const p = PRESETS[key];
    setPreset(key);
    setPayingUsers(p.payingUsers);
    setAvgActivity(p.avgActivity);
    setSellRate(p.sellRate);
    setLpSeed(p.lpSeed);
    setBurnRate(p.burnRate);
  };

  // Core sustainability calculations
  const sustainability = useMemo(() => {
    const startingPrice = TOKENOMICS.launchPrice;
    const lpPerUser = TOKENOMICS.subscriptionFee * TOKENOMICS.subscriptionToLP;
    
    // Monthly flows
    const monthlyLPInjection = payingUsers * lpPerUser;
    const mrr = payingUsers * TOKENOMICS.subscriptionFee;
    
    // Token minting (after burn)
    const grossMinted = payingUsers * avgActivity;
    const tokensBurned = grossMinted * (burnRate / 100);
    const tokensToUsers = grossMinted * ((100 - burnRate - 3 - 2) / 100); // subtract burn, LP, treasury
    
    // Sell pressure at current price
    const tokensSold = tokensToUsers * (sellRate / 100);
    const sellPressureUSD = tokensSold * startingPrice;
    
    // LP Coverage Ratio (key metric)
    const lpCoverage = sellPressureUSD > 0 ? monthlyLPInjection / sellPressureUSD : 10;
    
    // Net monthly LP flow
    const netLPFlow = monthlyLPInjection - sellPressureUSD;
    
    // Health status
    const isOptimal = lpCoverage >= 1.0;
    const isHealthy = lpCoverage >= 0.7;
    const isAtRisk = lpCoverage < 0.7;
    
    // Price trajectory using AMM constant product
    const initialK = lpSeed * (lpSeed / startingPrice);
    let lpUSDC = lpSeed + monthlyLPInjection;
    lpUSDC = Math.max(lpUSDC - sellPressureUSD, lpSeed * 0.5);
    const lpTokens = initialK / lpUSDC;
    let projectedPrice = lpUSDC / lpTokens;
    projectedPrice = Math.min(2.00, Math.max(0.05, projectedPrice));
    
    // User reward value
    const effectiveRewardValue = projectedPrice * avgActivity * ((100 - burnRate - 5) / 100);
    
    // Impact metrics
    const monthlyImpactScore = payingUsers * avgActivity * 0.7;
    const annualImpactTons = (monthlyImpactScore * 12) / 1000;
    
    // Breakeven subscribers
    const breakevenSubs = sellPressureUSD > 0 
      ? Math.ceil(sellPressureUSD / lpPerUser) 
      : 0;

    return {
      mrr,
      monthlyLPInjection,
      grossMinted,
      tokensBurned,
      tokensToUsers,
      tokensSold,
      sellPressureUSD,
      netLPFlow,
      lpCoverage,
      projectedPrice,
      effectiveRewardValue,
      monthlyImpactScore,
      annualImpactTons,
      isOptimal,
      isHealthy,
      isAtRisk,
      breakevenSubs,
    };
  }, [payingUsers, avgActivity, sellRate, lpSeed, burnRate]);

  // 36-month projection data
  const projectionData = useMemo(() => {
    const data = [];
    const startingPrice = TOKENOMICS.launchPrice;
    let lpUSDC = lpSeed;
    let lpTokens = lpSeed / startingPrice;
    let k = lpUSDC * lpTokens;
    let totalBurned = 0;
    let circulatingSupply = lpTokens * 1.2;

    for (let month = 0; month <= projectionMonths; month++) {
      const price = lpTokens > 0 ? lpUSDC / lpTokens : startingPrice;
      
      // Scale users linearly to target
      const currentUsers = Math.min(100 + month * (payingUsers / projectionMonths), payingUsers);
      const monthlyLP = currentUsers * TOKENOMICS.subscriptionFee * TOKENOMICS.subscriptionToLP;
      
      // Burns and mints
      const mintedTokens = currentUsers * avgActivity;
      const mintBurns = mintedTokens * (burnRate / 100);
      const sellTokens = mintedTokens * ((100 - burnRate - 5) / 100) * (sellRate / 100);
      const sellUSD = sellTokens * price;
      
      data.push({
        month,
        price: Math.min(price, 2),
        lpUSDC: Math.round(lpUSDC),
        totalBurned: Math.round(totalBurned),
        users: Math.round(currentUsers),
        marketCap: Math.round(price * circulatingSupply),
      });
      
      // Update for next month
      lpUSDC = Math.max(lpUSDC + monthlyLP - sellUSD * 0.3, lpSeed * 0.5);
      lpTokens = k / lpUSDC;
      totalBurned += mintBurns;
      circulatingSupply += mintedTokens * 0.75 - mintBurns;
    }
    
    return data;
  }, [payingUsers, avgActivity, sellRate, lpSeed, burnRate, projectionMonths]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    price: { label: "Price", color: "hsl(var(--primary))" },
    lpUSDC: { label: "LP (USDC)", color: "hsl(var(--chart-1))" },
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <motion.div 
        className="text-center space-y-2"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Badge variant="outline" className="mb-2">
          <Calculator className="h-3 w-3 mr-1" />
          Tokenomics Simulator
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold">$ZSOLAR Price & Sustainability Simulator</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Model price trajectories, LP coverage, and sustainability metrics with real-time calculations
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge className="bg-emerald-500/20 text-emerald-600">$0.10 Launch Floor</Badge>
          <Badge className="bg-amber-500/20 text-amber-600">20% Mint Burn</Badge>
          <Badge className="bg-blue-500/20 text-blue-600">$300K LP Seed</Badge>
        </div>
        <ExportButtons 
          pageTitle="Tokenomics Simulator" 
          getData={() => projectionData.map(d => ({
            month: d.month,
            price: `$${d.price.toFixed(2)}`,
            lpUSDC: formatCurrency(d.lpUSDC),
            totalBurned: formatNumber(d.totalBurned),
            users: d.users,
            marketCap: formatCurrency(d.marketCap)
          }))} 
        />
      </motion.div>

      {/* Fixed Tokenomics Constants */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Optimized Token Economics (From Framework Analysis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Launch Floor</p>
                  <p className="font-semibold text-sm">$0.10</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Mint Burn</p>
                  <p className="font-semibold text-sm">20%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">LP Seed</p>
                  <p className="font-semibold text-sm">$300K</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Seed Target</p>
                  <p className="font-semibold text-sm">$1M-$2M</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sustainability Health Card */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Card className={`border-2 ${sustainability.isOptimal ? 'border-emerald-500/50 bg-emerald-500/5' : sustainability.isHealthy ? 'border-amber-500/50 bg-amber-500/5' : 'border-destructive/50 bg-destructive/5'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Sustainability Status
              </span>
              <Badge className={sustainability.isOptimal ? 'bg-emerald-500' : sustainability.isHealthy ? 'bg-amber-500' : 'bg-destructive'}>
                {sustainability.isOptimal ? '✓ Optimal' : sustainability.isHealthy ? '◐ Healthy' : '⚠ At Risk'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-xs text-muted-foreground">LP Coverage Ratio</p>
                <p className={`text-2xl font-bold ${sustainability.lpCoverage >= 1 ? 'text-emerald-600' : sustainability.lpCoverage >= 0.7 ? 'text-amber-600' : 'text-destructive'}`}>
                  {(sustainability.lpCoverage * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sustainability.lpCoverage >= 1 ? 'LP covers all sell pressure' : 'Target: ≥100%'}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-xs text-muted-foreground">Monthly LP Injection</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(sustainability.monthlyLPInjection)}</p>
                <p className="text-xs text-muted-foreground mt-1">From {payingUsers.toLocaleString()} subs</p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-xs text-muted-foreground">Sell Pressure (USD)</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(sustainability.sellPressureUSD)}</p>
                <p className="text-xs text-muted-foreground mt-1">At {sellRate}% sell rate</p>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <p className="text-xs text-muted-foreground">Net Monthly LP Flow</p>
                <p className={`text-2xl font-bold ${sustainability.netLPFlow >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {sustainability.netLPFlow >= 0 ? '+' : ''}{formatCurrency(sustainability.netLPFlow)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{sustainability.netLPFlow >= 0 ? 'Price floor rising' : 'Price pressure'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Input Controls */}
        <motion.div className="lg:col-span-1 space-y-4" initial="hidden" animate="visible" variants={fadeIn}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Scenario Parameters</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => applyPreset("base")}
                  className="text-xs"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Preset Selector */}
              <div className="space-y-2">
                <Label>Scenario Preset</Label>
                <Select value={preset} onValueChange={(v) => applyPreset(v as ScenarioPreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (1K subs)</SelectItem>
                    <SelectItem value="base">Base Case (5K subs)</SelectItem>
                    <SelectItem value="growth">Growth (10K subs)</SelectItem>
                    <SelectItem value="viral">Viral (25K subs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Paying Users */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Paying Subscribers
                    <InfoTooltip text="Active $9.99/month subscribers who can mint tokens" />
                  </Label>
                  <span className="text-sm font-bold">{payingUsers.toLocaleString()}</span>
                </div>
                <Slider
                  value={[payingUsers]}
                  onValueChange={([v]) => { setPayingUsers(v); setPreset("custom"); }}
                  min={100}
                  max={50000}
                  step={100}
                />
                <div className="flex flex-wrap gap-1">
                  {[1000, 5000, 10000, 25000].map(v => (
                    <Button key={v} size="sm" variant={payingUsers === v ? "default" : "outline"} onClick={() => setPayingUsers(v)} className="text-xs">
                      {v >= 1000 ? `${v/1000}K` : v}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Average Activity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Avg Activity (tokens/mo)
                    <InfoTooltip text="Average tokens minted per user per month (kWh + miles)" />
                  </Label>
                  <span className="text-sm font-bold">{avgActivity.toLocaleString()}</span>
                </div>
                <Slider
                  value={[avgActivity]}
                  onValueChange={([v]) => { setAvgActivity(v); setPreset("custom"); }}
                  min={100}
                  max={2000}
                  step={50}
                />
              </div>

              {/* Sell Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Monthly Sell Rate
                    <InfoTooltip text="% of minted tokens sold each month (expect 15-25%)" />
                  </Label>
                  <span className="text-sm font-bold">{sellRate}%</span>
                </div>
                <Slider
                  value={[sellRate]}
                  onValueChange={([v]) => { setSellRate(v); setPreset("custom"); }}
                  min={5}
                  max={40}
                  step={1}
                />
                <div className="flex flex-wrap gap-1">
                  {[15, 20, 25, 30].map(v => (
                    <Button key={v} size="sm" variant={sellRate === v ? "default" : "outline"} onClick={() => setSellRate(v)} className="text-xs">
                      {v}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Burn Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Mint Burn Rate
                    <InfoTooltip text="% of tokens burned on mint (20% recommended)" />
                  </Label>
                  <span className="text-sm font-bold">{burnRate}%</span>
                </div>
                <Slider
                  value={[burnRate]}
                  onValueChange={([v]) => { setBurnRate(v); setPreset("custom"); }}
                  min={10}
                  max={30}
                  step={1}
                />
              </div>

              {/* LP Seed */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    LP Seed (USDC)
                    <InfoTooltip text="Initial USDC in liquidity pool at launch" />
                  </Label>
                  <span className="text-sm font-bold">{formatCurrency(lpSeed)}</span>
                </div>
                <Slider
                  value={[lpSeed]}
                  onValueChange={([v]) => { setLpSeed(v); setPreset("custom"); }}
                  min={100000}
                  max={1000000}
                  step={25000}
                />
              </div>

              <Separator />

              {/* Projection Period */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Projection Period</Label>
                  <span className="text-sm font-bold">{projectionMonths} months</span>
                </div>
                <Slider
                  value={[projectionMonths]}
                  onValueChange={([v]) => setProjectionMonths(v)}
                  min={6}
                  max={48}
                  step={6}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results & Charts */}
        <motion.div className="lg:col-span-2 space-y-4" initial="hidden" animate="visible" variants={fadeIn}>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">Projected Price (M{projectionMonths})</p>
                <p className="text-base sm:text-xl font-bold">${sustainability.projectedPrice.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sustainability.projectedPrice >= TOKENOMICS.launchPrice ? '↑' : '↓'} from $0.10 launch
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">User Reward Value</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600">{formatCurrency(sustainability.effectiveRewardValue)}/mo</p>
                <p className="text-xs text-muted-foreground mt-1">@ {avgActivity} tokens/mo</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">Monthly Burn</p>
                <p className="text-base sm:text-xl font-bold text-amber-600">{formatNumber(sustainability.tokensBurned)}</p>
                <p className="text-xs text-muted-foreground mt-1">{burnRate}% of {formatNumber(sustainability.grossMinted)} minted</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">MRR</p>
                <p className="text-base sm:text-xl font-bold text-blue-600">{formatCurrency(sustainability.mrr)}</p>
                <p className="text-xs text-muted-foreground mt-1">{payingUsers.toLocaleString()} × $9.99</p>
              </CardContent>
            </Card>
          </div>

          {/* Price Trajectory Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Price Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v.toFixed(2)}`} className="text-xs" domain={[0, 'auto']} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={TOKENOMICS.launchPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: '$0.10 Floor', position: 'right', className: 'text-xs fill-muted-foreground' }} />
                    <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Token Price" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* LP Depth Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                LP Depth Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="lpUSDC" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/0.2)" name="LP USDC" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Breakeven Analysis */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Breakeven Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">To Cover Current Sell Pressure</p>
                  <p className="text-2xl font-bold text-primary">{sustainability.breakevenSubs.toLocaleString()} subs</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    At {sellRate}% sell rate & {avgActivity} tokens/user
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Tipping Point (25K subs)</p>
                  <p className="text-2xl font-bold text-emerald-600">${(25000 * 4.995).toLocaleString()}/mo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly LP injection at scale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Disclaimer:</strong> This simulator uses simplified AMM math for educational purposes. 
              Real market dynamics involve additional factors. These projections are not financial advice.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
