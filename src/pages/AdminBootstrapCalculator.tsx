import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins, 
  DollarSign, 
  Flame,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Download,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SEO } from "@/components/SEO";

interface MonthData {
  month: number;
  users: number;
  tokensMinted: number;
  tokensBurned: number;
  netToUsers: number;
  lpInjection: number;
  cumulativeLp: number;
  tokensSold: number;
  lpTokenReserve: number;
  price: number;
  coverageRatio: number;
  cumulativeMinted: number;
  cumulativeBurned: number;
}

type SellScenario = 'hodl' | 'conservative' | 'moderate' | 'aggressive';

const SELL_SCENARIOS: Record<SellScenario, { label: string; description: string; startMonth: number; rate: number }> = {
  hodl: { label: '100% HODL', description: 'All users hold for 12 months', startMonth: 13, rate: 0 },
  conservative: { label: 'Conservative', description: '10% sell from Month 6', startMonth: 6, rate: 0.10 },
  moderate: { label: 'Moderate', description: '25% sell from Month 9', startMonth: 9, rate: 0.25 },
  aggressive: { label: 'Aggressive', description: '40% sell from Month 6', startMonth: 6, rate: 0.40 },
};

export default function AdminBootstrapCalculator() {
  // Core parameters
  const [initialLpUsdc, setInitialLpUsdc] = useState(2000);
  const [initialLpTokens, setInitialLpTokens] = useState(20000);
  const [subscriptionFee, setSubscriptionFee] = useState(9.99);
  const [lpRevenueShare, setLpRevenueShare] = useState(50);
  const [mintRatePerUser, setMintRatePerUser] = useState(800);
  const [mintBurnRate, setMintBurnRate] = useState(20);
  
  // Growth parameters
  const [startingUsers, setStartingUsers] = useState(10);
  const [doublingMonths, setDoublingMonths] = useState(2);
  const [maxUsers, setMaxUsers] = useState(160);
  
  // Sell scenario
  const [sellScenario, setSellScenario] = useState<SellScenario>('moderate');

  const floorPrice = useMemo(() => initialLpUsdc / initialLpTokens, [initialLpUsdc, initialLpTokens]);
  const lpInjectionPerUser = useMemo(() => (subscriptionFee * lpRevenueShare) / 100, [subscriptionFee, lpRevenueShare]);
  const netDistributionRate = useMemo(() => (100 - mintBurnRate - 5) / 100, [mintBurnRate]); // 5% = 3% LP + 2% treasury

  // Calculate 12-month projection
  const projection = useMemo((): MonthData[] => {
    const months: MonthData[] = [];
    const scenario = SELL_SCENARIOS[sellScenario];
    const k = initialLpUsdc * initialLpTokens; // AMM constant
    
    let cumulativeLp = initialLpUsdc;
    let lpTokenReserve = initialLpTokens;
    let cumulativeMinted = 0;
    let cumulativeBurned = 0;
    
    for (let month = 1; month <= 12; month++) {
      // Calculate users for this month (doubling pattern)
      const doublingPeriods = Math.floor((month - 1) / doublingMonths);
      const users = Math.min(startingUsers * Math.pow(2, doublingPeriods), maxUsers);
      
      // Minting calculations
      const tokensMinted = users * mintRatePerUser;
      const tokensBurned = tokensMinted * (mintBurnRate / 100);
      const netToUsers = tokensMinted * netDistributionRate;
      
      // LP injection from subscriptions
      const lpInjection = users * lpInjectionPerUser;
      
      // Sell pressure (based on scenario)
      const sellRate = month >= scenario.startMonth ? scenario.rate : 0;
      const tokensSold = netToUsers * sellRate;
      
      // AMM price calculation
      // When we inject USDC (buy), we add USDC and remove tokens
      // When users sell, they add tokens and remove USDC
      
      // First, handle the subscription buyback (adds USDC, removes tokens)
      if (lpInjection > 0 && sellRate === 0) {
        // Pure buyback - price increases
        cumulativeLp += lpInjection;
        lpTokenReserve = k / cumulativeLp;
      } else if (tokensSold > 0) {
        // Users selling - need to calculate net effect
        // Sell value at current price
        const currentPrice = cumulativeLp / lpTokenReserve;
        const sellValueUsdc = tokensSold * currentPrice;
        
        // Net LP change = buybacks - sells
        const netLpChange = lpInjection - sellValueUsdc;
        
        if (netLpChange > 0) {
          // Net buying pressure
          cumulativeLp += netLpChange;
          lpTokenReserve = k / cumulativeLp;
        } else {
          // Net selling pressure - tokens increase, USDC decreases
          cumulativeLp = Math.max(cumulativeLp + netLpChange, initialLpUsdc * 0.5); // Floor at 50% of initial
          lpTokenReserve = k / cumulativeLp;
        }
      } else if (lpInjection > 0) {
        cumulativeLp += lpInjection;
        lpTokenReserve = k / cumulativeLp;
      }
      
      const price = cumulativeLp / lpTokenReserve;
      
      // Coverage ratio
      const currentPrice2 = cumulativeLp / lpTokenReserve;
      const sellValueUsdc = tokensSold * currentPrice2;
      const coverageRatio = sellValueUsdc > 0 ? lpInjection / sellValueUsdc : Infinity;
      
      cumulativeMinted += tokensMinted;
      cumulativeBurned += tokensBurned;
      
      months.push({
        month,
        users,
        tokensMinted,
        tokensBurned,
        netToUsers,
        lpInjection,
        cumulativeLp,
        tokensSold,
        lpTokenReserve,
        price,
        coverageRatio,
        cumulativeMinted,
        cumulativeBurned,
      });
    }
    
    return months;
  }, [
    initialLpUsdc, initialLpTokens, subscriptionFee, lpRevenueShare,
    mintRatePerUser, mintBurnRate, startingUsers, doublingMonths, maxUsers, sellScenario
  ]);

  const finalMonth = projection[11];
  const priceChange = ((finalMonth.price - floorPrice) / floorPrice) * 100;
  const isHealthy = finalMonth.coverageRatio >= 1 || sellScenario === 'hodl';

  const resetToDefaults = () => {
    setInitialLpUsdc(2000);
    setInitialLpTokens(20000);
    setSubscriptionFee(9.99);
    setLpRevenueShare(50);
    setMintRatePerUser(800);
    setMintBurnRate(20);
    setStartingUsers(10);
    setDoublingMonths(2);
    setMaxUsers(160);
    setSellScenario('moderate');
  };

  const formatNumber = (n: number) => {
    if (n === Infinity) return '∞';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(n < 10 ? 2 : 0);
  };

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };

  return (
    <TooltipProvider>
      <SEO 
        title="Bootstrap Calculator | Admin"
        description="Interactive tokenomics calculator for bootstrap growth model"
      />
      
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              Bootstrap Tokenomics Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Model organic growth scenarios without external capital
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">Launch</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(floorPrice)}</p>
              <p className="text-sm text-muted-foreground">Floor Price</p>
            </CardContent>
          </Card>
          
          <Card className={`bg-gradient-to-br ${priceChange >= 0 ? 'from-emerald-500/10 to-emerald-500/5' : 'from-red-500/10 to-red-500/5'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                {priceChange >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                <Badge variant="outline" className="text-xs">Month 12</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(finalMonth.price)}</p>
              <p className={`text-sm ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Month 12</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{finalMonth.users}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          
          <Card className={isHealthy ? 'border-emerald-500/30' : 'border-amber-500/30'}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                {isHealthy ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                <Badge variant={isHealthy ? 'default' : 'secondary'} className="text-xs">
                  {isHealthy ? 'Healthy' : 'At Risk'}
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatNumber(finalMonth.coverageRatio)}</p>
              <p className="text-sm text-muted-foreground">Coverage Ratio</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="parameters" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="projection">12-Month Projection</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Liquidity Pool Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Initial Liquidity Pool
                  </CardTitle>
                  <CardDescription>Configure launch LP parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>USDC Seed ($)</Label>
                      <Input 
                        type="number" 
                        value={initialLpUsdc}
                        onChange={(e) => setInitialLpUsdc(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Token Seed</Label>
                      <Input 
                        type="number" 
                        value={initialLpTokens}
                        onChange={(e) => setInitialLpTokens(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Calculated Floor Price:</span>
                      <span className="font-mono font-bold">{formatCurrency(floorPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Revenue & Distribution
                  </CardTitle>
                  <CardDescription>Subscription and LP allocation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subscription ($/mo)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={subscriptionFee}
                        onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LP Share (%)</Label>
                      <Input 
                        type="number" 
                        value={lpRevenueShare}
                        onChange={(e) => setLpRevenueShare(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">LP Injection per User:</span>
                      <span className="font-mono font-bold">{formatCurrency(lpInjectionPerUser)}/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Minting Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Minting & Burn
                  </CardTitle>
                  <CardDescription>Token issuance parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Tokens/User/Month</Label>
                      <span className="text-sm font-mono">{mintRatePerUser}</span>
                    </div>
                    <Slider 
                      value={[mintRatePerUser]}
                      onValueChange={([v]) => setMintRatePerUser(v)}
                      min={100}
                      max={2000}
                      step={50}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Mint Burn Rate</Label>
                      <span className="text-sm font-mono">{mintBurnRate}%</span>
                    </div>
                    <Slider 
                      value={[mintBurnRate]}
                      onValueChange={([v]) => setMintBurnRate(v)}
                      min={10}
                      max={40}
                      step={5}
                    />
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Net to User:</span>
                      <span className="font-mono">{(netDistributionRate * 100).toFixed(0)}% ({formatNumber(mintRatePerUser * netDistributionRate)} tokens)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Burned:</span>
                      <span className="font-mono text-orange-500">{mintBurnRate}% ({formatNumber(mintRatePerUser * mintBurnRate / 100)} tokens)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                  <CardDescription>Organic doubling model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Users</Label>
                      <Input 
                        type="number" 
                        value={startingUsers}
                        onChange={(e) => setStartingUsers(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Double Every</Label>
                      <Select value={String(doublingMonths)} onValueChange={(v) => setDoublingMonths(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 month</SelectItem>
                          <SelectItem value="2">2 months</SelectItem>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="4">4 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Users</Label>
                      <Input 
                        type="number" 
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sell Scenario</Label>
                    <Select value={sellScenario} onValueChange={(v) => setSellScenario(v as SellScenario)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SELL_SCENARIOS).map(([key, scenario]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{scenario.label}</span>
                              <span className="text-xs text-muted-foreground">{scenario.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projection Tab */}
          <TabsContent value="projection">
            <Card>
              <CardHeader>
                <CardTitle>12-Month Projection</CardTitle>
                <CardDescription>
                  Scenario: {SELL_SCENARIOS[sellScenario].label} — {SELL_SCENARIOS[sellScenario].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Month</th>
                        <th className="text-right py-2 px-2">Users</th>
                        <th className="text-right py-2 px-2">Minted</th>
                        <th className="text-right py-2 px-2">Burned</th>
                        <th className="text-right py-2 px-2">LP Inject</th>
                        <th className="text-right py-2 px-2">Sold</th>
                        <th className="text-right py-2 px-2">LP (USDC)</th>
                        <th className="text-right py-2 px-2">Price</th>
                        <th className="text-right py-2 px-2">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projection.map((month) => (
                        <tr 
                          key={month.month} 
                          className={`border-b hover:bg-muted/50 ${month.coverageRatio < 1 && month.coverageRatio !== Infinity ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="py-2 px-2 font-medium">{month.month}</td>
                          <td className="text-right py-2 px-2">{month.users}</td>
                          <td className="text-right py-2 px-2 font-mono text-xs">{formatNumber(month.tokensMinted)}</td>
                          <td className="text-right py-2 px-2 font-mono text-xs text-orange-500">{formatNumber(month.tokensBurned)}</td>
                          <td className="text-right py-2 px-2 font-mono text-xs text-emerald-600">{formatCurrency(month.lpInjection)}</td>
                          <td className="text-right py-2 px-2 font-mono text-xs text-red-500">
                            {month.tokensSold > 0 ? formatNumber(month.tokensSold) : '-'}
                          </td>
                          <td className="text-right py-2 px-2 font-mono text-xs">{formatCurrency(month.cumulativeLp)}</td>
                          <td className="text-right py-2 px-2 font-mono font-bold">{formatCurrency(month.price)}</td>
                          <td className="text-right py-2 px-2">
                            {month.coverageRatio === Infinity ? (
                              <Badge variant="outline" className="text-xs">∞</Badge>
                            ) : (
                              <Badge variant={month.coverageRatio >= 1 ? 'default' : 'destructive'} className="text-xs">
                                {month.coverageRatio.toFixed(2)}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">12-Month Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Tokens Minted</span>
                    <span className="font-mono font-bold">{formatNumber(finalMonth.cumulativeMinted)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Tokens Burned</span>
                    <span className="font-mono font-bold text-orange-500">{formatNumber(finalMonth.cumulativeBurned)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Net Circulating (excl. LP)</span>
                    <span className="font-mono font-bold">
                      {formatNumber(finalMonth.cumulativeMinted - finalMonth.cumulativeBurned)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Final LP Depth</span>
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(finalMonth.cumulativeLp)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">LP Growth</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{(((finalMonth.cumulativeLp - initialLpUsdc) / initialLpUsdc) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Price Change</span>
                    <span className={`font-mono font-bold ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={isHealthy ? 'border-emerald-500/30' : 'border-amber-500/30'}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isHealthy ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    Health Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sellScenario === 'hodl' ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        ✨ Ideal Scenario
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        With 100% HODL, subscription revenue creates pure buying pressure. 
                        Price increases {priceChange.toFixed(0)}% from ${floorPrice.toFixed(2)} to ${finalMonth.price.toFixed(2)}.
                      </p>
                    </div>
                  ) : finalMonth.coverageRatio >= 1 ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        ✅ Sustainable
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        LP Coverage Ratio of {finalMonth.coverageRatio.toFixed(2)}x means subscription revenue 
                        exceeds sell pressure. The flywheel is working.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        ⚠️ At Risk
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Coverage Ratio of {finalMonth.coverageRatio.toFixed(2)}x indicates sell pressure 
                        exceeds subscription buybacks. Consider:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>Implement vesting schedules</li>
                        <li>Increase burn rate to {mintBurnRate + 5}%</li>
                        <li>Accelerate user growth</li>
                        <li>Add HODL incentives</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Break-even Users</p>
                        <p className="font-mono font-bold">
                          {sellScenario === 'hodl' ? 'N/A' : Math.ceil(finalMonth.users * (1 + SELL_SCENARIOS[sellScenario].rate * 2))}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Monthly Revenue</p>
                        <p className="font-mono font-bold">
                          {formatCurrency(finalMonth.users * subscriptionFee)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
