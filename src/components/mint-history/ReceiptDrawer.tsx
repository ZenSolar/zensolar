import { format } from "date-fns";
import { motion } from "framer-motion";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ZSOLAR_NFT_ADDRESS, ZSOLAR_TOKEN_ADDRESS } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  if (!tx) return null;

  const meta = ACTION_META[tx.action] ?? { label: tx.action, description: "On-chain transaction." };
  const userTokens = Number(tx.tokens_minted) || 0;
  // tokens_minted is already the 75% user share — derive grand total for split viz
  const grandTotal = userTokens > 0 ? userTokens / 0.75 : 0;
  const hasSplit = userTokens > 0;

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
      `Verify on BaseScan: ${getExplorerUrl(tx.tx_hash)}`,
      "",
      "Currency from Energy · zen.solar",
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildReceiptText();
    const url = getExplorerUrl(tx.tx_hash);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-primary/15 via-card to-accent-warm/10 px-6 pt-6 pb-5 border-b">
          <SheetHeader className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
                <Coins className="h-4 w-4 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase tracking-wider">
                Mint Receipt
              </Badge>
              <Badge variant="secondary" className="ml-auto text-[10px] capitalize">
                {tx.status}
              </Badge>
            </div>
            <SheetTitle className="text-xl tracking-tight">{meta.label}</SheetTitle>
            <SheetDescription className="text-xs leading-relaxed">
              {meta.description}
            </SheetDescription>
            <p className="text-[11px] text-muted-foreground tabular-nums pt-1">
              {format(new Date(tx.created_at), "PPpp")}
            </p>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
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
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full" variant="default">
              <a href={getExplorerUrl(tx.tx_hash)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify on BaseScan
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share receipt
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
