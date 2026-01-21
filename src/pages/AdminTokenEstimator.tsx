import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { motion } from "framer-motion";
import { Loader2, Calculator, TrendingUp, Droplets, Flame, Building2, ArrowRightLeft, Users, DollarSign, Coins, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, Legend, BarChart, Bar } from "recharts";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Token economics constants
const MAX_SUPPLY = 50_000_000_000; // 50 billion
const INITIAL_CIRCULATION = 5_000_000_000; // 5 billion (10% founder/owner allocation)
const BURN_TAX_RATE = 0.035; // 3.5%
const TREASURY_TAX_RATE = 0.035; // 3.5%
const AUTO_LP_RATE = 0.01; // 1% of transaction value to LP
const SUBSCRIPTION_LP_RATE = 0.50; // 50% of subscriptions to LP
const MONTHLY_SUB_FEE = 9.99;

interface ProjectionData {
  month: number;
  users: number;
  lpUSDC: number;
  lpTokens: number;
  circulatingSupply: number;
  totalBurned: number;
  treasuryBalance: number;
  tokenPrice: number;
  marketCap: number;
  monthlyLPInjection: number;
}

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

  // Input state
  const [initialLPSeed, setInitialLPSeed] = useState(100000); // $100k initial LP
  const [initialTokensInLP, setInitialTokensInLP] = useState(1_000_000_000); // 1B tokens in LP
  const [startingUsers, setStartingUsers] = useState(100);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(15); // 15% monthly growth
  const [avgTransactionsPerUser, setAvgTransactionsPerUser] = useState(5);
  const [avgTransactionSize, setAvgTransactionSize] = useState(100); // $100 avg transaction
  const [projectionMonths, setProjectionMonths] = useState(24);
  const [conversionRate, setConversionRate] = useState(30); // 30% of users are paid subscribers

  // Calculate projections
  const projections = useMemo(() => {
    const data: ProjectionData[] = [];
    
    let lpUSDC = initialLPSeed;
    let lpTokens = initialTokensInLP;
    let circulatingSupply = INITIAL_CIRCULATION;
    let totalBurned = 0;
    let treasuryBalance = 0;
    let users = startingUsers;

    for (let month = 0; month <= projectionMonths; month++) {
      // Calculate token price using AMM formula: Price = USDC / Tokens
      const tokenPrice = lpTokens > 0 ? lpUSDC / lpTokens : 0;
      const marketCap = tokenPrice * circulatingSupply;

      // Calculate monthly activity
      const paidUsers = Math.floor(users * (conversionRate / 100));
      const subscriptionRevenue = paidUsers * MONTHLY_SUB_FEE;
      const lpFromSubs = subscriptionRevenue * SUBSCRIPTION_LP_RATE;

      // Transaction volume (in tokens, converted from USD)
      const transactionVolumeUSD = users * avgTransactionsPerUser * avgTransactionSize;
      const transactionVolumeTokens = tokenPrice > 0 ? transactionVolumeUSD / tokenPrice : 0;

      // Fees from transactions
      const burnFromTx = transactionVolumeTokens * BURN_TAX_RATE;
      const treasuryFromTx = transactionVolumeTokens * TREASURY_TAX_RATE;
      const lpFromTx = transactionVolumeUSD * AUTO_LP_RATE;

      const monthlyLPInjection = lpFromSubs + lpFromTx;

      data.push({
        month,
        users: Math.round(users),
        lpUSDC: Math.round(lpUSDC),
        lpTokens: Math.round(lpTokens),
        circulatingSupply: Math.round(circulatingSupply),
        totalBurned: Math.round(totalBurned),
        treasuryBalance: Math.round(treasuryBalance),
        tokenPrice: tokenPrice,
        marketCap: Math.round(marketCap),
        monthlyLPInjection: Math.round(monthlyLPInjection),
      });

      // Apply changes for next month
      if (month < projectionMonths) {
        lpUSDC += monthlyLPInjection;
        totalBurned += burnFromTx;
        treasuryBalance += treasuryFromTx * tokenPrice; // Convert to USD value
        circulatingSupply -= burnFromTx; // Burned tokens reduce circulation
        users *= (1 + monthlyGrowthRate / 100);
      }
    }

    return data;
  }, [
    initialLPSeed,
    initialTokensInLP,
    startingUsers,
    monthlyGrowthRate,
    avgTransactionsPerUser,
    avgTransactionSize,
    projectionMonths,
    conversionRate,
  ]);

  const latestData = projections[projections.length - 1];
  const initialData = projections[0];

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
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

  const priceMultiplier = initialData.tokenPrice > 0 
    ? (latestData.tokenPrice / initialData.tokenPrice) 
    : 0;

  if (isLoading || isChecking) {
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
    tokenPrice: { label: "Token Price", color: "hsl(var(--primary))" },
    marketCap: { label: "Market Cap", color: "hsl(var(--secondary))" },
    users: { label: "Users", color: "hsl(var(--accent))" },
    lpUSDC: { label: "LP (USDC)", color: "hsl(var(--chart-1))" },
    totalBurned: { label: "Total Burned", color: "hsl(var(--destructive))" },
  };

  // Derived starting price from LP ratio
  const startingPrice = initialTokensInLP > 0 ? initialLPSeed / initialTokensInLP : 0;
  
  // Handle manual price input - adjusts tokens in LP to achieve target price
  const handlePriceChange = (targetPrice: number) => {
    if (targetPrice > 0 && initialLPSeed > 0) {
      const requiredTokens = Math.round(initialLPSeed / targetPrice);
      setInitialTokensInLP(Math.max(100_000_000, Math.min(requiredTokens, 10_000_000_000)));
    }
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
          Token Economics
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold">$ZSOLAR Price Estimator</h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          AMM-based price projections using constant product formula with burn mechanics, treasury fees, and LP injection
        </p>
      </motion.div>

      {/* Tokenomics Constants */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Built-in Tokenomics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Burn Tax</p>
                  <p className="font-semibold text-sm">3.5%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Treasury Tax</p>
                  <p className="font-semibold text-sm">3.5%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Auto LP (Tx)</p>
                  <p className="font-semibold text-sm">1%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-background">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Subscription LP</p>
                  <p className="font-semibold text-sm">50%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Input Controls */}
        <motion.div
          className="lg:col-span-1 space-y-4"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Model Parameters</CardTitle>
              <CardDescription className="text-xs">Adjust inputs to see price projections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Starting Price - Direct Input */}
              <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">
                    Starting Price
                    <InfoTooltip text="Set your target launch price. This adjusts the LP token ratio automatically." />
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">$</span>
                  <Input
                    type="number"
                    value={startingPrice.toFixed(6)}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                    step="0.000001"
                    min="0.000001"
                    max="1"
                    className="font-mono text-lg h-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You control this at launch by setting the LP ratio
                </p>
              </div>

              {/* Initial LP Seed */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">
                    Initial LP Seed (USDC)
                    <InfoTooltip text="Starting USDC in the liquidity pool at launch" />
                  </Label>
                  <span className="text-xs font-medium">{formatCurrency(initialLPSeed)}</span>
                </div>
                <Slider
                  value={[initialLPSeed]}
                  onValueChange={([v]) => setInitialLPSeed(v)}
                  min={10000}
                  max={1000000}
                  step={10000}
                />
              </div>

              {/* Initial Tokens in LP */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">
                    Tokens in LP
                    <InfoTooltip text="Number of tokens paired with USDC in LP. Adjusted when you change price." />
                  </Label>
                  <span className="text-xs font-medium">{formatNumber(initialTokensInLP)}</span>
                </div>
                <Slider
                  value={[initialTokensInLP]}
                  onValueChange={([v]) => setInitialTokensInLP(v)}
                  min={100_000_000}
                  max={10_000_000_000}
                  step={100_000_000}
                />
              </div>

              <Separator />

              {/* Starting Users */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Starting Users
                    <InfoTooltip text="Number of users at launch (Month 0)" />
                  </Label>
                  <span className="text-sm font-medium">{formatNumber(startingUsers)}</span>
                </div>
                <Slider
                  value={[startingUsers]}
                  onValueChange={([v]) => setStartingUsers(v)}
                  min={10}
                  max={10000}
                  step={10}
                />
              </div>

              {/* Monthly Growth Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Monthly Growth Rate
                    <InfoTooltip text="Percentage user growth each month (compound)" />
                  </Label>
                  <span className="text-sm font-medium">{monthlyGrowthRate}%</span>
                </div>
                <Slider
                  value={[monthlyGrowthRate]}
                  onValueChange={([v]) => setMonthlyGrowthRate(v)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>

              {/* Conversion Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Paid Subscriber Rate
                    <InfoTooltip text="Percentage of users on $9.99/mo paid plan" />
                  </Label>
                  <span className="text-sm font-medium">{conversionRate}%</span>
                </div>
                <Slider
                  value={[conversionRate]}
                  onValueChange={([v]) => setConversionRate(v)}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>

              <Separator />

              {/* Avg Transactions Per User */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Tx/User/Month
                    <InfoTooltip text="Average token transactions per user per month" />
                  </Label>
                  <span className="text-sm font-medium">{avgTransactionsPerUser}</span>
                </div>
                <Slider
                  value={[avgTransactionsPerUser]}
                  onValueChange={([v]) => setAvgTransactionsPerUser(v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              {/* Avg Transaction Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">
                    Avg Tx Size (USD)
                    <InfoTooltip text="Average transaction value in USD equivalent" />
                  </Label>
                  <span className="text-sm font-medium">{formatCurrency(avgTransactionSize)}</span>
                </div>
                <Slider
                  value={[avgTransactionSize]}
                  onValueChange={([v]) => setAvgTransactionSize(v)}
                  min={10}
                  max={1000}
                  step={10}
                />
              </div>

              <Separator />

              {/* Projection Months */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Projection Period</Label>
                  <span className="text-sm font-medium">{projectionMonths} months</span>
                </div>
                <Slider
                  value={[projectionMonths]}
                  onValueChange={([v]) => setProjectionMonths(v)}
                  min={6}
                  max={60}
                  step={6}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results & Charts */}
        <motion.div
          className="lg:col-span-2 space-y-4"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">Starting Price</p>
                <p className="text-base sm:text-xl font-bold truncate">${initialData.tokenPrice.toFixed(6)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground truncate">Final Price (M{projectionMonths})</p>
                <p className="text-base sm:text-xl font-bold text-green-600 truncate">${latestData.tokenPrice.toFixed(6)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">Price Multiplier</p>
                <p className="text-base sm:text-xl font-bold">{priceMultiplier.toFixed(2)}x</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">Final Market Cap</p>
                <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(latestData.marketCap)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 shrink-0" /> Final Users
                </p>
                <p className="text-base sm:text-lg font-semibold">{formatNumber(latestData.users)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplets className="h-3 w-3 shrink-0" /> LP Depth
                </p>
                <p className="text-base sm:text-lg font-semibold truncate">{formatCurrency(latestData.lpUSDC)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3 shrink-0" /> Total Burned
                </p>
                <p className="text-base sm:text-lg font-semibold">{formatNumber(latestData.totalBurned)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 shrink-0" /> Treasury
                </p>
                <p className="text-base sm:text-lg font-semibold truncate">{formatCurrency(latestData.treasuryBalance)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Token Price Projection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(v) => `M${v}`}
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${v.toFixed(4)}`}
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      width={55}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        formatter={(value) => `$${Number(value).toFixed(6)}`}
                      />} 
                    />
                    <Area
                      type="monotone"
                      dataKey="tokenPrice"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* LP & Users Growth */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Liquidity Pool Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ChartContainer config={chartConfig} className="h-[150px] sm:h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 10 }} width={50} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                      <Area
                        type="monotone"
                        dataKey="lpUSDC"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ChartContainer config={chartConfig} className="h-[150px] sm:h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => formatNumber(v)} className="text-xs" tick={{ fontSize: 10 }} width={40} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(Number(value))} />} />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(var(--accent))"
                        fill="hsl(var(--accent))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Formula Explanation */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AMM Price Formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="font-mono text-xs sm:text-sm bg-background p-3 rounded-lg">
                <p className="text-primary">Price = LP_USDC / LP_Tokens</p>
                <p className="text-muted-foreground text-xs mt-1">Constant Product: x * y = k</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">LP Injection Sources:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>50% of $9.99/mo subscriptions</li>
                    <li>1% of all token transactions</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Deflationary Mechanics:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>3.5% burn on every transfer</li>
                    <li>3.5% to treasury (buyback potential)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-amber-600">Disclaimer:</strong> This is a simplified model for internal planning only. 
              Actual token prices depend on market conditions, trading activity, external factors, and cannot be guaranteed. 
              This tool should not be shared with investors or used to make investment promises. 
              The SEC considers price predictions as potential securities fraud if used to solicit investment.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
