import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Shield, TrendingUp, Building2, Zap, ExternalLink, Globe, BarChart3, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

const wallStreetAssets = [
  { label: 'BlackRock Digital Holdings', market: '$107.4B', type: 'ETF / fund claim' },
  { label: 'U.S. Treasuries', market: '$10B+', type: 'Financial claim' },
  { label: 'Tokenized Gold', market: '$5B+', type: 'Commodity claim' },
  { label: 'Tokenized Stocks', market: '$1B+', type: 'Equity claim' },
];

const zenSolarAssets = [
  { label: '1 kWh solar produced', icon: Sun, proof: 'Cryptographically retired' },
  { label: '1 kWh battery discharged', icon: Zap, proof: 'Proof-of-Delta™ verified' },
  { label: '1 EV mile driven', icon: Shield, proof: 'Device Watermark Registry' },
  { label: '1 kWh EV charged', icon: TrendingUp, proof: 'Immutable on-chain record' },
];

const institutionalQuotes = [
  {
    name: 'Larry Fink',
    title: 'CEO of BlackRock',
    source: 'CNBC · October 14, 2025',
    quote: 'We are at the beginning of the tokenization of all assets.',
    detail: 'BlackRock\'s digital holdings surpassed $107.4 billion, with a strategy to "repot" traditional financial products into digital formats and access $4.1 trillion held in digital wallets globally.',
    icon: Building2,
    color: 'amber',
  },
  {
    name: 'Dr. Leemon Baird',
    title: 'Co-founder of Hedera',
    source: 'Benzinga · Consensus 2025',
    quote: 'Everything of value in the world will be tokenized within five years.',
    detail: 'Baird predicts AI will accelerate blockchain adoption, making tokenization accessible to non-technical users and driving mass institutional adoption.',
    icon: Globe,
    color: 'emerald',
  },
  {
    name: 'Coinbase Bytes · Bernstein Research',
    title: '',
    source: 'February 19, 2026',
    quote: 'Tokenized assets hit a record $24.5 billion. The tokenization of everything creates a tangible use case that attracts traditional capital.',
    detail: 'Bernstein predicts a tokenization "supercycle" beginning in 2026, driven by BlackRock, Franklin Templeton, JPMorgan, and $432M in new VC funding entering the space.',
    icon: ExternalLink,
    color: 'blue',
  },
  {
    name: 'Boston Consulting Group',
    title: 'BCG / ADDX Report',
    source: 'September 2022 (reaffirmed 2025)',
    quote: 'Asset tokenization is projected to grow 50x into a $16 trillion opportunity by 2030.',
    detail: 'Tokenized assets could represent 10% of global GDP by the end of the decade, driven by investor demand for access to private markets like PE, hedge funds, and real estate.',
    icon: BarChart3,
    color: 'violet',
  },
  {
    name: 'CoinDesk',
    title: 'News Analysis',
    source: 'January 17, 2026',
    quote: 'Tokenized assets could become a $400 billion market in 2026.',
    detail: 'After stablecoins proved product-market fit, crypto founders and executives say 2026 is when banks and asset managers will push tokenized assets into mainstream markets.',
    icon: TrendingUp,
    color: 'cyan',
  },
  {
    name: 'JPMorgan',
    title: 'Global Investment Bank',
    source: '2026',
    quote: 'JPMorgan launched its tokenized money market fund on Ethereum, signaling Wall Street\'s full commitment to on-chain finance.',
    detail: 'The world\'s largest bank by assets is actively deploying tokenized financial products on public blockchains, validating the infrastructure ZenSolar builds on.',
    icon: Landmark,
    color: 'sky',
  },
];

const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconText: string }> = {
  amber:   { border: 'border-amber-500/20',   bg: 'from-amber-500/5',   iconBg: 'bg-amber-500/10',   iconText: 'text-amber-500' },
  emerald: { border: 'border-emerald-500/20', bg: 'from-emerald-500/5', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-500' },
  blue:    { border: 'border-blue-500/20',    bg: 'from-blue-500/5',    iconBg: 'bg-blue-500/10',    iconText: 'text-blue-500' },
  violet:  { border: 'border-violet-500/20',  bg: 'from-violet-500/5',  iconBg: 'bg-violet-500/10',  iconText: 'text-violet-500' },
  cyan:    { border: 'border-cyan-500/20',    bg: 'from-cyan-500/5',    iconBg: 'bg-cyan-500/10',    iconText: 'text-cyan-500' },
  sky:     { border: 'border-sky-500/20',     bg: 'from-sky-500/5',     iconBg: 'bg-sky-500/10',     iconText: 'text-sky-500' },
};

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
            something more defensible: the physical reality of clean energy production at the kilowatt-hour level.
          </motion.p>
        </div>

        {/* RWA Utility Token callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/10">
            <CardContent className="p-6 text-center space-y-2">
              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">
                Real-World Asset · Utility Token
              </Badge>
              <p className="text-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                $ZSOLAR is a <strong>Real-World Asset (RWA) utility token</strong>. Unlike tokenized bonds or equities, 
                each $ZSOLAR represents a cryptographically retired kilowatt-hour of clean energy. 
                Governed by physics, not financial intermediaries.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Industry quotes grid */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
            What the world's largest institutions are saying
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {institutionalQuotes.map((q, i) => {
              const colors = colorMap[q.color];
              const Icon = q.icon;
              return (
                <motion.div
                  key={q.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`h-full ${colors.border} bg-gradient-to-br ${colors.bg} to-card`}>
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${colors.iconBg} shrink-0 mt-0.5`}>
                        <Icon className={`h-4 w-4 ${colors.iconText}`} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {q.name}{q.title ? `, ${q.title}` : ''} · {q.source}
                        </p>
                        <blockquote className="text-foreground font-medium leading-relaxed text-sm">
                          "{q.quote.split('$').map((part, pi, arr) => 
                            pi < arr.length - 1 ? (
                              <span key={pi}>{part}<span className="text-primary">$</span></span>
                            ) : part
                          )}"
                        </blockquote>
                        <p className="text-xs text-muted-foreground leading-relaxed">{q.detail}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

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
                <p className="text-xs text-muted-foreground">Financial claims: subject to counterparty, custody, and regulatory risk</p>
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
                <p className="text-xs text-muted-foreground">Physical reality: permanently retired at mint, verifiable on any chain</p>
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
