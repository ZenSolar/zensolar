import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Layers, Shield, Fingerprint, FileCheck } from 'lucide-react';

const stack = [
  { icon: Layers, num: 'L1', label: 'API Aggregation', desc: 'Tesla, Enphase, SolarEdge, Wallbox — one unified pipeline.' },
  { icon: FileCheck, num: 'L2', label: 'Data Normalization', desc: 'Manufacturer-agnostic schema. kWh is kWh regardless of source.' },
  { icon: Shield, num: 'L3', label: 'Verification Engine', desc: 'Proof-of-Delta™ — SHA-256 hash chains confirm energy deltas, prevent double-counting.' },
  { icon: Fingerprint, num: 'L4', label: 'Smart Contract Bridge', desc: 'Proof-of-Origin™ — Device Watermark Registry binds VIN / Site ID to on-chain identity.' },
];

export function S07Tech() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Proprietary Tech & IP" number={7} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at left, hsl(var(--secondary) / 0.14), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="Proprietary Tech & IP"
          title="Proof-of-Genesis™ — the energy-to-currency stack."
          subtitle="Proof-of-Genesis™ protocol — a hardware-agnostic architecture converting verified energy activity from any major OEM into blockchain rewards."
        />

        <div className="grid grid-cols-12 gap-6 flex-1">
          <DeckCard emphasized className="col-span-4 flex flex-col justify-center">
            <CardKicker className="text-secondary">Patent-pending</CardKicker>
            <p className="text-[80px] font-semibold text-white mt-4 leading-none">
              Proof-of-Genesis™<span className="text-secondary">™</span>
            </p>
            <p className="text-[18px] text-white/65 mt-6 leading-relaxed">
              U.S. App. 19/634,402. Filed. Covers the Proof of Genesis™ protocol
              end-to-end.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Mint-on-Proof™', 'Proof-of-Delta™', 'Proof-of-Origin™'].map((tm) => (
                <span
                  key={tm}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-secondary/30 bg-secondary/10 text-white/85"
                >
                  {tm}
                </span>
              ))}
            </div>
          </DeckCard>

          <div className="col-span-8 grid grid-cols-1 gap-4">
            {stack.map((layer) => (
              <DeckCard key={layer.label} className="!p-5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl border border-sky-400/30 bg-sky-400/10 flex items-center justify-center shrink-0">
                    <layer.icon className="w-7 h-7 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-mono text-white/35">
                        {layer.num}
                      </span>
                      <p className="text-[22px] font-semibold text-white">
                        {layer.label}
                      </p>
                    </div>
                    <p className="text-[16px] text-white/60 mt-1.5 leading-snug">
                      {layer.desc}
                    </p>
                  </div>
                </div>
              </DeckCard>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
