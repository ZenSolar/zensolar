import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Shield, Scale, Users, Cpu } from 'lucide-react';

export function Slide12RiskMitigation() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Risk Mitigation" number={12} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-3">
          Risks Acknowledged. <span className="text-[hsl(207,90%,54%)]">Mitigated.</span>
        </motion.h2>
        <p className="text-[20px] text-white/50 mb-12 max-w-[800px]">
          We've mapped every risk category and built specific defenses into the protocol architecture.
        </p>

        <div className="grid grid-cols-2 gap-6">
          {[
            {
              icon: Scale, title: 'Regulatory / SEC',
              risk: '$ZSOLAR is a utility token, not a security. No profit-sharing, no dividends.',
              mitigation: 'Tokens represent verified energy production receipts. Howey Test analysis completed. Legal counsel engaged.',
              color: 'hsl(45,93%,47%)',
            },
            {
              icon: Users, title: 'Market Adoption',
              risk: 'User growth depends on solar/EV penetration continuing upward.',
              mitigation: '4M+ US households already qualify. Federal incentive removal accelerates need for alternative rewards.',
              color: 'hsl(207,90%,54%)',
            },
            {
              icon: Cpu, title: 'Technical / API',
              risk: 'Manufacturer APIs could change or restrict access.',
              mitigation: 'SEGI\'s normalization layer abstracts providers. Multi-vendor support reduces single-point failure.',
              color: 'hsl(142,76%,50%)',
            },
            {
              icon: Shield, title: 'Competition',
              risk: 'Other projects enter the energy tokenization space.',
              mitigation: 'Patent-pending SEGI stack. First-mover on verified residential tokenization. 12–18 month head start.',
              color: 'hsl(280,68%,60%)',
            },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="p-6 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
                <p className="text-[18px] font-bold">{item.title}</p>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[hsl(0,84%,60%)]/5 border border-[hsl(0,84%,60%)]/10">
                  <p className="text-[12px] font-mono text-[hsl(0,84%,60%)]/60 mb-1">RISK</p>
                  <p className="text-[14px] text-white/60">{item.risk}</p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(142,76%,36%)]/5 border border-[hsl(142,76%,36%)]/10">
                  <p className="text-[12px] font-mono text-[hsl(142,76%,50%)]/60 mb-1">MITIGATION</p>
                  <p className="text-[14px] text-white/60">{item.mitigation}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
