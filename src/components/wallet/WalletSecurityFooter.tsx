import { Check, Copy, ExternalLink, Fingerprint, KeyRound, Layers, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS } from '@/lib/wagmi';
import type { WalletCapabilities } from '@/hooks/useWalletCapabilities';

interface WalletSecurityFooterProps {
  walletAddress: string;
  capabilities: WalletCapabilities;
  explorerBase: string;
  network: string;
}

/**
 * Tier 5 — Security footer.
 * Calm status rows: how the wallet is secured, which network, which contracts.
 * Capability rows read from live detection so they light up as 4337 features
 * are enabled instead of promising something that is not on yet.
 */
export function WalletSecurityFooter({
  walletAddress,
  capabilities,
  explorerBase,
  network,
}: WalletSecurityFooterProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = [
    {
      icon: capabilities.passkeySecured ? Fingerprint : KeyRound,
      label: capabilities.passkeySecured ? 'Secured by passkey' : 'Secured by your wallet app',
      value: capabilities.passkeySecured ? 'No seed phrase' : 'External signer',
      good: capabilities.passkeySecured,
    },
    {
      icon: ShieldCheck,
      label: 'Sponsored gas',
      value: capabilities.sponsoredGas ? 'Active' : 'Not enabled',
      good: capabilities.sponsoredGas,
    },
    {
      icon: Layers,
      label: 'Batched claims',
      value: capabilities.atomicBatch ? 'Supported' : 'One prompt per claim',
      good: capabilities.atomicBatch,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <p className="flex-1 truncate font-mono text-xs text-muted-foreground">
            {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
          </p>
          <button onClick={copy} aria-label="Copy address" className="rounded-lg p-1.5 hover:bg-muted/50">
            {copied ? <Check className="h-3.5 w-3.5 text-eco" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <a
            href={`${explorerBase}/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on explorer"
            className="rounded-lg p-1.5 hover:bg-muted/50"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>

        <div className="divide-y divide-border/40">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${r.good ? 'text-eco' : 'text-muted-foreground'}`} />
                <span className="flex-1 text-[11px] text-foreground">{r.label}</span>
                <span className={`text-[11px] ${r.good ? 'text-eco' : 'text-muted-foreground'}`}>{r.value}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 px-4 py-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-eco" />
            {network}
          </span>
          <a
            href={`${explorerBase}/token/${ZSOLAR_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline"
          >
            $ZSOLAR contract
          </a>
          <a
            href={`${explorerBase}/token/${ZSOLAR_NFT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline"
          >
            Medallion contract
          </a>
        </div>
      </div>

      <p className="px-2 text-[10px] leading-relaxed text-muted-foreground/80">
        Only your ZenSolar tokens and medallions are shown. ZenSolar cannot access other assets in this wallet.
      </p>
    </div>
  );
}
