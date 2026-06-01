import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Droplets, Users, ShieldCheck, Megaphone, PiggyBank } from 'lucide-react';

const LADDER = [
  { round: 'OG · Day 0', trigger: 'Mainnet launch', price: '$0.10' },
  { round: 'Round 2', trigger: '25K subs OR $0.25 sustained', price: '$0.25' },
  { round: 'Round 3', trigger: '50K subs OR $0.50 sustained', price: '$0.50' },
  { round: 'Round 4', trigger: '100K subs · sub-revenue funded', price: '$1.00' },
];

export function Slide13TheAsk() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Ask" number={15} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[hsl(207,90%,54%)]/10 blur-[150px]" />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        {/* Headline ask */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
          <p className="text-[15px] font-mono tracking-[0.3em] uppercase text-white/35 mb-3">Strategic Seed · SAFE · Post-money</p>
          <h2 className="text-[64px] font-bold leading-none">
            Raising <span className="text-[hsl(45,93%,47%)]">$5M</span>
            <span className="text-white/40 text-[44px] font-light"> · </span>
            <span className="text-white/70 text-[44px] font-light">$20M post</span>
            <span className="text-white/40 text-[44px] font-light"> · </span>
            <span className="text-[hsl(142,76%,50%)] text-[56px] font-bold">$7M</span>
            <span className="text-white/70 text-[44px] font-light"> cap</span>
          </h2>
          <p className="text-[20px] text-white/50 mt-4">
            18–24 month runway to mainnet TGE, first revenue, and Series A readiness
          </p>
        </motion.div>

        {/* Use of Funds — locked Feb 2026: $5M target, 5 buckets */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { pct: '40%', dollars: '$2.0M', label: 'LP Reserve', desc: '3 tranches · critical for flywheel', icon: Droplets, color: 'hsl(142,76%,50%)' },
            { pct: '36%', dollars: '$1.8M', label: 'Team & Ops', desc: 'Founders + 3 hires (18–24 mo)', icon: Users, color: 'hsl(207,90%,54%)' },
            { pct: '10%', dollars: '$500K', label: 'Growth / UA', desc: 'Paid acq · creators · PoG viral', icon: Megaphone, color: 'hsl(45,93%,47%)' },
            { pct: '8%', dollars: '$400K', label: 'Audits + Legal', desc: 'Smart-contract + securities + patents', icon: ShieldCheck, color: 'hsl(15,90%,55%)' },
            { pct: '6%', dollars: '$300K', label: 'Reserves', desc: 'Flexible contingency buffer', icon: PiggyBank, color: 'hsl(220,15%,60%)' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
              <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} />
              <p className="text-[22px] font-black" style={{ color: item.color }}>{item.dollars}</p>
              <p className="text-[12px] text-white/40 -mt-0.5">{item.pct}</p>
              <p className="text-[14px] font-semibold mt-1.5 text-white/85">{item.label}</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* LP tranche ladder — programmatic, trigger-based */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          className="mb-5">
          <p className="text-[12px] font-mono tracking-[0.24em] uppercase text-white/35 mb-2">
            LP Tranche Ladder · Triggered, Not Timed
          </p>
          <div className="grid grid-cols-4 gap-2">
            {LADDER.map((r) => (
              <div key={r.round} className="p-3 rounded-lg border border-white/10 bg-white/[0.04] flex items-center gap-3">
                <p className="text-[18px] font-bold text-[hsl(142,76%,50%)] font-mono w-[64px]">{r.price}</p>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white/85 leading-tight">{r.round}</p>
                  <p className="text-[10.5px] text-white/45 leading-tight truncate">{r.trigger}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/40 mt-2 italic">
            Seed pre-funds the first 3 tranches. By Round 4, subscription revenue auto-injects more USDC than required.
          </p>
        </motion.div>

        {/* Two-column: Milestones + Anchor slot */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="p-5 rounded-xl border border-white/10 bg-white/5">
            <p className="text-[13px] font-mono tracking-wider text-white/35 mb-3">MILESTONES FUNDED</p>
            <ul className="space-y-2">
              {[
                'Mainnet TGE on Base (chain 8453)',
                '1,000 verified homes · 50M kWh on-chain',
                'Subscriptions live ($9.99 base + Deason $4.99 add-on)',
                '250K paying subscribers on the runway',
                'Series A-ready in 18–24 months',
              ].map((m) => (
                <li key={m} className="flex items-start gap-2 text-[15px] text-white/75">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,50%)] mt-2 shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
            className="p-5 rounded-xl border border-dashed border-[hsl(45,93%,47%)]/30 bg-[hsl(45,93%,47%)]/[0.04] flex flex-col justify-center items-center text-center">
            <p className="text-[13px] font-mono tracking-wider text-[hsl(45,93%,47%)]/70 mb-3">ANCHOR · LEAD INVESTOR</p>
            <p className="text-[28px] font-light text-white/40 italic mb-2">Anchor slot open</p>
            <p className="text-[13px] text-white/40 max-w-[380px]">
              Strategic Seed structured to welcome a single operator-aligned lead. Conversations in progress.
            </p>
          </motion.div>
        </div>

        {/* Walk-off line */}
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          className="text-center text-[36px] font-light tracking-tight leading-[1.15] text-white/90">
          Bitcoin tokenized <span className="text-white/50">scarcity</span>.{' '}
          We're tokenizing <span className="text-[hsl(142,76%,50%)] font-semibold">abundance</span>.
        </motion.p>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
