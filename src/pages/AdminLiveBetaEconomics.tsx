import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useOnChainMetrics } from '@/hooks/useOnChainMetrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { 
  Loader2, 
  Zap, 
  TrendingUp, 
  Flame,
  Droplets,
  Wallet,
  Users,
  ArrowRight,
  Activity,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Info,
  Database,
  Coins,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  IS_LIVE_BETA,
  LIVE_BETA_MULTIPLIER,
  LIVE_BETA_CONFIG,
  MINT_DISTRIBUTION,
  TRANSFER_TAX,
  PRICES,
  SUBSCRIPTION,
  formatTokenAmount,
  formatUSD,
  getActiveLPSeed,
} from '@/lib/tokenomics';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface LiveMetrics {
  totalMinted: number;
  totalBurned: number;
  totalLPInjected: number;
  totalTreasuryCollected: number;
  activeUsers: number;
  transactionCount: number;
  currentPrice: number;
  lpDepth: number;
}

const INITIAL_METRICS: LiveMetrics = {
  totalMinted: 0,
  totalBurned: 0,
  totalLPInjected: 1000, // Initial LP seed
  totalTreasuryCollected: 0,
  activeUsers: 0,
  transactionCount: 0,
  currentPrice: 0.10,
  lpDepth: 1000,
};

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export default function AdminLiveBetaEconomics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();
  const { metrics: onChainMetrics, refresh: refreshOnChainMetrics } = useOnChainMetrics(30000);
  
  // Simulation state
  const [simulatedUsers, setSimulatedUsers] = useState(10);
  const [avgMonthlyActivity, setAvgMonthlyActivity] = useState(500); // kWh equivalent
  const [simulatedMonths, setSimulatedMonths] = useState(6);
  
  // Loading and auth checks
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate simulation data
  const lpSeed = getActiveLPSeed();
  
  const simulationData = useMemo(() => {
    const data = [];
    let cumulativeMinted = 0;
    let cumulativeBurned = 0;
    let cumulativeLP = lpSeed.usdcAmount;
    let cumulativeTreasury = 0;
    let currentTokenSupply = lpSeed.tokenAmount;
    
    for (let month = 0; month <= simulatedMonths; month++) {
      // Monthly activity per user × users × reward rate (10x in Live Beta)
      const monthlyTokensMinted = month === 0 ? 0 : 
        simulatedUsers * avgMonthlyActivity * LIVE_BETA_MULTIPLIER;
      
      // Mint distribution
      const userTokens = monthlyTokensMinted * (MINT_DISTRIBUTION.user / 100);
      const burnTokens = monthlyTokensMinted * (MINT_DISTRIBUTION.burn / 100);
      const lpTokens = monthlyTokensMinted * (MINT_DISTRIBUTION.lp / 100);
      const treasuryTokens = monthlyTokensMinted * (MINT_DISTRIBUTION.treasury / 100);
      
      // Subscription LP injection (50% of $9.99 × users)
      const subscriptionLPInjection = month === 0 ? 0 :
        simulatedUsers * SUBSCRIPTION.monthlyPrice * (SUBSCRIPTION.lpContribution / 100);
      
      cumulativeMinted += monthlyTokensMinted;
      cumulativeBurned += burnTokens;
      cumulativeLP += subscriptionLPInjection;
      cumulativeTreasury += treasuryTokens;
      currentTokenSupply += (userTokens + lpTokens + treasuryTokens); // Burned tokens removed
      
      // Simplified AMM price calculation
      // Price = LP_USDC / Token_Supply_In_Pool
      const priceImpact = month === 0 ? 0 : 
        (subscriptionLPInjection / cumulativeLP) * 0.5; // Positive price pressure
      const currentPrice = PRICES.launchFloor * (1 + priceImpact * month);
      
      data.push({
        month: `M${month}`,
        minted: Math.round(cumulativeMinted),
        burned: Math.round(cumulativeBurned),
        lpDepth: Math.round(cumulativeLP),
        treasury: Math.round(cumulativeTreasury),
        price: Math.round(currentPrice * 1000) / 1000,
        userTokens: Math.round(userTokens),
      });
    }
    
    return data;
  }, [simulatedUsers, avgMonthlyActivity, simulatedMonths, lpSeed]);
  
  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const final = simulationData[simulationData.length - 1];
    const initial = simulationData[0];
    
    return {
      totalMinted: final.minted,
      totalBurned: final.burned,
      burnRate: final.minted > 0 ? ((final.burned / final.minted) * 100).toFixed(1) : '0',
      lpGrowth: ((final.lpDepth - initial.lpDepth) / initial.lpDepth * 100).toFixed(1),
      priceChange: ((final.price - initial.price) / initial.price * 100).toFixed(1),
      monthlySubscriptionLP: simulatedUsers * SUBSCRIPTION.monthlyPrice * (SUBSCRIPTION.lpContribution / 100),
      avgTokensPerUser: final.minted > 0 ? Math.round(final.minted / simulatedUsers) : 0,
    };
  }, [simulationData, simulatedUsers]);

  // Pie chart data for mint distribution
  const distributionData = [
    { name: 'User', value: MINT_DISTRIBUTION.user, color: 'hsl(var(--primary))' },
    { name: 'Burn', value: MINT_DISTRIBUTION.burn, color: 'hsl(var(--destructive))' },
    { name: 'LP', value: MINT_DISTRIBUTION.lp, color: 'hsl(var(--solar))' },
    { name: 'Treasury', value: MINT_DISTRIBUTION.treasury, color: 'hsl(var(--muted-foreground))' },
  ];

  // Transfer tax pie data
  const taxData = [
    { name: 'Burn', value: TRANSFER_TAX.burn, color: 'hsl(var(--destructive))' },
    { name: 'LP', value: TRANSFER_TAX.lp, color: 'hsl(var(--solar))' },
    { name: 'Treasury', value: TRANSFER_TAX.treasury, color: 'hsl(var(--muted-foreground))' },
  ];

  const getExportData = () => {
    return [
      { section: 'Config', metric: 'Mode', value: IS_LIVE_BETA ? 'Live Beta' : 'Mainnet' },
      { section: 'Config', metric: 'Reward Multiplier', value: `${LIVE_BETA_MULTIPLIER}x` },
      { section: 'Config', metric: 'LP Seed (USDC)', value: formatUSD(lpSeed.usdcAmount) },
      { section: 'Config', metric: 'LP Seed (Tokens)', value: formatTokenAmount(lpSeed.tokenAmount) },
      { section: 'Config', metric: 'Initial Price', value: formatUSD(lpSeed.initialPrice) },
      { section: 'Simulation', metric: 'Users', value: simulatedUsers.toString() },
      { section: 'Simulation', metric: 'Avg Monthly Activity', value: `${avgMonthlyActivity} kWh` },
      { section: 'Simulation', metric: 'Duration', value: `${simulatedMonths} months` },
      { section: 'Results', metric: 'Total Minted', value: formatTokenAmount(summaryMetrics.totalMinted) },
      { section: 'Results', metric: 'Total Burned', value: formatTokenAmount(summaryMetrics.totalBurned) },
      { section: 'Results', metric: 'Burn Rate', value: `${summaryMetrics.burnRate}%` },
      { section: 'Results', metric: 'LP Growth', value: `${summaryMetrics.lpGrowth}%` },
      { section: 'Results', metric: 'Price Change', value: `${summaryMetrics.priceChange}%` },
      ...simulationData.map((d, i) => ({
        section: 'Projection',
        metric: d.month,
        minted: d.minted,
        burned: d.burned,
        lpDepth: d.lpDepth,
        price: d.price,
      })),
    ];
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Beta Economics</h1>
            <Badge 
              variant={IS_LIVE_BETA ? "default" : "secondary"}
              className={IS_LIVE_BETA ? "bg-solar text-solar-foreground" : ""}
            >
              {IS_LIVE_BETA ? '🔥 LIVE BETA ACTIVE' : 'Mainnet Config'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Real-time flywheel visualization for investor demos
          </p>
        </div>
        <ExportButtons 
          pageTitle="Live Beta Economics" 
          getData={getExportData}
        />
      </motion.div>

      {/* Status Banner */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className={IS_LIVE_BETA ? "border-solar/50 bg-solar/5" : "border-muted"}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${IS_LIVE_BETA ? 'bg-solar/20' : 'bg-muted'}`}>
                  <Activity className={`h-5 w-5 ${IS_LIVE_BETA ? 'text-solar' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {IS_LIVE_BETA ? 'Live Beta Mode Enabled' : 'Running Mainnet Configuration'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {IS_LIVE_BETA 
                      ? `${LIVE_BETA_MULTIPLIER}x reward multiplier • Scaled LP pool • Test USDC`
                      : 'Standard 1x rewards • Full LP configuration'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {IS_LIVE_BETA ? LIVE_BETA_CONFIG.testUSDCContract.slice(0, 10) + '...' : 'Mainnet USDC'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real-Time On-Chain Metrics */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Real-Time On-Chain Data</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {onChainMetrics.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'LIVE'
                  )}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshOnChainMetrics}
                disabled={onChainMetrics.isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${onChainMetrics.isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription className="flex items-center gap-2">
              {onChainMetrics.lastUpdated ? (
                <>
                  <Clock className="h-3 w-3" />
                  Last updated: {onChainMetrics.lastUpdated.toLocaleTimeString()}
                </>
              ) : (
                'Fetching data from blockchain...'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onChainMetrics.error ? (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {onChainMetrics.error}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <Coins className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{formatTokenAmount(onChainMetrics.totalMinted)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Minted</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-lg font-bold">{formatTokenAmount(onChainMetrics.totalBurned)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Burned</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <Activity className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{formatTokenAmount(onChainMetrics.circulatingSupply)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Circulating</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <Droplets className="h-5 w-5 mx-auto mb-1 text-solar" />
                  <p className="text-lg font-bold">{formatUSD(onChainMetrics.lpUsdcBalance)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">LP Depth</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{formatUSD(onChainMetrics.estimatedPrice)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Price</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <BarChart3 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{onChainMetrics.mintTransactionCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mint TXs</p>
                </div>
              </div>
            )}
            
            {/* LP Token Ratio */}
            {!onChainMetrics.error && onChainMetrics.lpTokenBalance > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">LP Token Balance:</span>
                  <span className="font-mono">{formatTokenAmount(onChainMetrics.lpTokenBalance)} $ZSOLAR</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Treasury Balance:</span>
                  <span className="font-mono">{formatTokenAmount(onChainMetrics.treasuryBalance)} $ZSOLAR</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div 
        variants={fadeIn} 
        initial="hidden" 
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-[10px]">LP SEED</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{formatUSD(lpSeed.usdcAmount)}</p>
            <p className="text-xs text-muted-foreground">{formatTokenAmount(lpSeed.tokenAmount)} tokens</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-solar/10 to-solar/5 border-solar/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Zap className="h-4 w-4 text-solar" />
              <Badge variant="secondary" className="text-[10px]">MULTIPLIER</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1}x</p>
            <p className="text-xs text-muted-foreground">Reward rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Flame className="h-4 w-4 text-destructive" />
              <Badge variant="secondary" className="text-[10px]">BURN</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{MINT_DISTRIBUTION.burn}%</p>
            <p className="text-xs text-muted-foreground">On mint</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted to-background border-muted">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-[10px]">TARGET</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{LIVE_BETA_CONFIG.targetUsers}</p>
            <p className="text-xs text-muted-foreground">Beta users</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Simulation Controls */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Flywheel Simulator
            </CardTitle>
            <CardDescription>
              Adjust parameters to see projected token economics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beta Users</span>
                  <span className="font-medium">{simulatedUsers}</span>
                </div>
                <Slider
                  value={[simulatedUsers]}
                  onValueChange={([v]) => setSimulatedUsers(v)}
                  min={1}
                  max={25}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Activity (kWh/mo)</span>
                  <span className="font-medium">{avgMonthlyActivity}</span>
                </div>
                <Slider
                  value={[avgMonthlyActivity]}
                  onValueChange={([v]) => setAvgMonthlyActivity(v)}
                  min={100}
                  max={2000}
                  step={50}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projection (months)</span>
                  <span className="font-medium">{simulatedMonths}</span>
                </div>
                <Slider
                  value={[simulatedMonths]}
                  onValueChange={([v]) => setSimulatedMonths(v)}
                  min={1}
                  max={12}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Results Summary */}
            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{formatTokenAmount(summaryMetrics.totalMinted)}</p>
                <p className="text-xs text-muted-foreground">Total Minted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{formatTokenAmount(summaryMetrics.totalBurned)}</p>
                <p className="text-xs text-muted-foreground">Total Burned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-solar">+{summaryMetrics.lpGrowth}%</p>
                <p className="text-xs text-muted-foreground">LP Growth</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">+{summaryMetrics.priceChange}%</p>
                <p className="text-xs text-muted-foreground">Price Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LP Depth & Price Chart */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">LP Depth & Price Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationData}>
                    <defs>
                      <linearGradient id="lpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--solar))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--solar))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      yAxisId="left"
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `$${(v * 100).toFixed(0)}¢`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'lpDepth') return [formatUSD(value), 'LP Depth'];
                        if (name === 'price') return [formatUSD(value), 'Token Price'];
                        return [value, name];
                      }}
                    />
                    <ReferenceLine 
                      y={lpSeed.usdcAmount} 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Initial LP', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="lpDepth"
                      stroke="hsl(var(--solar))"
                      fill="url(#lpGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Burn & Mint Chart */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cumulative Minted vs Burned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationData}>
                    <defs>
                      <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatTokenAmount(v)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [formatTokenAmount(value), name === 'minted' ? 'Minted' : 'Burned']}
                    />
                    <Area
                      type="monotone"
                      dataKey="minted"
                      stroke="hsl(var(--primary))"
                      fill="url(#mintGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="burned"
                      stroke="hsl(var(--destructive))"
                      fill="url(#burnGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Pies */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Mint Distribution
                <InfoTooltip text="How newly minted tokens are distributed: 75% to user, 20% burned, 3% to LP, 2% to treasury" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Transfer Tax (7%)
                <InfoTooltip text="Tax applied on every token transfer: 3% burned, 2% to LP, 2% to treasury" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taxData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taxData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Flywheel Visualization */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              The Flywheel Effect
            </CardTitle>
            <CardDescription>
              How subscription revenue creates sustainable token value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { 
                  step: 1, 
                  icon: Users, 
                  title: 'Users Subscribe', 
                  description: `${simulatedUsers} users × $${SUBSCRIPTION.monthlyPrice}/mo`,
                  value: formatUSD(simulatedUsers * SUBSCRIPTION.monthlyPrice),
                  color: 'text-primary'
                },
                { 
                  step: 2, 
                  icon: Droplets, 
                  title: '50% → LP', 
                  description: 'Monthly liquidity injection',
                  value: formatUSD(summaryMetrics.monthlySubscriptionLP),
                  color: 'text-solar'
                },
                { 
                  step: 3, 
                  icon: TrendingUp, 
                  title: 'Price Support', 
                  description: 'Deeper LP = stronger floor',
                  value: `+${summaryMetrics.lpGrowth}%`,
                  color: 'text-green-500'
                },
                { 
                  step: 4, 
                  icon: Flame, 
                  title: 'Deflationary', 
                  description: '20% mint burn + 3% transfer',
                  value: `${summaryMetrics.burnRate}% burned`,
                  color: 'text-destructive'
                },
              ].map((item, index) => (
                <div 
                  key={item.step}
                  className="relative text-center p-4 rounded-lg bg-muted/50"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-background border mb-3 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  {index < 3 && (
                    <ArrowRight className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/contracts')}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Contracts
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/final-tokenomics')}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Tokenomics
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/investment-thesis')}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Investment Thesis
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://app.uniswap.org/swap?chain=base_sepolia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Uniswap (Base Sepolia)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer Disclaimer */}
      <motion.p 
        variants={fadeIn} 
        initial="hidden" 
        animate="visible"
        className="text-xs text-center text-muted-foreground"
      >
        Live Beta simulation for demonstration purposes. Actual results may vary based on user activity and market conditions.
      </motion.p>
    </div>
  );
}
