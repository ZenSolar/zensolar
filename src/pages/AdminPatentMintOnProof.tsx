import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Coins, 
  CheckCircle2,
  FileText,
  ArrowRight,
  Lightbulb,
  Scale
} from 'lucide-react';
import { SEGIProofOfDeltaDiagram } from '@/components/technology/SEGIProofOfDeltaDiagram';
import { MintOnProofFlowDiagram } from '@/components/whitepaper/MintOnProofFlowDiagram';

const patentClaims = [
  {
    id: 1,
    title: 'Software-Enabled Gateway Interface (SEGI)',
    description: 'A hardware-agnostic software layer that connects to multiple energy device manufacturer APIs via OAuth 2.0, normalizes disparate data formats, and bridges verified activity to blockchain smart contracts.',
    novelty: 'Eliminates need for custom IoT hardware by leveraging existing manufacturer clouds.',
  },
  {
    id: 2,
    title: 'Mint-on-Proof Architecture',
    description: 'A token issuance system where blockchain tokens are minted only upon cryptographic verification of real-world energy activity, as opposed to pre-minted pool distribution.',
    novelty: 'Tokens are created at the moment of verified activity, ensuring 1:1 correspondence between energy production and token supply.',
  },
  {
    id: 3,
    title: 'Device Watermark Registry',
    description: 'A cumulative tracking system that records the total tokenized value per physical device, preventing double-counting across user transfers or account changes.',
    novelty: 'Device-bound (not user-bound) tracking ensures token integrity even when ownership changes.',
  },
  {
    id: 4,
    title: 'Delta-Only Minting',
    description: 'A calculation method where only the incremental difference between current device readings and the last recorded watermark is eligible for token minting.',
    novelty: 'Prevents retroactive claims and ensures tokens represent only new, verified activity.',
  },
];

const competitiveAdvantages = [
  {
    icon: Zap,
    title: '60-Second Onboarding',
    description: 'No hardware installation, technician visits, or shipping delays.',
  },
  {
    icon: Shield,
    title: 'Tamper-Evident Verification',
    description: 'Data pulled directly from manufacturer APIs with cryptographic timestamps.',
  },
  {
    icon: Coins,
    title: 'Guaranteed Token Integrity',
    description: 'Every token backed by verifiable, non-duplicated energy activity.',
  },
  {
    icon: Scale,
    title: 'Defensible IP Position',
    description: 'Novel combination of software gateway + on-chain verification creates patent moat.',
  },
];

export default function AdminPatentMintOnProof() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Patent Reference
          </Badge>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
            Provisional Filing: Pending
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Mint-on-Proof™ Patent Documentation</h1>
        <p className="text-muted-foreground">
          Internal reference for the patent-pending Mint-on-Proof architecture and SEGI technology.
        </p>
      </motion.div>

      {/* Visual Diagrams */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Visual Diagrams
        </h2>
        
        <SEGIProofOfDeltaDiagram />
        
        <MintOnProofFlowDiagram />
      </motion.div>

      {/* Patent Claims */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Core Patent Claims
            </CardTitle>
            <CardDescription>
              Key innovations that form the basis of our provisional patent application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patentClaims.map((claim, index) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.1 }}
                className="p-4 rounded-xl bg-muted/50 border border-border/60 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {claim.id}
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold text-foreground">{claim.title}</h4>
                    <p className="text-sm text-muted-foreground">{claim.description}</p>
                    <div className="flex items-start gap-2 pt-1">
                      <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Novelty
                      </Badge>
                      <span className="text-xs text-muted-foreground italic">{claim.novelty}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Competitive Advantages */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Competitive Moat
            </CardTitle>
            <CardDescription>
              How Mint-on-Proof creates defensible advantages over competitors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {competitiveAdvantages.map((advantage, index) => (
                <motion.div
                  key={advantage.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/60"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <advantage.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{advantage.title}</p>
                    <p className="text-xs text-muted-foreground">{advantage.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legal Notes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
      >
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">Confidential - Internal Reference Only</p>
            <p className="text-sm text-muted-foreground">
              This documentation is for internal use in preparing patent applications. Do not share externally. 
              All claims are subject to legal review and may be modified during the patent prosecution process.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
