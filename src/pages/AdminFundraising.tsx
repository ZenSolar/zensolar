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
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
  totalSupply: 50_000_000_000,
  allocations: [
    { name: "Community Rewards", percentage: 90, tokens: 45_000_000_000, status: "Mineable", vesting: "Earned through activity" },
    { name: "Founder", percentage: 2.5, tokens: 1_250_000_000, status: "Allocated", vesting: "4-year linear vest" },
    { name: "Treasury/Operations", percentage: 7.5, tokens: 3_750_000_000, status: "Allocated", vesting: "Controlled by multisig" },
  ]
};

// Raise scenarios
const raiseScenarios = [
  {
    stage: "Pre-Seed",
    amount: "$500K - $750K",
    recommended: true,
    valuation: "$5M - $7.5M",
    dilution: "10%",
    timeline: "Now",
    founderEquity: "90%", // Pre-dilution founder ownership
    founderPostDilution: "81%", // After 10% dilution
    founderPaperValue: "$4.05M - $6.08M", // 81% of $5M-$7.5M
    founderLiquidityNote: "No liquidity at this stage - paper value only",
    useOfFunds: [
      { category: "Legal & IP", amount: "$100-150K", description: "Patent prosecution, securities counsel, token legal opinion" },
      { category: "Security Audit", amount: "$50-75K", description: "Smart contract audit by reputable firm" },
      { category: "Mainnet Launch", amount: "$75-100K", description: "Deployment, gas reserves, initial LP" },
      { category: "Team (12-18 mo)", amount: "$200-300K", description: "2-3 person core team runway" },
      { category: "Marketing", amount: "$50-100K", description: "User acquisition, community building" },
    ]
  },
  {
    stage: "Seed",
    amount: "$1.5M - $3M",
    recommended: false,
    valuation: "$15M - $25M",
    dilution: "10-15%",
    timeline: "Post-Mainnet + 10K users",
    founderEquity: "81%", // Post Pre-Seed
    founderPostDilution: "68.9% - 72.9%", // After additional 10-15% dilution
    founderPaperValue: "$10.3M - $18.2M", // ~70% of $15M-$25M
    founderLiquidityNote: "Potential 5-10% secondary ($0.5M - $1.8M)",
    useOfFunds: [
      { category: "Team Expansion", amount: "$600K-1M", description: "Engineering, BD, Marketing hires" },
      { category: "Global Patent", amount: "$150-250K", description: "PCT filing + major jurisdictions" },
      { category: "Liquidity", amount: "$300-500K", description: "DEX liquidity provision" },
      { category: "Partnerships", amount: "$200-400K", description: "Hardware manufacturer integrations" },
      { category: "Operations", amount: "$250-500K", description: "18-24 month runway extension" },
    ]
  },
  {
    stage: "Series A",
    amount: "$5M - $10M",
    recommended: false,
    valuation: "$50M - $100M",
    dilution: "10-15%",
    timeline: "50K+ users, proven revenue",
    founderEquity: "~70%", // Post Seed
    founderPostDilution: "59.5% - 63%", // After additional 10-15% dilution
    founderPaperValue: "$29.8M - $63M", // ~60% of $50M-$100M
    founderLiquidityNote: "Potential 10-15% secondary ($3M - $9.5M)",
    useOfFunds: [
      { category: "Scale Operations", amount: "$2-4M", description: "Full team build-out globally" },
      { category: "Enterprise Sales", amount: "$1-2M", description: "B2B utility partnerships" },
      { category: "Product Expansion", amount: "$1-2M", description: "Mobile apps, new device types" },
      { category: "Treasury", amount: "$1-2M", description: "Strategic reserves, acquisitions" },
    ]
  }
];

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
  const [activeTab, setActiveTab] = useState("milestones");

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
      className="container mx-auto pt-4 pb-8 px-4 max-w-7xl space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="text-center space-y-4">
        <Badge variant="outline" className="text-primary border-primary">
          <DollarSign className="h-3 w-3 mr-1" />
          Fundraising Strategy
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">
          Fundraising Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track milestones, model cap table scenarios, and plan raise strategy for $ZSOLAR
        </p>
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="milestones" className="flex items-center gap-1">
              <Milestone className="h-4 w-4" />
              <span className="hidden sm:inline">Milestones</span>
            </TabsTrigger>
            <TabsTrigger value="captable" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Cap Table</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Scenarios</span>
            </TabsTrigger>
            <TabsTrigger value="patent" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Patent</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-1">
              <Fuel className="h-4 w-4" />
              <span className="hidden sm:inline">Operations</span>
            </TabsTrigger>
          </TabsList>

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

                  {/* Founder Proceeds Section */}
                  <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Founder Economics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-2 bg-background rounded border">
                        <p className="text-sm font-bold">{scenario.founderEquity}</p>
                        <p className="text-xs text-muted-foreground">Pre-Round Equity</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-sm font-bold">{scenario.founderPostDilution}</p>
                        <p className="text-xs text-muted-foreground">Post-Dilution</p>
                      </div>
                      <div className="p-2 bg-background rounded border border-green-500/50">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{scenario.founderPaperValue}</p>
                        <p className="text-xs text-muted-foreground">Paper Value</p>
                      </div>
                      <div className="p-2 bg-background rounded border border-amber-500/50">
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {scenario.founderLiquidityNote.includes("No liquidity") ? "$0" : scenario.founderLiquidityNote.match(/\$[\d.]+-[\d.]+[MK]/)?.[0] || "TBD"}
                        </p>
                        <p className="text-xs text-muted-foreground">Potential Cash</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {scenario.founderLiquidityNote}
                    </p>
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
