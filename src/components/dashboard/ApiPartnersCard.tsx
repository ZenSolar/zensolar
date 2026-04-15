import { motion } from 'framer-motion';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-wordmark-red.png';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-white.png';

const brandLogos = [
  { src: teslaLogo, alt: 'Tesla', size: 'max-h-7' },
  { src: enphaseLogo, alt: 'Enphase', size: 'max-h-10' },
  { src: solaredgeLogo, alt: 'SolarEdge', size: 'max-h-7 brightness-0 invert' },
  { src: wallboxLogo, alt: 'Wallbox', size: 'max-h-7' },
];

export function ApiPartnersCard() {
  return (
    <div className="w-full">
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.25em] font-mono mb-2.5 text-center">
        Connects with
      </p>
      <div className="relative overflow-hidden rounded-2xl py-5 px-5 border border-border/20 bg-gradient-to-br from-primary/[0.06] via-card/50 to-solar/[0.04] backdrop-blur-sm">
        {/* Ambient glow spots */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-28 h-28 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-28 h-28 bg-solar/10 rounded-full blur-[50px] pointer-events-none" />
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        />
        <div className="relative flex items-center justify-between gap-4 px-2">
          {brandLogos.map(({ src, alt, size }, idx) => (
            <motion.img
              key={alt}
              src={src}
              alt={alt}
              className={`w-auto object-contain opacity-70 hover:opacity-100 transition-all duration-500 ${size}`}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.15em] font-mono mt-2.5 text-center">
        More partners coming soon…
      </p>
    </div>
  );
}
