import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Droplets, 
  Rocket, 
  CheckCircle2,
  Zap,
  DollarSign,
  Flame,
  ArrowUp,
  Crown,
  Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ExportButtons } from "@/components/admin/ExportButtons";

// Constants
const SUBSCRIPTION_PRICE = 9.99;
const LP_PERCENTAGE = 0.50;
const LP_PER_USER = SUBSCRIPTION_PRICE * LP_PERCENTAGE;
const TIPPING_POINT = 25000;
const INITIAL_LP_SEED = 125000;

// Milestones toward the 25K tipping point
const MILESTONES = [
  { users: 1000, label: "1K", description: "Early Traction", lpMonthly: 1000 * LP_PER_USER, color: "text-muted-foreground" },
  { users: 2500, label: "2.5K", description: "Product-Market Signal", lpMonthly: 2500 * LP_PER_USER, color: "text-blue-500" },
  { users: 5000, label: "5K", description: "Noticeable LP Growth", lpMonthly: 5000 * LP_PER_USER, color: "text-blue-500" },
  { users: 10000, label: "10K", description: "Meaningful Price Support", lpMonthly: 10000 * LP_PER_USER, color: "text-amber-500" },
  { users: 15000, label: "15K", description: "Momentum Building", lpMonthly: 15000 * LP_PER_USER, color: "text-amber-500" },
  { users: 20000, label: "20K", description: "Flywheel Warming Up", lpMonthly: 20000 * LP_PER_USER, color: "text-orange-500" },
  { users: 25000, label: "25K", description: "🚀 TIPPING POINT", lpMonthly: 25000 * LP_PER_USER, color: "text-primary", isTippingPoint: true },
  { users: 50000, label: "50K", description: "Self-Sustaining", lpMonthly: 50000 * LP_PER_USER, color: "text-green-500" },
  { users: 100000, label: "100K", description: "Treasury Machine", lpMonthly: 100000 * LP_PER_USER, color: "text-green-500" },
];

// Generate LP depth projection data
const generateProjectionData = () => {
  const data = [];
  for (let month = 0; month <= 36; month++) {
    // Assumes linear growth to 25K over 18 months, then continued growth
    const users = Math.min(Math.round(month * (25000 / 18)), 100000);
    const monthlyLP = users * LP_PER_USER;
    const cumulativeLP = INITIAL_LP_SEED + (monthlyLP * month);
    
    data.push({
      month: `M${month}`,
      users,
      monthlyLP: Math.round(monthlyLP),
      cumulativeLP: Math.round(cumulativeLP),
      isTippingPoint: users >= TIPPING_POINT && data.length > 0 && data[data.length - 1]?.users < TIPPING_POINT
    });
  }
  return data;
};

const projectionData = generateProjectionData();

// Current simulated state (replace with real data when available)
const CURRENT_USERS = 127; // Example: current paying subscribers

