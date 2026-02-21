import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Shield, TrendingUp, Building2, Zap, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const wallStreetAssets = [
  { label: 'U.S. Treasuries', market: '$10B+', type: 'Financial claim' },
  { label: 'Tokenized Gold', market: '$5B+', type: 'Commodity claim' },
  { label: 'Tokenized Stocks', market: '$1B+', type: 'Equity claim' },
  { label: 'Real Estate', market: 'Emerging', type: 'Property claim' },
];

const zenSolarAssets = [
  { label: '1 kWh solar produced', icon: Sun, proof: 'Cryptographically retired' },
  { label: '1 kWh battery discharged', icon: Zap, proof: 'Proof-of-Delta™ verified' },
  { label: '1 EV mile driven', icon: Shield, proof: 'Device Watermark Registry' },
  { label: '1 kWh EV charged', icon: TrendingUp, proof: 'Immutable on-chain record' },
];

export function TokenizationWaveSection() {
  return (
    <section id="tokenization" className="py-[clamp(3rem,8vw,6rem)] scroll-mt-20">
      <div className="container max-w-6xl mx-auto px-4 space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium">
              Market Timing
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            The Tokenization Supercycle{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Just Started
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
          >
            Wall Street is racing to tokenize financial assets. ZenSolar is tokenizing 
            something more defensible — the physical reality of clean energy production at the kilowatt-hour level.
          </motion.p>
        </div>

        {/* Coinbase/Bernstein quote */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-card">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 shrink-0 mt-0.5">
                <ExternalLink className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Coinbase Bytes · Bernstein Research · February 19, 2026
                </p>
                <blockquote className="text-foreground font-medium leading-relaxed">
                  "The tokenization of everything creates a tangible use case that attracts traditional capital.
                  This provides the fundamental bedrock for the next cycle. Tokenized assets hit a record{' '}
                  <span className="text-primary">$24.5 billion</span>."
                </blockquote>
                <p className="text-xs text-muted-foreground">
                  Bernstein predicts a tokenization "supercycle" beginning in 2026, driven by BlackRock, 
                  Franklin Templeton, JPMorgan, and $432M in new VC funding entering the space.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* The comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Wall Street side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-muted bg-muted/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-muted-foreground">Wall Street Tokenizes</h3>
                </div>
                <p className="text-xs text-muted-foreground">Financial claims — subject to counterparty, custody, and regulatory risk</p>
                <div className="space-y-2">
                  {wallStreetAssets.map((a) => (
                    <div key={a.label} className="flex items-center justify-between p-3 rounded-lg bg-background/60 border border-border/40">
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.label}</p>
                        <p className="text-xs text-muted-foreground">{a.type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{a.market}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ZenSolar side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">ZenSolar Tokenizes</h3>
                </div>
                <p className="text-xs text-muted-foreground">Physical reality — permanently retired at mint, verifiable on any chain</p>
                <div className="space-y-2">
                  {zenSolarAssets.map(({ label, icon: Icon, proof }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-primary/70">{proof}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">= 1 $ZSOLAR</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* The key insight callout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-secondary/5 overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">
                Bitcoin is scarce because of math.
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  $ZSOLAR is scarce because of physics + math.
                </span>
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                A kilowatt-hour can only be used once. Once it powers your home, it's gone forever. 
                We capture that moment, verify it, and retire it on-chain. No counterparty risk. No custody risk. 
                Just physics. As the world adds 1.5 billion solar homes by 2040, every token becomes 
                a permanent stake in the clean energy economy.
              </p>
              <Link to="/white-paper" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                Read the full analysis in the White Paper
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </section>
  );
}
