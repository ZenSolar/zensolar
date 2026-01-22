import { useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { 
  DollarSign, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Circle,
  Globe,
  Shield,
  Fuel,
  Coins,
  PieChart,
  Calculator,
  Milestone,
  FileText,
  Rocket,
  Clock,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  BarChart3,
  Zap
} from "lucide-react";
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

// Milestone data
const milestones = [
  { 
    id: 1, 
    title: "Working MVP", 
    description: "Functional app with core features", 
    completed: true,
    date: "Completed"
  },
  { 
    id: 2, 
    title: "Provisional Patent Filed", 
    description: "US Patent Application submitted April 12, 2025", 
    completed: true,
    date: "Apr 12, 2025"
  },
  { 
    id: 3, 
    title: "4 Vendor API Integrations", 
    description: "Tesla, Enphase, SolarEdge, Wallbox connected", 
    completed: true,
    date: "Completed"
  },
  { 
    id: 4, 
    title: "Smart Contracts Deployed (Testnet)", 
    description: "ZSOLAR token + NFT contracts on Base Sepolia", 
    completed: true,
    date: "Completed"
  },
  { 
    id: 5, 
    title: "First $ZSOLAR Mints", 
    description: "Token rewards successfully minted on testnet", 
    completed: true,
    date: "Completed"
  },
  { 
    id: 6, 
    title: "First NFT Mints", 
    description: "Achievement NFTs minted on testnet", 
    completed: true,
    date: "Completed"
  },
  { 
    id: 7, 
    title: "Gas Sponsorship Model", 
    description: "Minter wallet covers all user transaction fees", 
    completed: true,
    date: "Implemented"
  },
  { 
    id: 8, 
    title: "100-500 Beta Users", 
    description: "Active users with connected energy devices", 
    completed: false,
    date: "In Progress"
  },
  { 
    id: 9, 
    title: "Security Audit", 
    description: "Third-party smart contract audit", 
    completed: false,
    date: "Pre-Mainnet"
  },
  { 
    id: 10, 
    title: "Mainnet Deployment", 
    description: "Production contracts on Base mainnet", 
    completed: false,
    date: "Post-Raise"
  },
  { 
    id: 11, 
    title: "Utility Patent Prosecution", 
    description: "Convert provisional to full utility patent", 
    completed: false,
    date: "Within 12 months"
  },
  { 
    id: 12, 
    title: "Global Patent Filing (PCT)", 
    description: "International patent protection", 
    completed: false,
    date: "Post-Raise"
  },
];

// Cap table data
const capTable = {
  totalSupply: 10_000_000_000,
  allocations: [
    { name: "Community Rewards", percentage: 90, tokens: 9_000_000_000, status: "Mineable", vesting: "Earned through activity" },
    { name: "Founder", percentage: 2.5, tokens: 250_000_000, status: "Allocated", vesting: "3-year linear vest" },
    { name: "Treasury/Operations", percentage: 7.5, tokens: 750_000_000, status: "Allocated", vesting: "2-year vest, multisig" },
  ]
};

// Comprehensive fundraising rounds data
const fundraisingRounds = [
  {
    stage: "Pre-Seed",
    amount: "$500K - $1M",
    valuation: "$5M - $10M",
    dilution: "10%",
    runway: "12-18 months",
    timeline: "Now",
    recommended: true,
    keyMilestones: [
      "Security audit completed",
      "Mainnet deployment",
      "500+ beta users",
      "Patent prosecution initiated"
    ],
    founderCompensation: {
      annualSalary: "$120K - $150K",
      signingBonus: "$0",
      secondarySale: "$0",
      totalCashYear1: "$120K - $150K",
    },
    useOfFunds: [
      { category: "Legal & IP", percentage: 15, amount: "$75K-150K" },
      { category: "Security Audit", percentage: 10, amount: "$50K-100K" },
      { category: "Mainnet Launch", percentage: 15, amount: "$75K-150K" },
      { category: "Team (12-18mo)", percentage: 40, amount: "$200K-400K" },
      { category: "Marketing", percentage: 20, amount: "$100K-200K" },
    ],
    investorFocus: "Product-market fit, patent protection, first users"
  },
  {
    stage: "Seed",
    amount: "$1M - $2M",
    valuation: "$15M - $25M",
    dilution: "10-15%",
    runway: "18-24 months",
    timeline: "Post-Mainnet + 10K users",
    recommended: false,
    keyMilestones: [
      "10,000+ active users",
      "25K subscriber tipping point",
      "$1.00 price target achieved",
      "Global patent (PCT) filed"
    ],
    founderCompensation: {
      annualSalary: "$175K - $225K",
      signingBonus: "$25K - $50K",
      secondarySale: "$150K - $300K",
      totalCashYear1: "$350K - $575K",
    },
    useOfFunds: [
      { category: "Team Expansion", percentage: 40, amount: "$400K-800K" },
      { category: "Global Patent", percentage: 10, amount: "$100K-200K" },
      { category: "LP Seeding", percentage: 20, amount: "$200K-400K" },
      { category: "Partnerships", percentage: 15, amount: "$150K-300K" },
      { category: "Operations", percentage: 15, amount: "$150K-300K" },
    ],
    investorFocus: "User growth, revenue metrics, LP sustainability"
  },
  {
    stage: "Series A",
    amount: "$5M - $10M",
    valuation: "$50M - $100M",
    dilution: "10-15%",
    runway: "24-36 months",
    timeline: "50K+ users, proven revenue",
    recommended: false,
    keyMilestones: [
      "50,000+ paying subscribers",
      "Positive unit economics",
      "Strategic partnerships",
      "International expansion"
    ],
    founderCompensation: {
      annualSalary: "$250K - $350K",
      signingBonus: "$50K - $100K",
      secondarySale: "$500K - $1.5M",
      totalCashYear1: "$800K - $1.95M",
    },
    useOfFunds: [
      { category: "Scale Operations", percentage: 35, amount: "$1.75M-3.5M" },
      { category: "Enterprise Sales", percentage: 20, amount: "$1M-2M" },
      { category: "Product Expansion", percentage: 25, amount: "$1.25M-2.5M" },
      { category: "Treasury Reserves", percentage: 20, amount: "$1M-2M" },
    ],
    investorFocus: "Revenue multiples, market leadership, defensibility"
  },
  {
    stage: "Series B",
    amount: "$15M - $30M",
    valuation: "$150M - $300M",
    dilution: "10-15%",
    runway: "36-48 months",
    timeline: "200K+ users, $5M+ ARR",
    recommended: false,
    keyMilestones: [
      "200,000+ paying subscribers",
      "$5M+ ARR achieved",
      "B2B utility partnerships",
      "Multi-chain deployment"
    ],
    founderCompensation: {
      annualSalary: "$350K - $450K",
      signingBonus: "$100K - $200K",
      secondarySale: "$2M - $5M",
      totalCashYear1: "$2.45M - $5.65M",
    },
    useOfFunds: [
      { category: "Global Expansion", percentage: 30, amount: "$4.5M-9M" },
      { category: "Enterprise Sales", percentage: 25, amount: "$3.75M-7.5M" },
      { category: "R&D / New Products", percentage: 25, amount: "$3.75M-7.5M" },
      { category: "M&A / Strategic", percentage: 20, amount: "$3M-6M" },
    ],
    investorFocus: "Path to profitability, market dominance, exit potential"
  },
  {
    stage: "Series C+",
    amount: "$50M+",
    valuation: "$500M+",
    dilution: "5-10%",
    runway: "48+ months",
    timeline: "1M+ users, $20M+ ARR",
    recommended: false,
    keyMilestones: [
      "1,000,000+ users globally",
      "$20M+ ARR",
      "IPO readiness or acquisition",
      "Category leader status"
    ],
    founderCompensation: {
      annualSalary: "$500K+",
      signingBonus: "$250K+",
      secondarySale: "$10M+",
      totalCashYear1: "$10M+",
    },
    useOfFunds: [
      { category: "Global Dominance", percentage: 40, amount: "$20M+" },
      { category: "IPO Preparation", percentage: 20, amount: "$10M+" },
      { category: "Strategic Acquisitions", percentage: 30, amount: "$15M+" },
      { category: "Treasury / Runway", percentage: 10, amount: "$5M+" },
    ],
    investorFocus: "Exit timeline, market cap potential, strategic value"
  },
];

// Simplified raise scenarios for backward compatibility
const raiseScenarios = fundraisingRounds.slice(0, 3).map(round => ({
  stage: round.stage,
  amount: round.amount,
  recommended: round.recommended,
  valuation: round.valuation,
  dilution: round.dilution,
  timeline: round.timeline,
  founderCompensation: {
    annualSalary: round.founderCompensation.annualSalary,
    salaryNote: round.stage === "Pre-Seed" ? "Below-market founder salary, standard for pre-seed" : 
                round.stage === "Seed" ? "Market-rate for early-stage CEO" : "Competitive CEO salary + benefits",
    signingBonus: round.founderCompensation.signingBonus,
    secondarySale: round.founderCompensation.secondarySale,
    secondaryNote: round.stage === "Pre-Seed" ? "No secondary allowed at this stage" :
                   round.stage === "Seed" ? "5-10% of shares sold (negotiable with lead investor)" : "10-15% secondary common at Series A",
    totalCashYear1: round.founderCompensation.totalCashYear1,
  },
  useOfFunds: round.useOfFunds.map(f => ({
    category: f.category,
    amount: f.amount,
    description: ""
  }))
}));

// Patent strategy
const patentStrategy = {
  current: {
    type: "Provisional Patent Application",
    filingDate: "April 12, 2025",
    jurisdiction: "United States",
    status: "Active",
    expiryForConversion: "April 12, 2026"
  },
  globalStrategy: [
    { jurisdiction: "United States", method: "Utility Patent", cost: "$15-25K", timeline: "2-3 years", priority: "High" },
    { jurisdiction: "European Union", method: "EP Application", cost: "$20-40K", timeline: "3-4 years", priority: "High" },
    { jurisdiction: "China", method: "CN Application", cost: "$10-20K", timeline: "2-3 years", priority: "Medium" },
    { jurisdiction: "Japan", method: "JP Application", cost: "$10-15K", timeline: "2-3 years", priority: "Medium" },
    { jurisdiction: "South Korea", method: "KR Application", cost: "$8-12K", timeline: "2 years", priority: "Medium" },
    { jurisdiction: "Australia", method: "AU Application", cost: "$8-12K", timeline: "2 years", priority: "Low" },
    { jurisdiction: "Canada", method: "CA Application", cost: "$8-12K", timeline: "2-3 years", priority: "Low" },
  ],
  pctRoute: {
    description: "Patent Cooperation Treaty (PCT) Application",
    benefit: "Single filing preserves rights in 150+ countries for 30 months",
    cost: "$5-10K initial + national phase costs",
    deadline: "Within 12 months of provisional filing (by April 12, 2026)"
  }
};

export default function AdminFundraising() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();
  const [activeTab, setActiveTab] = useState("rounds");

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
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.completed).length;
  const milestoneProgress = (completedMilestones / milestones.length) * 100;

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
            <DollarSign className="h-3 w-3 mr-1" />
            Fundraising Strategy
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Fundraising Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            Track milestones, model cap table scenarios, and plan raise strategy for $ZSOLAR
          </p>
        </div>
        <ExportButtons 
          pageTitle="Fundraising Dashboard" 
          getData={() => [
            ...milestones.map(m => ({ section: "Milestone", item: m.title, status: m.completed ? "Completed" : "Pending", date: m.date, description: m.description })),
            ...fundraisingRounds.map(r => ({ section: "Round", stage: r.stage, amount: r.amount, valuation: r.valuation, dilution: r.dilution, runway: r.runway, timeline: r.timeline })),
            ...capTable.allocations.map(a => ({ section: "Cap Table", allocation: a.name, percentage: `${a.percentage}%`, tokens: a.tokens, vesting: a.vesting }))
          ]} 
        />
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completedMilestones}/{milestones.length}</p>
                <p className="text-xs text-muted-foreground">Milestones Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">Testnet</p>
                <p className="text-xs text-muted-foreground">Current Stage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Patent Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">$500K-$750K</p>
                <p className="text-xs text-muted-foreground">Recommended Raise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 p-1.5 bg-muted/50 rounded-xl">
            <TabsTrigger value="rounds" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers className="h-4 w-4" />
              <span>Rounds</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Milestone className="h-4 w-4" />
              <span>Milestones</span>
            </TabsTrigger>
            <TabsTrigger value="captable" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <PieChart className="h-4 w-4" />
              <span>Cap Table</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calculator className="h-4 w-4" />
              <span>Scenarios</span>
            </TabsTrigger>
            <TabsTrigger value="patent" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4" />
              <span>Patent</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Fuel className="h-4 w-4" />
              <span>Operations</span>
            </TabsTrigger>
          </TabsList>

          {/* Fundraising Rounds Comparison Tab */}
          <TabsContent value="rounds" className="space-y-6">
            {/* Comparison Table */}
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Fundraising Rounds Comparison
                </CardTitle>
                <CardDescription>
                  Side-by-side comparison of all funding stages from Pre-Seed to Series C+
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold w-40">Metric</TableHead>
                        {fundraisingRounds.map((round) => (
                          <TableHead key={round.stage} className={`text-center min-w-[140px] ${round.recommended ? 'bg-primary/10' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold">{round.stage}</span>
                              {round.recommended && (
                                <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium bg-muted/20">Raise Amount</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center font-semibold text-primary ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.amount}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-muted/20">Valuation</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.valuation}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-muted/20">Dilution</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.dilution}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-muted/20">Runway</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.runway}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-muted/20">Timeline</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center text-sm ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.timeline}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium bg-green-500/10">Founder Salary</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center text-sm text-green-600 dark:text-green-400 ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.founderCompensation.annualSalary}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-amber-500/10">Secondary Sale</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center text-sm text-amber-600 dark:text-amber-400 ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.founderCompensation.secondarySale}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium bg-blue-500/10">Total Year 1</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center font-semibold text-blue-600 dark:text-blue-400 ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.founderCompensation.totalCashYear1}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium bg-muted/20">Investor Focus</TableCell>
                        {fundraisingRounds.map((round) => (
                          <TableCell key={round.stage} className={`text-center text-xs text-muted-foreground ${round.recommended ? 'bg-primary/5' : ''}`}>
                            {round.investorFocus}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Key Milestones Per Round */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fundraisingRounds.slice(0, 3).map((round, index) => (
                <motion.div
                  key={round.stage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full ${round.recommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}>
                    <CardHeader className={`pb-3 ${round.recommended ? 'bg-gradient-to-r from-primary/10 to-transparent' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {round.stage}
                          {round.recommended && <Zap className="h-4 w-4 text-primary" />}
                        </CardTitle>
                        <Badge variant={round.recommended ? "default" : "outline"}>
                          {round.amount}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{round.runway} runway</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">KEY MILESTONES</p>
                        <ul className="space-y-1.5">
                          {round.keyMilestones.map((milestone, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                              <span>{milestone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">USE OF FUNDS</p>
                        <div className="space-y-2">
                          {round.useOfFunds.slice(0, 4).map((fund, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span>{fund.category}</span>
                                  <span className="text-muted-foreground">{fund.percentage}%</span>
                                </div>
                                <Progress value={fund.percentage} className="h-1.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Late Stage Rounds */}
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Late-Stage Rounds (Series B+)
                </CardTitle>
                <CardDescription>Future funding stages contingent on growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {fundraisingRounds.slice(3).map((round) => (
                    <div key={round.stage} className="p-4 rounded-lg border bg-background/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{round.stage}</h4>
                        <Badge variant="outline">{round.amount}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valuation:</span>
                          <span className="ml-1 font-medium">{round.valuation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Runway:</span>
                          <span className="ml-1 font-medium">{round.runway}</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Trigger:</span>
                        <span className="ml-1">{round.timeline}</span>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Focus:</strong> {round.investorFocus}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Fundraising Readiness
                </CardTitle>
                <CardDescription>
                  Track key milestones for investor conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Pre-Seed Ready</span>
                    <span className="font-medium">{Math.round(milestoneProgress)}%</span>
                  </div>
                  <Progress value={milestoneProgress} className="h-3" />
                </div>

                <Separator />

                <div className="grid gap-3">
                  {milestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        milestone.completed 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium ${milestone.completed ? "text-green-700 dark:text-green-400" : ""}`}>
                            {milestone.title}
                          </p>
                          <Badge variant={milestone.completed ? "default" : "secondary"} className="shrink-0">
                            {milestone.date}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cap Table Tab */}
          <TabsContent value="captable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Token Allocation
                </CardTitle>
                <CardDescription>
                  $ZSOLAR supply distribution (50 billion total)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {capTable.allocations.map((allocation, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-medium">{allocation.name}</span>
                        </div>
                        <Badge variant="outline">{allocation.percentage}%</Badge>
                      </div>
                      <Progress value={allocation.percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{(allocation.tokens / 1_000_000_000).toFixed(2)}B tokens</span>
                        <span>{allocation.vesting}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Founder Vesting Schedule
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The 2.5% founder allocation (1.25B tokens) is subject to a 4-year linear vesting schedule, 
                    demonstrating long-term commitment and alignment with the community.
                  </p>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[1, 2, 3, 4].map((year) => (
                      <div key={year} className="text-center p-2 bg-background rounded border">
                        <p className="text-lg font-bold">312.5M</p>
                        <p className="text-xs text-muted-foreground">Year {year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            {raiseScenarios.map((scenario, index) => (
              <Card key={index} className={scenario.recommended ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {scenario.stage}
                    </CardTitle>
                    {scenario.recommended && (
                      <Badge className="bg-primary">Recommended</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {scenario.amount} at {scenario.valuation} valuation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{scenario.amount}</p>
                      <p className="text-xs text-muted-foreground">Raise Amount</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{scenario.dilution}</p>
                      <p className="text-xs text-muted-foreground">Dilution</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{scenario.timeline}</p>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Founder Compensation Section */}
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Founder Compensation (Cash)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-2 bg-background rounded border">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{scenario.founderCompensation.annualSalary}</p>
                        <p className="text-xs text-muted-foreground">Annual Salary</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-sm font-bold">{scenario.founderCompensation.signingBonus}</p>
                        <p className="text-xs text-muted-foreground">Signing Bonus</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{scenario.founderCompensation.secondarySale}</p>
                        <p className="text-xs text-muted-foreground">Secondary Sale</p>
                      </div>
                      <div className="p-2 bg-background rounded border border-green-500">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{scenario.founderCompensation.totalCashYear1}</p>
                        <p className="text-xs text-muted-foreground">Total Year 1</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-medium">Salary:</span> {scenario.founderCompensation.salaryNote}</p>
                      <p><span className="font-medium">Secondary:</span> {scenario.founderCompensation.secondaryNote}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Use of Funds</h4>
                    {scenario.useOfFunds.map((fund, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <div>
                          <span className="font-medium">{fund.category}</span>
                          <p className="text-xs text-muted-foreground">{fund.description}</p>
                        </div>
                        <Badge variant="outline">{fund.amount}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Patent Tab */}
          <TabsContent value="patent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Patent Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-xs text-muted-foreground">{patentStrategy.current.type}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-medium">Filed</p>
                    <p className="text-xs text-muted-foreground">{patentStrategy.current.filingDate}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm font-medium">Jurisdiction</p>
                    <p className="text-xs text-muted-foreground">{patentStrategy.current.jurisdiction}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center border border-green-500/30">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Status</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{patentStrategy.current.status}</p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Conversion Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        Must file utility patent by <span className="font-medium">{patentStrategy.current.expiryForConversion}</span> to 
                        maintain priority date.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Patent Strategy
                </CardTitle>
                <CardDescription>
                  International protection via PCT and direct filings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PCT Route */}
                <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {patentStrategy.pctRoute.description}
                  </h4>
                  <p className="text-sm text-muted-foreground">{patentStrategy.pctRoute.benefit}</p>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <Badge variant="outline">{patentStrategy.pctRoute.cost}</Badge>
                    <span className="text-muted-foreground">Deadline: {patentStrategy.pctRoute.deadline}</span>
                  </div>
                </div>

                {/* Country-specific filings */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">National Phase / Direct Filings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Jurisdiction</th>
                          <th className="text-left py-2">Method</th>
                          <th className="text-left py-2">Cost Est.</th>
                          <th className="text-left py-2">Timeline</th>
                          <th className="text-left py-2">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patentStrategy.globalStrategy.map((country, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 font-medium">{country.jurisdiction}</td>
                            <td className="py-2 text-muted-foreground">{country.method}</td>
                            <td className="py-2">{country.cost}</td>
                            <td className="py-2 text-muted-foreground">{country.timeline}</td>
                            <td className="py-2">
                              <Badge variant={
                                country.priority === "High" ? "default" : 
                                country.priority === "Medium" ? "secondary" : "outline"
                              }>
                                {country.priority}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Estimated Total Global Patent Budget:</strong> $75K - $150K over 3-4 years, 
                    including prosecution costs and translations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5" />
                  Gas Sponsorship Model
                </CardTitle>
                <CardDescription>
                  Minter wallet covers all user transaction fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Implemented</p>
                      <p className="text-sm text-muted-foreground">
                        The minter wallet pays gas fees for all users, removing friction from the onboarding 
                        and reward claiming experience.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Experience
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• No ETH/Base required in user wallets</li>
                      <li>• One-click minting experience</li>
                      <li>• Lower barrier to entry</li>
                      <li>• Better conversion rates</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Cost Projections
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Testnet: $0 (free transactions)</li>
                      <li>• Mainnet: ~$0.01-0.05 per mint</li>
                      <li>• 10K users: ~$500-2,500/month</li>
                      <li>• 100K users: ~$5K-25K/month</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    ChargePoint Integration Decision
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Status:</strong> Not proceeding. ChargePoint's API is designed for fleet management 
                      rather than individual consumers, making it incompatible with our peer-to-peer reward model. 
                      Our existing integrations (Tesla, Enphase, SolarEdge, Wallbox) provide comprehensive coverage 
                      for the residential clean energy market.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subscription Revenue Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">$9.99</p>
                    <p className="text-sm text-muted-foreground">/month subscription</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">50%</p>
                    <p className="text-sm text-muted-foreground">→ Liquidity Pool</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">50%</p>
                    <p className="text-sm text-muted-foreground">→ Operations</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Users</th>
                        <th className="text-left py-2">MRR</th>
                        <th className="text-left py-2">Annual LP Injection</th>
                        <th className="text-left py-2">Annual Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">1,000</td>
                        <td className="py-2">$10K</td>
                        <td className="py-2 text-green-600 dark:text-green-400">$60K</td>
                        <td className="py-2">$60K</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">10,000</td>
                        <td className="py-2">$100K</td>
                        <td className="py-2 text-green-600 dark:text-green-400">$600K</td>
                        <td className="py-2">$600K</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">100,000</td>
                        <td className="py-2">$1M</td>
                        <td className="py-2 text-green-600 dark:text-green-400">$6M</td>
                        <td className="py-2">$6M</td>
                      </tr>
                      <tr>
                        <td className="py-2">1,000,000</td>
                        <td className="py-2">$10M</td>
                        <td className="py-2 text-green-600 dark:text-green-400">$60M</td>
                        <td className="py-2">$60M</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Disclaimer */}
      <motion.div variants={fadeIn}>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center">
              This fundraising dashboard is for internal planning purposes only. All projections are 
              estimates and subject to change. Consult with legal and financial advisors before 
              engaging in any fundraising activities.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
