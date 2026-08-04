import { useEffect, useMemo, useState } from 'react';
import { CHAIN_ID } from '@/lib/wagmi';
import { useSafeAccount } from '@/hooks/useSafeWagmi';

/**
 * EIP-5792 capability detection for the ZenSolar wallet sheet.
 *
 * The redesigned wallet exposes 4337-era actions (sponsored gas, batched
 * claim-all, onramp) but ZenSolar is still on Base Sepolia with no paymaster
 * configured. Rather than shipping buttons that fail, every action is gated
 * on a *detected* capability and renders disabled with a plain-language
 * reason until the underlying config is turned on.
 *
 * Nothing here mutates state — it is a read-only probe.
 */
export interface WalletCapabilities {
  /** Wallet is a Coinbase Smart Wallet (passkey-secured, ERC-4337). */
  isSmartWallet: boolean;
  /** Passkey auth in use (no seed phrase). */
  passkeySecured: boolean;
  /** Paymaster will sponsor gas for this chain. */
  sponsoredGas: boolean;
  /** wallet_sendCalls / atomic batch supported → claim-all in one prompt. */
  atomicBatch: boolean;
  /** Coinbase onramp available for USDC purchases. */
  onramp: boolean;
  /** Spend permissions / sub-accounts (pre-authorized silent mints). */
  spendPermissions: boolean;
  /** Still probing the provider. */
  isProbing: boolean;
}

const DISABLED: WalletCapabilities = {
  isSmartWallet: false,
  passkeySecured: false,
  sponsoredGas: false,
  atomicBatch: false,
  onramp: false,
  spendPermissions: false,
  isProbing: false,
};

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function useWalletCapabilities(): WalletCapabilities {
  const { connector, isConnected, address } = useSafeAccount();
  const [probe, setProbe] = useState<{
    done: boolean;
    sponsoredGas: boolean;
    atomicBatch: boolean;
  }>({ done: false, sponsoredGas: false, atomicBatch: false });

  const isSmartWallet = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zensolar_wallet_type') === 'coinbase_smart') return true;
    }
    const id = connector?.id?.toLowerCase() ?? '';
    const name = connector?.name?.toLowerCase() ?? '';
    return id.includes('coinbase') || name.includes('coinbase') || name.includes('base');
  }, [connector]);

  useEffect(() => {
    let cancelled = false;
    if (!isConnected || !connector || !address) {
      setProbe({ done: true, sponsoredGas: false, atomicBatch: false });
      return;
    }

    (async () => {
      try {
        const provider = (await connector.getProvider?.()) as Eip1193 | undefined;
        if (!provider?.request) throw new Error('no provider');

        const raw = (await provider.request({
          method: 'wallet_getCapabilities',
          params: [address],
        })) as Record<string, Record<string, { supported?: boolean }>> | undefined;

        const hexChain = `0x${CHAIN_ID.toString(16)}`;
        const forChain = raw?.[hexChain] ?? raw?.[String(CHAIN_ID)] ?? {};

        if (cancelled) return;
        setProbe({
          done: true,
          sponsoredGas: forChain?.paymasterService?.supported === true,
          atomicBatch:
            forChain?.atomicBatch?.supported === true ||
            (forChain as Record<string, { status?: string }>)?.atomic?.status === 'supported',
        });
      } catch {
        if (cancelled) return;
        // Provider does not implement EIP-5792 — treat every advanced
        // capability as unavailable rather than guessing.
        setProbe({ done: true, sponsoredGas: false, atomicBatch: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, connector, address]);

  if (!isConnected) return DISABLED;

  return {
    isSmartWallet,
    passkeySecured: isSmartWallet,
    sponsoredGas: probe.sponsoredGas,
    atomicBatch: probe.atomicBatch,
    // Onramp and spend permissions require Coinbase Developer Platform config
    // that this project does not have on testnet. Detected, never assumed.
    onramp: false,
    spendPermissions: false,
    isProbing: !probe.done,
  };
}
