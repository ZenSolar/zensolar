import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Coins,
  Loader2,
  Target,
  Zap,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { DEVICE_MIX, WEIGHTED_AVG_RAW_TOKENS, WEIGHTED_AVG_NET_TOKENS, NET_MULTIPLIER } from "@/data/deviceMixAssumptions";
import { SUBSCRIPTION_TIERS, GENESIS_HALVING, PRICES } from "@/lib/tokenomics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from "recharts";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Growth projection model
const generateProjections = (
  startUsers: number,
  monthlyGrowthRate: number,
  subscriptionRate: number,
  avgTokensPerUser: number,
  subscriptionPrice: number,
  lpAllocation: number,
  burnRate: number
) => {
  const projections = [];
  let users = startUsers;
  let cumulativeTokens = 0;
  let cumulativeRevenue = 0;
  let cumulativeLP = 0;
  
  for (let month = 0; month <= 36; month++) {
    const subscribers = Math.round(users * subscriptionRate);
    const monthlyRevenue = subscribers * subscriptionPrice;
    const monthlyLP = monthlyRevenue * lpAllocation;
    const grossTokens = users * avgTokensPerUser;
    const netTokens = grossTokens * (1 - burnRate);
    
    cumulativeTokens += netTokens;
    cumulativeRevenue += monthlyRevenue;
    cumulativeLP += monthlyLP;
    
    projections.push({
      month: `M${month}`,
      monthNum: month,
      users: Math.round(users),
      subscribers: subscribers,
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyLP: Math.round(monthlyLP),
      cumulativeRevenue: Math.round(cumulativeRevenue),
      cumulativeLP: Math.round(cumulativeLP),
      monthlyTokens: Math.round(netTokens),
      cumulativeTokens: Math.round(cumulativeTokens),
      revenuePerUser: users > 0 ? (monthlyRevenue / users).toFixed(2) : 0
    });
    
    // Compound growth
    users = users * (1 + monthlyGrowthRate);
  }
  
  return projections;
};

// Key milestones
const milestones = [
  { users: 1000, label: "Early Traction", description: "Product-market fit validated" },
  { users: 5000, label: "Growth Phase", description: "Viral loops activating" },
  { users: 10000, label: "Scale Ready", description: "Series A metrics achieved" },
  { users: 25000, label: "Tipping Point", description: "Self-sustaining flywheel" },
  { users: 50000, label: "Market Leader", description: "Category dominance" },
  { users: 100000, label: "Escape Velocity", description: "Unassailable moat" }
];

