import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  TrendingUp,
  Zap,
  Battery,
  Car,
  Sun,
  Coins,
  FileText
} from "lucide-react";

interface Competitor {
  name: string;
  website: string;
  blockchain: string;
  focus: string[];
  tokenModel: string;
  funding: string;
  stage: string;
  threatLevel: "low" | "medium" | "high";
  patentStatus: string;
  keyDifferentiator: string;
}

const competitors: Competitor[] = [
  {
    name: "EVearn (VeBetterDAO)",
    website: "https://evearn.io",
    blockchain: "VeChainThor",
    focus: ["EV Mileage"],
    tokenModel: "B3TR Pool Distribution (12-year emission)",
    funding: "VeChain Foundation Grant",
    stage: "Live Beta",
    threatLevel: "medium",
    patentStatus: "No patents found",
    keyDifferentiator: "Smartcar API for 37+ EV brands"
  },
  {
    name: "Glow Protocol",
    website: "https://glowlabs.org",
    blockchain: "Ethereum (Custom L2)",
    focus: ["Solar Farms (B2B)"],
    tokenModel: "GLW Token + GCC Carbon Credits",
    funding: "$30M+ (Framework Ventures, Union Square)",
    stage: "Mainnet",
    threatLevel: "high",
    patentStatus: "No energy-to-token patents found",
    keyDifferentiator: "B2B solar farm focus, carbon credit integration"
  },
  {
    name: "Arkreen Network",
    website: "https://arkreen.com",
    blockchain: "Polygon / Solana",
    focus: ["Solar DePIN"],
    tokenModel: "AKRE Token Mining",
    funding: "Seed Round (undisclosed)",
    stage: "Testnet/Early",
    threatLevel: "medium",
    patentStatus: "No patents found",
    keyDifferentiator: "DePIN solar mining with hardware focus"
  },
  {
    name: "C+Charge",
    website: "https://c-charge.io",
    blockchain: "BSC",
    focus: ["EV Charging"],
    tokenModel: "CCHG Token + Carbon Credits",
    funding: "$1M+ ICO",
    stage: "Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Carbon credit rewards for EV charging"
  },
  {
    name: "SolarCoin",
    website: "https://solarcoin.org",
    blockchain: "Custom PoS",
    focus: ["Solar Production"],
    tokenModel: "SLR Token (1 SLR per MWh)",
    funding: "Community/Foundation",
    stage: "Legacy (Since 2014)",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Longest-running solar crypto project"
  },
  {
    name: "DeCharge",
    website: "https://decharge.io",
    blockchain: "Peaq Network",
    focus: ["EV Charging Infrastructure"],
    tokenModel: "Hardware Node Rewards",
    funding: "Seed (undisclosed)",
    stage: "Early Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Physical charging station network"
  },
  {
    name: "PowerPod",
    website: "https://powerpod.pro",
    blockchain: "IoTeX",
    focus: ["EV Charging DePIN"],
    tokenModel: "PPD Token Mining",
    funding: "Pre-seed",
    stage: "Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Home charger sharing network"
  }
];

const getThreatBadge = (level: Competitor["threatLevel"]) => {
  switch (level) {
    case "high":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
    case "medium":
      return <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Shield className="h-3 w-3" /> Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Low</Badge>;
  }
};

const getFocusIcon = (focus: string) => {
  if (focus.toLowerCase().includes("solar")) return <Sun className="h-4 w-4 text-solar" />;
  if (focus.toLowerCase().includes("ev") || focus.toLowerCase().includes("charging")) return <Car className="h-4 w-4 text-primary" />;
  if (focus.toLowerCase().includes("battery")) return <Battery className="h-4 w-4 text-green-500" />;
  return <Zap className="h-4 w-4 text-muted-foreground" />;
};

