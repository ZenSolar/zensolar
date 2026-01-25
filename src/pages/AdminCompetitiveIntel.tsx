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
  Coins
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
