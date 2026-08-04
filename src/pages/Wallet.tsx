import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wallet as WalletIcon, QrCode, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { useProfile } from '@/hooks/useProfile';
import { useOnChainHoldings } from '@/hooks/useOnChainHoldings';
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities';
import { useProvenanceLedger } from '@/hooks/useProvenanceLedger';

import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/empty-state';
import { SEO } from '@/components/SEO';
import { PageTransition } from '@/components/layout/PageTransition';
import { JargonTip } from '@/components/ui/jargon-tip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { WalletValueHeader } from '@/components/wallet/WalletValueHeader';
import { WalletActions } from '@/components/wallet/WalletActions';
import { ProvenanceLedger } from '@/components/wallet/ProvenanceLedger';
import { MedallionStrip } from '@/components/wallet/MedallionStrip';
import { WalletSecurityFooter } from '@/components/wallet/WalletSecurityFooter';
import { ZppaStatusWidget } from '@/components/wallet/ZppaStatusWidget';
import { ProofOfGenesisTile } from '@/components/proof/ProofOfGenesisTile';

/**
 * Indicative pre-liquidity reference price. There is no market yet, so every
 * surface that uses it must carry the caveat rendered in WalletValueHeader.
 */
const INDICATIVE_TOKEN_PRICE = 0.1;

const NETWORK_LABEL = 'Base Sepolia';
const EXPLORER_BASE = 'https://sepolia.basescan.org';

/**
 * ZenSolar wallet — an energy receipt book that happens to hold a token.
 *
 * Five tiers, deliberately in this order:
 *   1. Value header      — balance, indicative USD, lifetime kWh
 *   2. Actions           — capability-gated, gasless badges when sponsored
 *   3. Provenance ledger — device + delta + Merkle proof per credit
 *   4. Medallions        — milestone badges
 *   5. Security footer   — passkey status, network, contracts
 *
 * No price charts, no swap, nothing speculative.
 */
export default function Wallet() {
  const { profile, isLoading: profileLoading } = useProfile();
  const walletAddress = profile?.wallet_address ?? undefined;

  const { tokenBalance, nftTokenIds, isLoading: holdingsLoading, refetch } =
    useOnChainHoldings(walletAddress);
  const capabilities = useWalletCapabilities();
  const { entries, lifetimeKwh, isLoading: ledgerLoading, refetch: refetchLedger } =
    useProvenanceLedger(25);

  const [balanceHidden, setBalanceHidden] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedBalance = useMemo(
    () =>
      parseFloat(tokenBalance || '0').toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [tokenBalance],
  );

  const usdValue = parseFloat(tokenBalance || '0') * INDICATIVE_TOKEN_PRICE;

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  if (profileLoading) return <PageSkeleton variant="default" />;

  if (!walletAddress) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <SEO title="Wallet | ZenSolar" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-xl shadow-primary/10">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">Set up your wallet</h1>
          <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Connect a <JargonTip term="wallet">wallet</JargonTip> to hold your{' '}
            <JargonTip term="zsolar">$ZSOLAR</JargonTip> and the proof behind every credit.
          </p>
          <Button size="lg" asChild className="h-12 gap-2 px-8">
            <Link to="/onboarding?step=wallet">
              <WalletIcon className="h-4 w-4" />
              Connect wallet
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleRefresh = () => {
    refetch();
    refetchLedger();
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-3 px-4 py-5">
        <SEO title="My Wallet | ZenSolar" />

        <h1 className="sr-only">ZenSolar wallet</h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-3"
        >
          <WalletValueHeader
            formattedBalance={formattedBalance}
            usdValue={usdValue}
            lifetimeKwh={lifetimeKwh}
            isLoading={holdingsLoading || ledgerLoading}
            hidden={balanceHidden}
            onToggleHidden={() => setBalanceHidden((v) => !v)}
            onRefresh={handleRefresh}
            network={NETWORK_LABEL}
          />

          <WalletActions
            capabilities={capabilities}
            pendingMints={0}
            onReceive={() => setReceiveOpen(true)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="space-y-3"
        >
          <ProvenanceLedger entries={entries} isLoading={ledgerLoading} />
          <MedallionStrip tokenIds={nftTokenIds} isLoading={holdingsLoading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="space-y-3"
        >
          <ZppaStatusWidget />
          <ProofOfGenesisTile />
          <WalletSecurityFooter
            walletAddress={walletAddress}
            capabilities={capabilities}
            explorerBase={EXPLORER_BASE}
            network={NETWORK_LABEL}
          />
        </motion.div>
      </div>

      <Sheet open={receiveOpen} onOpenChange={setReceiveOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4 text-primary" />
              Receive
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send only {NETWORK_LABEL} assets to this address. Anything sent on another network is unrecoverable.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="break-all font-mono text-xs leading-relaxed text-foreground">{walletAddress}</p>
            </div>
            <Button onClick={copyAddress} className="h-11 w-full gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy address'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
