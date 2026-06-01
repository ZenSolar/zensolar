import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, Zap, Leaf, ShieldCheck, Clock } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { useLatestMintReceipt } from '@/hooks/useLatestMintReceipt';

type Verified = boolean | 'auto';

/**
 * Marquee entry point for the Proof-of-Genesis receipt — the IP bread &
 * butter (verified kWh → token split → CO₂ offset → device watermark).
 *
 * Lives on the Wallet page beneath RecentMintProofs and inside the per-mint
 * ReceiptDrawer (compact variant) so casual users get the snappy native
 * receipt first, then are one tap away from the full narrative.
 *
 * `verified` drives the on-chain status pill:
 *   - true        → green "Verified on-chain"
 *   - false       → amber "Pending proof"
 *   - 'auto'      → resolved from the user's latest mint via useLatestMintReceipt
 */
export function ProofOfGenesisTile({
  variant = 'full',
  verified = 'auto',
}: {
  variant?: 'full' | 'compact';
  verified?: Verified;
}) {
  const basePath = useBasePath();
  const to = `${basePath}/proof-of-genesis-receipt-preview`;

  // Resolve verification status — only call the hook in 'auto' mode
  const live = useLatestMintReceipt();
  const resolvedVerified: boolean | null = (() => {
    if (verified === true) return true;
    if (verified === false) return false;
    // auto
    if (live.status === 'loading') return null;
    if (live.status === 'ready') {
      const h = live.receipt?.tx_hash;
      return typeof h === 'string' && h.startsWith('0x') && h.length >= 10;
    }
    return false; // empty / error → no on-chain proof yet
  })();

  if (variant === 'compact') {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent-warm/10 px-3.5 py-3 transition-all hover:border-primary/60 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.4)] active:scale-[0.99]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Open Proof-of-Genesis receipt"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground leading-tight">Proof-of-Genesis</p>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 leading-none">IP</span>
              <StatusPill verified={resolvedVerified} size="xs" />
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight mt-1 truncate">
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
        className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent-warm/10 p-4 sm:p-5 transition-all hover:border-primary/60 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)] active:scale-[0.99]"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Open Proof-of-Genesis receipt"
      >
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent-warm/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.6)] flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Proof-of-Genesis</p>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 leading-none">IP</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight mt-0.5">
                  The receipt behind the receipt
                </h3>
                <div className="mt-1.5">
                  <StatusPill verified={resolvedVerified} size="sm" />
                </div>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0 mt-1" />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-3 sm:mb-4">
            Every Proof of Genesis™ is backed by a verified chain: real kWh from your
            devices, watermarked on-chain, split 50/25/20/5, and offset against
            CO₂. This is the proof.
          </p>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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

          <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span>View the proof</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatusPill({ verified, size = 'sm' }: { verified: boolean | null; size?: 'xs' | 'sm' }) {
  const isXs = size === 'xs';
  const base = isXs
    ? 'text-[9px] px-1.5 py-0.5 gap-1'
    : 'text-[10px] px-2 py-0.5 gap-1.5';

  if (verified === null) {
    return (
      <span className={`inline-flex items-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground uppercase tracking-wider leading-none ${base}`}>
        <Clock className={isXs ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        Checking
      </span>
    );
  }
  if (verified) {
    return (
      <span className={`inline-flex items-center rounded-full border border-primary/40 bg-primary/15 text-primary uppercase tracking-wider font-semibold leading-none ${base}`}>
        <span className={`${isXs ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]`} />
        Verified on-chain
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full border border-accent-warm/40 bg-accent-warm/10 text-accent-warm uppercase tracking-wider font-semibold leading-none ${base}`}>
      <span className={`${isXs ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full bg-accent-warm`} />
      Awaiting proof
    </span>
  );
}
