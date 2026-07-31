import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Scale,
  Globe
} from 'lucide-react';

interface IndependentClaim {
  id: string;
  title: string;
  type: 'method' | 'system' | 'apparatus';
  priority: 'critical' | 'high' | 'medium';
  defensiveValue: string;
  blocksCompetitors: string[];
  claimLanguage: string;
}

const independentClaims: IndependentClaim[] = [
  {
    id: 'IC-1',
    title: 'Mint-on-Proof Method',
    type: 'method',
    priority: 'critical',
    defensiveValue: 'Blocks ANY token system that mints on verification vs pre-minted pools',
    blocksCompetitors: ['EVearn.io', 'Glow', 'Any future activity-to-token platform'],
    claimLanguage: `A computer-implemented method for issuing blockchain tokens based on verified real-world activity, the method comprising:
a) receiving, by a processor, activity data from one or more third-party data sources via authenticated API connections;
b) validating authenticity of said activity data through verification of cryptographic signatures provided by said third-party data sources;
c) calculating a token quantity based on said validated activity data using predetermined conversion parameters;
d) transmitting a minting instruction to a blockchain smart contract, said instruction comprising the calculated token quantity and a recipient wallet address;
e) wherein tokens are created atomically upon execution of said minting instruction, and wherein no tokens representing said activity exist prior to completion of step (d).`,
  },
  {
    id: 'IC-2',
    title: 'Proof-of-Delta Verification System',
    type: 'system',
    priority: 'critical',
    defensiveValue: 'Blocks ANY delta-calculation system preventing double-tokenization',
    blocksCompetitors: ['Any platform tracking cumulative activity', 'Carbon credit systems', 'Loyalty programs'],
    claimLanguage: `A system for preventing duplicate tokenization of real-world activity, the system comprising:
a) a device fingerprint generator configured to create a unique cryptographic identifier from a combination of data provider identifier and physical device identifier;
b) a watermark registry storing, for each device fingerprint, a cumulative value representing previously tokenized activity;
c) a delta calculator configured to compute the difference between a current activity reading and the stored watermark value for the corresponding device fingerprint;
d) a token issuance module configured to issue tokens exclusively for positive delta values;
e) a watermark updater configured to atomically update the stored watermark value upon successful token issuance;
f) wherein said watermark is associated with the physical device rather than a user account, persisting across ownership transfers.`,
  },
  {
    id: 'IC-3',
    title: 'Hardware-Agnostic Activity Verification',
    type: 'method',
    priority: 'high',
    defensiveValue: 'Blocks competitors requiring custom IoT hardware',
    blocksCompetitors: ['Helium-style hardware networks', 'Custom IoT mining devices', 'REC hardware meters'],
    claimLanguage: `A method for verifying real-world activity without proprietary measurement hardware, the method comprising:
a) establishing authenticated connections to a plurality of third-party API endpoints operated by device manufacturers;
b) retrieving activity data through said API endpoints, wherein said data is cryptographically signed by the respective device manufacturers;
c) validating the authenticity and temporal properties of said signed data;
d) converting said validated data to blockchain-compatible proof records;
e) wherein no additional measurement devices beyond those provided by the original device manufacturers are required for verification.`,
  },
  {
    id: 'IC-4',
    title: 'Multi-Source Impact Normalization',
    type: 'method',
    priority: 'high',
    defensiveValue: 'Blocks competitors aggregating multiple activity types',
    blocksCompetitors: ['Multi-vertical platforms', 'Unified rewards systems', 'Cross-domain tokenization'],
    claimLanguage: `A method for unified quantification of heterogeneous real-world activities, the method comprising:
a) receiving activity metrics from a plurality of data sources, wherein said metrics are measured in disparate units;
b) applying source-specific conversion factors to each received metric;
c) computing a normalized impact score representing environmental or social value;
d) using said normalized impact score as basis for consistent token issuance across all activity types;
e) wherein said conversion factors are configurable to accommodate additional activity types without modification to core system logic.`,
  },
  {
    id: 'IC-5',
    title: 'Milestone-Based NFT Achievement System',
    type: 'system',
    priority: 'medium',
    defensiveValue: 'Blocks gamified NFT rewards tied to verified activity',
    blocksCompetitors: ['Achievement-based crypto rewards', 'Verified badge systems', 'Milestone collectibles'],
    claimLanguage: `A system for issuing achievement-based non-fungible tokens, the system comprising:
a) a cumulative activity tracker monitoring verified activity against configurable threshold values;
b) a threshold detector configured to identify when cumulative activity crosses a predefined milestone;
c) an NFT minting module configured to create a non-fungible token upon milestone crossing;
d) an NFT metadata encoder configured to embed within said token: activity type, threshold value, verification timestamp, and cryptographic proof of underlying activity;
e) wherein each milestone for each device fingerprint may only trigger NFT minting once.`,
  },
];

