import { useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { 
  DollarSign, 
  Target, 
  Users, 
  TrendingUp, 
  Shield,
  Coins,
  Lock,
  Layers,
  Loader2,
  BarChart3,
  Zap,
  Flame,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertTriangle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ExportButtons } from "@/components/admin/ExportButtons";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// === PHASED FUNDRAISING MODEL ===

const phases = [
  {
    id: "preseed",
    name: "Pre-Seed (Beta)",
    timeline: "Now – Month 6",
    raise: "$0",
    valuation: "N/A",
    users: { start: 10, end: 100 },
    lpLocked: "$5K (testnet)",
    lpFromRevenue: "$0",
    totalLP: "$5K",
    circulatingSupply: "~1M (testnet)",
    supplyPercent: "0%",
    priceTarget: "$0.10 (placeholder)",
    monthlyRevenue: "$0",
    cumulativeRevenue: "$0",
    arr: "$0",
    lpTier: "Test",
    lpTierColor: "text-muted-foreground",
    status: "active",
    milestones: [
      { text: "Smart contract deployed (10B supply)", done: true },
      { text: "Proof-of-Delta™ validation with real devices", done: true },
      { text: "127+ on-chain mints completed", done: true },
      { text: "50+ active beta users", done: false },
      { text: "Device Watermark Registry stress-tested", done: false },
      { text: "App Store submission (Q2 2026)", done: false },
    ],
    tokenRelease: [
      { event: "Testnet activity", tokens: 0, destination: "N/A (testnet only)" },
    ],
    useOfFunds: [],
    investorNarrative: "We've proven the technology works with real devices and real users on testnet. Zero mainnet tokens released."
  },
  {
    id: "seed",
    name: "Seed Round",
    timeline: "Month 7 – 18",
    raise: "$3M – $5M",
    valuation: "$15M – $25M pre-money",
    users: { start: 100, end: 5000 },
    lpLocked: "$1.5M",
    lpFromRevenue: "$150K",
    totalLP: "$1.65M",
    circulatingSupply: "60M",
    supplyPercent: "0.6%",
    priceTarget: "$0.10 – $0.25",
    monthlyRevenue: "$25K (at 5K users)",
    cumulativeRevenue: "$180K",
    arr: "$300K",
    lpTier: "Viable",
    lpTierColor: "text-yellow-500",
    status: "upcoming",
    milestones: [
      { text: "Mainnet launch on Base L2", done: false },
      { text: "$1.5M LP locked for 10 years (on-chain)", done: false },
      { text: "1,000 paying subscribers", done: false },
      { text: "Patent filing completed", done: false },
      { text: "App Store live (iOS + Android)", done: false },
      { text: "First $100K cumulative revenue", done: false },
    ],
    tokenRelease: [
      { event: "LP Seed", tokens: 15_000_000, destination: "Locked LP" },
      { event: "User Rewards (Mo 7-12)", tokens: 7_500_000, destination: "User wallets (vested)" },
      { event: "User Rewards (Mo 13-18)", tokens: 37_500_000, destination: "User wallets (vested)" },
    ],
    useOfFunds: [
      { category: "Locked LP (10-year lock)", amount: "$1.5M", percentage: 37.5 },
      { category: "Engineering (12 months)", amount: "$1M", percentage: 25 },
      { category: "Legal / IP / Compliance", amount: "$400K", percentage: 10 },
      { category: "Marketing & Growth", amount: "$500K", percentage: 12.5 },
      { category: "Operations & Infrastructure", amount: "$400K", percentage: 10 },
      { category: "Reserve / Contingency", amount: "$200K", percentage: 5 },
    ],
    investorNarrative: "We've proven the technology works. We're locking $1.5M to build the permanent financial foundation."
  },
  {
    id: "seriesA",
    name: "Series A",
    timeline: "Month 19 – 36",
    raise: "$15M – $25M",
    valuation: "$75M – $125M pre-money",
    users: { start: 5000, end: 50000 },
    lpLocked: "$7.5M",
    lpFromRevenue: "$2.5M",
    totalLP: "$10M",
    circulatingSupply: "350M",
    supplyPercent: "3.5%",
    priceTarget: "$0.20 – $0.60",
    monthlyRevenue: "$375K (at 50K users)",
    cumulativeRevenue: "$5.5M",
    arr: "$4.5M",
    lpTier: "Resilient",
    lpTierColor: "text-green-500",
    status: "future",
    milestones: [
      { text: "25,000 paying subscribers (self-sustaining)", done: false },
      { text: "$7.5M total locked LP", done: false },
      { text: "$1M+ ARR", done: false },
      { text: "Patent granted", done: false },
      { text: "5+ hardware integrations", done: false },
      { text: "$ZSOLAR debit card pilot", done: false },
    ],
    tokenRelease: [
      { event: "LP Expansion", tokens: 60_000_000, destination: "Locked LP" },
      { event: "User Rewards (Mo 19-36)", tokens: 180_000_000, destination: "User wallets (vested)" },
      { event: "Treasury Unlock (Year 2)", tokens: 50_000_000, destination: "Treasury ops" },
    ],
    useOfFunds: [
      { category: "Locked LP (added to lock)", amount: "$6M", percentage: 30 },
      { category: "Engineering Scale-up", amount: "$5M", percentage: 25 },
      { category: "Growth & Acquisition", amount: "$4M", percentage: 20 },
      { category: "Legal / Compliance", amount: "$1.5M", percentage: 7.5 },
      { category: "Operations & Infrastructure", amount: "$2M", percentage: 10 },
      { category: "Reserve / Contingency", amount: "$1.5M", percentage: 7.5 },
    ],
    investorNarrative: "We have 5,000 users generating real revenue. We're locking $7.5M total to make this permanent infrastructure."
  },
  {
    id: "seriesB",
    name: "Series B",
    timeline: "Month 37 – 60 (Year 3-5)",
    raise: "$50M – $75M",
    valuation: "$300M – $500M pre-money",
    users: { start: 50000, end: 500000 },
    lpLocked: "$25M",
    lpFromRevenue: "$35M",
    totalLP: "$60M",
    circulatingSupply: "1.1B",
    supplyPercent: "11%",
    priceTarget: "$0.50 – $2.00",
    monthlyRevenue: "$5M (at 500K users)",
    cumulativeRevenue: "$60M",
    arr: "$60M",
    lpTier: "Fortress",
    lpTierColor: "text-blue-500",
    status: "future",
    milestones: [
      { text: "100,000 paying subscribers", done: false },
      { text: "$25M total locked LP (Fortress tier)", done: false },
      { text: "$10M+ ARR", done: false },
      { text: "$ZSOLAR debit card nationwide", done: false },
      { text: "Utility bill payment integration", done: false },
      { text: "Token price sustainably above $1.00", done: false },
    ],
    tokenRelease: [
      { event: "LP Expansion", tokens: 175_000_000, destination: "Locked LP" },
      { event: "User Rewards (Mo 37-60)", tokens: 450_000_000, destination: "User wallets (vested)" },
      { event: "Treasury Operations", tokens: 75_000_000, destination: "Ecosystem growth" },
      { event: "Founder Vesting (Year 3+)", tokens: 50_000_000, destination: "Founder (vested)" },
    ],
    useOfFunds: [
      { category: "Locked LP (fortress level)", amount: "$17.5M", percentage: 29 },
      { category: "Engineering & Product", amount: "$15M", percentage: 25 },
      { category: "Growth & Partnerships", amount: "$12M", percentage: 20 },
      { category: "Debit Card Infrastructure", amount: "$5M", percentage: 8.3 },
      { category: "International Expansion", amount: "$5M", percentage: 8.3 },
      { category: "Legal / Compliance", amount: "$3M", percentage: 5 },
    ],
    investorNarrative: "We're at $10M ARR with 50K users. The $25M locked LP makes this price floor essentially unbreakable."
  },
  {
    id: "seriesC",
    name: "Series C / Growth",
    timeline: "Month 61 – 120 (Year 5-10)",
    raise: "$100M – $200M (or revenue-funded)",
    valuation: "$1B+",
    users: { start: 500000, end: 3000000 },
    lpLocked: "$50M",
    lpFromRevenue: "$350M",
    totalLP: "$400M",
    circulatingSupply: "4B",
    supplyPercent: "40%",
    priceTarget: "$1.00 – $10.00",
    monthlyRevenue: "$40M (at 3M users)",
    cumulativeRevenue: "$750M",
    arr: "$480M",
    lpTier: "Unshakeable",
    lpTierColor: "text-purple-500",
    status: "future",
    milestones: [
      { text: "1M+ users globally", done: false },
      { text: "$50M+ locked LP", done: false },
      { text: "$100M+ ARR", done: false },
      { text: "IPO readiness", done: false },
      { text: "International markets (EU, APAC)", done: false },
      { text: "$ZSOLAR accepted at major retailers", done: false },
    ],
    tokenRelease: [
      { event: "LP Expansion", tokens: 500_000_000, destination: "Locked LP" },
      { event: "User Rewards (Year 5-10)", tokens: 2_000_000_000, destination: "User wallets" },
      { event: "Treasury Operations", tokens: 200_000_000, destination: "Ecosystem growth" },
      { event: "Founder Vesting (complete)", tokens: 200_000_000, destination: "Founder" },
    ],
    useOfFunds: [
      { category: "Global Dominance", amount: "$80M+", percentage: 40 },
      { category: "IPO Preparation", amount: "$40M+", percentage: 20 },
      { category: "Strategic Acquisitions", amount: "$60M+", percentage: 30 },
      { category: "Treasury / Runway", amount: "$20M+", percentage: 10 },
    ],
    investorNarrative: "We're replacing federal tax credits for millions of Americans. The $50M+ locked LP is the financial backbone of the clean energy transition."
  },
];

// LP Resilience tiers
const lpTiers = [
  { name: "Viable", lp: "$1.5M", impact: "-9.1%", phase: "Seed", emoji: "🟡" },
  { name: "Resilient", lp: "$10M", impact: "-5%", phase: "Series A", emoji: "🟢" },
  { name: "Fortress", lp: "$25M", impact: "-2.5%", phase: "Series B", emoji: "🔵" },
  { name: "Unshakeable", lp: "$50M+", impact: "<1%", phase: "Series C", emoji: "💎" },
];

// Token release summary
const tokenReleaseSummary = [
  { phase: "Pre-seed", tokens: 0, cumulative: 0, percent: "0%", price: "$0.10 (test)" },
  { phase: "Seed", tokens: 60, cumulative: 60, percent: "0.6%", price: "$0.10 – $0.25" },
  { phase: "Series A", tokens: 290, cumulative: 350, percent: "3.5%", price: "$0.20 – $0.60" },
  { phase: "Series B", tokens: 750, cumulative: 1100, percent: "11%", price: "$0.50 – $2.00" },
  { phase: "Series C", tokens: 2900, cumulative: 4000, percent: "40%", price: "$1.00 – $10.00" },
];

// Revenue projection chart data
const revenueChartData = [
  { month: "Mo 7", users: 100, revenue: 0.5, lpDepth: 1500, arr: 6 },
  { month: "Mo 12", users: 1000, revenue: 33, lpDepth: 1730, arr: 60 },
  { month: "Mo 18", users: 5000, revenue: 180, lpDepth: 2250, arr: 300 },
  { month: "Mo 24", users: 15000, revenue: 1100, lpDepth: 8150, arr: 1350 },
  { month: "Mo 36", users: 50000, revenue: 5500, lpDepth: 10000, arr: 4500 },
  { month: "Mo 48", users: 150000, revenue: 24000, lpDepth: 37000, arr: 18000 },
  { month: "Mo 60", users: 500000, revenue: 60000, lpDepth: 60000, arr: 60000 },
  { month: "Yr 7", users: 1000000, revenue: 200000, lpDepth: 170000, arr: 144000 },
  { month: "Yr 10", users: 3000000, revenue: 750000, lpDepth: 400000, arr: 480000 },
];

// Price impact data for chart
const priceImpactData = [
  { lp: "$300K", sell10: 94, sell25: 97, sell50: 99 },
  { lp: "$1M", sell10: 33, sell25: 56, sell50: 75 },
  { lp: "$1.5M", sell10: 3.8, sell25: 9.1, sell50: 16.7 },
  { lp: "$5M", sell10: 3.8, sell25: 9.1, sell50: 20 },
  { lp: "$10M", sell10: 3.8, sell25: 5, sell50: 11 },
  { lp: "$25M", sell10: 2, sell25: 2.5, sell50: 5 },
  { lp: "$50M", sell10: 1, sell25: 1.2, sell50: 2.4 },
];

function formatTokens(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}B`;
  return `${m}M`;
}

export default function AdminFundraising() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();
  const [activeTab, setActiveTab] = useState("overview");

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
      <div className="container mx-auto py-8 px-4">
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Access Denied. Admin privileges required.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerChildren}
      className="container mx-auto pt-4 pb-8 px-4 max-w-7xl space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-2">
          <Badge variant="outline" className="text-primary border-primary">
            <Lock className="h-3 w-3 mr-1" />
            Permanent Infrastructure Model
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Phased Fundraising & Token Release
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            Building the permanent financial infrastructure that replaces federal tax credits for clean energy users.
          </p>
        </div>
        <ExportButtons 
          pageTitle="Phased Fundraising Model" 
          getData={() => [
            ...phases.map(p => ({ 
              Phase: p.name, Raise: p.raise, Valuation: p.valuation, 
              Users: `${p.users.start.toLocaleString()} → ${p.users.end.toLocaleString()}`,
              "LP Locked": p.lpLocked, "Total LP": p.totalLP,
              "Circulating Supply": p.circulatingSupply, "% of 10B": p.supplyPercent,
              "Price Target": p.priceTarget, ARR: p.arr,
              "Cumulative Revenue": p.cumulativeRevenue
            })),
          ]} 
        />
      </motion.div>

      {/* Infrastructure Narrative Banner */}
      <motion.div variants={fadeIn}>
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">The Infrastructure Thesis</h3>
              <p className="text-sm text-muted-foreground">
                The locked liquidity pool is ZenSolar's equivalent of the U.S. Treasury backing tax credits. 
                Users don't need to trust a founder. They need to trust that the <span className="text-primary font-semibold">mechanism is permanent and self-sustaining</span>. 
                Subscription revenue feeds the pool automatically. Deflationary burns ensure scarcity. The longer it runs, the stronger it gets.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">10 yr</p>
                <p className="text-xs text-muted-foreground">LP Lock Period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">10B</p>
                <p className="text-xs text-muted-foreground">Total Supply</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">20%+7%</p>
                <p className="text-xs text-muted-foreground">Mint + Transfer Burn</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">50%</p>
                <p className="text-xs text-muted-foreground">Revenue → LP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 p-1.5 bg-muted/50 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers className="h-4 w-4" />
              <span>Phases</span>
            </TabsTrigger>
            <TabsTrigger value="tokenrelease" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Coins className="h-4 w-4" />
              <span>Token Release</span>
            </TabsTrigger>
            <TabsTrigger value="lpresilience" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4" />
              <span>LP Resilience</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Revenue</span>
            </TabsTrigger>
          </TabsList>

          {/* === PHASES TAB === */}
          <TabsContent value="overview" className="space-y-6">
            {/* Master Comparison Table */}
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Phased Fundraising Model
                </CardTitle>
                <CardDescription>
                  From testnet beta to global infrastructure. Each phase deepens the permanent liquidity foundation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold w-40">Metric</TableHead>
                        {phases.map((p) => (
                          <TableHead key={p.id} className={`text-center min-w-[140px] ${p.status === 'active' ? 'bg-primary/10' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-xs">{p.name}</span>
                              {p.status === 'active' && <Badge className="bg-primary text-primary-foreground text-[10px]">Current</Badge>}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: "Raise", key: "raise", highlight: true },
                        { label: "Valuation", key: "valuation" },
                        { label: "Timeline", key: "timeline" },
                        { label: "Users", key: "users", format: (p: typeof phases[0]) => `${p.users.start.toLocaleString()} → ${p.users.end.toLocaleString()}` },
                        { label: "LP Locked", key: "lpLocked", highlight: true },
                        { label: "LP from Revenue", key: "lpFromRevenue" },
                        { label: "Total LP Depth", key: "totalLP", highlight: true },
                        { label: "Circulating Supply", key: "circulatingSupply" },
                        { label: "% of 10B Supply", key: "supplyPercent" },
                        { label: "Price Target", key: "priceTarget", highlight: true },
                        { label: "Cumulative Revenue", key: "cumulativeRevenue" },
                        { label: "ARR", key: "arr" },
                      ].map((row) => (
                        <TableRow key={row.key} className={row.highlight ? 'bg-primary/[0.02]' : ''}>
                          <TableCell className="font-medium bg-muted/20 text-xs">{row.label}</TableCell>
                          {phases.map((p) => (
                            <TableCell key={p.id} className={`text-center text-xs ${p.status === 'active' ? 'bg-primary/5' : ''} ${row.highlight ? 'font-semibold' : ''}`}>
                              {row.format ? row.format(p) : (p as any)[row.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium bg-blue-500/10 text-xs">LP Tier</TableCell>
                        {phases.map((p) => (
                          <TableCell key={p.id} className={`text-center font-bold ${p.lpTierColor} ${p.status === 'active' ? 'bg-primary/5' : ''}`}>
                            {p.lpTier}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Phase Detail Cards */}
            <div className="space-y-4">
              {phases.map((phase, idx) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`${phase.status === 'active' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}>
                    <CardHeader className={`pb-3 ${phase.status === 'active' ? 'bg-gradient-to-r from-primary/10 to-transparent' : ''}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {phase.status === 'active' && <Zap className="h-4 w-4 text-primary" />}
                          {phase.name}
                          <span className="text-sm font-normal text-muted-foreground">({phase.timeline})</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{phase.raise}</Badge>
                          {phase.valuation !== "N/A" && <Badge variant="secondary" className="text-xs">{phase.valuation}</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{phase.investorNarrative}"</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Milestones */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Key Milestones</p>
                          <ul className="space-y-1.5">
                            {phase.milestones.map((m, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                {m.done ? (
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className={m.done ? 'text-muted-foreground line-through' : ''}>{m.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Use of Funds */}
                        {phase.useOfFunds.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Use of Funds</p>
                            <div className="space-y-2">
                              {phase.useOfFunds.map((f, i) => (
                                <div key={i}>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span>{f.category}</span>
                                    <span className="text-muted-foreground">{f.amount} ({f.percentage}%)</span>
                                  </div>
                                  <Progress value={f.percentage} className="h-1.5" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* === TOKEN RELEASE TAB === */}
          <TabsContent value="tokenrelease" className="space-y-6">
            {/* Supply Release Summary */}
            <Card className="overflow-hidden border-yellow-500/20">
              <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  10B Supply Release Schedule
                </CardTitle>
                <CardDescription>
                  Managed supply curve: token supply matches real demand, not flooding the market.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Phase</TableHead>
                        <TableHead className="text-right">Released</TableHead>
                        <TableHead className="text-right">Cumulative</TableHead>
                        <TableHead className="text-right">% of 10B</TableHead>
                        <TableHead className="text-right">Price Target</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenReleaseSummary.map((row) => (
                        <TableRow key={row.phase}>
                          <TableCell className="font-medium">{row.phase}</TableCell>
                          <TableCell className="text-right">{formatTokens(row.tokens)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatTokens(row.cumulative)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-mono">{row.percent}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-primary font-medium">{row.price}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/20">
                        <TableCell className="font-bold">Remaining (Year 10+)</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-bold">6.0B</TableCell>
                        <TableCell className="text-right"><Badge variant="outline" className="font-mono">60%</Badge></TableCell>
                        <TableCell className="text-right text-muted-foreground">Long-term ecosystem</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Supply Release Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cumulative Token Release
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tokenReleaseSummary.filter(r => r.tokens > 0)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${v}M`} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [`${formatTokens(value)} tokens`, "Released"]}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="cumulative" name="Cumulative Supply" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Release per Phase */}
            <div className="space-y-4">
              {phases.filter(p => p.tokenRelease.some(t => t.tokens > 0)).map((phase) => (
                <Card key={phase.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{phase.name}: Token Release Detail</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Event</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead>Destination</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {phase.tokenRelease.filter(t => t.tokens > 0).map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{t.event}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{t.tokens.toLocaleString()}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{t.destination}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Remaining 6B Explanation */}
            <Card className="border-muted bg-muted/20">
              <CardContent className="p-5">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Remaining 6B Tokens (60% of supply)
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Long-term user reward runway (decades of growth)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Future LP expansion for new exchanges</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Strategic partnership allocations</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Acquisition currency</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Community governance incentives</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === LP RESILIENCE TAB === */}
          <TabsContent value="lpresilience" className="space-y-6">
            {/* Resilience Tiers */}
            <Card className="border-blue-500/20">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  LP Resilience Tiers
                </CardTitle>
                <CardDescription>
                  Price impact when 25% of all users sell everything at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {lpTiers.map((tier) => (
                    <Card key={tier.name} className="text-center">
                      <CardContent className="pt-5 pb-4">
                        <p className="text-3xl mb-1">{tier.emoji}</p>
                        <p className="font-bold text-lg">{tier.name}</p>
                        <p className="text-2xl font-bold text-primary mt-1">{tier.lp}</p>
                        <p className="text-sm text-muted-foreground mt-1">25% dump impact: <span className="font-semibold text-foreground">{tier.impact}</span></p>
                        <Badge variant="outline" className="mt-2">{tier.phase}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Impact Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Price Impact vs LP Depth
                </CardTitle>
                <CardDescription>% price drop at different sell scenarios (10K users, 50M circulating)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceImpactData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="lp" tick={{ fontSize: 11 }} label={{ value: "LP Depth", position: "insideBottom", offset: -5 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} label={{ value: "Price Drop", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value}%`, name]}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="sell10" name="10% sell" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="sell25" name="25% sell" fill="hsl(45, 93%, 47%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="sell50" name="50% sell" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Impact Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Price Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>LP Depth</TableHead>
                        <TableHead className="text-center">10% sell all</TableHead>
                        <TableHead className="text-center">25% sell all</TableHead>
                        <TableHead className="text-center">50% sell all</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceImpactData.map((row) => (
                        <TableRow key={row.lp}>
                          <TableCell className="font-semibold">{row.lp}</TableCell>
                          <TableCell className={`text-center font-mono ${row.sell10 > 20 ? 'text-destructive' : row.sell10 > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                            -{row.sell10}%
                          </TableCell>
                          <TableCell className={`text-center font-mono ${row.sell25 > 20 ? 'text-destructive' : row.sell25 > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                            -{row.sell25}%
                          </TableCell>
                          <TableCell className={`text-center font-mono ${row.sell50 > 30 ? 'text-destructive' : row.sell50 > 15 ? 'text-yellow-500' : 'text-green-500'}`}>
                            -{row.sell50}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === REVENUE TAB === */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue & LP Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Revenue & LP Depth Growth
                </CardTitle>
                <CardDescription>Cumulative revenue and total LP depth over time ($K)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}M` : `$${v}K`} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [value >= 1000 ? `$${(value/1000).toFixed(1)}M` : `$${value}K`, name]}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Area dataKey="revenue" name="Cumulative Revenue" fill="hsl(142, 76%, 36%)" fillOpacity={0.1} stroke="hsl(142, 76%, 36%)" />
                      <Line dataKey="lpDepth" name="Total LP Depth" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line dataKey="arr" name="ARR" stroke="hsl(45, 93%, 47%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue & Cash Projections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Phase</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Monthly Revenue</TableHead>
                        <TableHead className="text-right">Cumulative Revenue</TableHead>
                        <TableHead className="text-right">Revenue → LP (50%)</TableHead>
                        <TableHead className="text-right">ARR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.users.end.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{p.monthlyRevenue}</TableCell>
                          <TableCell className="text-right font-semibold">{p.cumulativeRevenue}</TableCell>
                          <TableCell className="text-right text-primary">{p.lpFromRevenue}</TableCell>
                          <TableCell className="text-right font-semibold">{p.arr}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Key Insight */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-5">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  The Flywheel Takeover
                </h4>
                <p className="text-sm text-muted-foreground">
                  By Series B, subscription revenue alone injects <span className="text-foreground font-semibold">$2.5M/month</span> into the LP. 
                  By Year 10, it's <span className="text-foreground font-semibold">$20M/month</span>. The locked base becomes a small fraction of total LP depth. 
                  The flywheel takes over, and the infrastructure becomes self-sustaining, independent of any future fundraising.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
