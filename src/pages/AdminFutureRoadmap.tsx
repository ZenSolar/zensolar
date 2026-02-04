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
  Map,
  Lock,
  Fingerprint,
  AlertTriangle
} from "lucide-react";

// Token Integrity & Proof-of-Delta Implementation Roadmap
const proofOfDeltaImplementation = {
  phase1: {
    title: "Database Foundation",
    status: "Deferred until post-beta",
    tasks: [
      {
        title: "Create device_tokenization_registry table",
        description: "Global registry keyed by (provider, device_id) storing watermarks that persist across account deletions",
        schema: `device_id, provider, device_type, watermark_odometer_miles, watermark_solar_kwh, watermark_battery_kwh, watermark_charging_kwh, first_tokenized_at, last_tokenized_at, total_tokens_issued`,
        priority: "Critical"
      },
      {
        title: "Create device_claim_history table",
        description: "Audit trail of all device claims: who claimed, when, tokens issued during claim period, release reason",
        schema: `device_registry_id, user_id, wallet_address, claimed_at, released_at, release_reason, baseline_at_claim, tokens_issued_in_period`,
        priority: "Critical"
      },
      {
        title: "Revoke user access to registry",
        description: "REVOKE ALL on device_tokenization_registry from anon/authenticated. Only service_role (Edge Functions) can access",
        priority: "Critical"
      }
    ]
  },
  phase2: {
    title: "Claim Flow Integration",
    status: "Deferred until post-beta",
    tasks: [
      {
        title: "Modify device claim flow",
        description: "On new device connection: check if watermark exists → if yes, set baseline = MAX(current_api_value, watermark) → if no, create watermark record",
        priority: "Critical"
      },
      {
        title: "Handle ownership transfers",
        description: "When device is sold (new VIN owner), watermark persists. New owner can only earn tokens for activity AFTER the watermark",
        priority: "High"
      },
      {
        title: "Add claim history logging",
        description: "Every claim/release event logged with snapshot of baseline values at that moment",
        priority: "Medium"
      }
    ]
  },
  phase3: {
    title: "Minting Integration",
    status: "Deferred until post-beta",
    tasks: [
      {
        title: "Atomic watermark updates",
        description: "After successful on-chain mint, update watermark using GREATEST(current_watermark, new_value). Watermarks can only increase.",
        priority: "Critical"
      },
      {
        title: "Mint audit logging",
        description: "Log every mint to device_claim_history with tx_hash, tokens issued, delta values",
        priority: "High"
      },
      {
        title: "Failed mint rollback",
        description: "If on-chain mint fails, watermark must NOT be updated. Atomic transaction handling.",
        priority: "Critical"
      }
    ]
  },
  phase4: {
    title: "Account Deletion Hardening",
    status: "Deferred until post-beta",
    tasks: [
      {
        title: "Preserve watermarks on account deletion",
        description: "When user deletes account: release device claims, log release_reason='account_deleted', but NEVER delete watermark records",
        priority: "Critical"
      },
      {
        title: "Re-claim detection",
        description: "If same device_id is claimed again (same or different user), baseline is forced to MAX of API value and watermark",
        priority: "Critical"
      }
    ]
  },
  phase5: {
    title: "On-Chain Auditability",
    status: "Future Enhancement",
    tasks: [
      {
        title: "Merkle root checkpoints",
        description: "Periodically commit Merkle root of all watermarks to Base L2 smart contract for public verifiability",
        priority: "Medium"
      },
      {
        title: "Proof generation",
        description: "Users can generate Merkle proofs showing their device's tokenization history is consistent with on-chain root",
        priority: "Low"
      }
    ]
  }
};

// Summary features for the card display
const tokenIntegrityFeatures = [
  {
    icon: Fingerprint,
    title: "Device Watermark Registry",
    description: "Permanent, user-independent tracking of the highest tokenized values for each physical device. Survives account deletion.",
    priority: "Critical",
    status: "Deferred"
  },
  {
    icon: Lock,
    title: "Immutable Audit Trail",
    description: "Full history of device ownership, claims, and token issuance. Every token traceable to specific API data.",
    priority: "Critical",
    status: "Deferred"
  },
  {
    icon: AlertTriangle,
    title: "Anti-Gaming Protection",
    description: "Watermarks only increase, never decrease. Prevents delete-and-recreate attacks for double-issuance.",
    priority: "Critical",
    status: "Deferred"
  },
  {
    icon: Shield,
    title: "Backend-Only Registry",
    description: "Tokenization registry inaccessible to users. Only Edge Functions can read/write to prevent manipulation.",
    priority: "High",
    status: "Deferred"
  },
];

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
      { title: "Token Integrity Architecture", description: "Device watermark registry preventing double-issuance across account lifecycles", completed: false },
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

      {/* Token Integrity & Proof-of-Delta - Detailed Implementation */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
              Token Integrity & Proof-of-Delta Implementation
            </CardTitle>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">Deferred Until Post-Beta</Badge>
          </div>
          <CardDescription>
            Ensuring 1:1 token-to-energy integrity—every $ZSOLAR tied to specific API data, preventing double-issuance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Features */}
          <div className="grid md:grid-cols-2 gap-4">
            {tokenIntegrityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-amber-500/20">
                <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
                  <feature.icon className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{feature.title}</p>
                    <Badge variant={feature.priority === 'Critical' ? 'destructive' : 'secondary'} className="text-xs">
                      {feature.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Detailed Implementation Phases */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Implementation Phases (When Ready)</h4>
            
            {Object.entries(proofOfDeltaImplementation).map(([key, phase]) => (
              <div key={key} className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">{phase.title}</h5>
                  <Badge variant="outline" className="text-xs">{phase.status}</Badge>
                </div>
                <div className="space-y-2">
                  {phase.tasks.map((task, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-amber-500/30 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge variant={task.priority === 'Critical' ? 'destructive' : task.priority === 'High' ? 'default' : 'secondary'} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      {task.schema && (
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block overflow-x-auto">
                          {task.schema}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-amber-600 dark:text-amber-400">Architecture Doc:</strong>{" "}
              Full technical specification available in <code className="bg-muted px-1 rounded">docs/TOKEN_INTEGRITY_ARCHITECTURE.md</code>
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Beta Mode:</strong> During beta, baselines are stored per-user in <code className="bg-background px-1 rounded">connected_devices.baseline_data</code>. 
              This allows flexible testing but doesn't prevent re-minting after account deletion. 
              The Device Watermark Registry will replace this with permanent, device-level tracking.
            </p>
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
