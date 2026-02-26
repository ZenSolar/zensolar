import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

export function Slide08POLDefense() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="POL Defense" number={8} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-3">
          Protocol-Owned Liquidity <span className="text-[hsl(207,90%,54%)]">Defense</span>
        </motion.h2>
        <p className="text-[20px] text-white/50 mb-12 max-w-[800px]">
          We don't rent liquidity from mercenary LPs. We own it — and protect it with circuit breakers.
        </p>

        <div className="grid grid-cols-2 gap-10">
          {/* Phased Tiers */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Lock className="w-6 h-6 text-[hsl(207,90%,54%)]" />
              <p className="text-[20px] font-semibold">Phased Liquidity Tiers</p>
            </div>
            <div className="space-y-3">
              {[
                { phase: 'Seed', range: '$250K', pool: 'Initial USDC/ZSOLAR pair', status: 'Active' },
                { phase: 'Series A', range: '$1M+', pool: 'Deepened pool + multi-pair', status: 'Planned' },
                { phase: 'Series B', range: '$5M+', pool: 'Cross-chain bridges', status: 'Roadmap' },
                { phase: 'Series C', range: '$25M+', pool: 'CEX market-making', status: 'Roadmap' },
              ].map((tier, i) => (
                <motion.div key={tier.phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[14px] font-mono text-[hsl(207,90%,54%)] w-20">{tier.phase}</span>
                  <span className="text-[16px] font-bold w-20">{tier.range}</span>
                  <span className="text-[14px] text-white/50 flex-1">{tier.pool}</span>
                  <span className={`text-[12px] px-2 py-0.5 rounded-full ${tier.status === 'Active' ? 'bg-[hsl(142,76%,36%)]/20 text-[hsl(142,76%,50%)]' : 'bg-white/10 text-white/40'}`}>
                    {tier.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Circuit Breakers */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Shield className="w-6 h-6 text-[hsl(0,84%,60%)]" />
              <p className="text-[20px] font-semibold">ERC-7265 Circuit Breakers</p>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="p-6 rounded-xl border border-[hsl(0,84%,60%)]/20 bg-[hsl(0,84%,60%)]/5 space-y-5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-[hsl(0,84%,60%)] mt-1" />
                <div>
                  <p className="text-[16px] font-semibold">Automated Market Protection</p>
                  <p className="text-[14px] text-white/50 mt-1">Smart contract-level safeguards that automatically pause large outflows when anomalies are detected.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {[
                  { label: 'Whale Dump Guard', desc: 'Max single-tx withdrawal limits' },
                  { label: 'Velocity Limits', desc: 'Rate-limited withdrawals per epoch' },
                  { label: 'Flash Loan Shield', desc: 'Multi-block settlement windows' },
                  { label: 'Admin Override', desc: 'Multi-sig emergency pause' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[13px] font-semibold text-[hsl(0,84%,60%)]">{item.label}</p>
                    <p className="text-[12px] text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
