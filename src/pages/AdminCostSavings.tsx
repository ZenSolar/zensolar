import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Users, Clock, DollarSign, TrendingDown, Zap, 
  Bot, Code2, Layers, Shield, Smartphone, Database,
  BarChart3, Rocket, CheckCircle2, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { Progress } from "@/components/ui/progress";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// Traditional team breakdown
const TRADITIONAL_TEAM = [
  { role: "Senior Full-Stack Engineer", count: 2, monthlyRate: 15000, icon: Code2 },
  { role: "Blockchain / Web3 Engineer", count: 1, monthlyRate: 18000, icon: Layers },
  { role: "UI/UX Designer", count: 1, monthlyRate: 12000, icon: Smartphone },
  { role: "DevOps / Infrastructure", count: 0.5, monthlyRate: 14000, icon: Database },
  { role: "Product Manager", count: 0.5, monthlyRate: 13000, icon: BarChart3 },
];

// Development area breakdown
const DEV_AREAS = [
  { area: "Frontend (60+ pages, components, animations)", traditionalHours: 2000, color: "hsl(var(--primary))" },
  { area: "Backend (31 edge functions, DB, auth, RLS)", traditionalHours: 1200, color: "hsl(var(--accent))" },
  { area: "Web3 (smart contracts, wallet, minting)", traditionalHours: 800, color: "hsl(210 80% 55%)" },
  { area: "Energy Provider Integrations (4 OAuth)", traditionalHours: 600, color: "hsl(140 60% 45%)" },
  { area: "Mobile / PWA (Capacitor, push)", traditionalHours: 400, color: "hsl(280 60% 55%)" },
  { area: "Design & UX", traditionalHours: 500, color: "hsl(30 80% 55%)" },
  { area: "Admin Tools & Dashboards (30+ pages)", traditionalHours: 500, color: "hsl(350 70% 55%)" },
  { area: "Testing, Debugging, DevOps", traditionalHours: 500, color: "hsl(200 50% 50%)" },
];

const TOTAL_HOURS = DEV_AREAS.reduce((sum, d) => sum + d.traditionalHours, 0);
const TRADITIONAL_TIMELINE_MONTHS = 8;
const TRADITIONAL_COST_LOW = 800000;
const TRADITIONAL_COST_HIGH = 1300000;
const AI_ASSISTED_COST = 50000; // Rough estimate of tools + founder time opportunity cost
const SAVINGS_PERCENTAGE = Math.round((1 - AI_ASSISTED_COST / TRADITIONAL_COST_LOW) * 100);

// What was built
const SCOPE_METRICS = [
  { label: "Routes / Pages", value: "60+" },
  { label: "Edge Functions", value: "31" },
  { label: "Database Tables", value: "20+" },
  { label: "Custom Hooks", value: "25+" },
  { label: "React Components", value: "100+" },
  { label: "Smart Contracts", value: "3" },
  { label: "Energy Providers", value: "4" },
  { label: "OAuth Integrations", value: "4" },
];

const AI_TOOLS = [
  { name: "Lovable", role: "Primary development platform (Claude-powered)", impact: "10x velocity" },
  { name: "Grok (xAI)", role: "Strategy, tokenomics modeling, architecture", impact: "Strategic depth" },
  { name: "Claude 3.5 Sonnet", role: "Code reviews, architecture decisions", impact: "Code quality" },
];

const getData = () => {
  const rows: Array<{ section: string; metric: string; value: string }> = [];
  rows.push({ section: "Summary", metric: "Traditional Cost (Low)", value: `$${TRADITIONAL_COST_LOW.toLocaleString()}` });
  rows.push({ section: "Summary", metric: "Traditional Cost (High)", value: `$${TRADITIONAL_COST_HIGH.toLocaleString()}` });
  rows.push({ section: "Summary", metric: "AI-Assisted Cost", value: `$${AI_ASSISTED_COST.toLocaleString()}` });
  rows.push({ section: "Summary", metric: "Savings", value: `${SAVINGS_PERCENTAGE}%` });
  rows.push({ section: "Summary", metric: "Traditional Hours", value: `${TOTAL_HOURS.toLocaleString()}` });
  rows.push({ section: "Summary", metric: "Traditional Timeline", value: `${TRADITIONAL_TIMELINE_MONTHS} months` });
  rows.push({ section: "Summary", metric: "Traditional Team Size", value: "5 people" });

  TRADITIONAL_TEAM.forEach(t => {
    rows.push({ section: "Team Breakdown", metric: `${t.role} (x${t.count})`, value: `$${(t.monthlyRate * t.count).toLocaleString()}/mo` });
  });

  DEV_AREAS.forEach(d => {
    rows.push({ section: "Development Areas", metric: d.area, value: `${d.traditionalHours.toLocaleString()} hours` });
  });

  SCOPE_METRICS.forEach(s => {
    rows.push({ section: "Scope Built", metric: s.label, value: s.value });
  });

  return rows;
};

