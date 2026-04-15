import { motion } from 'framer-motion';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-wordmark-red.png';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-white.png';

const brandLogos = [
  { src: teslaLogo, alt: 'Tesla', extra: '' },
  { src: enphaseLogo, alt: 'Enphase', extra: '' },
  { src: solaredgeLogo, alt: 'SolarEdge', extra: '' },
  { src: wallboxLogo, alt: 'Wallbox', extra: '' },
];

export function ApiPartnersCard() {
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] font-mono mb-5 text-center">Connects with</p>
      <div className="relative overflow-hidden rounded-2xl pt-1 pb-6 px-6 border border-border/20 bg-gradient-to-br from-primary/[0.06] via-card/50 to-solar/[0.04] backdrop-blur-sm">
        {/* Ambient glow spots */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-32 h-32 bg-solar/10 rounded-full blur-[60px] pointer-events-none" />
        {/* Subtle shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        />
        <div className="relative grid grid-cols-2 gap-6 place-items-center">
          {brandLogos.map(({ src, alt, extra }, idx) => (
            <motion.img
              key={alt}
              src={src}
              alt={alt}
              className={`${extra} w-auto object-contain opacity-60 hover:opacity-100 transition-all duration-500 ${alt === 'Tesla' ? 'max-w-[400px] max-h-20' : 'max-w-[120px] max-h-10'}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground/40 uppercase tracking-[0.15em] font-mono mt-4 text-center">More partners coming soon…</p>
    </div>
  );
}
