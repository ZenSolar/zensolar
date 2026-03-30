import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle2, Target, Gauge, Lock
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { WEIGHTED_AVG_NET_TOKENS } from "@/data/deviceMixAssumptions";
import {
  SUBSCRIPTION, TRANSFER_TAX, PRICES, MINT_DISTRIBUTION
} from "@/lib/tokenomics";

// ─── AMM Math Engine ──────────────────────────────────────────────────────────

const PRICE = PRICES.launchFloor; // $0.10
const NET_TOKENS = WEIGHTED_AVG_NET_TOKENS; // ~896
const SUB_LP_SHARE = SUBSCRIPTION.lpContribution / 100; // 0.50
const TAX_RATE = TRANSFER_TAX.total / 100; // 0.07
const MAX_DRAWDOWN_PCT = 5; // ≤5% monthly price drawdown

interface CapacityResult {
  users: number;
  lpUSDC: number;
  lpTokens: number;
  monthlySubLP: number;
  monthlySellPressure: number;
  coverageRatio: number;
  netSellPerUser: number;
}

function calculateCapacity(users: number, sellRate: number): CapacityResult {
  const tokensSold = NET_TOKENS * sellRate;
  const afterTax = tokensSold * (1 - TAX_RATE);
  const sellPressureUSD = afterTax * PRICE;
  const subOffset = SUBSCRIPTION.monthlyPrice * SUB_LP_SHARE;
  const netSellPerUser = sellPressureUSD - subOffset;

  // AMM constant product: for ≤5% drawdown
  // newPrice ≥ 0.95 × oldPrice → T ≤ 0.02598 × Y, Y = X/P
  // X ≥ (T × P) / 0.02598
  const drawdownFactor = 1 - Math.sqrt(1 - MAX_DRAWDOWN_PCT / 100);
  const totalTokensSold = users * afterTax;
  const requiredUSDC = Math.round((totalTokensSold * PRICE) / drawdownFactor);
  const requiredTokens = Math.round(requiredUSDC / PRICE);

  return {
    users,
    lpUSDC: requiredUSDC,
    lpTokens: requiredTokens,
    monthlySubLP: Math.round(users * subOffset),
    monthlySellPressure: Math.round(totalTokensSold * PRICE),
    coverageRatio: parseFloat(((users * subOffset) / (totalTokensSold * PRICE)).toFixed(3)),
    netSellPerUser: Math.round(netSellPerUser),
  };
}

function calculateTotalRaise(lpUSDC: number, runwayMonths: number, burnRate: number) {
  const ops = runwayMonths * burnRate;
  const legal = 100_000;
  const audit = 75_000;
  const marketing = 150_000;
  const reserve = Math.round((lpUSDC + ops + legal + audit + marketing) * 0.06);
  const total = lpUSDC + ops + legal + audit + marketing + reserve;
  return {
    lp: lpUSDC,
    ops,
    legal,
    audit,
    marketing,
    reserve,
    total: Math.ceil(total / 100_000) * 100_000, // Round up to nearest $100K
  };
}