export default function AdminGrowthProjections() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();
  
  // Adjustable parameters
  const [startUsers, setStartUsers] = useState(500);
  const [monthlyGrowth, setMonthlyGrowth] = useState(15); // 15%
  const [subRate, setSubRate] = useState(40); // 40%
  
  // Device mix driven — from centralized assumptions
  const tokensPerUser = Math.round(WEIGHTED_AVG_RAW_TOKENS);
  
  // Fixed parameters from strategy
  const subscriptionPrice = 9.99;
  const lpAllocation = 0.5; // 50% to LP
  const burnRate = 0.2; // 20% mint burn
  
  const projections = useMemo(() => 
    generateProjections(
      startUsers,
      monthlyGrowth / 100,
      subRate / 100,
      tokensPerUser,
      subscriptionPrice,
      lpAllocation,
      burnRate
    ),
    [startUsers, monthlyGrowth, subRate, tokensPerUser]
  );
  
  // Find milestone months
  const milestonesWithMonth = useMemo(() => {
    return milestones.map(m => {
      const monthData = projections.find(p => p.users >= m.users);
      return {
        ...m,
        month: monthData?.monthNum ?? null,
        actualUsers: monthData?.users ?? 0
      };
    });
  }, [projections]);
  
  // Key metrics at different time points
  const metricsAtPoints = useMemo(() => {
    return [
      { label: "Launch", data: projections[0] },
      { label: "Month 6", data: projections[6] },
      { label: "Month 12", data: projections[12] },
      { label: "Month 24", data: projections[24] },
      { label: "Month 36", data: projections[36] }
    ];
  }, [projections]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };
  
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const exportData = [
    {
      section: "Parameters",
      startUsers,
      monthlyGrowthRate: `${monthlyGrowth}%`,
      subscriptionRate: `${subRate}%`,
      tokensPerUser,
      burnRate: "20%",
      lpAllocation: "50%"
    },
    ...projections.map(p => ({
      section: "Projection",
      month: p.month,
      users: p.users,
      subscribers: p.subscribers,
      monthlyRevenue: formatCurrency(p.monthlyRevenue),
      cumulativeRevenue: formatCurrency(p.cumulativeRevenue),
      monthlyLP: formatCurrency(p.monthlyLP),
      cumulativeLP: formatCurrency(p.cumulativeLP),
      monthlyTokens: formatNumber(p.monthlyTokens),
      cumulativeTokens: formatNumber(p.cumulativeTokens)
    })),
    ...milestonesWithMonth.map(m => ({
      section: "Milestone",
      label: m.label,
      targetUsers: m.users,
      description: m.description,
      achievedMonth: m.month ?? "Beyond 36mo"
    }))
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Growth Projections
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              36-month trajectory modeling for users, revenue, and token economics
            </p>
          </div>
          <ExportButtons 
            pageTitle="Growth Projections" 
            getData={() => exportData}
          />
        </div>

        {/* Parameter Controls */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Model Parameters
            </CardTitle>
            <CardDescription>Adjust assumptions to see projected outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Starting Users</label>
                  <Badge variant="secondary">{formatNumber(startUsers)}</Badge>
                </div>
                <Slider
                  value={[startUsers]}
                  onValueChange={([v]) => setStartUsers(v)}
                  min={100}
                  max={5000}
                  step={100}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Monthly Growth</label>
                  <Badge variant="secondary">{monthlyGrowth}%</Badge>
                </div>
                <Slider
                  value={[monthlyGrowth]}
                  onValueChange={([v]) => setMonthlyGrowth(v)}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Subscription Rate</label>
                  <Badge variant="secondary">{subRate}%</Badge>
                </div>
                <Slider
                  value={[subRate]}
                  onValueChange={([v]) => setSubRate(v)}
                  min={20}
                  max={80}
                  step={5}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Tokens/User/Month</label>
                  <Badge variant="secondary">~{tokensPerUser} raw</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Driven by device mix assumptions (~{WEIGHTED_AVG_NET_TOKENS} net after burns)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Mix Breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Device Mix Assumptions
              <Badge variant="outline" className="text-xs">Conservative</Badge>
            </CardTitle>
            <CardDescription>
              Weighted avg: ~{Math.round(WEIGHTED_AVG_RAW_TOKENS)} raw tokens/mo → ~{WEIGHTED_AVG_NET_TOKENS} net (after 20% burn + 5% tax)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DEVICE_MIX.map((seg) => (
                <div key={seg.id} className="p-3 rounded-lg border bg-muted/50 text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">{seg.percentage}%</p>
                  <p className="font-medium text-sm">{seg.label}</p>
                  <p className="text-xs text-muted-foreground">{seg.breakdown}</p>
                  <p className="font-mono text-xs font-bold text-primary">~{seg.monthlyTokensRaw.toLocaleString()} tokens/mo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metricsAtPoints.map((point, idx) => (
            <Card key={point.label} className={idx === 4 ? "border-primary/50" : ""}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground font-medium">{point.label}</p>
                <p className="text-xl font-bold">{formatNumber(point.data.users)}</p>
                <p className="text-xs text-muted-foreground">users</p>
                <Separator className="my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium text-green-600">{formatCurrency(point.data.cumulativeRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">LP Depth</span>
                  <span className="font-medium text-blue-600">{formatCurrency(point.data.cumulativeLP)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Growth Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projections}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    interval={5}
                  />
                  <YAxis 
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                    labelFormatter={(label) => `Month ${label.replace('M', '')}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    name="Total Users"
                    stroke="hsl(var(--primary))" 
                    fill="url(#userGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="subscribers" 
                    name="Subscribers"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue & LP Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenue & LP Accumulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    interval={5}
                  />
                  <YAxis 
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="monthlyRevenue" 
                    name="Monthly Revenue"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeLP" 
                    name="Cumulative LP"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Token Issuance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600" />
                Token Issuance (Net of Burns)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    interval={5}
                  />
                  <YAxis 
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeTokens" 
                    name="Cumulative Tokens"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="monthlyTokens" 
                    name="Monthly Tokens"
                    stroke="#f97316"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Growth Milestones
              </CardTitle>
              <CardDescription>
                Key user count targets and projected achievement months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestonesWithMonth.map((m, idx) => {
                  const achieved = m.month !== null;
                  const isTippingPoint = m.users === 25000;
                  
                  return (
                    <div 
                      key={m.users}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        isTippingPoint ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achieved ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                      }`}>
                        {achieved ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{m.label}</span>
                          {isTippingPoint && (
                            <Badge className="bg-primary text-primary-foreground">Tipping Point</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatNumber(m.users)}</p>
                        <p className="text-xs text-muted-foreground">
                          {achieved ? `Month ${m.month}` : "Beyond 36mo"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* v2 Flywheel — Tier Mix + Genesis Halving */}
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              v2 Flywheel — Tier Mix vs Genesis Halving
            </CardTitle>
            <CardDescription>
              LP injection vs sell pressure across user counts at the target tier mix. Genesis Halving triggers at{" "}
              {formatNumber(GENESIS_HALVING.userCountTrigger)} paying users (50% mint-rate cut).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {Object.values(SUBSCRIPTION_TIERS).map((t) => (
                <div key={t.id} className="p-3 rounded-lg border bg-muted/40">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t.name}</span>
                    <Badge variant="secondary">${t.monthlyPrice}/mo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    LP ${t.lpPerMonth.toFixed(2)} · Treasury ${t.treasuryPerMonth.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1">
                    Sell-rate: <span className="font-mono">{Math.round(t.assumedMonthlySellRate * 100)}%</span>
                  </p>
                </div>
              ))}
            </div>
            {(() => {
              const userCounts = [1_000, 10_000, 50_000, 250_000];
              const rawTokensPerUser = WEIGHTED_AVG_RAW_TOKENS;
              const userShareOfMint = 0.75;
              const price = PRICES.launchFloor;

              // Cohort mix evolves: heavier Power tier as scale grows
              const mixFor = (users: number) => {
                if (users < 10_000) return { base: 0.6, regular: 0.35, power: 0.05 };
                if (users < 100_000) return { base: 0.4, regular: 0.45, power: 0.15 };
                return { base: 0.25, regular: 0.5, power: 0.25 };
              };

              const rows = userCounts.map((users) => {
                const mix = mixFor(users);
                const halvingActive = users >= GENESIS_HALVING.userCountTrigger;
                const mintMultiplier = halvingActive ? GENESIS_HALVING.multiplier : 1;
                const userTokens = rawTokensPerUser * userShareOfMint * mintMultiplier;

                const tiers = [
                  { ...SUBSCRIPTION_TIERS.base, share: mix.base },
                  { ...SUBSCRIPTION_TIERS.regular, share: mix.regular },
                  { ...SUBSCRIPTION_TIERS.power, share: mix.power },
                ];

                const lpInjection = tiers.reduce(
                  (sum, t) => sum + users * t.share * t.lpPerMonth,
                  0
                );
                const sellPressure = tiers.reduce(
                  (sum, t) => sum + users * t.share * userTokens * t.assumedMonthlySellRate * price,
                  0
                );
                const net = lpInjection - sellPressure;

                return { users, halvingActive, lpInjection, sellPressure, net };
              });

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Users</th>
                        <th className="py-2">Genesis Halving</th>
                        <th className="py-2">Monthly LP</th>
                        <th className="py-2">Sell pressure</th>
                        <th className="py-2">Net flywheel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.users} className="border-b last:border-0">
                          <td className="py-2 font-medium">{formatNumber(r.users)}</td>
                          <td className="py-2">
                            {r.halvingActive ? (
                              <Badge className="bg-primary text-primary-foreground">Active</Badge>
                            ) : (
                              <Badge variant="outline">Pre-halving</Badge>
                            )}
                          </td>
                          <td className="py-2 text-emerald-600 font-medium">{formatCurrency(r.lpInjection)}</td>
                          <td className="py-2 text-orange-600 font-medium">{formatCurrency(r.sellPressure)}</td>
                          <td className={`py-2 font-bold ${r.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {r.net >= 0 ? "+" : ""}
                            {formatCurrency(r.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            <p className="text-xs text-muted-foreground mt-3">
              Mix evolves: launch (60/35/5) → growth (40/45/15) → post-halving (25/50/25) for Base/Regular/Power.
              Sell pressure priced at $0.10 floor. Treasury auto-buyback (Satoshi-Mirror v2) absorbs residual gap.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Note:</strong> Projections are illustrative models based on adjustable assumptions. 
              Actual results will vary based on market conditions, user behavior, and execution.
              Growth rates are compounded monthly. LP accumulation assumes consistent subscription conversion.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
