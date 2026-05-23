import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, MoreHorizontal, Wallet, Zap, Home, Sparkles, Images, Activity } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * V2Dashboard — "Linear Mission Control" direction.
 *
 * Tesla-grade web3 typography (Sora display, JetBrains Mono numerals,
 * uppercase micro-labels with wide tracking) over the existing emerald-on-
 * near-black brand. Replaces the legacy ZenSolarDashboard for the /v2
 * sandbox route only. /demo and / are unchanged.
 *
 * Structure (mobile-first 390x844):
 *   1. Top brand bar (zensolar wordmark + minimal action)
 *   2. Welcome + wallet summary (mono balance)
 *   3. Vertical step timeline hero (Identity ✓ → Wallet (active) → Energy)
 *   4. Energy Center PREVIEW grid (grayscale + opacity-30 + "LOCKED")
 *   5. Bottom tab bar handled by AppLayout / DemoLayout — we render content only.
 */
export function V2Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { activityData, connectedAccounts } = useDashboardData();

  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || 'friend';
  const hasWallet = !!profile?.wallet_address;
  const hasEnergy = connectedAccounts.some((a) => a.connected);
  const balanceUsd = useMemo(() => {
    const tokens = Number(activityData?.totalMintedTokens ?? 0);
    return (tokens * 0.1).toFixed(2);
  }, [activityData]);
  const tokens = Number(activityData?.totalMintedTokens ?? 0);

  const steps = [
    {
      n: '01',
      title: 'Identity Verified',
      desc: 'Genesis protocol initialized.',
      done: true,
      active: false,
    },
    {
      n: '02',
      title: hasWallet ? 'Wallet Connected' : 'Connect Wallet',
      desc: hasWallet
        ? 'On-chain assets linked.'
        : 'Link your on-chain assets to track carbon offsets.',
      done: hasWallet,
      active: !hasWallet,
      cta: hasWallet
        ? undefined
        : {
            label: 'Initialize Link',
            onClick: () =>
              (window.location.href = '/onboarding?step=wallet&returnTo=/v2'),
          },
    },
    {
      n: '03',
      title: hasEnergy ? 'Energy Synced' : 'Sync Energy',
      desc: hasEnergy
        ? `${connectedAccounts.filter((a) => a.connected).length} provider(s) connected.`
        : 'Connect your solar, EV, or charging provider.',
      done: hasEnergy,
      active: hasWallet && !hasEnergy,
      cta:
        hasWallet && !hasEnergy
          ? {
              label: 'Connect Provider',
              onClick: () =>
                (window.location.href =
                  '/onboarding?step=energy&returnTo=/v2'),
            }
          : undefined,
    },
  ];

  return (
    <div className="min-h-[100svh] bg-background text-foreground font-[Sora,system-ui,sans-serif]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <Link to="/v2" className="flex items-center gap-2">
          <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/70">
            /v2
          </span>
        </Link>
        <button
          aria-label="Menu"
          onClick={() => navigate('/v2/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-primary/40 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {/* Welcome + wallet summary */}
      <section className="px-6 pb-2">
        <h1 className="text-3xl font-bold tracking-tight mb-3 capitalize">
          Welcome, {firstName}
        </h1>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              Available Balance
            </p>
            <p className="font-mono text-3xl font-light tracking-tighter">
              ${balanceUsd}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-1">
              {tokens.toLocaleString()} ZSOLAR · $0.10
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-primary">
            <Wallet className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* Mission Control timeline */}
      <section className="px-8 pt-8 pb-2">
        <div className="relative">
          <div className="absolute left-[15px] top-6 bottom-6 w-px bg-white/10" />
          <div className="space-y-8">
            {steps.map((s) => (
              <TimelineStep key={s.n} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Energy Center preview */}
      <section className="px-6 pt-8 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">
            Energy Center Preview
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {hasEnergy ? 'Live' : 'Locked'}
          </span>
        </div>

        <div
          className={cn(
            'grid grid-cols-2 gap-3 transition-all',
            !hasEnergy && 'opacity-30 grayscale pointer-events-none select-none',
          )}
          aria-hidden={!hasEnergy}
        >
          <PreviewTile
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Solar Prod"
            value="42.8"
            unit="kWh"
          />
          <PreviewTile
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Exported"
            value="18.2"
            unit="kWh"
          />
          <PreviewTile
            icon={<Activity className="h-3.5 w-3.5" />}
            label="EV Miles"
            value="126"
            unit="mi"
          />
          <PreviewTile
            icon={<Images className="h-3.5 w-3.5" />}
            label="Tokens"
            value="84.2"
            unit="ZSOLAR"
          />
        </div>

        {!hasEnergy && (
          <p className="text-center text-xs text-muted-foreground mt-5">
            Complete the steps above to unlock your live Energy Center.
          </p>
        )}
      </section>
    </div>
  );
}

function TimelineStep({
  n,
  title,
  desc,
  done,
  active,
  cta,
}: {
  n: string;
  title: string;
  desc: string;
  done: boolean;
  active: boolean;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: done ? 1 : active ? 1 : 0.45, x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative pl-10"
    >
      <div
        className={cn(
          'absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background',
          done && 'bg-primary',
          active && 'bg-card ring-2 ring-primary',
          !done && !active && 'bg-card',
        )}
      >
        {done ? (
          <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
        ) : active ? (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        )}
      </div>

      <p
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.25em] font-bold mb-1',
          done || active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        Step {n}
      </p>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>

      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 w-full rounded-lg bg-primary py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-transform active:scale-[0.98] inline-flex items-center justify-center gap-2 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function PreviewTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
        {icon}
        <p className="font-mono text-[9px] uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <p className="font-mono text-xl font-light tracking-tighter">
        {value}
        <span className="ml-1 text-[10px] uppercase text-muted-foreground tracking-widest">
          {unit}
        </span>
      </p>
    </div>
  );
}

export default V2Dashboard;
