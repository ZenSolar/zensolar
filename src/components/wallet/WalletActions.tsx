import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Sparkles, Zap } from 'lucide-react';
import type { WalletCapabilities } from '@/hooks/useWalletCapabilities';

interface WalletActionsProps {
  capabilities: WalletCapabilities;
  pendingMints: number;
  onReceive: () => void;
}

interface ActionSpec {
  key: string;
  label: string;
  icon: typeof Zap;
  enabled: boolean;
  /** Plain reason shown when disabled — never hide the action. */
  reason?: string;
  gasless?: boolean;
  onClick?: () => void;
}

/**
 * Tier 2 — Actions row.
 * Each action shows a gasless badge when the paymaster covers it, and is
 * greyed with a plain reason when unavailable. Nothing is hidden, so the
 * capability surface stays honest as 4337 features get enabled.
 */
export function WalletActions({ capabilities, pendingMints, onReceive }: WalletActionsProps) {
  const navigate = useNavigate();

  const actions: ActionSpec[] = [
    {
      key: 'mint',
      label: pendingMints > 0 ? `Claim ${pendingMints}` : 'Mint',
      icon: Sparkles,
      enabled: true,
      gasless: capabilities.sponsoredGas,
      onClick: () => navigate('/'),
    },
    {
      key: 'send',
      label: 'Send',
      icon: ArrowUpRight,
      enabled: false,
      reason: 'Transfers open at mainnet launch',
    },
    {
      key: 'receive',
      label: 'Receive',
      icon: ArrowDownLeft,
      enabled: true,
      onClick: onReceive,
    },
    {
      key: 'buy',
      label: 'Buy USDC',
      icon: CreditCard,
      enabled: capabilities.onramp,
      reason: 'Onramp not enabled on this network',
    },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              disabled={!a.enabled}
              onClick={a.onClick}
              title={a.enabled ? undefined : a.reason}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
                a.enabled
                  ? 'border-border/50 bg-muted/25 hover:border-primary/40 hover:bg-primary/[0.05]'
                  : 'cursor-not-allowed border-border/30 bg-muted/10 opacity-45'
              }`}
            >
              <Icon className={`h-4 w-4 ${a.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-[11px] font-medium leading-none text-foreground">{a.label}</span>
              {a.gasless && (
                <span className="absolute -top-1.5 right-1 rounded-full border border-eco/30 bg-eco/15 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-eco">
                  Free gas
                </span>
              )}
            </button>
          );
        })}
      </div>

      {actions.some((a) => !a.enabled) && (
        <p className="mt-2.5 px-1 text-[10px] leading-relaxed text-muted-foreground/80">
          {actions
            .filter((a) => !a.enabled && a.reason)
            .map((a) => `${a.label}: ${a.reason}`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}
