import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  Shield,
  Sparkles,
  Scale,
  Layers,
  FileText,
  Hash,
  Link2,
  Fingerprint
} from 'lucide-react';
import { PatentPageNavigation } from '@/components/admin/patent/PatentPageNavigation';

interface ComparisonRow {
  feature: string;
  provisional: string | null;
  utility: string;
  status: 'new' | 'evolved' | 'unchanged';
  critical?: boolean;
}

const segiComparison: ComparisonRow[] = [
  {
    feature: 'Architecture Model',
    provisional: '2 embodiments: API-based (SEGI) or hardware (IoT fallback)',
    utility: '4-layer architecture: API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge',
    status: 'evolved',
    critical: true,
  },
  {
    feature: 'Data Sources',
    provisional: 'Solar Inverter, EV Onboard System, Battery Storage, EV Charger via manufacturer APIs',
    utility: 'Same + Wallbox EV Charger, Tesla Wall Connector home charging, SolarEdge — all via OAuth 2.0 unified auth',
    status: 'evolved',
  },
  {
    feature: 'Data Normalization',
    provisional: 'Not specified — raw kWh/miles passed directly to minting',
    utility: 'Dedicated normalization layer converting disparate metrics (kWh, miles, charge sessions) into unified impact score',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Hardware Requirement',
    provisional: 'Mentions IoT sensors/smart meters as alternative embodiment',
    utility: '100% software-based — explicitly hardware-agnostic, no custom IoT required',
    status: 'evolved',
  },
  {
    feature: 'Verification Method',
    provisional: '"SEGI calculates new activity" — no cryptographic specification',
    utility: 'SHA-256 hash chain with tamper-evident timestamps and cryptographic proofs',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Multi-Domain Applicability',
    provisional: 'Listed as possibilities: wind, fitness, education, gaming, fundraising',
    utility: 'Same — domain-agnostic claims maintained. Method applies to any verifiable real-world activity',
    status: 'unchanged',
  },
];

const mintOnProofComparison: ComparisonRow[] = [
  {
    feature: 'Token Issuance Trigger',
    provisional: '"Token Minting Step (Item 14)" — mints based on activity data at predetermined rate',
    utility: 'Mint-on-Proof™ — tokens minted ONLY at the moment of cryptographic verification, never from pre-minted pools',
    status: 'evolved',
    critical: true,
  },
  {
    feature: 'Verification Before Mint',
    provisional: 'Not specified — implied but no cryptographic requirement stated',
    utility: 'Explicit requirement: cryptographic proof must be generated and validated before any token issuance',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Minting Architecture',
    provisional: '"Smart Contract mints tokens on Blockchain Network based on activity data"',
    utility: 'Platform-sponsored (gasless) minting via smart contract bridge with real-time on-chain watermarking',
    status: 'evolved',
  },
  {
    feature: 'Pre-minted Pool',
    provisional: 'Not addressed — mentions "presale token access" suggesting pre-minting possible',
    utility: 'Explicitly prohibited — zero pre-minted reward tokens. Every token has a 1:1 provenance to verified activity',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Fee/Burn at Mint',
    provisional: '"5% fee with 90% burned"',
    utility: '20% mint burn + 7% transfer tax (3% permanent burn, 2% LP, 2% treasury)',
    status: 'evolved',
  },
];

const proofOfDeltaComparison: ComparisonRow[] = [
  {
    feature: 'Incremental Tracking',
    provisional: '"If new kWh > last kWh stored, calculate difference as new kWh to mint"',
    utility: 'Proof-of-Delta™ — SHA-256(device_id | timestamp | value | prevHash) creating linked hash chain for every reading',
    status: 'evolved',
    critical: true,
  },
  {
    feature: 'Double-Mint Prevention',
    provisional: 'Simple comparison logic (new vs. stored value) — no cryptographic binding',
    utility: 'Cumulative delta tracking with cryptographic proof chain — every increment is provably unique and sequential',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Cross-Platform Protection',
    provisional: 'Not addressed — no mechanism to prevent same device being registered on competing platforms',
    utility: 'Device-bound watermarks ensure tokens represent only incremental, never-before-tokenized energy across ALL platforms',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Historical Data Handling',
    provisional: 'Not addressed',
    utility: 'Historical estimates explicitly excluded from minting eligibility — only real-time verified deltas are mint-eligible',
    status: 'new',
  },
  {
    feature: 'Audit Trail',
    provisional: 'Activity Data Storage Unit stores data — no chain of custody',
    utility: 'Every reading produces a linked hash creating a tamper-evident, auditable provenance trail',
    status: 'new',
    critical: true,
  },
];