export default function AdminCompetitiveIntel() {
  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Competitive Intelligence</h1>
        <p className="text-muted-foreground">
          Strategic analysis of energy-to-crypto competitors and ZenSolar's market positioning
        </p>
      </div>

      {/* White Paper Chapter Draft */}
      <Card className="border-solar/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-solar" />
            White Paper Chapter Draft: Market Landscape & Competitive Positioning
          </CardTitle>
          <CardDescription>Ready for inclusion in White Paper when approved</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-lg border border-solar/20 bg-solar/5">
              <p className="text-xs text-solar font-medium mb-2">📋 DRAFT — PENDING APPROVAL</p>
              <p className="text-xs text-muted-foreground">This chapter is ready for insertion into the White Paper as Chapter 5 (before Roadmap).</p>
            </div>

            <h3 className="text-foreground font-semibold text-lg">5. Market Landscape & Competitive Positioning</h3>
            
            <h4 className="text-foreground font-medium">5.1 First-Mover Advantage in Verified Energy Tokenization</h4>
            <p>
              The intersection of clean energy and blockchain technology represents one of the most compelling opportunities 
              in the emerging decentralized economy. While numerous projects have attempted to bridge these domains, the 
              market has lacked a comprehensive, consumer-accessible solution that transforms verified energy activity into 
              on-chain value without requiring specialized hardware, complex integrations, or technical expertise.
            </p>
            <p>
              <strong className="text-foreground">ZenSolar enters this market as the first platform to deliver true on-demand 
              token minting triggered by real-time, API-verified energy data across multiple verticals</strong>—Solar Production, 
              Battery Storage, Electric Vehicle Usage, and EV Charging. This first-mover position is not merely temporal; it 
              represents a fundamental architectural breakthrough that existing and emerging competitors have not replicated.
            </p>

            <h4 className="text-foreground font-medium">5.2 The SEGI Innovation: Patent-Pending Technology</h4>
            <p>
              At the core of ZenSolar's competitive moat lies the <strong className="text-foreground">Software-Enabled Gateway 
              Interface (SEGI)</strong>—a patent-pending architecture that fundamentally reimagines how energy data translates 
              to blockchain value. Unlike legacy approaches that rely on hardware installations, periodic manual reporting, or 
              distribution from pre-minted token pools, SEGI operates as a pure software layer that:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Aggregates</strong> data from existing consumer devices (Tesla, Enphase, 
                SolarEdge, Wallbox, and expandable to 37+ vehicle brands via Smartcar) without requiring proprietary hardware
              </li>
              <li>
                <strong className="text-foreground">Verifies</strong> energy production, consumption, storage, and transportation 
                metrics through authenticated API connections with millisecond-level precision
              </li>
              <li>
                <strong className="text-foreground">Computes</strong> a unified "Impact Score" that translates diverse energy 
                activities into a single, auditable reward metric
              </li>
              <li>
                <strong className="text-foreground">Mints</strong> $ZSOLAR tokens directly to user wallets on Base L2 (Ethereum) 
                in a trustless, verifiable transaction—not distributed from a pre-allocated pool, but created on-demand based 
                on proven activity
              </li>
            </ol>
            <p>
              This architecture represents a <strong className="text-foreground">paradigm shift</strong> from the "earn-from-pool" 
              models prevalent in the market to a "mint-on-proof" model where every token in circulation is backed by verified 
              clean energy impact.
            </p>

            <h4 className="text-foreground font-medium">5.3 Deflationary Economics: A First-of-Its-Kind Model</h4>
            <p>
              ZenSolar's tokenomics introduce an innovative deflationary mechanism unprecedented in the energy-to-crypto sector. 
              While competing projects typically operate on inflationary emission schedules (distributing tokens from fixed 
              supplies over multi-year periods), ZenSolar implements:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">20% Mint Burn:</strong> For every 100 tokens minted as user rewards, 
                20 tokens are simultaneously burned—creating immediate deflationary pressure at the point of creation
              </li>
              <li>
                <strong className="text-foreground">7% Transfer Tax:</strong> Secondary market transactions contribute to 
                ecosystem sustainability: 3% burned (permanent deflation), 2% to liquidity pools (market stability), and 
                2% to treasury (ongoing development)
              </li>
              <li>
                <strong className="text-foreground">No Pre-Minted Supply:</strong> Unlike projects with fixed total supplies 
                awaiting distribution, $ZSOLAR's circulating supply is determined entirely by verified user activity—ensuring 
                the token economy scales organically with real-world adoption
              </li>
            </ul>
            <p>
              This model solves the fundamental tension in reward-based tokenomics: how to incentivize participation without 
              creating unsustainable inflation. By burning tokens at both minting and transfer, ZenSolar creates a self-balancing 
              system where increased adoption actually strengthens token scarcity.
            </p>

            <h4 className="text-foreground font-medium">5.4 Unified Multi-Vertical Aggregation</h4>
            <p>
              The clean energy ecosystem is inherently fragmented—solar installations, battery systems, electric vehicles, and 
              charging infrastructure each represent distinct hardware categories, API ecosystems, and data formats. Existing 
              market participants have universally focused on single verticals: solar-only rewards, EV-mileage tracking, or 
              charging-station tokens.
            </p>
            <p>
              <strong className="text-foreground">ZenSolar is the first and only platform to unify all four energy verticals 
              into a single, cohesive rewards interface.</strong> A homeowner with rooftop solar, a Tesla Powerwall, a Model Y, 
              and a home charger earns $ZSOLAR across their entire energy footprint—not through four separate apps with four 
              different tokens, but through one dashboard with one universal reward currency.
            </p>
            <p>
              This unified approach creates powerful network effects: users who connect one device are incentivized to connect 
              additional devices, and the platform's value proposition strengthens with each integration. The "combo bonus" 
              NFT system further rewards multi-device adoption, creating a virtuous cycle of engagement.
            </p>

            <h4 className="text-foreground font-medium">5.5 Hardware Agnosticism as Strategic Moat</h4>
            <p>
              A critical differentiator in ZenSolar's architecture is its complete hardware independence. The platform requires 
              no proprietary devices, no "mining nodes," no physical installations beyond what users already own. This creates 
              three strategic advantages:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Zero Barrier to Entry:</strong> Users with existing compatible devices 
                can begin earning within 60 seconds of account creation
              </li>
              <li>
                <strong className="text-foreground">Scalable Economics:</strong> Without hardware COGS, the platform can 
                operate at software-company margins while competitors bear manufacturing, distribution, and support costs
              </li>
              <li>
                <strong className="text-foreground">Future-Proof Extensibility:</strong> As new energy devices enter the 
                market (next-generation batteries, bidirectional chargers, vehicle-to-grid systems), SEGI can integrate 
                new APIs without hardware retrofits
              </li>
            </ol>

            <h4 className="text-foreground font-medium">5.6 Intellectual Property Strategy</h4>
            <p>
              ZenSolar's first-mover advantage is reinforced by a deliberate intellectual property strategy. The patent-pending 
              SEGI architecture covers the novel combination of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>API-based energy data verification from consumer devices</li>
              <li>Real-time impact score computation across multiple energy categories</li>
              <li>On-demand token minting triggered by verified activity thresholds</li>
              <li>Deflationary burn mechanics applied at the point of minting</li>
            </ul>
            <p>
              Comprehensive patent landscape research has identified no existing claims covering this methodology. The closest 
              prior art addresses hardware-dependent systems (physical solar installations generating RECs) rather than 
              software-only gateway interfaces. This IP position creates a defensive moat that compounds over time as the 
              patent application progresses.
            </p>

            <h4 className="text-foreground font-medium">5.7 Competitive Positioning Summary</h4>
            <p>
              ZenSolar occupies a unique position in the market: the only platform combining verified on-demand minting, 
              deflationary tokenomics, multi-vertical aggregation, and hardware agnosticism into a consumer-accessible 
              application. This is not an incremental improvement over existing solutions—it represents a <strong className="text-foreground">
              category-defining innovation</strong> that establishes new standards for how clean energy participation 
              translates to blockchain value.
            </p>
            <p>
              As the clean energy transition accelerates and consumer adoption of solar, storage, and EVs continues its 
              exponential growth, ZenSolar is positioned to become the default rewards layer for the entire ecosystem—not 
              by competing on any single vertical, but by unifying them all under a technologically superior, economically 
              sustainable, and legally defensible platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
          <CardDescription>Market landscape and competitive positioning analysis</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The energy-to-blockchain rewards sector is nascent but rapidly evolving, with several projects attempting to bridge clean energy 
              production and consumption with cryptocurrency incentives. Our comprehensive analysis of the competitive landscape reveals that 
              while multiple players exist, <strong className="text-foreground">ZenSolar's SEGI (Software-Enabled Gateway Interface) architecture 
              maintains a unique and defensible position</strong> in the market.
            </p>
            
            <h3 className="text-foreground font-semibold mt-6">Key Market Observations</h3>
            <p>
              The primary competitor identified is <strong className="text-foreground">Glow Protocol</strong>, which has secured significant 
              institutional backing ($30M+ from Framework Ventures and Union Square). However, Glow's focus remains exclusively on B2B solar 
              farm deployments and carbon credit generation—a fundamentally different market segment than ZenSolar's consumer-facing, 
              multi-vertical approach. Their reliance on physical hardware installations and enterprise partnerships creates barriers that 
              ZenSolar's software-only integration model deliberately avoids.
            </p>
            
            <p>
              <strong className="text-foreground">EVearn</strong> represents the closest conceptual competitor in the EV rewards space. 
              Operating on VeChainThor and leveraging the Smartcar API for multi-brand vehicle support, EVearn validates the market demand 
              for driving-to-earn rewards. However, their tokenomics rely on a 12-year inflationary emission schedule distributing tokens 
              from a pre-minted B3TR pool—a fundamentally different economic model than ZenSolar's deflationary on-demand minting with 
              20% burn mechanics.
            </p>
            
            <h3 className="text-foreground font-semibold mt-6">ZenSolar's Competitive Moat</h3>
            <p>
              Our patent research across USPTO databases for EVearn, VeChain, Glow, and related entities found <strong className="text-foreground">
              no existing patents for API-based, on-demand energy-to-token minting</strong>. The closest prior art identified was SafeMoon's 
              2023 patent application (US 2023/0385824) for off-grid solar-to-REC NFT generation, which differs substantially from SEGI's 
              software-only gateway approach.
            </p>
            
            <p>
              ZenSolar differentiates through four key vectors:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Multi-Vertical Integration:</strong> While competitors focus on single verticals (EVearn on 
                driving, Glow on solar farms), SEGI aggregates Solar, Battery, EV, and Charging data into a unified impact score.
              </li>
              <li>
                <strong className="text-foreground">Deflationary Tokenomics:</strong> The 20% mint-burn mechanism and 7% transfer tax (3% burn, 
                2% LP, 2% treasury) create sustainable deflationary pressure versus competitors' inflationary emission models.
              </li>
              <li>
                <strong className="text-foreground">Hardware Agnosticism:</strong> SEGI's API-first architecture supports Tesla, Enphase, 
                SolarEdge, Wallbox, and can integrate Smartcar for expanded EV coverage—without requiring proprietary hardware.
              </li>
              <li>
                <strong className="text-foreground">Consumer-First UX:</strong> 60-second setup via existing device APIs versus competitors 
                requiring hardware purchases or enterprise integrations.
              </li>
            </ol>
            
            <h3 className="text-foreground font-semibold mt-6">Strategic Recommendations</h3>
            <p>
              The competitive analysis suggests ZenSolar should prioritize: (1) accelerating the patent application for SEGI's on-demand 
              minting methodology, (2) integrating Smartcar API to achieve feature parity with EVearn on EV brand coverage, and (3) 
              emphasizing the deflationary tokenomics as a key differentiator in investor communications. The "unified impact scoring" 
              across energy categories remains our strongest moat against single-vertical competitors.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ZenSolar Positioning */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            ZenSolar (SEGI) — Our Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Blockchain</p>
              <p className="font-medium">Base L2 (Ethereum)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Coverage</p>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-solar" />
                <Battery className="h-4 w-4 text-green-500" />
                <Car className="h-4 w-4 text-primary" />
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">4 Verticals</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Token Model</p>
              <p className="font-medium">On-Demand Mint + 20% Burn + 7% Tax</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Patent Status</p>
              <Badge className="bg-solar/20 text-solar border-solar/30">Pending Application</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Table */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Comparison Matrix</CardTitle>
          <CardDescription>Detailed breakdown of identified competitors in the energy-to-crypto space</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Blockchain</TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead>Token Model</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Threat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.name}>
                    <TableCell>
                      <div className="space-y-1">
                        <a 
                          href={competitor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary flex items-center gap-1"
                        >
                          {competitor.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">{competitor.keyDifferentiator}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{competitor.blockchain}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {competitor.focus.map((f) => (
                          <Badge key={f} variant="outline" className="gap-1 text-xs">
                            {getFocusIcon(f)}
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-48">{competitor.tokenModel}</TableCell>
                    <TableCell className="text-sm">{competitor.funding}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{competitor.stage}</Badge>
                    </TableCell>
                    <TableCell>{getThreatBadge(competitor.threatLevel)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patent Landscape */}
      <Card>
        <CardHeader>
          <CardTitle>Patent Landscape Analysis</CardTitle>
          <CardDescription>USPTO search results for energy-to-blockchain patent claims</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2">Searches Conducted</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "EVearn" / "EVearn.io" — No results</li>
                  <li>• "VeChain" + "energy rewards" — No relevant patents</li>
                  <li>• "Glow Protocol" / "Glow Labs" — No patents</li>
                  <li>• "energy token minting" — General blockchain patents only</li>
                  <li>• "solar cryptocurrency" — SolarCoin references (no patents)</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2">Closest Prior Art Identified</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>US 2023/0385824 (SafeMoon)</strong></p>
                  <p>Off-grid solar panel to REC-backed NFT generation</p>
                  <p className="text-xs italic">
                    Distinction: Hardware-dependent, REC-focused. Does not cover API-based 
                    verification or on-demand token minting from existing devices.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-600">SEGI Patent Opportunity</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No existing patents found for: "API-based energy data verification triggering on-demand token minting 
                    across multiple device categories (solar, battery, EV, charging) via a unified software gateway."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last research update: January 2025 • Sources: USPTO, Crunchbase, Project Websites, VeChain Foundation
      </p>
    </div>
  );
}
