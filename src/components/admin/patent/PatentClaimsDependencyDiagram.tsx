import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Shield, 
  Zap, 
  Fingerprint, 
  ArrowDown,
  FileText,
  Sparkles
} from 'lucide-react';

interface ClaimNode {
  id: string;
  label: string;
  trademark?: string;
  type: 'independent' | 'dependent';
  description: string;
  claimNumbers: string;
  icon: React.ElementType;
  color: string;
}

const independentClaim: ClaimNode = {
  id: 'master',
  label: 'Master System & Method',
  type: 'independent',
  description: 'System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology',
  claimNumbers: 'Independent Claim 1',
  icon: FileText,
  color: 'primary',
};

const dependentClaims: ClaimNode[] = [
  {
    id: 'mint-on-proof',
    label: 'Token Issuance Method',
    trademark: 'Mint-on-Proof™',
    type: 'dependent',
    description: 'Tokens minted only upon cryptographic verification of real-world activity — no pre-minted pools.',
    claimNumbers: 'Dependent Claims 2–5',
    icon: Sparkles,
    color: 'emerald',
  },
  {
    id: 'proof-of-delta',
    label: 'Incremental Verification Method',
    trademark: 'Proof-of-Delta™',
    type: 'dependent',
    description: 'Delta calculation using device-bound watermarks to ensure tokens represent only new, never-before-tokenized activity.',
    claimNumbers: 'Dependent Claims 6–9',
    icon: Zap,
    color: 'amber',
  },
  {
    id: 'proof-of-origin',
    label: 'Device-Bound Anti-Fraud System',
    trademark: 'Proof-of-Origin™',
    type: 'dependent',
    description: 'Cryptographic device fingerprinting with on-chain watermark registry preventing cross-platform double-minting.',
    claimNumbers: 'Dependent Claims 10–13',
    icon: Fingerprint,
    color: 'violet',
  },
];

const subClaims: Record<string, string[]> = {
  'mint-on-proof': [
    'API aggregation layer with OAuth 2.0 authentication',
    'Data normalization to unified impact score',
    'Cryptographic proof generation with tamper-evident timestamps',
    'Atomic token minting upon verification event',
  ],
  'proof-of-delta': [
    'Cumulative watermark per physical device',
    'Delta computation (current reading − stored watermark)',
    'Tokens issued exclusively for positive delta',
    'Atomic watermark update upon successful mint',
  ],
  'proof-of-origin': [
    'Deterministic hash: keccak256(manufacturer_id | device_id)',
    'Device-bound (not user-bound) tracking',
    'Monotonically increasing watermarks',
    'Public Merkle snapshot for cross-platform auditability',
  ],
};

const colorMap: Record<string, { bg: string; border: string; text: string; badgeBg: string }> = {
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    badgeBg: 'bg-primary/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-500/20',
  },
};

export function PatentClaimsDependencyDiagram() {
  const masterColors = colorMap[independentClaim.color];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Patent Claims Dependency Structure
        </CardTitle>
        <CardDescription>
          One patent, many claims. All three IP pillars are dependent claims under the master invention.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Independent Claim (Master) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl border-2 ${masterColors.border} ${masterColors.bg} text-center space-y-2`}
        >
          <Badge className={`${masterColors.badgeBg} ${masterColors.text} border-0`}>
            {independentClaim.claimNumbers}
          </Badge>
          <div className="flex items-center justify-center gap-2">
            <independentClaim.icon className={`h-5 w-5 ${masterColors.text}`} />
            <h3 className="text-lg font-bold">{independentClaim.label}</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto italic">
            "{independentClaim.description}"
          </p>
          <p className="text-xs text-muted-foreground">
            Covers the overall SEGI architecture + blockchain bridge as a unified invention
          </p>
        </motion.div>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-0.5 h-4 bg-border" />
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Dependent Claims</p>
          </div>
        </div>

        {/* Dependent Claims (IP Trilogy) */}
        <div className="grid md:grid-cols-3 gap-4">
          {dependentClaims.map((claim, index) => {
            const colors = colorMap[claim.color];
            const subs = subClaims[claim.id];
            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} space-y-3`}
              >
                <div className="space-y-2">
                  <Badge className={`${colors.badgeBg} ${colors.text} border-0 text-xs`}>
                    {claim.claimNumbers}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <claim.icon className={`h-4 w-4 ${colors.text}`} />
                    <h4 className="font-semibold text-sm">{claim.trademark}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{claim.description}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Sub-claims:</p>
                  {subs.map((sub, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.text.includes('emerald') ? 'bg-emerald-500' : colors.text.includes('amber') ? 'bg-amber-500' : 'bg-violet-500'} flex-shrink-0 mt-1.5`} />
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trademark vs Patent clarification */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Patent (1 filing)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Protects the <strong>methods</strong> — how the system works. All three pillars live as claims within a single patent application.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-purple-500" />
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Trademarks (3 filings)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Protects the <strong>names</strong> — Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™. Each requires a separate USPTO trademark application.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
