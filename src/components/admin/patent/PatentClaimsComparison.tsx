import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Plus,
  FileText,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface ClaimComparison {
  claim: string;
  inProvisional: boolean;
  provisionalLanguage: string;
  nonProvisionalLanguage: string;
  strengthLevel: 'core' | 'enhanced' | 'new';
  defensiveScope: string;
}

const claimsComparison: ClaimComparison[] = [
  {
    claim: 'SEGI Architecture',
    inProvisional: true,
    provisionalLanguage: 'Software-Enabled Gateway Interface (SEGI) that pulls data from APIs',
    nonProvisionalLanguage: 'A four-layer software architecture comprising: (1) API aggregation layer with OAuth 2.0 authentication to plurality of third-party data sources; (2) data normalization layer converting heterogeneous metrics to unified impact score; (3) verification engine generating cryptographic proofs; (4) smart contract bridge for blockchain token issuance',
    strengthLevel: 'enhanced',
    defensiveScope: 'ANY software-to-blockchain bridge using layered verification',
  },
  {
    claim: 'Mint-on-Proof Token Issuance',
    inProvisional: true,
    provisionalLanguage: 'Token Minting Step where Blockchain Smart Contract mints $ZSOLAR tokens based on activity data',
    nonProvisionalLanguage: 'A method for issuing blockchain tokens comprising: receiving verified activity data from external source; validating authenticity through cryptographic signature verification; calculating token quantity based on activity metrics; minting tokens atomically upon successful verification—wherein no tokens exist prior to verification event',
    strengthLevel: 'enhanced',
    defensiveScope: 'ANY token issuance system that mints on-demand vs pre-minted pools',
  },
  {
    claim: 'Proof-of-Delta Verification',
    inProvisional: false,
    provisionalLanguage: 'if new kWh produced > last kWh stored, calculate the difference as new kWh to mint',
    nonProvisionalLanguage: 'A method for preventing double-tokenization comprising: maintaining device-bound watermark representing cumulative tokenized activity; computing delta between current activity reading and stored watermark; issuing tokens exclusively for positive delta value; atomically updating watermark upon successful token issuance',
    strengthLevel: 'new',
    defensiveScope: 'ANY delta-calculation system preventing retroactive or duplicate claims',
  },
  {
    claim: 'Device Fingerprinting',
    inProvisional: false,
    provisionalLanguage: 'Not explicitly claimed (device_id mentioned in context)',
    nonProvisionalLanguage: 'A system for device-bound activity tracking comprising: generating unique cryptographic hash from provider identifier and device identifier; associating said hash with physical device regardless of user account ownership; persisting activity watermark against device hash rather than user account',
    strengthLevel: 'new',
    defensiveScope: 'ANY device-bound (vs user-bound) tracking for tokenization',
  },
  {
    claim: 'Impact Score Normalization',
    inProvisional: false,
    provisionalLanguage: 'Not claimed (kWh, miles used separately)',
    nonProvisionalLanguage: 'A method for unified activity quantification comprising: receiving heterogeneous activity metrics from plurality of sources; applying domain-specific conversion factors; outputting normalized impact score enabling consistent token issuance across disparate activity types',
    strengthLevel: 'new',
    defensiveScope: 'ANY multi-source activity normalization for unified rewards',
  },
  {
    claim: 'Milestone NFT Issuance',
    inProvisional: true,
    provisionalLanguage: 'Milestone Tracking Algorithm monitors thresholds; Smart Contract mints NFTs at predefined thresholds (e.g., 1,000 kWh)',
    nonProvisionalLanguage: 'A system for achievement-based non-fungible token issuance comprising: monitoring cumulative verified activity against configurable threshold values; triggering NFT minting transaction upon threshold crossing; encoding achievement metadata including activity type, threshold value, and verification timestamp within NFT',
    strengthLevel: 'enhanced',
    defensiveScope: 'ANY milestone-based NFT rewards tied to verified activity',
  },
  {
    claim: 'Hardware-Agnostic Data Collection',
    inProvisional: true,
    provisionalLanguage: 'SEGI that pulls data from APIs, or alternatively through hardware devices',
    nonProvisionalLanguage: 'A method for activity verification independent of proprietary hardware comprising: establishing authenticated connections to plurality of third-party API endpoints; retrieving activity data without requiring installation of additional measurement devices; validating data authenticity through provider-signed responses',
    strengthLevel: 'enhanced',
    defensiveScope: 'ANY software-only verification bypassing hardware requirements',
  },
];

