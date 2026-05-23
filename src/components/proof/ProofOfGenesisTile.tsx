import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, Zap, Leaf, ShieldCheck } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

/**
 * Marquee entry point for the Proof-of-Genesis receipt — the IP bread &
 * butter (verified kWh → token split → CO₂ offset → device watermark).
 *
 * Lives on the Wallet page beneath RecentMintProofs and inside the per-mint
 * ReceiptDrawer (compact variant) so casual users get the snappy native
 * receipt first, then are one tap away from the full narrative.
 */
export function ProofOfGenesisTile({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const basePath = useBasePath();
  const to = `${basePath}/proof-of-genesis-receipt-preview`;

  if (variant === 'compact') {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent-warm/10 px-3.5 py-3 transition-all hover:border-primary/60 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.4)] active:scale-[0.99]"
        aria-label="Open Proof-of-Genesis receipt"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">Proof-of-Genesis</p>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">IP</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              See the verified energy → token → CO₂ chain
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent-warm/10 p-5 transition-all hover:border-primary/60 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)] active:scale-[0.99]"
        aria-label="Open Proof-of-Genesis receipt"
      >
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent-warm/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.6)]">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Proof-of-Genesis</p>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">IP</span>
                </div>
                <h3 className="text-base font-bold text-foreground leading-tight mt-0.5">
                  The receipt behind the receipt
                </h3>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0 mt-1" />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Every Tap-to-Mint™ is backed by a verified chain: real kWh from your
            devices, watermarked on-chain, split 75/20/3/2, and offset against
            CO₂. This is the proof.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/40 border border-border/40">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">Verified kWh</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/40 border border-border/40">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-cool" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">Watermarked</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/40 border border-border/40">
              <Leaf className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">CO₂ offset</span>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span>View the proof</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
