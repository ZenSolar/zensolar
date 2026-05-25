import { motion } from 'framer-motion';
import { ShimmerOverlay } from './ShimmerOverlay';
import teslaLogo from '@/assets/logos/tesla-t-icon.png';
import enphaseLogo from '@/assets/logos/enphase-wordmark.svg';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-white.png';

const brandLogos = [
  { src: teslaLogo, alt: 'Tesla' },
  { src: enphaseLogo, alt: 'Enphase' },
  { src: solaredgeLogo, alt: 'SolarEdge' },
  { src: wallboxLogo, alt: 'Wallbox' },
];

export function ApiPartnersCard() {
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] font-mono mb-5 text-center">Connects with</p>
      <div className="relative overflow-hidden rounded-2xl pt-1 pb-6 px-6 border backdrop-blur-md card-neon-glow bg-card/90 dark:bg-[hsl(220_20%_18%/0.92)]">
        {/* Ambient glow spots */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-32 h-32 bg-solar/10 rounded-full blur-[60px] pointer-events-none" />
        {/* Rainbow shimmer — synced with wallet/CEC cascade (4s cycle, 1.5s delay) */}
        <ShimmerOverlay
          gradient="linear-gradient(90deg, transparent 0%, hsl(340 85% 55% / 0.25) 8%, hsl(30 90% 50% / 0.35) 20%, hsl(60 85% 48% / 0.3) 35%, hsl(155 90% 45% / 0.5) 50%, hsl(210 85% 50% / 0.4) 65%, hsl(280 70% 55% / 0.35) 80%, hsl(340 80% 55% / 0.2) 92%, transparent 100%)"
          glowColor="hsla(155, 85%, 45%, 0.12)"
          duration="4s"
          idleDelay="1.5s"
        />
        <div className="relative grid grid-cols-2 gap-6 place-items-center">
          {brandLogos.map(({ src, alt }, idx) => (
            <motion.img
              key={alt}
              src={src!}
              alt={alt}
              className={`w-auto object-contain opacity-60 hover:opacity-100 transition-all duration-500 dark:brightness-100 brightness-1 ${alt === 'Tesla' ? 'max-w-[400px] max-h-20' : 'max-w-[180px] max-h-10'}`}
              initial={{ opacity: 1, y: 8 }}
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