const proofOfOriginComparison: ComparisonRow[] = [
  {
    feature: 'Device Identity',
    provisional: 'Devices referenced by type (Item 12, 17, 18, 19) — no unique binding',
    utility: 'Deterministic device hash: keccak256(manufacturer_id | device_id) — VIN, Site ID, serial numbers',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Watermark Registry',
    provisional: 'Not present',
    utility: 'Device Watermark Registry™ — standalone smart contract mapping device hashes to cumulative tokenized amounts',
    status: 'new',
    critical: true,
  },
  {
    feature: 'On-Chain Verification',
    provisional: '"Blockchain Network" mentioned generally for token/NFT storage',
    utility: 'Hybrid model: real-time DB tracking + periodic Merkle root snapshots committed on-chain for public auditability',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Ownership Transfer',
    provisional: 'Not addressed',
    utility: 'Device watermark persists across ownership changes — prevents new owner from re-tokenizing already-credited energy',
    status: 'new',
    critical: true,
  },
  {
    feature: 'Fraud Detection',
    provisional: 'Security Encryption Layer (Item 13) — generic encryption reference',
    utility: 'publishMerkleSnapshot enables public proof that any duplicate tokenization attempt is provably fraudulent',
    status: 'new',
    critical: true,
  },
];

const statusConfig = {
  new: { label: 'NEW CLAIM', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: Sparkles },
  evolved: { label: 'EVOLVED', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: ArrowRight },
  unchanged: { label: 'UNCHANGED', color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

function ComparisonSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  description, 
  rows,
  trademark 
}: { 
  title: string; 
  icon: React.ElementType; 
  iconColor: string; 
  description: string; 
  rows: ComparisonRow[];
  trademark?: string;
}) {
  const newClaims = rows.filter(r => r.status === 'new').length;
  const evolvedClaims = rows.filter(r => r.status === 'evolved').length;
  const criticalNew = rows.filter(r => r.status === 'new' && r.critical).length;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconColor}`} />
              {title}
              {trademark && (
                <Badge variant="outline" className="text-xs font-mono">
                  {trademark}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {newClaims > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                {newClaims} new {criticalNew > 0 && `(${criticalNew} critical)`}
              </Badge>
            )}
            {evolvedClaims > 0 && (
              <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                {evolvedClaims} evolved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => {
          const config = statusConfig[row.status];
          const StatusIcon = config.icon;
          return (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`rounded-xl border p-4 space-y-3 ${
                row.critical ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {row.critical && <AlertTriangle className="h-3.5 w-3.5 text-primary" />}
                  {row.feature}
                </h4>
                <Badge className={`text-xs ${config.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {/* Provisional */}
                <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Provisional (Q1 2025)
                  </p>
                  {row.provisional ? (
                    <p className="text-sm">{row.provisional}</p>
                  ) : (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Not covered in provisional
                    </p>
                  )}
                </div>

                {/* Utility */}
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Utility Filing (2026)
                  </p>
                  <p className="text-sm">{row.utility}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AdminPatentComparison() {
  const allRows = [...segiComparison, ...mintOnProofComparison, ...proofOfDeltaComparison, ...proofOfOriginComparison];
  const totalNew = allRows.filter(r => r.status === 'new').length;
  const totalEvolved = allRows.filter(r => r.status === 'evolved').length;
  const totalCritical = allRows.filter(r => r.critical).length;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      <PatentPageNavigation />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <GitCompare className="h-3.5 w-3.5 mr-2" />
            Utility Filing Prep
          </Badge>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
            Deadline: ~April 2026
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Provisional → Utility Comparison</h1>
        <p className="text-muted-foreground">
          Side-by-side analysis of the original provisional claims vs. current system capabilities 
          to identify new and strengthened claims for the non-provisional utility filing.
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'New Claims', value: totalNew, color: 'text-emerald-500', icon: Sparkles },
          { label: 'Evolved Claims', value: totalEvolved, color: 'text-amber-500', icon: ArrowRight },
          { label: 'Critical Claims', value: totalCritical, color: 'text-primary', icon: AlertTriangle },
          { label: 'Total Features', value: allRows.length, color: 'text-muted-foreground', icon: Layers },
        ].map((stat, i) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filing Strategy Note */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">Utility Filing Strategy: Master + 3 Dependent Claims</p>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="font-medium text-primary">Master Independent</p>
                    <p className="text-xs text-muted-foreground mt-1">SEGI 4-layer architecture for converting verified real-world activity into blockchain assets</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">Dependent Claim 1</p>
                    <p className="text-xs text-muted-foreground mt-1">Mint-on-Proof™ — verification-gated token issuance</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Dependent Claim 2</p>
                    <p className="text-xs text-muted-foreground mt-1">Proof-of-Delta™ — incremental cryptographic verification</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="font-medium text-blue-600 dark:text-blue-400">Dependent Claim 3</p>
                    <p className="text-xs text-muted-foreground mt-1">Proof-of-Origin™ — device-bound watermark registry</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SEGI Architecture */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ComparisonSection
          title="SEGI Architecture"
          icon={Layers}
          iconColor="text-primary"
          description="Master independent claim — the core system architecture"
          rows={segiComparison}
        />
      </motion.div>

      {/* Mint-on-Proof */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <ComparisonSection
          title="Mint-on-Proof™"
          icon={Sparkles}
          iconColor="text-emerald-500"
          description="Dependent Claim 1 — verification-gated token issuance"
          trademark="Mint-on-Proof™"
          rows={mintOnProofComparison}
        />
      </motion.div>

      {/* Proof-of-Delta */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ComparisonSection
          title="Proof-of-Delta™"
          icon={Hash}
          iconColor="text-amber-500"
          description="Dependent Claim 2 — incremental cryptographic verification"
          trademark="Proof-of-Delta™"
          rows={proofOfDeltaComparison}
        />
      </motion.div>

      {/* Proof-of-Origin */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ComparisonSection
          title="Proof-of-Origin™ / Device Watermark Registry"
          icon={Fingerprint}
          iconColor="text-blue-500"
          description="Dependent Claim 3 — hardware-bound anti-double-mint standard"
          trademark="Proof-of-Origin™"
          rows={proofOfOriginComparison}
        />
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Utility Filing Action Items
            </CardTitle>
            <CardDescription>Key items to address with patent counsel before filing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { text: 'Draft master independent claim covering the 4-layer SEGI architecture as a unified system', priority: 'critical' },
                { text: 'Write Mint-on-Proof™ dependent claim — verification-gated, zero pre-mint, cryptographic proof required before issuance', priority: 'critical' },
                { text: 'Write Proof-of-Delta™ dependent claim — SHA-256 hash chain for incremental-only tokenization', priority: 'critical' },
                { text: 'Write Proof-of-Origin™ dependent claim — keccak256 device hashing, watermark registry, Merkle root snapshots', priority: 'critical' },
                { text: 'Update system architecture drawings (FIG 1) to reflect 4-layer model with verification engine', priority: 'high' },
                { text: 'Add new drawing: Proof-of-Delta hash chain flow diagram', priority: 'high' },
                { text: 'Add new drawing: Device Watermark Registry architecture', priority: 'high' },
                { text: 'Maintain domain-agnostic language — claims should not be limited to energy/solar', priority: 'high' },
                { text: 'Reference provisional filing date for priority — ensure continuity of original claims', priority: 'medium' },
                { text: 'Consider PCT filing for international protection (EU, UK, CA, AU)', priority: 'medium' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/60"
                >
                  <Badge className={`text-xs flex-shrink-0 mt-0.5 ${
                    item.priority === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                    item.priority === 'high' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    {item.priority}
                  </Badge>
                  <p className="text-sm">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legal Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
      >
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">Legal Review Required</p>
            <p className="text-sm text-muted-foreground">
              This comparison is for internal strategic planning. All claims language must be drafted and 
              reviewed by qualified patent counsel. The utility filing must maintain continuity with the 
              provisional application's priority date while incorporating new matter for the three dependent claims.
            </p>
          </div>
        </div>
      </motion.div>

      <PatentPageNavigation />
    </div>
  );
}
