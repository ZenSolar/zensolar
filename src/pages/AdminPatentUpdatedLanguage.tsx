import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Scale,
  Tag
} from 'lucide-react';
import { PatentClaimsComparison } from '@/components/admin/patent/PatentClaimsComparison';
import { SEGIArchitectureDiagram } from '@/components/admin/patent/SEGIArchitectureDiagram';
import { NonProvisionalRecommendations } from '@/components/admin/patent/NonProvisionalRecommendations';
import { PatentPageNavigation } from '@/components/admin/patent/PatentPageNavigation';

// Terms that have evolved since the original provisional filing
const updatedTerminology = [
  {
    original: 'Software-Enabled Gateway Interface (SEGI)',
    updated: 'SEGI™ (Software-Enabled Gateway Interface)',
    status: 'trademark-pending',
    notes: 'Trademark filing recommended. Core branding element.',
    inOriginal: true,
  },
  {
    original: 'Token Minting Step',
    updated: 'Mint-on-Proof™',
    status: 'trademark-pending',
    notes: 'New term emphasizing verification-before-minting. Key differentiator.',
    inOriginal: false,
  },
  {
    original: 'Milestone Tracking Algorithm / "if kWh produced ≥ 1,000"',
    updated: 'Proof-of-Delta™',
    status: 'trademark-pending',
    notes: 'New term for device watermark + delta calculation. Patent-eligible as process.',
    inOriginal: false,
  },
  {
    original: 'Activity Data Storage Unit',
    updated: 'Device Watermark Registry',
    status: 'updated-language',
    notes: 'More precise description of cumulative tracking functionality.',
    inOriginal: true,
  },
  {
    original: 'Real-Time Data Collection Step',
    updated: 'API Aggregation Layer',
    status: 'updated-language',
    notes: 'Emphasizes OAuth 2.0 integration with manufacturer clouds.',
    inOriginal: true,
  },
  {
    original: 'Security Encryption Layer',
    updated: 'Verification Engine',
    status: 'updated-language',
    notes: 'Expanded to include cryptographic proof generation and tamper-evident timestamps.',
    inOriginal: true,
  },
];

const newConcepts = [
  {
    term: 'Impact Score',
    definition: 'Normalized metric converting diverse energy measurements (kWh, miles, CO₂ offset) into a unified value for consistent token issuance.',
    patentable: true,
    reason: 'Novel standardization method across energy types.',
  },
  {
    term: 'Device Fingerprint',
    definition: 'Cryptographic hash (keccak256) of provider + device_id, creating a unique identifier that follows the physical device regardless of user account changes.',
    patentable: true,
    reason: 'Device-bound (not user-bound) tracking is novel.',
  },
  {
    term: 'Delta-Only Minting',
    definition: 'Calculation method where only the incremental difference between current readings and last watermark is eligible for minting.',
    patentable: true,
    reason: 'Prevents retroactive claims; ensures tokens represent only new activity.',
  },
  {
    term: 'High-Water Mark',
    definition: 'The cumulative amount of energy that has already been converted to tokens for a specific device.',
    patentable: false,
    reason: 'Supporting concept for Proof-of-Delta; not independently patentable.',
  },
  {
    term: 'SEGI Verification Engine (Layer 3)',
    definition: 'The third layer of SEGI architecture that generates cryptographic proofs and creates tamper-evident timestamps.',
    patentable: true,
    reason: 'Novel verification layer bridging energy data to blockchain.',
  },
];

const trademarkVsPatent = [
  {
    type: 'Trademark (™)',
    protects: 'Brand names, logos, slogans',
    examples: ['Mint-on-Proof™', 'Proof-of-Delta™', 'SEGI™', 'ZenSolar™'],
    process: 'USPTO trademark application; use ™ immediately, ® after registration.',
    cost: '$250-$350 per class',
    duration: '10 years, renewable indefinitely',
  },
  {
    type: 'Patent',
    protects: 'Processes, methods, systems, compositions',
    examples: ['SEGI architecture', 'Mint-on-Proof token issuance process', 'Device watermark verification system'],
    process: 'Provisional → Non-provisional → Examination → Grant',
    cost: '$10,000-$20,000 total',
    duration: '20 years from filing, non-renewable',
  },
];

