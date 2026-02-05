import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Brain, Target, Users, Coins, 
  TrendingUp, Shield, CheckCircle2, Sparkles,
  DollarSign, Zap, Award, Rocket, BarChart3,
  MessageSquare, Mic, HelpCircle, UserPlus, Gift,
  Bot, Megaphone, FileText, AlertTriangle, Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";
import { ExportButtons } from "@/components/admin/ExportButtons";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// User-Facing Agents
const userFacingAgents = [
  {
    title: "Energy Coach",
    icon: Zap,
    purpose: "Personalized tips to maximize solar production, optimal EV charging times, battery usage patterns",
    value: "Increases engagement + makes rewards more valuable",
    priority: "high",
    complexity: "medium"
  },
  {
    title: "Onboarding Concierge",
    icon: UserPlus,
    purpose: "Walk users through device OAuth, wallet creation, first mint",
    value: "Reduces drop-off, improves conversion",
    priority: "high",
    complexity: "medium"
  },
  {
    title: "Achievement Hunter",
    icon: Award,
    purpose: "\"You're 50 kWh from your next NFT!\" — proactive milestone nudges",
    value: "Gamification + daily engagement",
    priority: "medium",
    complexity: "low"
  },
  {
    title: "Token Advisor",
    icon: Coins,
    purpose: "Explain tokenomics, flywheel, best times to hold vs. redeem",
    value: "Builds trust, reduces support tickets",
    priority: "medium",
    complexity: "low"
  },
  {
    title: "Voice Agent (ElevenLabs)",
    icon: Mic,
    purpose: "Hands-free support while driving EV — \"Hey ZenSolar, how many tokens did I earn today?\"",
    value: "Differentiation, accessibility",
    priority: "high",
    complexity: "high"
  },
];

// Support Agents
const supportAgents = [
  {
    title: "Device Troubleshooter",
    icon: HelpCircle,
    purpose: "Diagnose Tesla/Enphase/SolarEdge connection issues",
    value: "Reduces churn from integration frustration",
    priority: "high",
    complexity: "medium"
  },
  {
    title: "24/7 Support Bot",
    icon: MessageSquare,
    purpose: "Answer FAQs, handle tier-1 support",
    value: "Scale support as a solo founder",
    priority: "high",
    complexity: "low"
  },
];

// Growth Agents
const growthAgents = [
  {
    title: "Website Conversion Agent",
    icon: Target,
    purpose: "Chat widget that explains value prop, handles objections, captures leads",
    value: "Higher conversion from visitors",
    priority: "high",
    complexity: "medium"
  },
  {
    title: "Referral Optimizer",
    icon: Gift,
    purpose: "Suggest optimal referral messaging based on user's social connections",
    value: "Viral growth acceleration",
    priority: "medium",
    complexity: "medium"
  },
  {
    title: "Community Manager",
    icon: Users,
    purpose: "Discord/Telegram bot for community engagement, announcements",
    value: "Build community without 24/7 availability",
    priority: "medium",
    complexity: "medium"
  },
];

// Founder/Admin Agents
const founderAgents = [
  {
    title: "Investor Relations Assistant",
    icon: Rocket,
    purpose: "Draft investor updates, answer LP questions, prepare pitch materials",
    value: "Time savings during fundraise",
    priority: "medium",
    complexity: "low"
  },
  {
    title: "Content Creator",
    icon: FileText,
    purpose: "Generate social posts, blog content about clean energy + crypto",
    value: "Marketing velocity",
    priority: "low",
    complexity: "low"
  },
  {
    title: "Analytics Narrator",
    icon: BarChart3,
    purpose: "\"Your DAU is up 15% this week, driven by new Tesla connections\"",
    value: "Faster decision-making",
    priority: "low",
    complexity: "medium"
  },
];

// Token Price Optimization Agents
const tokenPriceAgents = [
  {
    title: "Market Sentiment Analyzer",
    icon: Brain,
    purpose: "Monitor social media, news, and on-chain data for sentiment shifts affecting clean energy/crypto markets",
    value: "Early warning system for market movements",
    priority: "medium",
    complexity: "high",
    legalRisk: "low"
  },
  {
    title: "LP Health Monitor",
    icon: Shield,
    purpose: "Real-time alerts when LP depth drops below thresholds, whale activity detection, slippage warnings",
    value: "Protect token price stability",
    priority: "high",
    complexity: "medium",
    legalRisk: "low"
  },
  {
    title: "Buyback Timing Optimizer",
    icon: TrendingUp,
    purpose: "Analyze market conditions to execute treasury buybacks at optimal prices (TWAP/VWAP strategies)",
    value: "Maximize treasury buyback efficiency",
    priority: "high",
    complexity: "high",
    legalRisk: "medium"
  },
  {
    title: "Whale Wallet Tracker",
    icon: Target,
    purpose: "Monitor large holder movements, predict potential sell pressure, alert on unusual activity",
    value: "Anticipate and prepare for large sells",
    priority: "medium",
    complexity: "medium",
    legalRisk: "low"
  },
  {
    title: "Arbitrage Detector",
    icon: Sparkles,
    purpose: "Identify price discrepancies across DEXs/CEXs, alert for potential arbitrage opportunities",
    value: "Maintain price consistency across venues",
    priority: "low",
    complexity: "high",
    legalRisk: "medium"
  },
];

