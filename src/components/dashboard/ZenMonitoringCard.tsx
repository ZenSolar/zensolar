import { lazy, Suspense } from 'react';
import { EnergyFlowErrorBoundary } from './EnergyFlowErrorBoundary';
import { OutageRecapCard } from './OutageRecapCard';
import { NewLocationPrompt } from './NewLocationPrompt';
import { OemDiagnosticsBanner } from './OemDiagnosticsBanner';
import { ProviderReauthCallout, type ReauthProvider } from './ProviderReauthCallout';
import { TeslaStatusCard } from './TeslaStatusCard';
import { SuperchargerLiveCard } from './SuperchargerLiveCard';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';

const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow })),
);
const LiveEnergyMonitoringCard = lazy(() =>
  import('./LiveEnergyMonitoringCard').then((m) => ({ default: m.LiveEnergyMonitoringCard })),
);

type ConnectedAccount = { service: string; connected: boolean; label?: string };

interface ZenMonitoringCardProps {
  connectedAccounts: ConnectedAccount[];
  providerRefresh: Partial<Record<ReauthProvider | 'tesla', { needsReauth?: boolean }>>;
}

/**
 * Zen Monitoring Card — the single hero of the dashboard.
 *
 * Answers one question: "Is my clean energy working right now?"
 *
 * Device-adaptive: only renders nodes/sub-cards for devices the user has
 * actually connected. Layout is stable — only edge activity and status
 * lines change. No "solar-powered charging" attribution label.
 *
 * Earning UX (tap-to-mint, weekly claim, today's stats) lives in the
 * Clean Energy Center, not here.
 */
export function ZenMonitoringCard({ connectedAccounts, providerRefresh }: ZenMonitoringCardProps) {
  const isConnected = (s: string) =>
    connectedAccounts.some((a) => a.service === s && a.connected);

  const hasTesla = isConnected('tesla');
  const hasSolarOrBattery =
    isConnected('enphase') || isConnected('solaredge') || isConnected('tesla');

  const { subscription, loading: subLoading } = useEnergyInsightsSubscription();
  const subscribed = !!subscription?.active;

  const reauthProviders = (['enphase', 'solaredge', 'wallbox'] as ReauthProvider[]).filter(
    (p) => providerRefresh[p]?.needsReauth,
  );

  return (
    <div className="space-y-3">
      {/* Auto-hides when no active issues */}
      <OemDiagnosticsBanner />
      {reauthProviders.map((p) => (
        <ProviderReauthCallout key={p} provider={p} />
      ))}

      <EnergyFlowErrorBoundary>
        <div
          className="rounded-xl overflow-hidden bg-card/5"
          style={{ border: '1px solid hsla(142, 76%, 36%, 0.25)' }}
        >
          {/* Unified animated flow diagram — sun → home → battery → car.
              The renderer hides nodes for OEMs not present in telemetry. */}
          {subscribed && hasSolarOrBattery ? (
            <Suspense
              fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}
            >
              <NewLocationPrompt />
              <LiveEnergyMonitoringCard hideVehicle={!hasTesla} />
            </Suspense>
          ) : (
            <Suspense
              fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}
            >
              <AnimatedEnergyFlow className="w-full" />
            </Suspense>
          )}

          {/* Tesla — car node detail. Each sub-card auto-hides when its
              state isn't active (supercharging, parked, offline, etc.). */}
          {hasTesla && (
            <div className="px-1 pb-1">
              <div className="mt-3">
                <SuperchargerLiveCard />
              </div>
              <div className="mt-3">
                <TeslaStatusCard />
              </div>
            </div>
          )}

          {/* Outage recap — auto-hides when no recent outage */}
          <div className="mt-3 px-1 pb-2">
            <OutageRecapCard />
          </div>
        </div>
      </EnergyFlowErrorBoundary>
    </div>
  );
}
