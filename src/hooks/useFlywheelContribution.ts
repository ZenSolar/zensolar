import { useEffect, useState } from 'react';
import {
  getFlywheelContribution,
  type FlywheelContribution,
} from '@/lib/flywheelLedger';

/**
 * Live snapshot of the user's subscription-fee flywheel contribution.
 * Re-evaluates every `intervalMs` (default 5s) so cumulative figures tick.
 */
export function useFlywheelContribution(intervalMs = 5000): FlywheelContribution {
  const [snapshot, setSnapshot] = useState<FlywheelContribution>(() =>
    getFlywheelContribution(),
  );

  useEffect(() => {
    const tick = () => setSnapshot(getFlywheelContribution());
    tick();
    const id = window.setInterval(tick, intervalMs);

    // Re-evaluate when storage changes (tier switch from another tab/page).
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'zensolar_mock_subscription_tier' ||
        e.key === 'zensolar_mock_subscription_started_at'
      ) {
        tick();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [intervalMs]);

  return snapshot;
}