// Critical: Domain-agnostic applications to claim
const domainAgnosticApplications = [
  {
    domain: 'Clean Energy',
    examples: 'Solar production (kWh), EV miles driven, battery discharge, EV charging',
    currentlyBuilt: true,
  },
  {
    domain: 'Fitness & Wellness',
    examples: 'Steps walked, calories burned, workout completion, sleep quality scores',
    currentlyBuilt: false,
  },
  {
    domain: 'Education',
    examples: 'Courses completed, quiz scores, study time, certifications earned',
    currentlyBuilt: false,
  },
  {
    domain: 'Gaming',
    examples: 'Achievements unlocked, levels completed, playtime, in-game milestones',
    currentlyBuilt: false,
  },
  {
    domain: 'Environmental Monitoring',
    examples: 'Carbon offset, recycling metrics, water conservation, emissions reduction',
    currentlyBuilt: false,
  },
  {
    domain: 'Charitable Activities',
    examples: 'Volunteer hours, donations made, community service events, blood donations',
    currentlyBuilt: false,
  },
  {
    domain: 'Transportation',
    examples: 'Public transit usage, carpooling miles, bike commute distance, flight offsets',
    currentlyBuilt: false,
  },
  {
    domain: 'Professional Development',
    examples: 'Training hours, skill certifications, mentorship sessions, conference attendance',
    currentlyBuilt: false,
  },
];

export function PatentClaimsComparison() {
  return (
    <div className="space-y-6">
      {/* Claims Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Provisional vs Non-Provisional Claims
          </CardTitle>
          <CardDescription>
            Side-by-side comparison of claim language and defensive scope
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {claimsComparison.map((item, index) => (
            <motion.div
              key={item.claim}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{item.claim}</h4>
                  {item.inProvisional ? (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      In Provisional
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <Plus className="h-3 w-3 mr-1" />
                      NEW
                    </Badge>
                  )}
                </div>
                <Badge className={`text-xs ${
                  item.strengthLevel === 'core' 
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    : item.strengthLevel === 'enhanced'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}>
                  {item.strengthLevel === 'core' ? 'Core Claim' : 
                   item.strengthLevel === 'enhanced' ? 'Enhanced' : 'New Claim'}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background border border-border/60">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Provisional Language</p>
                  <p className="text-sm">{item.provisionalLanguage}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">Non-Provisional (Recommended)</p>
                  <p className="text-sm">{item.nonProvisionalLanguage}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Shield className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Defensive Scope</p>
                  <p className="text-sm text-muted-foreground">{item.defensiveScope}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Domain-Agnostic Applications */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            CRITICAL: Domain-Agnostic Claim Scope
          </CardTitle>
          <CardDescription>
            The provisional explicitly states the invention "can be used in various fields beyond sustainability incentives." 
            Non-provisional claims should protect ALL verifiable activity types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>Strategic Insight:</strong> By claiming the <em>process</em> of verification-before-minting (Mint-on-Proof) 
              and delta-calculation (Proof-of-Delta) as domain-agnostic methods, you protect against competitors in 
              <strong> any industry</strong>—not just clean energy. EVearn, fitness apps, gaming platforms, 
              and future competitors would all fall within scope.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {domainAgnosticApplications.map((app, index) => (
              <motion.div
                key={app.domain}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`p-3 rounded-lg border ${
                  app.currentlyBuilt 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-muted/30 border-border/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{app.domain}</p>
                  {app.currentlyBuilt && (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Built
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{app.examples}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Recommended Claim Language:</strong> "A method for tokenizing verified real-world activity, 
              wherein said activity comprises one or more of: energy production, transportation metrics, 
              physical exercise, educational achievement, gaming progress, environmental action, 
              charitable contribution, or any measurable activity verifiable through third-party API or sensor data."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
