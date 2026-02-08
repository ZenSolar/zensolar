import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Scale, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Sparkles,
  Download,
  FileImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PatentPageNavigation } from '@/components/admin/patent/PatentPageNavigation';
import { PatentClaimsDependencyDiagram } from '@/components/admin/patent/PatentClaimsDependencyDiagram';

const patentTimeline = [
  {
    date: 'Q1 2025',
    title: 'Provisional Patent Application Filed',
    description: 'USPTO provisional patent filed covering SEGI, Mint-on-Proof™, and Token/NFT minting system.',
    status: 'complete',
  },
  {
    date: 'Q1 2026',
    title: 'Non-Provisional Filing',
    description: 'Convert to non-provisional within 12-month window with full claims and updated language.',
    status: 'pending',
  },
  {
    date: 'Q2 2026',
    title: 'PCT International Application',
    description: 'File PCT for international protection in key markets (EU, UK, CA, AU).',
    status: 'future',
  },
  {
    date: 'Q4 2027+',
    title: 'Patent Examination',
    description: 'Respond to office actions and negotiate claims with USPTO examiner.',
    status: 'future',
  },
];

// Original document links
const originalDocuments = [
  {
    title: 'Provisional Patent Application',
    filename: 'ZenSolar_Provisional_Patent_Application.doc',
    path: '/documents/ZenSolar_Provisional_Patent_Application.doc',
    type: 'Word Document (.doc)',
    description: 'Original 11-page provisional application covering "System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology".',
    pages: 11,
  },
  {
    title: 'Provisional Patent Drawings',
    filename: 'ZenSolar_Provisional_Patent_Drawings.pdf',
    path: '/documents/ZenSolar_Provisional_Patent_Drawings.pdf',
    type: 'PDF (Landscape)',
    description: 'FIG 1: System Architecture, FIG 2: Process Flowchart, FIG 3: Dashboard UI Mockup.',
    pages: 3,
  },
];

const abstractDraft = `A system and method for converting verified clean energy activity into blockchain-based digital assets through a Software-Enabled Gateway Interface (SEGI). The system comprises: (1) an API aggregation layer connecting to multiple energy device manufacturer clouds via OAuth 2.0 authentication; (2) a data normalization layer converting disparate metrics into a unified impact score; (3) a verification engine generating cryptographic proofs of energy activity with tamper-evident timestamps; and (4) a smart contract bridge implementing "Mint-on-Proof™" token issuance where blockchain tokens are minted only upon verification of real-world activity. The system further implements a "Proof-of-Delta™" mechanism using device-bound watermarks to track cumulative tokenized values, ensuring tokens represent only incremental, never-before-tokenized energy production. This hardware-agnostic approach eliminates the need for custom IoT devices while maintaining cryptographic verification of energy claims.`;

const keyTerms = [
  { term: 'Mint-on-Proof™', definition: 'Token issuance system where tokens are minted at the moment of verified activity, not distributed from pre-minted pools.' },
  { term: 'SEGI', definition: 'Software-Enabled Gateway Interface - a hardware-agnostic software layer bridging energy devices to blockchain.' },
  { term: 'Proof-of-Delta™', definition: 'Verification mechanism ensuring tokens are minted only for incremental activity beyond previously tokenized amounts.' },
  { term: 'Device Watermark', definition: 'Cumulative record of tokenized value per physical device, preventing double-counting across ownership changes.' },
  { term: 'Impact Score', definition: 'Normalized metric converting diverse energy measurements (kWh, miles, etc.) to a unified value (e.g., CO₂ offset).' },
];

const priorArtNotes = [
  {
    category: 'Energy Trading Platforms',
    examples: 'SunContract, Power Ledger, WePower',
    distinction: 'Focus on P2P energy trading, not hardware-agnostic verification with device-bound tracking.',
  },
  {
    category: 'Carbon Credit Systems',
    examples: 'Toucan, Flowcarbon, Moss',
    distinction: 'Bridge existing carbon credits; we create new tokens from verified device data.',
  },
  {
    category: 'IoT Blockchain Solutions',
    examples: 'Helium, IOTA',
    distinction: 'Require custom hardware; SEGI is 100% software using existing manufacturer APIs.',
  },
  {
    category: 'EV Rewards Programs',
    examples: 'ChargePoint, EVgo loyalty',
    distinction: 'Centralized points systems; we provide blockchain-based, transferable tokens.',
  },
];

export default function AdminPatentApplication() {
  const copyAbstract = () => {
    navigator.clipboard.writeText(abstractDraft);
    toast.success('Abstract copied to clipboard');
  };

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
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <Scale className="h-3.5 w-3.5 mr-2" />
            Legal Documentation
          </Badge>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
            <Clock className="h-3 w-3 mr-1" />
            Draft Status
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Patent Application Materials</h1>
        <p className="text-muted-foreground">
          Draft language, timelines, and reference materials for patent filings.
        </p>
      </motion.div>

      {/* Original Documents */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-emerald-500" />
              Original Provisional Filing
            </CardTitle>
            <CardDescription>
              Filed Q1 2025 — USPTO Provisional Patent Application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {originalDocuments.map((doc, index) => (
              <motion.div
                key={doc.filename}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/60"
              >
                <div className="p-3 rounded-lg bg-emerald-500/10 flex-shrink-0">
                  {doc.type.includes('PDF') ? (
                    <FileImage className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{doc.title}</h4>
                      <p className="text-xs text-muted-foreground">{doc.type} • {doc.pages} pages</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={doc.path} download={doc.filename}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                </div>
              </motion.div>
            ))}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
              <p className="text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><strong>Note:</strong> The drawings PDF is formatted as portrait pages with landscape content. Rotate 90° clockwise when viewing.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Claims Dependency Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
      >
        <PatentClaimsDependencyDiagram />
      </motion.div>

      {/* Filing Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Filing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patentTimeline.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                      item.status === 'pending' ? 'bg-amber-500/20 border-2 border-amber-500' :
                      item.status === 'complete' ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                      'bg-muted border-2 border-border'
                    }`}>
                      {item.status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : item.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {index < patentTimeline.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2 min-h-[16px]" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{item.date}</Badge>
                      {item.status === 'pending' && (
                        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Abstract Draft */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Draft Abstract
                </CardTitle>
                <CardDescription>Provisional patent application abstract language.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyAbstract}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
              <p className="text-sm leading-relaxed text-foreground">{abstractDraft}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Terms */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Key Terms & Definitions
            </CardTitle>
            <CardDescription>Standardized terminology for patent claims.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyTerms.map((item, index) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                  className="p-3 rounded-lg bg-muted/30 border border-border/60"
                >
                  <p className="font-semibold text-sm text-primary">{item.term}</p>
                  <p className="text-sm text-muted-foreground">{item.definition}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Prior Art Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Prior Art Distinctions
            </CardTitle>
            <CardDescription>How our innovation differs from existing solutions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorArtNotes.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.08 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border/60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{item.category}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium">Examples:</span> {item.examples}
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{item.distinction}</p>
                  </div>
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
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
      >
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">Legal Review Required</p>
            <p className="text-sm text-muted-foreground">
              All materials on this page are drafts for internal reference. Final patent applications 
              must be reviewed and prepared by qualified patent counsel. Claims and language are subject 
              to modification based on legal advice and USPTO requirements.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <PatentPageNavigation />
    </div>
  );
}
