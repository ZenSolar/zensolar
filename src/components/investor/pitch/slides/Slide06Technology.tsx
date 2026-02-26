import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Layers, Shield, Fingerprint, FileCheck } from 'lucide-react';

const layers = [
  { icon: Layers, label: 'API Aggregation', desc: 'Tesla, Enphase, SolarEdge, Wallbox — one unified pipeline', color: 'hsl(207,90%,54%)', num: 'L1' },
  { icon: FileCheck, label: 'Data Normalization', desc: 'Manufacturer-agnostic schema. kWh is kWh regardless of source', color: 'hsl(142,76%,50%)', num: 'L2' },
  { icon: Shield, label: 'Verification Engine', desc: 'Proof-of-Delta™ — SHA-256 hash chains confirm energy deltas, prevent double-counting', color: 'hsl(45,93%,47%)', num: 'L3' },
  { icon: Fingerprint, label: 'Smart Contract Bridge', desc: 'Proof-of-Origin™ — Device Watermark Registry™ binds VIN/Site ID to on-chain identity', color: 'hsl(280,68%,60%)', num: 'L4' },
];

export function Slide06Technology() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Proprietary Tech & IP" number={6} />

      <div className="absolute inset-0 flex px-16 pt-24 pb-16">
        <div className="w-full flex gap-16">
          {/* Left: SEGI overview */}
          <div className="w-[500px] flex flex-col justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-[13px] font-mono tracking-[0.3em] uppercase text-[hsl(207,90%,54%)]/60 mb-3">Patent-Pending</p>
              <h2 className="text-[56px] font-black leading-[1.05] mb-4">
                SEGI<span className="text-[hsl(207,90%,54%)]">™</span>
              </h2>
              <p className="text-[20px] text-white/50 leading-relaxed mb-6">
                Software-Enabled Gateway Interface — a hardware-agnostic architecture converting verified energy activity into blockchain rewards.
              </p>
              <div className="flex gap-3">
                {['Mint-on-Proof™', 'Proof-of-Delta™', 'Proof-of-Origin™'].map((tm) => (
                  <span key={tm} className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-white/10 bg-white/5 text-white/60">
                    {tm}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: 4-layer stack */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            {layers.map((layer, i) => (
              <motion.div key={layer.label} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-5 p-5 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${layer.color}15`, border: `1px solid ${layer.color}30` }}>
                  <layer.icon className="w-7 h-7" style={{ color: layer.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-white/30">{layer.num}</span>
                    <p className="text-[18px] font-bold">{layer.label}</p>
                  </div>
                  <p className="text-[14px] text-white/50 mt-1">{layer.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
