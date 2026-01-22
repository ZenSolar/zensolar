import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, BarChart } from "recharts";

// 10B Token Strategy Constants
const TOKEN_STRATEGY = {
  maxSupply: 10_000_000_000, // 10 billion hard cap
  founderAllocation: { percentage: 2.5, amount: 250_000_000, vestingYears: 3, cliffMonths: 6 },
  treasuryAllocation: { percentage: 7.5, amount: 750_000_000, vestingYears: 2 },
  communityRewards: { percentage: 90, amount: 9_000_000_000 },
  initialCirculating: { min: 100_000_000, max: 200_000_000, percentage: "1-2%" },
  initialLPSeed: { min: 50_000, max: 100_000 }, // USDC
  targetPriceRange: { min: 0.50, max: 2.00 },
};

// Mint Distribution (adjusted to 100%)
const MINT_DISTRIBUTION = {
  user: 85,
  burn: 10,
  lp: 3,
  treasury: 2,
};

// Transfer Tax (unchanged)
const TRANSFER_TAX = {
  burn: 3.5,
  treasury: 3.5,
  total: 7,
};

// Milestone Unlocks tied to paying users
const UNLOCK_MILESTONES = [
  { milestone: "Launch (TGE)", users: 0, tokens: "100-200M", percentage: "1-2%", cumulative: "1-2%", vesting: "—", mrr: "$0" },
  { milestone: "Early Traction", users: 1000, tokens: "100M", percentage: "1%", cumulative: "2-3%", vesting: "6 months", mrr: "~$10K" },
  { milestone: "Product-Market Fit", users: 5000, tokens: "300M", percentage: "3%", cumulative: "5-6%", vesting: "6 months", mrr: "~$50K" },
  { milestone: "Scaling Phase 1", users: 10000, tokens: "800M", percentage: "8%", cumulative: "13-14%", vesting: "9 months", mrr: "~$100K" },
  { milestone: "Scaling Phase 2", users: 25000, tokens: "2B", percentage: "20%", cumulative: "33%", vesting: "12 months", mrr: "~$250K" },
  { milestone: "Mass Adoption", users: 50000, tokens: "3B", percentage: "30%", cumulative: "63%", vesting: "12 months", mrr: "~$500K" },
  { milestone: "Long-Term", users: 100000, tokens: "Remaining", percentage: "37%", cumulative: "100%", vesting: "Governance", mrr: "$1M+" },
];

// Burn Mechanics
const BURN_MECHANICS = [
  { type: "Transfer Burns", rate: "3.5%", description: "Every token transfer permanently burns 3.5%" },
  { type: "Mint Burns", rate: "10%", description: "10% of newly minted tokens are burned immediately" },
  { type: "Redemption Burns", rate: "5-10%", description: "NFT redemptions burn 5-10% of token value" },
  { type: "Subscription Burns", rate: "5-10%", description: "Monthly burn from 50% LP flow" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function AdminTokenomics10B() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  // Price projection data - starting at $0.50-$1.00 floor price
  // Price projection data - starting at $0.50-$1.00 floor price
  // Math: Price = USDC / Tokens in LP
  // $75,000 USDC / 100,000 tokens = $0.75 per token
  const projectionData = useMemo(() => {
    const data = [];
    const STARTING_PRICE = 0.75; // $0.75 target starting price
    const initialLPUSDC = 75_000; // $75K USDC seed
    const initialLPTokens = initialLPUSDC / STARTING_PRICE; // 100,000 tokens to achieve $0.75
    
    // Total circulating includes LP + unlocked tokens outside LP
    let circulatingSupply = 150_000; // Start with 150K tokens total circulating
    let lpUSDC = initialLPUSDC;
    let lpTokens = initialLPTokens;
    let totalBurned = 0;
    
    // AMM constant product: k = lpUSDC * lpTokens
    let k = lpUSDC * lpTokens;
    
    for (let month = 0; month <= 36; month++) {
      // Price from constant product AMM: price = lpUSDC / lpTokens
      const price = lpTokens > 0 ? lpUSDC / lpTokens : 0;
      
      // Monthly activity assumptions (scaling with time)
      const users = Math.min(1000 + month * 2500, 100000);
      const paidUsers = users * 0.3; // 30% conversion
      const subRevenue = paidUsers * 9.99;
      const lpInjection = subRevenue * 0.5; // 50% to LP (USDC side)
      
      // Burns from transactions (3.5% of volume)
      const txVolume = users * 5 * 100; // 5 tx/user, $100 avg
      const txTokens = price > 0 ? txVolume / price : 0;
      const burnFromTx = txTokens * 0.035;
      
      data.push({
        month,
        price: price,
        marketCap: price * circulatingSupply,
        lpUSDC,
        totalBurned,
        users,
        circulatingSupply,
      });
      
      // Apply LP injection (adds USDC to LP)
      lpUSDC += lpInjection;
      // Recalculate lpTokens based on constant product (price goes up as USDC increases)
      lpTokens = k / lpUSDC;
      
      // Apply burns to circulating supply
      totalBurned += burnFromTx;
      
      // Milestone unlocks add to circulating (simplified linear unlock)
      const monthlyUnlock = month > 0 ? 50_000 : 0; // 50K tokens unlocked monthly
      circulatingSupply = Math.max(circulatingSupply + monthlyUnlock - burnFromTx, 100_000);
    }
    
    return data;
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
          Revenue-backed token economics designed for $1-$2 price equilibrium
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
                  <Badge className="bg-primary/20 text-primary">1-2% (100-200M)</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seeded into LP with $50K-$100K USDC for $0.50-$1.00 starting price floor
                </p>
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
                    <TableHead className="text-right">% of Max</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
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
                      <TableCell className="text-right">{row.percentage}</TableCell>
                      <TableCell className="text-right">{row.cumulative}</TableCell>
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

      {/* Price Projection Chart */}
      <motion.div {...fadeIn} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              36-Month Price Projection
            </CardTitle>
            <CardDescription>Modeled with 30% conversion, 50% sub→LP, 3.5% transfer burn</CardDescription>
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
