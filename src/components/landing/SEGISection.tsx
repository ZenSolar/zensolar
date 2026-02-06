import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Hexagon, Sparkles } from 'lucide-react';
import { MintOnProofFlowDiagram } from '@/components/whitepaper/MintOnProofFlowDiagram';

export function SEGISection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5"
        >
          <Badge variant="outline" className="border-solar/40 bg-solar/10 text-solar">
            <Hexagon className="h-3.5 w-3.5 mr-2" />
            One-Tap Minting
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Tokens & NFTs
            <br />
            <span className="bg-gradient-to-r from-secondary via-energy to-primary bg-clip-text text-transparent">
              Minted In-App
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Our patent-pending <strong className="text-primary">Mint-on-Proof</strong> technology verifies your energy production and lets you mint $ZSOLAR tokens
            and milestone NFTs with just one tap—no external tools needed.
          </p>

          <div className="pt-4 space-y-3">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Patent-Pending Mint-on-Proof™
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold">
              How In-App Minting Works
            </h3>
            <p className="text-muted-foreground">
              Our 4-layer architecture seamlessly converts energy data to blockchain rewards
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MintOnProofFlowDiagram />
        </motion.div>
      </div>
    </section>
  );
}