export default function AdminFlywheelTracker() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

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
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.min((CURRENT_USERS / TIPPING_POINT) * 100, 100);
  const currentMonthlyLP = CURRENT_USERS * LP_PER_USER;
  const monthsToTipping = Math.ceil((TIPPING_POINT - CURRENT_USERS) / (CURRENT_USERS * 0.15));
  const currentMilestone = MILESTONES.find(m => m.users > CURRENT_USERS) || MILESTONES[MILESTONES.length - 1];
  const previousMilestone = MILESTONES[MILESTONES.indexOf(currentMilestone) - 1];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  // Export data helper
  const getExportData = () => [
    { section: "Current", metric: "Current Users", value: CURRENT_USERS },
    { section: "Current", metric: "Tipping Point Target", value: TIPPING_POINT },
    { section: "Current", metric: "Progress %", value: `${progressPercent.toFixed(1)}%` },
    { section: "Current", metric: "Monthly LP", value: formatCurrency(currentMonthlyLP) },
    { section: "Current", metric: "Est. Months to Tipping", value: monthsToTipping },
    ...MILESTONES.map(m => ({ section: "Milestone", users: m.users, description: m.description, monthlyLP: formatCurrency(m.lpMonthly) })),
    ...projectionData.slice(0, 24).map(d => ({ section: "Projection", month: d.month, users: d.users, cumulativeLP: d.cumulativeLP })),
  ];


  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="text-center md:text-left space-y-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Rocket className="h-3 w-3 mr-1" />
            Flywheel Tracker
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            25K Subscriber Tipping Point
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Track progress toward the inflection point where monthly LP injection equals the entire initial liquidity seed.
          </p>
        </div>
        <ExportButtons pageTitle="Flywheel Tracker" getData={getExportData} />
      </motion.div>

      {/* Hero Progress Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
          <CardContent className="pt-6 space-y-6">
            {/* Main Progress */}
            <div className="text-center space-y-2">
              <div className="text-6xl md:text-7xl font-bold text-primary">
                {formatNumber(CURRENT_USERS)}
              </div>
              <div className="text-xl text-muted-foreground">
                of <span className="text-foreground font-semibold">{formatNumber(TIPPING_POINT)}</span> paying subscribers
              </div>
            </div>

            <Progress value={progressPercent} className="h-4" />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progressPercent.toFixed(1)}% to tipping point</span>
              <span>{formatNumber(TIPPING_POINT - CURRENT_USERS)} subscribers to go</span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-2" />
                <div className="text-xl font-bold">{formatCurrency(currentMonthlyLP)}</div>
                <div className="text-xs text-muted-foreground">Current Monthly LP</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <Target className="h-5 w-5 mx-auto text-primary mb-2" />
                <div className="text-xl font-bold">{formatCurrency(TIPPING_POINT * LP_PER_USER)}</div>
                <div className="text-xs text-muted-foreground">Target Monthly LP</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <Zap className="h-5 w-5 mx-auto text-amber-500 mb-2" />
                <div className="text-xl font-bold">{formatCurrency(INITIAL_LP_SEED)}</div>
                <div className="text-xs text-muted-foreground">Initial LP Seed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-2" />
                <div className="text-xl font-bold">~{monthsToTipping} mo</div>
                <div className="text-xs text-muted-foreground">Est. to Tipping (15% MoM)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The Magic Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">The Investor Pitch Inflection</h3>
                <p className="text-muted-foreground">
                  At <strong className="text-foreground">25,000 paying subscribers</strong>, we add our 
                  <strong className="text-primary"> entire $125K launch liquidity every single month</strong> — forever.
                  This is when the flywheel becomes an unstoppable economic engine.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Self-Sustaining LP
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Flame className="h-3 w-3 mr-1" />
                    Compounding Burns
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Rising Price Floor
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Milestone Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Milestone Timeline
            </CardTitle>
            <CardDescription>
              Key subscriber milestones and their economic impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {MILESTONES.map((milestone, index) => {
                  const isReached = CURRENT_USERS >= milestone.users;
                  const isCurrent = previousMilestone === milestone || (index === 0 && CURRENT_USERS < milestone.users);
                  
                  return (
                    <div 
                      key={milestone.users}
                      className={`relative flex items-center gap-4 pl-10 py-2 rounded-lg transition-colors ${
                        milestone.isTippingPoint 
                          ? 'bg-primary/10 border border-primary/30' 
                          : isCurrent 
                            ? 'bg-muted/50' 
                            : ''
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isReached 
                          ? 'bg-green-500 border-green-500' 
                          : milestone.isTippingPoint 
                            ? 'bg-primary/20 border-primary' 
                            : 'bg-background border-muted-foreground/30'
                      }`}>
                        {isReached && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${milestone.color}`}>
                            {milestone.label} Users
                          </span>
                          {milestone.isTippingPoint && (
                            <Badge className="bg-primary text-primary-foreground">
                              TIPPING POINT
                            </Badge>
                          )}
                          {isCurrent && !isReached && (
                            <Badge variant="outline">Next Target</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{milestone.description}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono font-bold">{formatCurrency(milestone.lpMonthly)}/mo</div>
                        <div className="text-xs text-muted-foreground">LP injection</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* LP Depth Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cumulative LP Depth Projection
            </CardTitle>
            <CardDescription>
              36-month projection assuming 15% month-over-month subscriber growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'cumulativeLP' ? 'Total LP Depth' : 'Monthly Injection'
                    ]}
                    labelFormatter={(label) => `Month ${label.replace('M', '')}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine 
                    y={INITIAL_LP_SEED} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Initial LP ($125K)', position: 'right', fontSize: 10 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeLP" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Why 25K Matters - Investor FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Why 25K is THE Number for Investors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Before 25K
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Flywheel is narrative, not mathematical impact</li>
                <li>LP injection is helpful but not dominant</li>
                <li>Price depends more on initial seed + burns</li>
                <li>Growth is "promising" but unproven at scale</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Rocket className="h-4 w-4" />
                After 25K
              </div>
              <ul className="text-sm space-y-1 ml-6 list-disc">
                <li><strong>$125K/month</strong> = 1 "initial LP" added monthly</li>
                <li><strong>$1.5M/year</strong> pure LP growth</li>
                <li>Price floor becomes <strong>mathematically inevitable</strong></li>
                <li>Competitors cannot replicate the moat</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Internal strategic planning document. Projections assume 15% MoM growth and current model parameters.</p>
        <p>Actual results depend on market conditions, user acquisition, and tokenomics finalization.</p>
      </div>
    </div>
  );
}
