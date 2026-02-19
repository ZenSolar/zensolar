import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sprout, TrendingUp, TrendingDown, Users, DollarSign,
  Flame, AlertTriangle, CheckCircle2, RefreshCw, Info,
  Target, Calendar, BarChart3, Shield
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SEO } from "@/components/SEO";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthData {
  month: number;
  label: string;
  users: number;
  // LP state
  lpUsdc: number;
  lpTokens: number;
  price: number;
  // Flows
  subRevenue: number;
  lpInjection: number;
  tokensMinted: number;
  tokensBurned: number;
  tokensToUsers: number;
  tokensSold: number;
  sellPressureUsdc: number;
  // Health
  coverageRatio: number;
  // Cumulative
  totalMinted: number;
  totalBurned: number;
  totalSubs: number;
  lpGrowthPct: number;
  priceChangePct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 0) => {
  if (!isFinite(n)) return '∞';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(d);
};

const fmtUsd = (n: number) => {
  if (!isFinite(n)) return '$∞';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  lpUsdc: 10_000,
  lpTokens: 100_000,
  startUsers: 5,
  monthlyUserGrowth: 8,      // +N new users per month (linear grassroots)
  sellPressurePct: 10,       // % of tokens-to-users that get sold each month
  sellStartMonth: 7,         // sell pressure begins after vesting window
  subFee: 9.99,
  lpRevSharePct: 50,
  mintRatePerUser: 750,      // tokens/user/month (mainnet baseline)
  mintBurnPct: 20,
  transferTaxPct: 7,
};

// ─── AMM Core ─────────────────────────────────────────────────────────────────

function ammPrice(usdc: number, tokens: number) {
  return tokens > 0 ? usdc / tokens : 0;
}

/** Buy USDC worth of tokens from AMM. Returns [new_usdc, new_tokens] */
function ammBuy(usdc: number, tokens: number, usdcIn: number): [number, number] {
  const k = usdc * tokens;
  const newUsdc = usdc + usdcIn;
  const newTokens = k / newUsdc;
  return [newUsdc, newTokens];
}

/** Sell tokenAmount into AMM. Returns [new_usdc, new_tokens] */
function ammSell(usdc: number, tokens: number, tokensIn: number): [number, number] {
  const k = usdc * tokens;
  const newTokens = tokens + tokensIn;
  const newUsdc = k / newTokens;
  return [newUsdc, newTokens];
}

// ─── Simulation Engine ────────────────────────────────────────────────────────