const usd = (n: number) => '$' + n.toLocaleString();

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLPCapacityCalculator() {
  const { isAdmin, isChecking } = useAdminCheck();

  // Adjustable parameters
  const [targetUsers, setTargetUsers] = useState(1000);
  const [sellRate, setSellRate] = useState(35);
  const [burnRate, setBurnRate] = useState(20_000);
  const [runwayMonths, setRunwayMonths] = useState(18);

  // Computed results
  const target = useMemo(() => calculateCapacity(targetUsers, sellRate / 100), [targetUsers, sellRate]);
  const raise = useMemo(() => calculateTotalRaise(target.lpUSDC, runwayMonths, burnRate), [target.lpUSDC, runwayMonths, burnRate]);

  // Capacity ladder data
  const ladder = useMemo(() => {
    const steps = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000];
    return steps.map(u => {
      const r = calculateCapacity(u, sellRate / 100);
      return { ...r, isTarget: u === targetUsers };
    });
  }, [sellRate, targetUsers]);

  // Sensitivity analysis: vary sell rate
  const sensitivity = useMemo(() => {
    return [10, 15, 20, 25, 30, 35, 40, 50].map(rate => {
      const r = calculateCapacity(targetUsers, rate / 100);
      return { sellRate: rate, lpRequired: r.lpUSDC, isSelected: rate === sellRate };
    });
  }, [targetUsers, sellRate]);

  if (isChecking) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Admin access required.</div>;

  const healthStatus = target.coverageRatio >= 0.5 ? 'healthy' : target.coverageRatio >= 0.2 ? 'moderate' : 'critical';

  return (
    <>
      <SEO title="LP Capacity Calculator | ZenSolar Admin" description="Model LP depth vs user capacity" />
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Gauge className="h-7 w-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">LP Capacity Calculator</h1>
          </div>
          <p className="text-muted-foreground">
            AMM-derived user capacity ceiling. Determines exact fundraising ask based on Uniswap V2 constant product math.
          </p>
        </motion.div>

        {/* Key Output */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Raise</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">{usd(raise.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">LP Allocation</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{usd(raise.lp)}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(raise.lp / raise.total * 100)}% of raise</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Users</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{targetUsers.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Price Floor</p>
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600">${PRICE.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">≤{MAX_DRAWDOWN_PCT}% monthly drawdown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Target Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Users to support</span>
                <span className="font-mono font-bold">{targetUsers.toLocaleString()}</span>
              </div>
              <Slider
                value={[targetUsers]}
                onValueChange={([v]) => setTargetUsers(v)}
                min={100}
                max={5000}
                step={50}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span><span>5,000</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Sell Rate (Stress Test)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly sell %</span>
                <Badge variant={sellRate >= 30 ? "destructive" : sellRate >= 20 ? "secondary" : "default"}>
                  {sellRate}%
                </Badge>
              </div>
              <Slider
                value={[sellRate]}
                onValueChange={([v]) => setSellRate(v)}
                min={5}
                max={50}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5% (HODL)</span><span>50% (Extreme)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Monthly Burn Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team cost/month</span>
                <span className="font-mono font-bold">{usd(burnRate)}</span>
              </div>
              <Slider
                value={[burnRate]}
                onValueChange={([v]) => setBurnRate(v)}
                min={10000}
                max={50000}
                step={5000}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" /> Runway (Months)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Months of runway</span>
                <span className="font-mono font-bold">{runwayMonths} months</span>
              </div>
              <Slider
                value={[runwayMonths]}
                onValueChange={([v]) => setRunwayMonths(v)}
                min={12}
                max={24}
                step={3}
              />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="capacity">
          <TabsList className="mb-4">
            <TabsTrigger value="capacity">Capacity Ladder</TabsTrigger>
            <TabsTrigger value="breakdown">Raise Breakdown</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
            <TabsTrigger value="economics">Per-User Economics</TabsTrigger>
          </TabsList>

          {/* Capacity Ladder */}
          <TabsContent value="capacity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> LP Depth → User Capacity
                </CardTitle>
                <CardDescription>
                  Required USDC in LP to maintain ≤{MAX_DRAWDOWN_PCT}% monthly price drawdown at {sellRate}% sell rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ladder}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="users" tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}K` : String(v)} />
                      <YAxis tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                      <ChartTooltip
                        formatter={(value: number) => [usd(value), 'LP Required']}
                        labelFormatter={(label: string) => `${label} users`}
                      />
                      {targetUsers <= 5000 && (
                        <ReferenceLine x={targetUsers} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Target" />
                      )}
                      <Bar dataKey="lpUSDC" radius={[4, 4, 0, 0]}>
                        {ladder.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.isTarget ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Users</th>
                        <th className="text-right py-2 px-3">LP Required</th>
                        <th className="text-right py-2 px-3">Monthly Sub→LP</th>
                        <th className="text-right py-2 px-3">Monthly Sell Pressure</th>
                        <th className="text-right py-2 px-3">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ladder.map(row => (
                        <tr
                          key={row.users}
                          className={`border-b ${row.isTarget ? 'bg-primary/10 font-semibold' : ''}`}
                        >
                          <td className="py-2 px-3">{row.users.toLocaleString()}</td>
                          <td className="text-right py-2 px-3 font-mono">{usd(row.lpUSDC)}</td>
                          <td className="text-right py-2 px-3 font-mono">{usd(row.monthlySubLP)}</td>
                          <td className="text-right py-2 px-3 font-mono">{usd(row.monthlySellPressure)}</td>
                          <td className="text-right py-2 px-3">{row.coverageRatio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raise Breakdown */}
          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Capital Allocation: {usd(raise.total)}
                </CardTitle>
                <CardDescription>How the raise is allocated across priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Liquidity Pool (POL)', amount: raise.lp, icon: Lock, desc: 'AMM price floor defense', color: 'bg-primary' },
                    { label: `Operations (${runwayMonths}mo)`, amount: raise.ops, icon: Users, desc: `Team runway @ ${usd(burnRate)}/mo`, color: 'bg-blue-500' },
                    { label: 'Marketing & Growth', amount: raise.marketing, icon: TrendingUp, desc: 'User acquisition', color: 'bg-emerald-500' },
                    { label: 'Legal & IP', amount: raise.legal, icon: Shield, desc: 'Patent filing + compliance', color: 'bg-amber-500' },
                    { label: 'Smart Contract Audit', amount: raise.audit, icon: CheckCircle2, desc: 'Security verification', color: 'bg-purple-500' },
                    { label: 'Reserve', amount: raise.reserve, icon: Target, desc: 'Contingency buffer', color: 'bg-muted-foreground' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded ${item.color}`} />
                      <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium text-sm">{item.label}</span>
                          <span className="font-mono font-bold">{usd(item.amount)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">{item.desc}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(item.amount / raise.total * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${item.color}`}
                            style={{ width: `${(item.amount / raise.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sensitivity */}
          <TabsContent value="sensitivity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Sell Rate Sensitivity
                </CardTitle>
                <CardDescription>
                  How LP requirements change at different sell rates for {targetUsers.toLocaleString()} users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensitivity}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="sellRate" tickFormatter={(v: number) => `${v}%`} />
                      <YAxis tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                      <ChartTooltip
                        formatter={(value: number) => [usd(value), 'LP Required']}
                        labelFormatter={(label: string) => `${label}% sell rate`}
                      />
                      <ReferenceLine x={sellRate} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="lpRequired" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    At 15% sell rate (industry standard), LP requirement drops to{' '}
                    <strong>{usd(calculateCapacity(targetUsers, 0.15).lpUSDC)}</strong>.
                    Your {sellRate}% stress test is {(sellRate / 15).toFixed(1)}x more conservative.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Per-User Economics */}
          <TabsContent value="economics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" /> Per-User Monthly Economics
                </CardTitle>
                <CardDescription>Token flow breakdown for a single user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Token Flow</h3>
                    {[
                      { label: 'Weighted avg raw tokens', value: `${Math.round(NET_TOKENS / (MINT_DISTRIBUTION.user / 100))} tokens` },
                      { label: 'After 20% mint burn', value: `${NET_TOKENS} net tokens` },
                      { label: `Tokens sold (${sellRate}%)`, value: `${Math.round(NET_TOKENS * sellRate / 100)} tokens` },
                      { label: 'After 7% transfer tax', value: `${Math.round(NET_TOKENS * sellRate / 100 * (1 - TAX_RATE))} tokens hit LP` },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-sm border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">USD Impact</h3>
                    {[
                      { label: 'Sell pressure @ $0.10', value: usd(Math.round(NET_TOKENS * sellRate / 100 * (1 - TAX_RATE) * PRICE)), color: 'text-destructive' },
                      { label: 'Subscription → LP offset', value: `+${usd(Math.round(SUBSCRIPTION.monthlyPrice * SUB_LP_SHARE))}`, color: 'text-emerald-600' },
                      { label: 'Net sell pressure/user', value: usd(target.netSellPerUser), color: 'text-foreground font-bold' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-sm border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-mono ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Coverage Ratio</span>
                        <Badge variant={healthStatus === 'healthy' ? 'default' : healthStatus === 'moderate' ? 'secondary' : 'destructive'}>
                          {healthStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Subscription revenue covers {Math.round(target.coverageRatio * 100)}% of sell pressure.
                        Remaining {Math.round((1 - target.coverageRatio) * 100)}% is absorbed by LP depth.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