const defensiveStrategies = [
  {
    strategy: 'Claim Domain-Agnostic Methods',
    icon: Globe,
    description: 'The provisional mentions fitness, gaming, education, and fundraising. Non-provisional should explicitly claim these as embodiments.',
    action: 'Add dependent claims for each vertical: fitness tracking, educational achievements, gaming progress, charitable contributions.',
  },
  {
    strategy: 'Method + System + Apparatus Claims',
    icon: Target,
    description: 'File overlapping claim types. Method claims protect the process; system claims protect the architecture; apparatus claims protect specific components.',
    action: 'For each independent claim, add corresponding system and apparatus claims covering the same functionality.',
  },
  {
    strategy: 'Continuation-in-Part Strategy',
    icon: Zap,
    description: 'If major new features (e.g., new data sources, AI verification) are added post-filing, file CIP to capture new matter.',
    action: 'Monitor development roadmap; file CIP for significant technical additions not covered by original provisional.',
  },
  {
    strategy: 'International Filing (PCT)',
    icon: Globe,
    description: 'File PCT application to preserve rights in key markets: EU, UK, Canada, Australia, Japan.',
    action: 'File PCT within 12 months of provisional. National phase entry in strategic markets by 30 months.',
  },
];

export function NonProvisionalRecommendations() {
  return (
    <div className="space-y-6">
      {/* Independent Claims */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Recommended Independent Claims
          </CardTitle>
          <CardDescription>
            Core claims that should form the foundation of the non-provisional application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {independentClaims.map((claim, index) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-4 rounded-xl bg-background border border-border/60 space-y-3"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">{claim.id}</Badge>
                  <h4 className="font-semibold">{claim.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{claim.type}</Badge>
                  <Badge className={`text-xs ${
                    claim.priority === 'critical' 
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      : claim.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  }`}>
                    {claim.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Defensive Value</p>
                <p className="text-sm">{claim.defensiveValue}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Blocks Competitors:</p>
                <div className="flex flex-wrap gap-1">
                  {claim.blocksCompetitors.map(comp => (
                    <Badge key={comp} variant="outline" className="text-xs">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-primary flex items-center gap-2">
                  <span>View Recommended Claim Language</span>
                  <span className="text-xs text-muted-foreground">(click to expand)</span>
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border/60">
                  <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{claim.claimLanguage}</pre>
                </div>
              </details>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Defensive Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            Defensive Filing Strategies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {defensiveStrategies.map((item, index) => (
            <motion.div
              key={item.strategy}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
              className="p-4 rounded-lg bg-muted/30 border border-border/60"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <item.icon className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{item.strategy}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary">{item.action}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Critical Warning */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-amber-600 dark:text-amber-400">Urgent: Domain-Agnostic Scope</p>
            <p className="text-sm text-muted-foreground">
              Your provisional explicitly states the invention "can be used in various fields beyond sustainability incentives" 
              including fitness, education, gaming, and fundraising. <strong>This is your biggest defensive asset.</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              The non-provisional MUST claim the <em>generic method</em> of verification-before-minting for <em>any</em> verifiable 
              activity type—not just clean energy. This blocks EVearn.io (EV rewards), future fitness tokenization apps, 
              gaming achievement systems, and any "Mint-on-Proof" competitor in any industry.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Reminder */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">Legal Review Required</p>
            <p className="text-sm text-muted-foreground">
              These claim recommendations are for internal strategic planning. Final claim language must be drafted and 
              reviewed by qualified patent counsel who can assess patentability, prior art, and claim scope under 35 U.S.C. §§ 101, 102, 103.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
