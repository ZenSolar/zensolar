import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sun, Battery, Zap, Car, Star, Hexagon, Award } from 'lucide-react';

const milestoneJourney = [
  {
    icon: Sun,
    category: 'Solar Production',
    nftCount: 8,
    range: '500 – 100,000 kWh',
    highlight: 'Sunspark',
    highlightDesc: 'Your first 500 kWh',
    accent: 'from-amber-400 to-orange-500',
    glowColor: 'shadow-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  {
    icon: Battery,
    category: 'Battery Discharge',
    nftCount: 7,
    range: '500 – 50,000 kWh',
    highlight: 'First Reserve',
    highlightDesc: 'Your first 500 kWh stored',
    accent: 'from-emerald-400 to-teal-500',
    glowColor: 'shadow-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  {
    icon: Zap,
    category: 'EV Charging',
    nftCount: 8,
    range: '100 – 25,000 kWh',
    highlight: 'First Charge',
    highlightDesc: 'Your first 100 kWh charged',
    accent: 'from-blue-400 to-cyan-500',
    glowColor: 'shadow-blue-500/20',
    dotColor: 'bg-blue-400',
  },
  {
    icon: Car,
    category: 'EV Miles Driven',
    nftCount: 10,
    range: '100 – 200,000 miles',
    highlight: 'Odyssey',
    highlightDesc: '200,000 miles driven',
    accent: 'from-violet-400 to-purple-500',
    glowColor: 'shadow-violet-500/20',
    dotColor: 'bg-violet-400',
  },
];

const comboNFTs = [
  { name: 'Duality', desc: '2 categories mastered' },
  { name: 'Trifecta', desc: '3 categories mastered' },
  { name: 'ZenMaster', desc: 'All 4 categories' },
  { name: 'Total Eclipse', desc: 'Ultimate achievement' },
];

function FloatingHexagon({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none opacity-[0.07]"
      style={{ left: x, top: y }}
      animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <Hexagon className="text-token" style={{ width: size, height: size }} />
    </motion.div>
  );
}

export function NFTMilestoneSection() {
  return (
    <section className="py-[clamp(4rem,10vw,7rem)] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-token/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <FloatingHexagon delay={0} x="5%" y="15%" size={48} />
        <FloatingHexagon delay={1.5} x="85%" y="10%" size={36} />
        <FloatingHexagon delay={3} x="75%" y="70%" size={56} />
        <FloatingHexagon delay={2} x="15%" y="75%" size={40} />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-token/40 bg-token/10 text-token font-medium mb-4">
              <Award className="h-3 w-3 mr-1.5" />
              42 Achievement NFTs
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Your Clean Energy{' '}
            <span className="bg-gradient-to-r from-token via-solar to-primary bg-clip-text text-transparent">
              Trophy Case
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg"
          >
            Powered by our patent-pending Mint-on-Proof™ engine, every kWh produced and every mile driven 
            mints a unique achievement NFT — your proof-of-impact, forever on-chain.
          </motion.p>
        </div>

        {/* Milestone cards — 2x2 grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {milestoneJourney.map((m, i) => (
            <motion.div
              key={m.category}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`group relative rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 hover:shadow-xl ${m.glowColor} transition-all duration-500`}
            >
              {/* Top row: icon + category + count */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${m.accent} shadow-lg`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{m.category}</h3>
                    <p className="text-xs text-muted-foreground">{m.range}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full">
                  {m.nftCount} NFTs
                </span>
              </div>

              {/* Progress tier dots */}
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: m.nftCount }).map((_, j) => (
                  <motion.div
                    key={j}
                    className={`h-1.5 flex-1 rounded-full ${j === 0 ? m.dotColor : 'bg-muted/40'}`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + j * 0.04, duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Featured NFT */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/30 px-4 py-3">
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${m.accent} flex items-center justify-center shadow-md`}>
                  <Hexagon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">"{m.highlight}"</p>
                  <p className="text-xs text-muted-foreground">{m.highlightDesc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Combo achievements row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-token/20 bg-gradient-to-br from-token/10 via-card to-primary/5 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Left side */}
            <div className="flex items-center gap-4 shrink-0">
              <motion.div
                className="p-3 rounded-2xl bg-gradient-to-br from-token to-solar shadow-lg shadow-token/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Trophy className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Combo Achievements</h3>
                <p className="text-sm text-muted-foreground">Master multiple categories</p>
              </div>
            </div>

            {/* Combo NFT pills */}
            <div className="flex flex-wrap gap-2.5 md:ml-auto">
              {comboNFTs.map((combo, i) => (
                <motion.div
                  key={combo.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-2 bg-background/60 backdrop-blur-sm border border-border/40 rounded-full pl-2 pr-3.5 py-1.5 hover:border-token/40 transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-token" />
                  <div>
                    <span className="text-xs font-semibold text-foreground">{combo.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 hidden sm:inline">— {combo.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 8 combo badge + ERC-1155 note */}
          <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-border/20">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-token">8 Combo NFTs</span> in total — including Duality, Trifecta, ZenMaster & Total Eclipse
            </span>
            <span className="text-[10px] text-muted-foreground/60 ml-auto">ERC-1155 on Base L2</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
