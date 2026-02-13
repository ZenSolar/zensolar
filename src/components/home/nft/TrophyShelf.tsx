import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { getNftArtwork } from '@/lib/nftArtwork';

interface ShelfNFT {
  id: string;
  name: string;
  earned: boolean;
}

interface TrophyShelfProps {
  title: string;
  nfts: ShelfNFT[];
  accentColor: string;
  delay?: number;
}

export function TrophyShelf({ title, nfts, accentColor, delay = 0 }: TrophyShelfProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
        {title}
      </h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {nfts.map((nft, i) => {
          const artwork = getNftArtwork(nft.id);
          return (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: delay + i * 0.04, duration: 0.35 }}
              className="group relative"
            >
              <div
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  nft.earned
                    ? `border-${accentColor}/50 shadow-lg shadow-${accentColor}/20 hover:shadow-xl hover:shadow-${accentColor}/30 hover:scale-105`
                    : 'border-border/20 opacity-40 grayscale hover:opacity-60'
                }`}
              >
                {artwork ? (
                  <img
                    src={artwork}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}

                {/* Locked overlay */}
                {!nft.earned && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}

                {/* Shine on earned */}
                {nft.earned && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/5 pointer-events-none" />
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
                <div className="bg-popover border border-border/40 rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                  <p className="text-[10px] font-semibold text-foreground">{nft.name}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