// Legal considerations for token price agents
const legalConsiderations = [
  {
    title: "What's ALLOWED",
    icon: CheckCircle2,
    color: "text-green-500",
    items: [
      "Monitoring and analytics (sentiment, whale tracking, LP health)",
      "Treasury buybacks using pre-announced, transparent strategies",
      "Automated market making with disclosed parameters",
      "TWAP/VWAP execution to minimize market impact",
    ]
  },
  {
    title: "What's RISKY",
    icon: AlertTriangle,
    color: "text-amber-500",
    items: [
      "Any form of price manipulation or artificial inflation",
      "Wash trading or fake volume generation",
      "Front-running user trades",
      "Undisclosed market-making activities",
      "Coordinated buying to pump price",
    ]
  },
];

export default function AdminAIAgentOpportunities() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "high": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "medium": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "low": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const renderAgentCard = (agent: any, showLegalRisk = false) => (
    <motion.div
      key={agent.title}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <agent.icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold">{agent.title}</h4>
            <Badge variant="outline" className={getPriorityColor(agent.priority)}>
              {agent.priority} priority
            </Badge>
            <Badge variant="outline" className={getComplexityColor(agent.complexity)}>
              {agent.complexity} complexity
            </Badge>
            {showLegalRisk && agent.legalRisk && (
              <Badge variant="outline" className={agent.legalRisk === "low" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}>
                {agent.legalRisk} legal risk
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{agent.purpose}</p>
          <p className="text-xs font-medium text-primary">💡 {agent.value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">AI Agent Opportunities</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Strategic AI agents to accelerate ZenSolar growth and operations
            </p>
          </div>
          <ExportButtons 
            pageTitle="AI Agent Strategy" 
            getData={() => [
              ...userFacingAgents.map(a => ({ category: "User-Facing", ...a })),
              ...supportAgents.map(a => ({ category: "Support", ...a })),
              ...growthAgents.map(a => ({ category: "Growth", ...a })),
              ...founderAgents.map(a => ({ category: "Founder", ...a })),
              ...tokenPriceAgents.map(a => ({ category: "Token Price", ...a })),
            ]}
          />
        </div>

        <div id="ai-agents-content" className="space-y-6">
          {/* Quick Wins Section */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                🎯 Highest-Impact Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-solar" />
                    <span className="font-semibold">Energy Coach + Achievement Hunter</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Directly increases user engagement and LTV</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-5 w-5 text-solar" />
                    <span className="font-semibold">Onboarding Concierge</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Reduces #1 friction point (device connection)</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-5 w-5 text-solar" />
                    <span className="font-semibold">Voice Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Major differentiator, aligns with EV lifestyle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User-Facing Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User-Facing Agents
              </CardTitle>
              <CardDescription>
                AI agents that directly interact with and help users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userFacingAgents.map(agent => renderAgentCard(agent))}
            </CardContent>
          </Card>

          {/* Support Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Support Agents
              </CardTitle>
              <CardDescription>
                AI agents that handle customer support and troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportAgents.map(agent => renderAgentCard(agent))}
            </CardContent>
          </Card>

          {/* Growth Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Agents
              </CardTitle>
              <CardDescription>
                AI agents focused on user acquisition and community building
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {growthAgents.map(agent => renderAgentCard(agent))}
            </CardContent>
          </Card>

          {/* Founder/Admin Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Founder/Admin Agents
              </CardTitle>
              <CardDescription>
                AI agents that help with internal operations and fundraising
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {founderAgents.map(agent => renderAgentCard(agent))}
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Token Price Optimization Section */}
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                Token Price Optimization Agents
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                  Requires Legal Review
                </Badge>
              </CardTitle>
              <CardDescription>
                AI agents to monitor and optimize token price health — with important legal considerations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Legal Considerations */}
              <div className="grid gap-4 md:grid-cols-2">
                {legalConsiderations.map((consideration) => (
                  <div key={consideration.title} className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <consideration.icon className={`h-5 w-5 ${consideration.color}`} />
                      <h4 className="font-semibold">{consideration.title}</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {consideration.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-xs mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Token Price Agents List */}
              <div className="space-y-3">
                {tokenPriceAgents.map(agent => renderAgentCard(agent, true))}
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Recommended Approach</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with <strong>LP Health Monitor</strong> and <strong>Whale Wallet Tracker</strong> — these are purely observational 
                      and have zero legal risk. Use insights to inform manual treasury decisions. Only consider automated 
                      buyback strategies after consulting with a securities lawyer familiar with token regulations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Priority Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Implementation Priority Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Phase</th>
                      <th className="text-left py-2 px-3">Agents</th>
                      <th className="text-left py-2 px-3">Timeline</th>
                      <th className="text-left py-2 px-3">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-3 font-medium">Phase 1</td>
                      <td className="py-3 px-3">24/7 Support Bot, Energy Coach, Onboarding Concierge</td>
                      <td className="py-3 px-3">Q1 2026</td>
                      <td className="py-3 px-3">
                        <Badge className="bg-green-500/10 text-green-500">High ROI</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-3 font-medium">Phase 2</td>
                      <td className="py-3 px-3">Website Conversion Agent, Device Troubleshooter, LP Health Monitor</td>
                      <td className="py-3 px-3">Q2 2026</td>
                      <td className="py-3 px-3">
                        <Badge className="bg-blue-500/10 text-blue-500">Growth</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-3 font-medium">Phase 3</td>
                      <td className="py-3 px-3">Voice Agent (ElevenLabs), Community Manager, Whale Tracker</td>
                      <td className="py-3 px-3">Q3 2026</td>
                      <td className="py-3 px-3">
                        <Badge className="bg-purple-500/10 text-purple-500">Differentiation</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-medium">Phase 4</td>
                      <td className="py-3 px-3">Buyback Optimizer, Sentiment Analyzer, Analytics Narrator</td>
                      <td className="py-3 px-3">Q4 2026+</td>
                      <td className="py-3 px-3">
                        <Badge className="bg-amber-500/10 text-amber-500">Advanced</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
