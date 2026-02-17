import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Award, Sun, BatteryFull, Zap, Car, Trophy, Star, Hexagon } from 'lucide-react';
import { CategoryProgressRing } from './nft/CategoryProgressRing';
import { TrophyShelf } from './nft/TrophyShelf';

// Demo "earned" state — first few in each category are earned for showcase
const solarNFTs = [
  { id: 'solar_1', name: 'Sunspark', earned: true },
  { id: 'solar_2', name: 'Photonic', earned: true },
  { id: 'solar_3', name: 'Rayforge', earned: true },
  { id: 'solar_4', name: 'Solaris', earned: false },
  { id: 'solar_5', name: 'Helios', earned: false },
  { id: 'solar_6', name: 'Sunforge', earned: false },
  { id: 'solar_7', name: 'Gigasun', earned: false },
  { id: 'solar_8', name: 'Starforge', earned: false },
];

const batteryNFTs = [
  { id: 'battery_1', name: 'Voltbank', earned: true },
  { id: 'battery_2', name: 'Gridpulse', earned: true },
  { id: 'battery_3', name: 'Megacell', earned: false },
  { id: 'battery_4', name: 'Reservex', earned: false },
  { id: 'battery_5', name: 'Dynamax', earned: false },
  { id: 'battery_6', name: 'Ultracell', earned: false },
  { id: 'battery_7', name: 'Gigavolt', earned: false },
];

const chargeNFTs = [
  { id: 'charge_1', name: 'Ignite', earned: true },
  { id: 'charge_2', name: 'Voltcharge', earned: true },
  { id: 'charge_3', name: 'Kilovolt', earned: true },
  { id: 'charge_4', name: 'Ampforge', earned: true },
  { id: 'charge_5', name: 'Chargeon', earned: false },
  { id: 'charge_6', name: 'Gigacharge', earned: false },
  { id: 'charge_7', name: 'Megacharge', earned: false },
  { id: 'charge_8', name: 'Teracharge', earned: false },
];

const evNFTs = [
  { id: 'ev_1', name: 'Sparkstart', earned: true },
  { id: 'ev_2', name: 'Velocity', earned: false },
  { id: 'ev_3', name: 'Autobahn', earned: false },
  { id: 'ev_4', name: 'Hyperdrive', earned: false },
  { id: 'ev_5', name: 'Electra', earned: false },
  { id: 'ev_6', name: 'Velocity Pro', earned: false },
  { id: 'ev_7', name: 'Mach One', earned: false },
  { id: 'ev_8', name: 'Centauri', earned: false },
  { id: 'ev_9', name: 'Voyager', earned: false },
  { id: 'ev_10', name: 'Odyssey', earned: false },
];

const comboNFTs = [
  { id: 'combo_1', name: 'Duality', earned: true },
  { id: 'combo_2', name: 'Trifecta', earned: false },
  { id: 'combo_3', name: 'Quadrant', earned: false },
  { id: 'combo_4', name: 'Constellation', earned: false },
  { id: 'combo_5', name: 'Cyber Echo', earned: false },
  { id: 'combo_6', name: 'Zenith', earned: false },
  { id: 'combo_7', name: 'ZenMaster', earned: false },
  { id: 'combo_8', name: 'Total Eclipse', earned: false },
];

const categories = [
  { icon: Sun, label: 'Solar', earned: 3, total: 8, from: '#f59e0b', to: '#f97316' },
  { icon: BatteryFull, label: 'Battery', earned: 2, total: 7, from: '#34d399', to: '#14b8a6' },
  { icon: Zap, label: 'Charging', earned: 4, total: 8, from: '#60a5fa', to: '#06b6d4' },
  { icon: Car, label: 'EV Miles', earned: 1, total: 10, from: '#a78bfa', to: '#8b5cf6' },
];

function FloatingHexagon({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none opacity-[0.05]"
      style={{ left: x, top: y }}
      animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
      transition={{ duration: 7, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <Hexagon className="text-token" style={{ width: size, height: size }} />
    </motion.div>
  );
}

export function NFTMilestoneSection() {
  const totalEarned = 3 + 2 + 4 + 1 + 1; // 11 out of 42 for demo
  const totalNFTs = 42;

  return (
    <section className="py-[clamp(4rem,10vw,7rem)] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-token/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <FloatingHexagon delay={0} x="5%" y="15%" size={48} />
        <FloatingHexagon delay={1.5} x="88%" y="8%" size={36} />
        <FloatingHexagon delay={3} x="78%" y="72%" size={56} />
        <FloatingHexagon delay={2} x="12%" y="78%" size={40} />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
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
             Every kWh produced and mile driven mints a unique achievement NFT. 
            Your proof-of-impact, forever on-chain.
          </motion.p>
        </div>

        {/* ── Gamified Progress Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 md:p-8 mb-10"
        >
          {/* Top stat bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2.5 rounded-xl bg-gradient-to-br from-token to-solar shadow-lg shadow-token/20"
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Trophy className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Collection Progress</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-token">{totalEarned}</span> of {totalNFTs} unlocked
                </p>
              </div>
            </div>

            {/* Overall XP bar */}
            <div className="w-full sm:w-64">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Overall</span>
                <span>{Math.round((totalEarned / totalNFTs) * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-token via-solar to-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(totalEarned / totalNFTs) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Category progress rings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
            {categories.map((cat, i) => (
              <CategoryProgressRing
                key={cat.label}
                icon={cat.icon}
                label={cat.label}
                earned={cat.earned}
                total={cat.total}
                accentFrom={cat.from}
                accentTo={cat.to}
                delay={i * 0.1}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Trophy Shelf — NFT Artwork Grid ── */}
        <div className="space-y-8">
          <TrophyShelf title="Solar Production" nfts={solarNFTs} accentColor="solar" delay={0} />
          <TrophyShelf title="Battery Storage" nfts={batteryNFTs} accentColor="eco" delay={0.05} />
          <TrophyShelf title="EV Charging" nfts={chargeNFTs} accentColor="primary" delay={0.1} />
          <TrophyShelf title="EV Miles Driven" nfts={evNFTs} accentColor="token" delay={0.15} />
          <TrophyShelf title="Combo Achievements" nfts={comboNFTs} accentColor="accent" delay={0.2} />
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10 pt-6 border-t border-border/20"
        >
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-token" />
            <span className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">Mint-on-Proof™</span>
            </span>
          </div>
          <span className="text-border">·</span>
          <span className="text-[10px] text-muted-foreground/60">ERC-1155 on Base L2</span>
        </motion.div>
      </div>
    </section>
  );
}