function simulate(params: typeof DEFAULTS): MonthData[] {
  const {
    lpUsdc: seedUsdc,
    lpTokens: seedTokens,
    startUsers,
    monthlyUserGrowth,
    sellPressurePct,
    sellStartMonth,
    subFee,
    lpRevSharePct,
    mintRatePerUser,
    mintBurnPct,
  } = params;

  const months: MonthData[] = [];
  let lpUsdc = seedUsdc;
  let lpTokens = seedTokens;
  let totalMinted = 0;
  let totalBurned = 0;
  let totalSubs = 0;

  for (let m = 1; m <= 24; m++) {
    // Linear grassroots user growth
    const users = Math.max(startUsers + (m - 1) * monthlyUserGrowth, startUsers);

    // Subscription revenue this month
    const subRevenue = users * subFee;
    totalSubs += subRevenue;

    // LP injection (50% of sub revenue → buy tokens from AMM)
    const lpInjection = subRevenue * (lpRevSharePct / 100);

    // Token minting
    const tokensMinted = users * mintRatePerUser;
    const tokensBurned = tokensMinted * (mintBurnPct / 100);
    const tokensToUsers = tokensMinted * ((100 - mintBurnPct - 5) / 100); // 5% = LP 3% + treasury 2%
    totalMinted += tokensMinted;
    totalBurned += tokensBurned;

    // Sell pressure (only after vesting window)
    const sellRate = m >= sellStartMonth ? sellPressurePct / 100 : 0;
    const tokensSold = tokensToUsers * sellRate;

    // Step 1: Apply subscription buybacks (LP injection → buy $ZSOLAR from AMM)
    let [u1, t1] = lpInjection > 0 ? ammBuy(lpUsdc, lpTokens, lpInjection) : [lpUsdc, lpTokens];

    // Step 2: Apply sell pressure (users sell tokens into AMM)
    let [u2, t2] = tokensSold > 0 ? ammSell(u1, t1, tokensSold) : [u1, t1];

    // Safety floor: LP USDC can't go below 10% of seed (bankruptcy guard)
    if (u2 < seedUsdc * 0.1) {
      u2 = seedUsdc * 0.1;
      t2 = (seedUsdc * seedTokens) / u2;
    }

    lpUsdc = u2;
    lpTokens = t2;

    const price = ammPrice(lpUsdc, lpTokens);
    const sellPressureUsdc = tokensSold * price;
    const coverageRatio = sellPressureUsdc > 0 ? lpInjection / sellPressureUsdc : Infinity;

    months.push({
      month: m,
      label: `M${m}`,
      users,
      lpUsdc,
      lpTokens,
      price,
      subRevenue,
      lpInjection,
      tokensMinted,
      tokensBurned,
      tokensToUsers,
      tokensSold,
      sellPressureUsdc,
      coverageRatio,
      totalMinted,
      totalBurned,
      totalSubs,
      lpGrowthPct: ((lpUsdc - seedUsdc) / seedUsdc) * 100,
      priceChangePct: ((price - (seedUsdc / seedTokens)) / (seedUsdc / seedTokens)) * 100,
    });
  }

  return months;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminBootstrapSimulator() {
  const [params, setParams] = useState({ ...DEFAULTS });

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: typeof DEFAULTS[K]) =>
    setParams(prev => ({ ...prev, [k]: v }));

  const data = useMemo(() => simulate(params), [params]);

  const floorPrice = params.lpUsdc / params.lpTokens;
  const finalMonth = data[23];
  const breakEvenMonth = data.find(m => m.coverageRatio >= 1 && m.month >= params.sellStartMonth);
  const sustainableMonth = data.findIndex(m => m.coverageRatio >= 1 && m.month >= params.sellStartMonth);
  const priceAtMonth12 = data[11].price;
  const priceAtMonth24 = data[23].price;
  const overallHealthy = finalMonth.coverageRatio >= 1 || params.sellPressurePct === 0;

  return (
    <TooltipProvider>
      <SEO title="Bootstrap Scenario Simulator | Admin" />

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sprout className="h-8 w-8 text-primary" />
              Bootstrap Scenario Simulator
            </h1>
            <p className="text-muted-foreground mt-1">
              Model a self-funded grassroots launch — no investors required
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs">24-Month Horizon</Badge>
              <Badge variant="outline" className="text-xs">AMM Math (Uniswap V2)</Badge>
              <Badge variant="outline" className="text-xs">Sell Pressure Modeling</Badge>
              <Badge variant="outline" className="text-xs">Break-Even Analysis</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setParams({ ...DEFAULTS })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <Badge variant="outline" className="text-xs">Launch</Badge>
              </div>
              <p className="text-2xl font-bold font-mono">{fmtUsd(floorPrice)}</p>
              <p className="text-xs text-muted-foreground">Floor Price / Token</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${priceAtMonth12 >= floorPrice ? 'from-emerald-500/10 to-emerald-500/5' : 'from-red-500/10 to-red-500/5'}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                {priceAtMonth12 >= floorPrice
                  ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
                <Badge variant="outline" className="text-xs">Month 12</Badge>
              </div>
              <p className="text-2xl font-bold font-mono">{fmtUsd(priceAtMonth12)}</p>
              <p className={`text-xs ${priceAtMonth12 >= floorPrice ? 'text-emerald-600' : 'text-red-600'}`}>
                {fmtPct(data[11].priceChangePct)} vs launch
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${priceAtMonth24 >= floorPrice ? 'from-blue-500/10 to-blue-500/5' : 'from-red-500/10 to-red-500/5'}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                {priceAtMonth24 >= floorPrice
                  ? <TrendingUp className="h-4 w-4 text-blue-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
                <Badge variant="outline" className="text-xs">Month 24</Badge>
              </div>
              <p className="text-2xl font-bold font-mono">{fmtUsd(priceAtMonth24)}</p>
              <p className={`text-xs ${priceAtMonth24 >= floorPrice ? 'text-blue-600' : 'text-red-600'}`}>
                {fmtPct(finalMonth.priceChangePct)} vs launch
              </p>
            </CardContent>
          </Card>

          <Card className={overallHealthy ? 'border-emerald-500/30' : 'border-amber-500/30'}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                {overallHealthy
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <Badge variant={overallHealthy ? 'default' : 'secondary'} className="text-xs">
                  {overallHealthy ? 'Healthy' : 'At Risk'}
                </Badge>
              </div>
              <p className="text-2xl font-bold font-mono">
                {breakEvenMonth ? `M${breakEvenMonth.month}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Break-Even Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="table">24-Month Table</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* ── Config Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="config" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">

              {/* LP Seed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Personal LP Seed
                  </CardTitle>
                  <CardDescription>
                    Your founder capital injected at launch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>USDC Amount ($)</Label>
                      <Input
                        type="number"
                        value={params.lpUsdc}
                        onChange={e => set('lpUsdc', Number(e.target.value))}
                        min={1000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Token Amount</Label>
                      <Input
                        type="number"
                        value={params.lpTokens}
                        onChange={e => set('lpTokens', Number(e.target.value))}
                        min={1000}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Implied Floor Price</span>
                      <span className="font-mono font-bold text-primary">{fmtUsd(floorPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Personal Capital</span>
                      <span className="font-mono">{fmtUsd(params.lpUsdc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AMM Constant (k)</span>
                      <span className="font-mono text-xs">{fmt(params.lpUsdc * params.lpTokens)}</span>
                    </div>
                  </div>

                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs text-muted-foreground">
                      Shallow pools are sensitive to sell pressure. A single user selling 5,000 tokens
                      moves your price by ~{fmt(Math.abs(((params.lpUsdc / (params.lpTokens + 5000)) - floorPrice) / floorPrice * 100), 1)}%.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* User Growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Grassroots User Growth
                  </CardTitle>
                  <CardDescription>Linear organic acquisition model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Launch Users</Label>
                      <Input
                        type="number"
                        value={params.startUsers}
                        onChange={e => set('startUsers', Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>New Users / Month</Label>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Linear growth model — grassroots word-of-mouth, not exponential</TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={params.monthlyUserGrowth}
                        onChange={e => set('monthlyUserGrowth', Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Month 6 users</span>
                      <span className="font-mono">{params.startUsers + 5 * params.monthlyUserGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Month 12 users</span>
                      <span className="font-mono">{params.startUsers + 11 * params.monthlyUserGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Month 24 users</span>
                      <span className="font-mono font-bold">{params.startUsers + 23 * params.monthlyUserGrowth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sell Pressure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    Sell Pressure
                  </CardTitle>
                  <CardDescription>
                    % of earned tokens sold monthly after vesting window
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Monthly Sell Rate</Label>
                      <span className="font-mono text-sm font-bold text-destructive">{params.sellPressurePct}%</span>
                    </div>
                    <Slider
                      value={[params.sellPressurePct]}
                      onValueChange={([v]) => set('sellPressurePct', v)}
                      min={0} max={50} step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0% (HODL)</span>
                      <span>25% (Moderate)</span>
                      <span>50% (Aggressive)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Label>Vesting Window (months)</Label>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Sell pressure starts after this many months — simulates linear vesting unlock</TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="font-mono text-sm font-bold">M{params.sellStartMonth}</span>
                    </div>
                    <Slider
                      value={[params.sellStartMonth]}
                      onValueChange={([v]) => set('sellStartMonth', v)}
                      min={1} max={12} step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>No vesting</span>
                      <span>6-mo cliff</span>
                      <span>12-mo cliff</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sell-free months</span>
                      <span className="font-mono font-bold text-emerald-600">{params.sellStartMonth - 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak monthly sell pressure</span>
                      <span className="font-mono text-destructive">
                        {fmt((params.startUsers + 23 * params.monthlyUserGrowth) * params.mintRatePerUser * 0.75 * (params.sellPressurePct / 100))} tokens
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tokenomics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Token Economics
                  </CardTitle>
                  <CardDescription>Mint rate, burn, subscription flywheel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Tokens Minted / User / Month</Label>
                      <span className="font-mono text-sm">{params.mintRatePerUser}</span>
                    </div>
                    <Slider
                      value={[params.mintRatePerUser]}
                      onValueChange={([v]) => set('mintRatePerUser', v)}
                      min={100} max={2000} step={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Mint Burn Rate</Label>
                      <span className="font-mono text-sm text-orange-500">{params.mintBurnPct}%</span>
                    </div>
                    <Slider
                      value={[params.mintBurnPct]}
                      onValueChange={([v]) => set('mintBurnPct', v)}
                      min={10} max={40} step={5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subscription ($/mo)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={params.subFee}
                        onChange={e => set('subFee', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LP Revenue Share %</Label>
                      <Input
                        type="number"
                        value={params.lpRevSharePct}
                        onChange={e => set('lpRevSharePct', Number(e.target.value))}
                        min={1} max={100}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User receives</span>
                      <span className="font-mono">{100 - params.mintBurnPct - 5}% ({fmt(params.mintRatePerUser * (100 - params.mintBurnPct - 5) / 100)} tokens)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LP injection / user</span>
                      <span className="font-mono text-emerald-600">{fmtUsd(params.subFee * params.lpRevSharePct / 100)}/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Charts Tab ────────────────────────────────────────────────── */}
          <TabsContent value="charts" className="space-y-6">

            {/* Price Trajectory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Price Trajectory (24 Months)
                </CardTitle>
                <CardDescription>
                  Token price vs. {fmtUsd(floorPrice)} launch floor — sell pressure starts Month {params.sellStartMonth}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${v.toFixed(2)}`} tick={{ fontSize: 11 }} width={55} />
                    <ChartTooltip
                      formatter={(v: number) => [fmtUsd(v), 'Price']}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <ReferenceLine y={floorPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Floor', position: 'right', fontSize: 10 }} />
                    <ReferenceLine x={`M${params.sellStartMonth}`} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: 'Sell Starts', position: 'insideTopRight', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* LP Depth & Users */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    LP Depth (USDC)
                  </CardTitle>
                  <CardDescription>Pool size grows as subscriptions inject buying pressure</CardDescription>
                </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtUsd(v)} tick={{ fontSize: 10 }} width={60} />
                    <ChartTooltip formatter={(v: number) => [fmtUsd(v), 'LP USDC']} contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={params.lpUsdc} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="lpUsdc" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#lpGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Growth & Revenue
                  </CardTitle>
                  <CardDescription>Linear grassroots acquisition</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmtUsd(v)} tick={{ fontSize: 10 }} width={60} />
                      <ChartTooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, name: string) => name === 'users' ? [v, 'Users'] : [fmtUsd(v), 'Monthly Revenue']} />
                      <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Users" />
                      <Line yAxisId="right" type="monotone" dataKey="subRevenue" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Coverage Ratio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  LP Coverage Ratio
                </CardTitle>
                <CardDescription>
                  {">"} 1.0 = subscription buybacks exceed sell pressure (healthy flywheel)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.filter(d => isFinite(d.coverageRatio))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="coverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${v.toFixed(1)}x`} tick={{ fontSize: 10 }} width={45} />
                    <ChartTooltip formatter={(v: number) => [`${v.toFixed(2)}x`, 'Coverage']} contentStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: 'Healthy ≥ 1.0', position: 'right', fontSize: 10 }} />
                    <Area type="monotone" dataKey="coverageRatio" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#coverGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Table Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">24-Month Projection Table</CardTitle>
                <CardDescription>
                  Sell pressure ({params.sellPressurePct}%) begins Month {params.sellStartMonth} •
                  Rows highlighted amber = coverage ratio &lt; 1.0 (unhealthy)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 px-2">Mo</th>
                        <th className="text-right py-2 px-2">Users</th>
                        <th className="text-right py-2 px-2">Minted</th>
                        <th className="text-right py-2 px-2">Burned</th>
                        <th className="text-right py-2 px-2">To Users</th>
                        <th className="text-right py-2 px-2">Sold</th>
                        <th className="text-right py-2 px-2">LP Inject</th>
                        <th className="text-right py-2 px-2">LP Depth</th>
                        <th className="text-right py-2 px-2">Price</th>
                        <th className="text-right py-2 px-2">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(m => {
                        const isUnhealthy = isFinite(m.coverageRatio) && m.coverageRatio < 1 && m.month >= params.sellStartMonth;
                        const isSellStart = m.month === params.sellStartMonth;
                        return (
                          <tr
                            key={m.month}
                            className={`border-b hover:bg-muted/50 transition-colors ${isUnhealthy ? 'bg-amber-500/5' : ''} ${isSellStart ? 'border-l-2 border-l-destructive' : ''}`}
                          >
                            <td className="py-1.5 px-2 font-medium">{m.month}</td>
                            <td className="text-right py-1.5 px-2">{m.users}</td>
                            <td className="text-right py-1.5 px-2 font-mono">{fmt(m.tokensMinted)}</td>
                            <td className="text-right py-1.5 px-2 font-mono text-orange-500">{fmt(m.tokensBurned)}</td>
                            <td className="text-right py-1.5 px-2 font-mono">{fmt(m.tokensToUsers)}</td>
                            <td className="text-right py-1.5 px-2 font-mono text-destructive">
                              {m.tokensSold > 0 ? fmt(m.tokensSold) : '—'}
                            </td>
                            <td className="text-right py-1.5 px-2 font-mono text-emerald-600">{fmtUsd(m.lpInjection)}</td>
                            <td className="text-right py-1.5 px-2 font-mono">{fmtUsd(m.lpUsdc)}</td>
                            <td className="text-right py-1.5 px-2 font-mono font-bold">{fmtUsd(m.price)}</td>
                            <td className="text-right py-1.5 px-2">
                              {!isFinite(m.coverageRatio) ? (
                                <Badge variant="outline" className="text-xs">∞</Badge>
                              ) : (
                                <Badge
                                  variant={m.coverageRatio >= 1 ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {m.coverageRatio.toFixed(2)}x
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analysis Tab ──────────────────────────────────────────────── */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    ['Personal Capital at Risk', fmtUsd(params.lpUsdc)],
                    ['Launch Price Floor', fmtUsd(floorPrice)],
                    ['Month 12 Price', fmtUsd(priceAtMonth12)],
                    ['Month 24 Price', fmtUsd(priceAtMonth24)],
                    ['Month 24 Users', String(params.startUsers + 23 * params.monthlyUserGrowth)],
                    ['Month 24 Monthly Revenue', fmtUsd((params.startUsers + 23 * params.monthlyUserGrowth) * params.subFee)],
                    ['24-Month Total Sub Revenue', fmtUsd(finalMonth.totalSubs)],
                    ['24-Month Total LP Depth', fmtUsd(finalMonth.lpUsdc)],
                    ['LP Multiplier vs Seed', `${(finalMonth.lpUsdc / params.lpUsdc).toFixed(1)}x`],
                    ['Total Tokens Minted', fmt(finalMonth.totalMinted)],
                    ['Total Tokens Burned', fmt(finalMonth.totalBurned)],
                    ['Burn % of Supply', `${((finalMonth.totalBurned / finalMonth.totalMinted) * 100).toFixed(1)}%`],
                    ['Break-Even Month', breakEvenMonth ? `Month ${breakEvenMonth.month}` : 'Not reached (grow users)'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-bold">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Assessment + Recommendations */}
              <div className="space-y-4">
                <Card className={overallHealthy ? 'border-emerald-500/30' : 'border-amber-500/30'}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {overallHealthy
                        ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Viable Scenario</>
                        : <><AlertTriangle className="h-4 w-4 text-amber-500" /> Stress Scenario</>
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {params.sellPressurePct === 0 ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">✨ 100% HODL — Best Case</p>
                        <p className="text-muted-foreground mt-1">
                          Every dollar of subscription revenue acts as pure buying pressure.
                          Price climbs {fmtPct(finalMonth.priceChangePct)} over 24 months.
                        </p>
                      </div>
                    ) : overallHealthy ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">✅ Flywheel Working</p>
                        <p className="text-muted-foreground mt-1">
                          Subscription buybacks outpace sell pressure.
                          Break-even reached at Month {breakEvenMonth?.month}.
                          Your {fmtUsd(params.lpUsdc)} seed is self-sustaining.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="font-medium text-amber-700 dark:text-amber-400">⚠️ Sell Pressure Too High</p>
                        <p className="text-muted-foreground mt-1">
                          At {params.sellPressurePct}% sell rate, your coverage ratio is &lt;1.0.
                          The flywheel breaks unless you grow users faster or extend vesting.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Grassroots Execution Phases
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {[
                      {
                        phase: 'Phase 1 — Foundation',
                        months: `M1–M${params.sellStartMonth - 1}`,
                        color: 'bg-primary/10 border-primary/20',
                        text: `${params.sellStartMonth - 1} sell-free months while LP deepens from subscriptions. Recruit true believers — friends, solar forums, local EV clubs.`,
                      },
                      {
                        phase: 'Phase 2 — Flywheel Ignition',
                        months: `M${params.sellStartMonth}–M12`,
                        color: 'bg-blue-500/10 border-blue-500/20',
                        text: `Vesting unlocks begin. ${fmtUsd(data[11]?.lpUsdc ?? 0)} LP depth by Month 12 absorbs moderate sells. Word-of-mouth driven by token earnings on energy bills.`,
                      },
                      {
                        phase: 'Phase 3 — Self-Sustaining',
                        months: 'M12–M24',
                        color: 'bg-emerald-500/10 border-emerald-500/20',
                        text: `${fmtUsd((params.startUsers + 11 * params.monthlyUserGrowth) * params.subFee)}/mo subscription revenue → ${fmtUsd((params.startUsers + 11 * params.monthlyUserGrowth) * params.subFee * params.lpRevSharePct / 100)}/mo LP injection. Pool is deep enough to absorb natural selling.`,
                      },
                    ].map(p => (
                      <div key={p.phase} className={`p-3 rounded-lg border ${p.color}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-xs">{p.phase}</p>
                          <Badge variant="outline" className="text-xs">{p.months}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Risks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Shallow pool: early sells have outsized price impact until LP depth builds</span>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Growth dependency: if user acquisition stalls, flywheel slows</span>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Vesting compliance: smart contract enforcement required, not honor system</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Mitigation: 7% transfer tax recycles value back to LP + burn on every sell</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Mitigation: 20% mint burn reduces circulating supply permanently</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
