import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminLiveSnapshot {
  solar_kwh: number;
  battery_discharged_kwh: number;
  ev_miles: number;
  supercharger_kwh: number;
  home_charger_kwh: number;
  lifetime_minted: number;
  nft_count: number;
  devices: Array<{
    device_id: string;
    device_name: string | null;
    device_type: string;
    provider: string;
  }>;
  connections: {
    display_name: string | null;
    tesla_connected: boolean;
    enphase_connected: boolean;
    solaredge_connected: boolean;
    wallbox_connected: boolean;
  } | null;
  snapshot_at: string;
}

const REFRESH_INTERVAL_MS = 60_000; // refresh every minute

/**
 * Fetches the admin's aggregated live activity for VIP investor demos.
 * Public read-only — no auth required.
 */
export function useAdminLiveSnapshot() {
  const [snapshot, setSnapshot] = useState<AdminLiveSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const { data, error } = await supabase.rpc('get_admin_live_snapshot');
      if (error) {
        console.error('[AdminLiveSnapshot] fetch error', error);
        return;
      }
      if (data) {
        setSnapshot(data as unknown as AdminLiveSnapshot);
        setLastUpdatedAt(new Date().toISOString());
      }
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    const id = window.setInterval(fetchSnapshot, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchSnapshot]);

  return { snapshot, isLoading, lastUpdatedAt, refresh: fetchSnapshot };
}