const ipRecommendations = [
  {
    action: 'File Trademark Applications',
    items: ['Mint-on-Proof™', 'Proof-of-Delta™', 'SEGI™'],
    priority: 'High',
    timeline: 'Immediately',
    notes: 'Can be filed independently of patent. Protects brand regardless of patent outcome.',
  },
  {
    action: 'Update Non-Provisional Claims',
    items: ['Add Proof-of-Delta as independent claim', 'Add device fingerprint/watermark language', 'Strengthen SEGI verification engine claims'],
    priority: 'High',
    timeline: 'Before Q1 2026 filing deadline',
    notes: 'Include all evolved terminology and new concepts not in provisional.',
  },
  {
    action: 'Continuation Applications',
    items: ['File continuation-in-part if major new features added', 'Consider divisional if examiner requires claim restriction'],
    priority: 'Medium',
    timeline: 'During prosecution',
    notes: 'Allows capturing improvements made after provisional filing.',
  },
];

export default function AdminPatentUpdatedLanguage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Navigation */}
      <PatentPageNavigation />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Updated Language
          </Badge>
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            For Non-Provisional
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Updated Patent Language</h1>
        <p className="text-muted-foreground">
          Terminology and concepts that have evolved since the original provisional filing and should be included in the non-provisional application.
        </p>
      </motion.div>

      {/* SEGI Architecture Diagram (Downloadable) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <SEGIArchitectureDiagram />
      </motion.div>

      {/* Claims Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PatentClaimsComparison />
      </motion.div>

      {/* Non-Provisional Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <NonProvisionalRecommendations />
      </motion.div>

      {/* Trademark vs Patent Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/5 to-violet-500/5 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              Trademark vs Patent: Key Differences
            </CardTitle>
            <CardDescription>
              Understanding how to protect different aspects of your IP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {trademarkVsPatent.map((item, index) => (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.1 }}
                  className="p-4 rounded-xl bg-background border border-border/60 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    {item.type.includes('Trademark') ? (
                      <Tag className="h-5 w-5 text-violet-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500" />
                    )}
                    <h4 className="font-semibold">{item.type}</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-muted-foreground">Protects:</strong> {item.protects}</p>
                    <p><strong className="text-muted-foreground">Examples:</strong> {item.examples.join(', ')}</p>
                    <p><strong className="text-muted-foreground">Cost:</strong> {item.cost}</p>
                    <p><strong className="text-muted-foreground">Duration:</strong> {item.duration}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><strong>Proof-of-Delta:</strong> The <em>name</em> "Proof-of-Delta" can be trademarked. The <em>process</em> (device watermarking + delta calculation) can be patented. These are separate filings that protect different things.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Updated Terminology */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Evolved Terminology
            </CardTitle>
            <CardDescription>
              Terms from the original provisional that have been refined or renamed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {updatedTerminology.map((item, index) => (
              <motion.div
                key={item.updated}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/60"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm text-muted-foreground line-through">{item.original}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{item.updated}</span>
                  {item.status === 'trademark-pending' && (
                    <Badge variant="outline" className="text-xs border-violet-500/40 text-violet-600 dark:text-violet-400">
                      <Tag className="h-3 w-3 mr-1" />
                      TM Recommended
                    </Badge>
                  )}
                  {!item.inOriginal && (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New Term
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* New Concepts Not in Original */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              New Concepts for Non-Provisional
            </CardTitle>
            <CardDescription>
              Terms and concepts developed after the provisional filing that should be added.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {newConcepts.map((item, index) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + index * 0.05 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/60"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold">{item.term}</h4>
                  {item.patentable ? (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Patentable
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Supporting
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{item.definition}</p>
                <p className="text-xs text-muted-foreground italic">
                  <strong>Note:</strong> {item.reason}
                </p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* IP Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              IP Strategy Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ipRecommendations.map((rec, index) => (
              <motion.div
                key={rec.action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + index * 0.08 }}
                className="p-4 rounded-xl bg-background border border-border/60"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold">{rec.action}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{rec.timeline}</Badge>
                    <Badge className={`text-xs ${
                      rec.priority === 'High' 
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' 
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}>
                      {rec.priority} Priority
                    </Badge>
                  </div>
                </div>
                <ul className="space-y-1 mb-2">
                  {rec.items.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground italic">{rec.notes}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legal Notice */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
      >
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">Legal Review Required</p>
            <p className="text-sm text-muted-foreground">
              This documentation is for internal planning purposes. All trademark and patent applications should be 
              prepared by qualified IP counsel. The determinations of patentability and trademark registrability 
              are ultimately made by the USPTO examiner.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <PatentPageNavigation />
    </div>
  );
}