export default function AdminCostSavings() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();

  if (authLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const totalMonthlyTeamCost = TRADITIONAL_TEAM.reduce((sum, t) => sum + (t.monthlyRate * t.count), 0);
  const totalTeamCost = totalMonthlyTeamCost * TRADITIONAL_TIMELINE_MONTHS;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">AI-Assisted Development Savings</h1>
          <p className="text-muted-foreground">
            Capital efficiency analysis — Solo founder + AI vs. traditional team
          </p>
        </div>
        <ExportButtons 
          pageTitle="ZenSolar Cost Savings Analysis" 
          getData={getData}
          getFileName={() => `zensolar-cost-savings-${new Date().toISOString().split('T')[0]}`}
        />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ZenSolar — AI Development Cost Savings</h1>
        <p className="text-sm text-muted-foreground">Capital Efficiency Analysis</p>
      </div>

      {/* Hero Savings Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeIn}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Traditional Development
              </CardDescription>
              <CardTitle className="text-3xl text-destructive">
                ${TRADITIONAL_COST_LOW.toLocaleString()} – ${(TRADITIONAL_COST_HIGH / 1000).toLocaleString()}K
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">5-person team × {TRADITIONAL_TIMELINE_MONTHS} months</p>
              <p className="text-sm text-muted-foreground">{TOTAL_HOURS.toLocaleString()} engineering hours</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Bot className="h-4 w-4" />
                AI-Assisted (Actual)
              </CardDescription>
              <CardTitle className="text-3xl text-accent-foreground">
                ~${AI_ASSISTED_COST.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">1 founder + AI tools</p>
              <p className="text-sm text-muted-foreground">~8 months, thousands of hours</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" />
                Capital Saved
              </CardDescription>
              <CardTitle className="text-3xl text-primary">
                {SAVINGS_PERCENTAGE}%+ Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">$750K–$1.25M preserved</p>
              <p className="text-sm text-muted-foreground">Available for LP seed & growth</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Investor Takeaway */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Rocket className="h-6 w-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Investor Takeaway</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ZenSolar demonstrates exceptional capital efficiency. A solo founder leveraging AI-assisted development 
                  has built a production-ready platform that would traditionally require a 5-person team and $800K–$1.3M 
                  in engineering costs. This means seed capital goes directly toward user acquisition, liquidity pool seeding, 
                  and market expansion — not rebuilding what already exists. The founder's ability to ship at team-scale velocity 
                  with AI is a structural advantage that compounds post-funding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Was Built */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Scope Delivered
            </CardTitle>
            <CardDescription>Production-ready features built by a solo founder with AI tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SCOPE_METRICS.map((metric) => (
                <div key={metric.label} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{metric.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Traditional Team Breakdown */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-destructive" />
              Traditional Team Required
            </CardTitle>
            <CardDescription>
              Estimated team composition to build equivalent scope in {TRADITIONAL_TIMELINE_MONTHS} months
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TRADITIONAL_TEAM.map((member) => {
              const totalCost = member.monthlyRate * member.count * TRADITIONAL_TIMELINE_MONTHS;
              const percentage = (totalCost / totalTeamCost) * 100;
              return (
                <div key={member.role} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <member.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{member.role}</span>
                      <Badge variant="outline" className="text-xs">×{member.count}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">
                        ${(member.monthlyRate * member.count).toLocaleString()}/mo
                      </span>
                      <span className="font-semibold w-20 text-right">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
            <Separator className="my-4" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total ({TRADITIONAL_TIMELINE_MONTHS} months)</span>
              <span className="text-destructive text-lg">${totalTeamCost.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              * At market-rate salaries for Austin, TX. Does not include benefits, office space, equipment, or recruiting costs, 
              which would add 20-30% overhead.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hours Breakdown */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Engineering Hours by Area
            </CardTitle>
            <CardDescription>
              Estimated {TOTAL_HOURS.toLocaleString()} man-hours at $150–$200/hr consulting rates = $975K–$1.3M
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEV_AREAS.map((area) => {
              const percentage = (area.traditionalHours / TOTAL_HOURS) * 100;
              return (
                <div key={area.area} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{area.area}</span>
                    <span className="font-medium">{area.traditionalHours.toLocaleString()} hrs</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: area.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Stack */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Development Stack
            </CardTitle>
            <CardDescription>The tools that enabled solo-founder, team-scale velocity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AI_TOOLS.map((tool) => (
                <div key={tool.name} className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{tool.name}</h4>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{tool.impact}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Capital Allocation Argument */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Where Saved Capital Goes
            </CardTitle>
            <CardDescription>
              Every dollar NOT spent on rebuilding existing tech goes toward growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  title: "Liquidity Pool Seeding", 
                  description: "Initial LP capital to establish $0.10 price floor. More liquidity = stronger floor = more user confidence.",
                  icon: Layers,
                  priority: "Critical"
                },
                { 
                  title: "User Acquisition", 
                  description: "Marketing, partnerships with solar installers, EV dealership integrations, influencer campaigns.",
                  icon: Users,
                  priority: "High"
                },
                { 
                  title: "Security Audits", 
                  description: "Smart contract audits (CertiK, Trail of Bits), penetration testing, SOC 2 compliance preparation.",
                  icon: Shield,
                  priority: "High"
                },
                { 
                  title: "Native App Distribution", 
                  description: "iOS App Store and Google Play distribution via Capacitor. Broader reach beyond PWA.",
                  icon: Smartphone,
                  priority: "Medium"
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                  <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <Badge variant="outline" className="text-xs">{item.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Line */}
      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">The Bottom Line</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                <div className="text-center p-3">
                  <div className="text-2xl font-bold text-destructive">5 people</div>
                  <div className="text-muted-foreground">Traditional team</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                <div className="text-center p-3">
                  <div className="text-2xl font-bold text-primary">1 founder</div>
                  <div className="text-muted-foreground">AI-assisted</div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                ZenSolar proves that AI-assisted development isn't just faster — it's a fundamentally different 
                capital model. The product is built. The beta users are real. The blockchain transactions are on-chain. 
                Seed capital funds <em>growth</em>, not <em>construction</em>.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
        ZenSolar — AI Development Cost Savings — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
