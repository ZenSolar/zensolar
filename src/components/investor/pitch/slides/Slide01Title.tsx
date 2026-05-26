import { SlideLayout, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function Slide01Title() {
  return (
    <SlideLayout variant="gradient">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[hsl(207,90%,54%)]/8 blur-[150px]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)] animate-pulse" />
          <span className="text-[15px] font-mono tracking-[0.3em] uppercase text-white/40">Pre-Seed · Confidential</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, duration: 0.8 }}
          className="flex items-center justify-center">
          <img
            src={zenLogo}
            alt="ZenSolar"
            className="h-[180px] w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 60px hsl(142, 76%, 50%, 0.35)) drop-shadow(0 0 20px hsl(207, 90%, 54%, 0.25))' }}
          />
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="text-[34px] font-light text-white/75 mt-8 text-center max-w-[1200px] leading-[1.2]">
          The <span className="text-white font-medium">energy-to-currency minting protocol</span> for clean energy users.
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          className="text-[18px] font-mono tracking-[0.18em] uppercase text-white/35 mt-6 text-center">
          From SolarCity rep to Solidity dev · Solo founder, full stack
        </motion.p>


        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="flex items-center gap-8 mt-16">
          <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-[13px] text-white/40 uppercase tracking-wider mb-1">Raising</p>
            <p className="text-[28px] font-bold text-[hsl(45,93%,47%)]">$500K</p>
          </div>
          <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-[13px] text-white/40 uppercase tracking-wider mb-1">Type</p>
            <p className="text-[28px] font-bold text-white/90">RWA Utility Token</p>
          </div>
          <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-[13px] text-white/40 uppercase tracking-wider mb-1">Patent</p>
            <p className="text-[28px] font-bold text-[hsl(142,76%,50%)]">Filed</p>
          </div>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
