import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Rocket, 
  CreditCard, 
  Globe, 
  Building2, 
  Zap, 
  Users, 
  TrendingUp,
  Shield,
  Smartphone,
  Car,
  Home,
  Leaf,
  Award,
  DollarSign,
  Map
} from "lucide-react";

const roadmapPhases = [
  {
    year: "Year 1-2",
    phase: "Foundation & Traction",
    status: "current",
    icon: Rocket,
    milestones: [
      { title: "Embedded Wallet Launch", description: "Zero-friction onboarding with Coinbase Smart Wallet—users never see a seed phrase", completed: true },
      { title: "In-App Cash Out", description: "Direct $ZSOLAR → USD conversion to bank accounts via embedded widget", completed: true },
      { title: "Multi-OEM Integration", description: "Tesla, Enphase, SolarEdge, Wallbox APIs fully integrated", completed: true },
      { title: "25K Subscriber Tipping Point", description: "Self-sustaining liquidity pool from 50% subscription injection", completed: false },
      { title: "App Store Launch", description: "iOS and Android native apps with push notifications", completed: false },
    ]
  },
  {
    year: "Year 3-4",
    phase: "Scale & Monetization",
    status: "upcoming",
    icon: TrendingUp,
    milestones: [
      { title: "$ZSOLAR Debit Card", description: "Spend tokens anywhere VISA is accepted—automatic conversion at point of sale", completed: false },
      { title: "Auto-Pilot Rewards", description: "Fully automated sync, mint, and compound—users set it and forget it", completed: false },
      { title: "Utility Bill Integration", description: "Pay electric bills directly with $ZSOLAR tokens", completed: false },
      { title: "100K Active Users", description: "Critical mass for B2B data partnerships and premium features", completed: false },
      { title: "Premium Analytics Tier", description: "Advanced insights, forecasting, and optimization recommendations", completed: false },
    ]
  },
  {
    year: "Year 5-6",
    phase: "Ecosystem Expansion",
    status: "future",
    icon: Globe,
    milestones: [
      { title: "International Launch", description: "Expand to EU, UK, Australia, and Canada with localized energy APIs", completed: false },
      { title: "Smart Home Integration", description: "Google Home, Alexa, Apple HomeKit for voice-activated rewards tracking", completed: false },
      { title: "EV Fleet Management", description: "Commercial fleet operators earn rewards across entire vehicle fleets", completed: false },
      { title: "Carbon Credit Marketplace", description: "Trade verified carbon offsets generated from user energy data", completed: false },
      { title: "Affiliate Marketplace", description: "Curated clean energy products with $ZSOLAR payment options", completed: false },
    ]
  },
  {
    year: "Year 7-8",
    phase: "Enterprise & B2B",
    status: "future",
    icon: Building2,
    milestones: [
      { title: "White-Label Platform", description: "License Mint-on-Proof™ engine to utilities and energy companies", completed: false },
      { title: "Corporate Sustainability Programs", description: "Employee clean energy reward programs for Fortune 500 companies", completed: false },
      { title: "Real Estate Integration", description: "Property developers pre-install ZenSolar for new construction", completed: false },
      { title: "Insurance Partnerships", description: "Lower premiums for homes with verified solar/battery systems", completed: false },
      { title: "Grid Demand Response", description: "Coordinated load balancing rewards during peak demand events", completed: false },
    ]
  },
  {
    year: "Year 9-10",
    phase: "Market Leadership",
    status: "future",
    icon: Award,
    milestones: [
      { title: "1M+ Active Users", description: "Dominant clean energy rewards platform in North America", completed: false },
      { title: "Public Token Listing", description: "$ZSOLAR on major exchanges (Coinbase, Kraken) pending regulatory clarity", completed: false },
      { title: "Decentralized Governance", description: "Community-driven protocol upgrades via token voting", completed: false },
      { title: "Energy Trading Layer", description: "Peer-to-peer energy credit trading between users", completed: false },
      { title: "Climate Impact Dashboard", description: "Real-time global carbon offset visualization from all users", completed: false },
    ]
  },
];

const visionFeatures = [
  {
    icon: CreditCard,
    title: "$ZSOLAR Debit Card",
    description: "Spend your clean energy rewards anywhere VISA is accepted. Automatic $ZSOLAR → USD conversion at point of sale with no manual steps.",
    timeline: "Year 3-4"
  },
  {
    icon: Zap,
    title: "Auto-Pilot Mode",
    description: "Set it and forget it. Automatic device syncing, reward calculation, and compounding. Users check in weekly to see their growing balance.",
    timeline: "Year 3-4"
  },
  {
    icon: Home,
    title: "Utility Bill Pay",
    description: "Pay your electric bill directly with $ZSOLAR tokens. Close the loop—earn from clean energy, spend on energy costs.",
    timeline: "Year 3-4"
  },
  {
    icon: Smartphone,
    title: "Smart Home Voice Control",
    description: "'Hey Google, how much did I earn today?' Native integrations with Alexa, Google Home, and Apple HomeKit.",
    timeline: "Year 5-6"
  },
  {
    icon: Car,
    title: "Fleet Management",
    description: "Commercial EV fleet operators earn rewards across hundreds of vehicles. Enterprise dashboard with driver leaderboards.",
    timeline: "Year 5-6"
  },
  {
    icon: Leaf,
    title: "Carbon Credit Trading",
    description: "Convert verified energy production into tradeable carbon credits. Secondary market for corporate sustainability buyers.",
    timeline: "Year 5-6"
  },
];

export default function AdminFutureRoadmap() {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">10-Year Future Roadmap</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          The vision for ZenSolar as the dominant clean energy rewards platform
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">The 10-Year Vision</h3>
              <p className="text-muted-foreground">
                By 2035, ZenSolar becomes the <strong>default rewards layer for clean energy</strong>—every 
                solar panel, battery, and EV automatically earns tokens. Users don't think about blockchain; 
                they just see their balance grow and spend it like any other money. We've replaced 
                government incentives with a self-sustaining economic engine that makes clean energy 
                ownership the obvious financial choice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Development Phases
        </h2>
        
        <div className="space-y-6">
          {roadmapPhases.map((phase, index) => (
            <Card key={phase.year} className={phase.status === 'current' ? 'border-primary/50 bg-primary/5' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${phase.status === 'current' ? 'bg-primary/20' : 'bg-muted'}`}>
                      <phase.icon className={`h-5 w-5 ${phase.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{phase.year}: {phase.phase}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={phase.status === 'current' ? 'default' : 'secondary'}>
                    {phase.status === 'current' ? 'In Progress' : 'Planned'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {phase.milestones.map((milestone, mIndex) => (
                    <div key={mIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${milestone.completed ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <div>
                        <p className={`font-medium ${milestone.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Key Vision Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Zap className="h-6 w-6 text-secondary" />
          Flagship Features (Years 3-6)
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visionFeatures.map((feature, index) => (
            <Card key={index} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">{feature.timeline}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Market Opportunity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            10-Year Market Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">1M+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-secondary">$50M+</p>
              <p className="text-sm text-muted-foreground">Annual Revenue</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">10GW+</p>
              <p className="text-sm text-muted-foreground">Energy Tracked</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-secondary">5M+</p>
              <p className="text-sm text-muted-foreground">Tons CO₂ Offset</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Protection Note */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">Intellectual Property Protection</p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Mint-on-Proof™</strong> and <strong>SEGI (Software-Enabled Gateway Interface)</strong> are 
                trademark pending. The underlying verification architecture is documented for provisional patent filing. 
                All roadmap features leverage this protected core IP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
