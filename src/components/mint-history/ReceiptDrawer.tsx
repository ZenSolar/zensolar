import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  Coins,
  Copy,
  ExternalLink,
  Flame,
  Hash,
  Share2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import { ZSOLAR_NFT_ADDRESS, ZSOLAR_TOKEN_ADDRESS } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBasePath } from "@/hooks/useBasePath";

export interface MintReceiptTx {
  id: string;
  tx_hash: string;
  block_number: string | null;
  action: string;
  wallet_address: string;
  tokens_minted: number;
  nfts_minted: number[];
  nft_names: string[];
  status: string;
  created_at: string;
  chain_hash?: string | null;
  /** Per-source kWh contributions (or miles for ev_miles). Populated by
   *  recent mints; legacy rows may be null. */
  source_breakdown?: Record<string, number> | null;
  kwh_delta?: number | null;
  miles_delta?: number | null;
}

/** Visual meta for each mintable energy source — chip color + icon + unit. */
const SOURCE_META: Record<string, { label: string; unit: 'kWh' | 'mi'; accent: string; dot: string }> = {
  solar:         { label: 'Solar Production',     unit: 'kWh', accent: 'border-amber-400/40 text-amber-300 bg-amber-400/10',   dot: 'bg-amber-400' },
  battery:       { label: 'Battery Export',       unit: 'kWh', accent: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10', dot: 'bg-emerald-400' },
  supercharger:  { label: 'Tesla Supercharging',  unit: 'kWh', accent: 'border-[hsl(0_85%_55%)]/40 text-[hsl(0_85%_70%)] bg-[hsl(0_85%_45%)]/10', dot: 'bg-[hsl(0_85%_55%)]' },
  home_charger:  { label: 'Home Charging',        unit: 'kWh', accent: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',     dot: 'bg-cyan-400' },
  charging:      { label: 'EV Charging',          unit: 'kWh', accent: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',     dot: 'bg-cyan-400' },
  ev_charging:   { label: 'EV Charging',          unit: 'kWh', accent: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',     dot: 'bg-cyan-400' },
  ev_miles:      { label: 'EV Miles Driven',      unit: 'mi',  accent: 'border-green-400/40 text-green-300 bg-green-400/10',  dot: 'bg-green-400' },
};

type SourceSummary = {
  primaryKey: string;
  primaryMeta: typeof SOURCE_META[string];
  primaryValue: number;
  total: number;
  isMixed: boolean;
  others: { key: string; meta: typeof SOURCE_META[string]; value: number; pct: number }[];
};

function summarizeSource(tx: MintReceiptTx): SourceSummary | null {
  const breakdown = tx.source_breakdown ?? null;
  // Fallback: single-source EV from miles_delta when source_breakdown absent
  if ((!breakdown || Object.keys(breakdown).length === 0)) {
    if (tx.miles_delta && tx.miles_delta > 0) {
      const meta = SOURCE_META.ev_miles;
      return { primaryKey: 'ev_miles', primaryMeta: meta, primaryValue: Number(tx.miles_delta), total: Number(tx.miles_delta), isMixed: false, others: [] };
    }
    return null;
  }
  const entries = Object.entries(breakdown)
    .filter(([k, v]) => SOURCE_META[k] && Number(v) > 0)
    .map(([k, v]) => ({ key: k, meta: SOURCE_META[k], value: Number(v) }))
    .sort((a, b) => b.value - a.value);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, e) => s + e.value, 0);
  const primary = entries[0];
  const others = entries.slice(1).map((e) => ({ ...e, pct: Math.round((e.value / total) * 100) }));
  const isMixed = others.some((o) => o.pct >= 5);
  return { primaryKey: primary.key, primaryMeta: primary.meta, primaryValue: primary.value, total, isMixed, others };
}

interface ReceiptDrawerProps {
  tx: MintReceiptTx | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_META: Record<string, { label: string; description: string }> = {
  register: { label: "Welcome NFT", description: "Onboarding mint — Welcome NFT issued on Base." },
  "mint-rewards": { label: "$ZSOLAR Token Mint", description: "Energy-backed mint. 75% to you, 20% burned, 3% LP, 2% treasury." },
  "mint-combos": { label: "Combo Achievement", description: "Combo NFTs awarded for hitting multi-source milestones." },
  "claim-milestone-nfts": { label: "Milestone Claim", description: "Milestone NFT claimed on-chain." },
};

/** Brand mint-split — keep in sync with mem://features/tokenomics */
const SPLIT = [
  { key: "user", label: "You", pct: 75, color: "bg-primary", icon: Wallet },
  { key: "burn", label: "Burn", pct: 20, color: "bg-destructive/80", icon: Flame },
  { key: "lp", label: "LP Seed", pct: 3, color: "bg-accent-cool", icon: Sparkles },
  { key: "treasury", label: "Treasury", pct: 2, color: "bg-accent-warm", icon: ShieldCheck },
] as const;

function getExplorerUrl(txHash: string) {
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function ReceiptDrawer({ tx, open, onOpenChange }: ReceiptDrawerProps) {
  const basePath = useBasePath();
  if (!tx) return null;

  const meta = ACTION_META[tx.action] ?? { label: tx.action, description: "On-chain transaction." };
  const userTokens = Number(tx.tokens_minted) || 0;
  // tokens_minted is already the 75% user share — derive grand total for split viz
  const grandTotal = userTokens > 0 ? userTokens / 0.75 : 0;
  const hasSplit = userTokens > 0;
  const pogReceiptUrl = `${basePath}/proof-of-genesis-receipt-preview`;
  const verifyUrl = tx.chain_hash
    ? `${typeof window !== "undefined" ? window.location.origin : "https://beta.zen.solar"}/verify/${tx.chain_hash}`
    : null;

  const buildReceiptText = () => {
    const lines = [
      "🌞 ZenSolar Mint Receipt",
      "",
      `Action: ${meta.label}`,
      `Date: ${format(new Date(tx.created_at), "PPpp")}`,
      userTokens > 0 ? `Earned: ${userTokens.toLocaleString()} $ZSOLAR (75% user share)` : null,
      tx.nft_names?.length ? `NFTs: ${tx.nft_names.join(", ")}` : null,
      `Wallet: ${tx.wallet_address}`,
      `Tx: ${tx.tx_hash}`,
      tx.block_number ? `Block: ${tx.block_number}` : null,
      "",
      verifyUrl ? `Tamper-evident receipt: ${verifyUrl}` : null,
      `Verify on BaseScan: ${getExplorerUrl(tx.tx_hash)}`,
      "",
      "Currency from Energy · zen.solar",
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildReceiptText();
    // Prefer the hash-chained verify link — independently auditable, no PII.
    const url = verifyUrl ?? getExplorerUrl(tx.tx_hash);
    try {
      if (navigator.share) {
        await navigator.share({ title: "ZenSolar Mint Receipt", text, url });
        return;
      }
    } catch {
      /* user cancelled — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard");
    } catch {
      toast.error("Could not copy receipt");
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(tx.tx_hash);
      toast.success("Tx hash copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="max-h-[92dvh] focus:outline-none"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Scrollable inner column so the drag-handle + safe area stay pinned */}
        <div className="overflow-y-auto overscroll-contain">
          <div className="relative bg-gradient-to-br from-primary/15 via-card to-accent-warm/10 px-6 pt-4 pb-5 border-b">
            <DrawerClose
              aria-label="Close receipt"
              className="absolute right-3 top-3 z-10 rounded-full p-2 bg-background/70 backdrop-blur border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </DrawerClose>
            <DrawerHeader className="p-0 text-left space-y-2">
              <div className="flex items-center gap-2 pr-10">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
                  <Coins className="h-4 w-4 text-primary-foreground" />
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase tracking-wider">
                  Quick View
                </Badge>
                <Badge variant="secondary" className="ml-auto text-[10px] capitalize">
                  {tx.status}
                </Badge>
              </div>
              <DrawerTitle className="text-xl tracking-tight">{meta.label}</DrawerTitle>
              <DrawerDescription className="text-xs leading-relaxed">
                {meta.description}
              </DrawerDescription>
              <p className="text-[11px] text-muted-foreground tabular-nums pt-1">
                {format(new Date(tx.created_at), "PPpp")}
              </p>
            </DrawerHeader>
          </div>

          <div
            className="px-6 py-6 space-y-6"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
          >

          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your $ZSOLAR</p>
              <p className="text-2xl font-bold tabular-nums leading-tight mt-1">
                {userTokens.toLocaleString()}
              </p>
              {hasSplit && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  of {Math.round(grandTotal).toLocaleString()} minted
                </p>
              )}
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NFTs</p>
              <p className="text-2xl font-bold tabular-nums leading-tight mt-1">
                {tx.nfts_minted?.length ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">in this transaction</p>
            </div>
          </div>

          {/* Split visualization */}
          {hasSplit && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Mint Split
                </h3>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Brand: 75 / 20 / 3 / 2
                </span>
              </div>

              {/* Stacked bar */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {SPLIT.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full", s.color)}
                    title={`${s.label} · ${s.pct}%`}
                  />
                ))}
              </div>

              <ul className="grid grid-cols-2 gap-2 pt-1">
                {SPLIT.map((s) => {
                  const tokens = Math.round((grandTotal * s.pct) / 100);
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.key}
                      className="flex items-center gap-2 rounded-lg border bg-card/50 px-2.5 py-1.5"
                    >
                      <span className={cn("h-2 w-2 rounded-full", s.color)} aria-hidden />
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] font-medium">{s.label}</span>
                      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                        {tokens.toLocaleString()}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground/70">
                        {s.pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* NFTs */}
          {tx.nft_names?.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-accent-rare" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">NFTs Minted</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tx.nft_names.map((name, i) => (
                  <Badge key={`${name}-${i}`} variant="secondary" className="text-[11px]">
                    {name}
                    {tx.nfts_minted?.[i] != null && (
                      <span className="ml-1 text-muted-foreground font-mono">#{tx.nfts_minted[i]}</span>
                    )}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* On-chain proof */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">On-Chain Proof</h3>
            </div>

            <div className="rounded-xl border bg-card divide-y">
              <button
                onClick={handleCopyHash}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
              >
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction</p>
                  <p className="text-xs font-mono truncate">{shortHash(tx.tx_hash)}</p>
                </div>
                <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>

              <div className="grid grid-cols-2">
                <div className="px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Block</p>
                  <p className="text-xs font-mono">{tx.block_number ?? "Pending"}</p>
                </div>
                <div className="px-3 py-2 border-l">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wallet</p>
                  <p className="text-xs font-mono truncate">{shortHash(tx.wallet_address)}</p>
                </div>
              </div>

              <a
                href={`https://sepolia.basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
              >
                <Coins className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs flex-1">$ZSOLAR contract</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </a>

              {tx.nfts_minted?.length > 0 && (
                <a
                  href={`https://sepolia.basescan.org/token/${ZSOLAR_NFT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
                >
                  <Award className="h-3.5 w-3.5 text-accent-rare shrink-0" />
                  <span className="text-xs flex-1">NFT contract</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </a>
              )}

              {verifyUrl && (
                <Link
                  to={`/verify/${tx.chain_hash}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs flex-1">
                    Tamper-evident receipt
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">public</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </Link>
              )}
            </div>
          </section>

          {/* Primary CTA — the Proof-of-Genesis receipt is THE receipt.
              This drawer is just a quick peek; the full audit trail (verified
              kWh → split → CO₂ tons → device watermark → BTC PoW comparison)
              lives on one shareable URL. */}
          <Link
            to={pogReceiptUrl}
            onClick={() => onOpenChange(false)}
            className="group relative block overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 via-primary/10 to-accent-warm/15 p-4 transition-all hover:border-primary/70 hover:shadow-[0_0_32px_-8px_hsl(var(--primary)/0.55)] active:scale-[0.99]"
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.6)] flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Proof-of-Genesis™</p>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 leading-none">IP</span>
                </div>
                <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                  Open the full receipt
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                  Verified kWh → split math → CO₂ tons offset → device watermark
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
            </div>
          </Link>

          {/* Secondary actions */}
          <div className="flex gap-2 pt-1">
            <Button asChild variant="outline" className="flex-1" size="sm">
              <a href={getExplorerUrl(tx.tx_hash)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                BaseScan
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Quick share
            </Button>
          </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
