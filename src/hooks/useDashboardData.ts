import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ActivityData, 
  ConnectedAccount, 
  calculateCO2Offset, 
  DeviceLabels, 
  SolarDeviceData,
  BatteryDeviceData,
  EVDeviceData,
  ChargerDeviceData 
} from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PROFILE_UPDATED_EVENT } from '@/hooks/useProfile';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { 
  isSolarDevice, 
  isBatteryDevice, 
  isVehicleDevice, 
  isChargerDevice,
  canHaveSolarData 
} from '@/lib/deviceTypeNormalizer';

const defaultActivityData: ActivityData = {
  // Lifetime minted (from mint_transactions)
  lifetimeMinted: 0,
  // Lifetime totals (for NFT milestone progress)
  solarEnergyProduced: 0,
  evMilesDriven: 0,
  batteryStorageDischarged: 0,
  teslaSuperchargerKwh: 0,
  homeChargerKwh: 0,
  // Pending rewards (since last mint)
  pendingSolarKwh: 0,
  pendingEvMiles: 0,
  pendingBatteryKwh: 0,
  pendingChargingKwh: 0,
  pendingSuperchargerKwh: 0,
  pendingHomeChargerKwh: 0,
  // Reward totals
  tokensEarned: 0,
  pendingTokens: 0,
  referralTokens: 0,
  nftsEarned: [],
  co2OffsetPounds: 0,
  deviceLabels: undefined,
  solarDevices: [],
  batteryDevices: [],
  evDevices: [],
  chargerDevices: [],
};

// Module-level flags so state survives component remounts during navigation.
let hasAutoRefreshedOnceGlobal = false;
let cachedProfileConnections: ProfileConnections | null = null;
let cachedConnectionKey: string | null = null;
let cachedActivityData: ActivityData | null = null;
let cachedLastUpdatedAt: string | null = null;
let cachedForUserId: string | null = null; // tracks which user the cache belongs to

interface ProfileConnections {
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
}

export function useDashboardData() {
  // Check if we're in "view as user" mode (admin viewing another user's data)
  const viewAsUserId = useViewAsUserId();
  const isViewingAsOther = viewAsUserId !== null;
  const location = useLocation();
  const isOnDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Helper to get the effective user ID for data fetching
  const getEffectiveUserId = async (): Promise<string | null> => {
    if (viewAsUserId) return viewAsUserId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };
  const [activityData, setActivityDataRaw] = useState<ActivityData>(cachedActivityData ?? defaultActivityData);
  const setActivityData = useCallback((data: ActivityData) => {
    cachedActivityData = data;
    setActivityDataRaw(data);
  }, []);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { service: 'tesla', connected: cachedProfileConnections?.tesla_connected ?? false, label: 'Tesla' },
    { service: 'enphase', connected: cachedProfileConnections?.enphase_connected ?? false, label: 'Enphase' },
    { service: 'solaredge', connected: cachedProfileConnections?.solaredge_connected ?? false, label: 'SolarEdge' },
    { service: 'wallbox', connected: cachedProfileConnections?.wallbox_connected ?? false, label: 'Wallbox' },
  ]);
  const [isLoading, setIsLoading] = useState(!cachedProfileConnections);
  const [profileConnections, setProfileConnections] = useState<ProfileConnections | null>(cachedProfileConnections);
  const hasAutoRefreshedOnce = useRef(hasAutoRefreshedOnceGlobal);

  type ProviderKey = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
  type ProviderRefreshState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    updatedAt?: string;
    cached?: boolean;
    stale?: boolean;
    rateLimited?: boolean;
    needsReauth?: boolean;
    error?: string;
  };

  const [lastUpdatedAt, setLastUpdatedAtRaw] = useState<string | null>(cachedLastUpdatedAt);
  const setLastUpdatedAt = useCallback((val: string | null) => {
    cachedLastUpdatedAt = val;
    setLastUpdatedAtRaw(val);
  }, []);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [providerRefresh, setProviderRefresh] = useState<Record<ProviderKey, ProviderRefreshState>>({
    tesla: { status: 'idle' },
    enphase: { status: 'idle' },
    solaredge: { status: 'idle' },
    wallbox: { status: 'idle' },
  });
  const fetchConnections = useCallback(async () => {
    // When viewing as another user, use their ID; otherwise use current user
    const targetUserId = viewAsUserId ?? null;
    
    if (!targetUserId) {
      // Normal mode - get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileConnections(null);
        setConnectedAccounts([
          { service: 'tesla', connected: false, label: 'Tesla' },
          { service: 'enphase', connected: false, label: 'Enphase' },
          { service: 'solaredge', connected: false, label: 'SolarEdge' },
          { service: 'wallbox', connected: false, label: 'Wallbox' },
        ]);
        setIsLoading(false);
        return;
      }
      
      // Use current user's ID
      await fetchConnectionsForUser(user.id, true);
    } else {
      // View as user mode - fetch that user's connections (read-only)
      await fetchConnectionsForUser(targetUserId, false);
    }
  }, [viewAsUserId]);
  
  const fetchConnectionsForUser = async (userId: string, canReconcile: boolean) => {
    // Fetch connection state from BOTH profile flags and tokens.
    // Why: new-user profiles can be created after an energy connection completes, and profile updates can be a silent no-op
    // if the row didn't exist yet. Tokens/devices are the source of truth for whether an account is connected.
    const [{ data: profile, error }, { data: tokens, error: tokenError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('tesla_connected, enphase_connected, solaredge_connected, wallbox_connected')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('energy_tokens')
        .select('provider')
        .eq('user_id', userId),
    ]);

    if (error) {
      console.error('Error fetching profile connections:', error);
    }

    if (tokenError) {
      console.error('Error fetching token connections:', tokenError);
    }

    const tokenProviders = new Set((tokens || []).map((t: any) => String(t.provider)));
    const fromTokens: ProfileConnections = {
      tesla_connected: tokenProviders.has('tesla'),
      enphase_connected: tokenProviders.has('enphase'),
      solaredge_connected: tokenProviders.has('solaredge'),
      wallbox_connected: tokenProviders.has('wallbox'),
    };

    const connections: ProfileConnections = {
      tesla_connected: Boolean(profile?.tesla_connected) || fromTokens.tesla_connected,
      enphase_connected: Boolean(profile?.enphase_connected) || fromTokens.enphase_connected,
      solaredge_connected: Boolean(profile?.solaredge_connected) || fromTokens.solaredge_connected,
      wallbox_connected: Boolean(profile?.wallbox_connected) || fromTokens.wallbox_connected,
    };

    // Best-effort: if tokens say connected but profile flags are stale, reconcile silently.
    // Only do this when viewing own data, not when admin is viewing another user.
    if (canReconcile) {
      try {
        const needsReconcile =
          (fromTokens.tesla_connected && !profile?.tesla_connected) ||
          (fromTokens.enphase_connected && !profile?.enphase_connected) ||
          (fromTokens.solaredge_connected && !profile?.solaredge_connected) ||
          (fromTokens.wallbox_connected && !profile?.wallbox_connected);

        if (needsReconcile) {
          const nowIso = new Date().toISOString();
          const patch: Partial<ProfileConnections> & { updated_at: string } = {
            updated_at: nowIso,
            tesla_connected: connections.tesla_connected,
            enphase_connected: connections.enphase_connected,
            solaredge_connected: connections.solaredge_connected,
            wallbox_connected: connections.wallbox_connected,
          };

          const { data: updatedRows, error: updateErr } = await supabase
            .from('profiles')
            .update(patch)
            .eq('user_id', userId)
            .select('user_id');

          if (updateErr) {
            console.warn('Failed to reconcile profile connection flags:', updateErr);
          }

          if (!updatedRows || updatedRows.length === 0) {
            // Profile missing; create then update.
            await supabase.from('profiles').insert({ user_id: userId });
            await supabase.from('profiles').update(patch).eq('user_id', userId);
          }
        }
      } catch (reconcileErr) {
        console.warn('Connection reconcile error:', reconcileErr);
      }
    }

    // Cache at module level so remounts don't re-fetch
    cachedProfileConnections = connections;
    cachedForUserId = viewAsUserId ?? '__self__';
    cachedConnectionKey = [
      connections.enphase_connected,
      connections.solaredge_connected,
      connections.tesla_connected,
      connections.wallbox_connected,
    ].join(',');

    setProfileConnections(connections);
    setConnectedAccounts([
      { service: 'tesla', connected: connections.tesla_connected, label: 'Tesla' },
      { service: 'enphase', connected: connections.enphase_connected, label: 'Enphase' },
      { service: 'solaredge', connected: connections.solaredge_connected, label: 'SolarEdge' },
      { service: 'wallbox', connected: connections.wallbox_connected, label: 'Wallbox' },
    ]);

    setIsLoading(false);
  };

  // Initial load — skip if we already have cached connections from a previous mount
  // BUT always re-fetch when viewAsUserId changes or cache belongs to a different user
  const prevViewAsRef = useRef<string | null | undefined>(undefined);
  const effectiveViewKey = viewAsUserId ?? '__self__';
  useEffect(() => {
    const viewAsChanged = prevViewAsRef.current !== undefined && prevViewAsRef.current !== viewAsUserId;
    prevViewAsRef.current = viewAsUserId;

    // Also detect stale cache from a different user (e.g. first mount with viewAsUserId already set)
    const cacheStale = cachedForUserId !== null && cachedForUserId !== effectiveViewKey;

    if (viewAsChanged || cacheStale) {
      // Clear module-level caches when switching users
      cachedProfileConnections = null;
      cachedConnectionKey = null;
      cachedActivityData = null;
      cachedLastUpdatedAt = null;
      cachedForUserId = null;
      hasAutoRefreshedOnceGlobal = false;
      hasAutoRefreshedOnce.current = false;
      setActivityData(defaultActivityData);
      fetchConnections();
      return;
    }

    if (cachedProfileConnections) return;
    fetchConnections();
  }, [fetchConnections, viewAsUserId]);

  // Keep connection state in sync (Onboarding, Profile, Device selection, etc.)
  useEffect(() => {
    const handleProfileUpdated = () => {
      // Allow one more automatic refresh after a connection is completed.
      hasAutoRefreshedOnce.current = false;
      hasAutoRefreshedOnceGlobal = false;
      cachedProfileConnections = null;
      cachedConnectionKey = null;
      cachedActivityData = null;
      cachedLastUpdatedAt = null;
      cachedForUserId = null;
      fetchConnections();
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [fetchConnections]);

  const fetchEnphaseData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Throttle Enphase calls to once every 6 hours to stay within API limits
      const cacheKey = `enphase_last_fetch_${session.user.id}`;
      const cachedDataKey = `enphase_cached_data_${session.user.id}`;
      const lastFetch = localStorage.getItem(cacheKey);
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

      if (lastFetch && Date.now() - Number(lastFetch) < SIX_HOURS_MS) {
        console.log('[Enphase] Skipping API call — last fetch was', Math.round((Date.now() - Number(lastFetch)) / 60000), 'min ago (6h throttle)');
        const cached = localStorage.getItem(cachedDataKey);
        return cached ? JSON.parse(cached) : null;
      }

      const response = await supabase.functions.invoke('enphase-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        console.error('Enphase data error:', response.error);
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('Usage limit exceeded')) {
          toast.error('Enphase API rate limit reached. Please try again later.');
        } else if (errorMessage.includes('needsReauth') || errorMessage.includes('Token expired')) {
          toast.error('Enphase connection expired. Please reconnect your account.');
        }
        return null;
      }

      // Cache successful response
      localStorage.setItem(cacheKey, String(Date.now()));
      try { localStorage.setItem(cachedDataKey, JSON.stringify(response.data)); } catch {}

      return response.data;
    } catch (error) {
      console.error('Failed to fetch Enphase data:', error);
      return null;
    }
  }, []);

  const fetchSolarEdgeData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('solaredge-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        console.error('SolarEdge data error:', response.error);
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          toast.error('SolarEdge API rate limit reached. Please try again later.');
        }
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch SolarEdge data:', error);
      return null;
    }
  }, []);

  const fetchTeslaData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('tesla-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        console.error('Tesla data error:', response.error);
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          toast.error('Tesla API rate limit reached. Please try again later.');
          return { error: 'rate_limited' };
        } else if (errorMessage.includes('needsReauth') || errorMessage.includes('Token expired')) {
          // Don't show toast - let the UI show the reconnect CTA
          return { error: 'needs_reauth', needsReauth: true };
        }
        return { error: 'unknown' };
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch Tesla data:', error);
      return { error: 'fetch_failed' };
    }
  }, []);

  const fetchWallboxData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('wallbox-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        console.error('Wallbox data error:', response.error);
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('needsReauth') || errorMessage.includes('Token expired')) {
          toast.error('Wallbox connection expired. Please reconnect your account.');
        }
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch Wallbox data:', error);
      return null;
    }
  }, []);

  const fetchRewardsData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('calculate-rewards', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        console.error('Rewards calculation error:', response.error);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch rewards data:', error);
      return null;
    }
  }, []);

  const fetchReferralTokens = useCallback(async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('referrals')
        .select('tokens_rewarded')
        .eq('referrer_id', userId);

      if (error) {
        console.error('Referrals fetch error:', error);
        return 0;
      }

      return data?.reduce((sum, r) => sum + Number(r.tokens_rewarded), 0) || 0;
    } catch (error) {
      console.error('Failed to fetch referral tokens:', error);
      return 0;
    }
  }, []);

  const fetchMintedTokens = useCallback(async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('mint_transactions')
        .select('tokens_minted')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('Mint transactions fetch error:', error);
        return 0;
      }

      return data?.reduce((sum, tx) => sum + Number(tx.tokens_minted || 0), 0) || 0;
    } catch (error) {
      console.error('Failed to fetch minted tokens:', error);
      return 0;
    }
  }, []);

  const fetchDeviceLabels = useCallback(async (): Promise<DeviceLabels> => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return {};

      const { data: devices, error } = await supabase
        .from('connected_devices')
        .select('device_type, device_name, provider')
        .eq('user_id', userId);

      if (error) {
        console.error('Device labels fetch error:', error);
        return {};
      }

      const labels: DeviceLabels = {};

      for (const device of devices || []) {
        // Use normalized device type checks for consistent matching
        if (isVehicleDevice(device.device_type) && device.device_name) {
          labels.vehicle = device.device_name;
        } else if (isBatteryDevice(device.device_type) && device.device_name) {
          // Battery/Powerwall devices
          labels.powerwall = device.device_name;
        } else if (isChargerDevice(device.device_type) && device.device_name) {
          // Wall connectors and home chargers (Tesla Wall Connector, Wallbox, etc.)
          labels.wallConnector = device.device_name;
          if (device.provider === 'wallbox') {
            labels.homeCharger = device.device_name;
          }
        } else if (isSolarDevice(device.device_type) && device.device_name) {
          // Solar systems from any provider (Tesla, Enphase, SolarEdge)
          labels.solar = device.device_name;
        }
      }

      // Build home charger label from available sources
      if (!labels.homeCharger) {
        if (labels.wallConnector) {
          labels.homeCharger = labels.wallConnector;
        }
      }

      console.log('Device labels:', labels);
      return labels;
    } catch (error) {
      console.error('Failed to fetch device labels:', error);
      return {};
    }
  }, []);

  const fetchDevicesSnapshot = useCallback(async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('connected_devices')
        .select('device_id, device_name, device_type, provider, baseline_data, lifetime_totals, last_minted_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Device snapshot fetch error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch device snapshot:', error);
      return [];
    }
  }, []);

  // ── Fast path: build dashboard from DB-stored lifetime_totals (instant, no API calls) ──
  const buildFastPathData = useCallback(async (): Promise<ActivityData | null> => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return null;

      const [devicesSnapshot, homeChargingMonitorKwh, lifetimeMinted, referralTokens, deviceLabelsResult] = await Promise.all([
        supabase.from('connected_devices')
          .select('device_id, device_name, device_type, provider, baseline_data, lifetime_totals, last_minted_at')
          .eq('user_id', userId).then(r => r.data || []),
        supabase.from('home_charging_sessions')
          .select('total_session_kwh')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .then(r => (r.data || []).reduce((sum: number, s: any) => sum + Number(s.total_session_kwh || 0), 0)),
        fetchMintedTokens(),
        fetchReferralTokens(),
        fetchDeviceLabels(),
      ]);

      if (devicesSnapshot.length === 0) return null;

      // Reuse the same fallback logic to build data from device snapshots
      const devices = devicesSnapshot as any[];
      const sum = (arr: any[], fn: (d: any) => number) => arr.reduce((acc, d) => acc + (Number(fn(d)) || 0), 0);
      const extractSolarWh = (obj: any): number => Number(obj?.solar_wh || obj?.lifetime_solar_wh || obj?.solar_production_wh || obj?.total_solar_produced_wh || 0);
      const extractBatteryWh = (obj: any): number => Number(obj?.battery_discharge_wh || obj?.total_energy_discharged_wh || obj?.lifetime_battery_discharge_wh || 0);

      const hasDedicatedSolarProvider = profileConnections?.enphase_connected || profileConnections?.solaredge_connected;

      // Solar
      const enphaseSolar = devices.filter(d => d.provider === 'enphase');
      const solaredgeSolar = devices.filter(d => d.provider === 'solaredge');
      const teslaDevices = devices.filter(d => d.provider === 'tesla');

      let solarEnergy = 0;
      let pendingSolar = 0;
      if (enphaseSolar.length > 0) {
        solarEnergy = sum(enphaseSolar, d => extractSolarWh(d.lifetime_totals)) / 1000;
        pendingSolar = sum(enphaseSolar, d => Math.max(0, extractSolarWh(d.lifetime_totals) - extractSolarWh(d.baseline_data))) / 1000;
      } else if (solaredgeSolar.length > 0) {
        solarEnergy = sum(solaredgeSolar, d => extractSolarWh(d.lifetime_totals)) / 1000;
        pendingSolar = sum(solaredgeSolar, d => Math.max(0, extractSolarWh(d.lifetime_totals) - extractSolarWh(d.baseline_data))) / 1000;
      } else {
        const teslaSolarDevices = teslaDevices.filter(d => canHaveSolarData(d.device_type));
        solarEnergy = sum(teslaSolarDevices, d => extractSolarWh(d.lifetime_totals)) / 1000;
        pendingSolar = sum(teslaSolarDevices, d => Math.max(0, extractSolarWh(d.lifetime_totals) - extractSolarWh(d.baseline_data))) / 1000;
      }

      // Battery
      const batteryDevicesArr = teslaDevices.filter(d => isBatteryDevice(d.device_type));
      const batteryDischarge = sum(batteryDevicesArr, d => extractBatteryWh(d.lifetime_totals)) / 1000;
      const pendingBattery = sum(batteryDevicesArr, d => Math.max(0, extractBatteryWh(d.lifetime_totals) - extractBatteryWh(d.baseline_data))) / 1000;

      // EV
      const vehicleDevices = teslaDevices.filter(d => isVehicleDevice(d.device_type));
      const evMiles = sum(vehicleDevices, d => Number(d.lifetime_totals?.odometer || 0));
      const pendingEvMiles = sum(vehicleDevices, d => Math.max(0, Number(d.lifetime_totals?.odometer || 0) - Number(d.baseline_data?.odometer || 0)));
      const superchargerKwh = sum(vehicleDevices, d => Number(d.lifetime_totals?.charging_kwh || 0));
      const pendingSupercharger = sum(vehicleDevices, d => Math.max(0, Number(d.lifetime_totals?.charging_kwh || 0) - Number(d.baseline_data?.charging_kwh || 0)));

      const homeChargerKwh = homeChargingMonitorKwh;
      const pendingHomeCharger = homeChargingMonitorKwh;
      const pendingCharging = pendingSupercharger + pendingHomeCharger;

      const tokensEarned = Math.floor(evMiles) + Math.floor(solarEnergy) + Math.floor(batteryDischarge) + Math.floor(superchargerKwh) + Math.floor(homeChargerKwh);
      const pendingActivityUnits = Math.floor(pendingSolar) + Math.floor(pendingEvMiles) + Math.floor(pendingBattery) + Math.floor(pendingCharging);
      const { calculatePendingTokens } = await import('@/lib/tokenomics');
      const pendingTokens = calculatePendingTokens(pendingActivityUnits);

      // Build per-device arrays (same logic as full refresh but from DB only)
      const solarDevicesArr: SolarDeviceData[] = [];
      const batteryDevicesResult: BatteryDeviceData[] = [];
      const evDevicesArr: EVDeviceData[] = [];
      const chargerDevicesArr: ChargerDeviceData[] = [];

      for (const device of devices) {
        const deviceName = device.device_name || `${device.provider?.charAt(0).toUpperCase() + device.provider?.slice(1)} Device`;
        
        if (isSolarDevice(device.device_type)) {
          const lifetimeWh = extractSolarWh(device.lifetime_totals);
          if (lifetimeWh > 0) {
            const baselineWh = extractSolarWh(device.baseline_data);
            const pendingWh = Math.max(0, lifetimeWh - baselineWh);
            if (device.provider === 'tesla') {
              if (!hasDedicatedSolarProvider) {
                const existing = solarDevicesArr.find(d => d.provider === 'tesla');
                if (existing) { existing.lifetimeKwh += lifetimeWh / 1000; existing.pendingKwh += pendingWh / 1000; }
                else solarDevicesArr.push({ deviceId: device.device_id, deviceName, provider: 'tesla', lifetimeKwh: lifetimeWh / 1000, pendingKwh: pendingWh / 1000 });
              }
            } else {
              solarDevicesArr.push({ deviceId: device.device_id, deviceName, provider: device.provider, lifetimeKwh: lifetimeWh / 1000, pendingKwh: pendingWh / 1000 });
            }
          }
        }
        if (isBatteryDevice(device.device_type)) {
          const lifetimeWh = extractBatteryWh(device.lifetime_totals);
          const baselineWh = extractBatteryWh(device.baseline_data);
          const pendingWh = Math.max(0, lifetimeWh - baselineWh);
          if (batteryDevicesResult.length > 0) { batteryDevicesResult[0].lifetimeKwh += lifetimeWh / 1000; batteryDevicesResult[0].pendingKwh += pendingWh / 1000; }
          else batteryDevicesResult.push({ deviceId: device.device_id, deviceName, provider: 'tesla', lifetimeKwh: lifetimeWh / 1000, pendingKwh: pendingWh / 1000 });
        }
        if (isVehicleDevice(device.device_type)) {
          const lifetimeMilesVal = Number(device.lifetime_totals?.odometer || 0);
          const baselineMilesVal = Number(device.baseline_data?.odometer || 0);
          evDevicesArr.push({
            deviceId: device.device_id, deviceName, provider: 'tesla',
            lifetimeMiles: lifetimeMilesVal, pendingMiles: Math.max(0, lifetimeMilesVal - baselineMilesVal),
            lifetimeChargingKwh: Number(device.lifetime_totals?.charging_kwh || 0),
            pendingChargingKwh: Math.max(0, Number(device.lifetime_totals?.charging_kwh || 0) - Number(device.baseline_data?.charging_kwh || 0)),
            lifetimeSuperchargerKwh: Number(device.lifetime_totals?.supercharger_kwh || 0),
            pendingSuperchargerKwh: Math.max(0, Number(device.lifetime_totals?.supercharger_kwh || 0) - Number(device.baseline_data?.supercharger_kwh || 0)),
          });
        }
        if (isChargerDevice(device.device_type)) {
          const lifetimeKwh = Number(device.lifetime_totals?.charging_kwh || device.lifetime_totals?.home_charger_kwh || 0);
          const baselineKwh = Number(device.baseline_data?.charging_kwh || 0);
          chargerDevicesArr.push({ deviceId: device.device_id, deviceName, provider: device.provider as 'tesla' | 'wallbox', lifetimeKwh, pendingKwh: Math.max(0, lifetimeKwh - baselineKwh) });
        }
      }

      const newData: ActivityData = {
        lifetimeMinted,
        solarEnergyProduced: solarEnergy,
        evMilesDriven: evMiles,
        batteryStorageDischarged: batteryDischarge,
        teslaSuperchargerKwh: superchargerKwh,
        homeChargerKwh,
        pendingSolarKwh: pendingSolar,
        pendingEvMiles,
        pendingBatteryKwh: pendingBattery,
        pendingChargingKwh: pendingCharging,
        pendingSuperchargerKwh: pendingSupercharger,
        pendingHomeChargerKwh: pendingHomeCharger,
        tokensEarned,
        pendingTokens,
        referralTokens,
        nftsEarned: [],
        co2OffsetPounds: 0,
        deviceLabels: deviceLabelsResult,
        solarDevices: solarDevicesArr,
        batteryDevices: batteryDevicesResult,
        evDevices: evDevicesArr,
        chargerDevices: chargerDevicesArr,
      };
      newData.co2OffsetPounds = calculateCO2Offset(newData);
      return newData;
    } catch (err) {
      console.error('Fast path error:', err);
      return null;
    }
  }, [profileConnections, fetchMintedTokens, fetchReferralTokens, fetchDeviceLabels]);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);

    const nowIso = new Date().toISOString();

    // Mark connected providers as loading for UI indicators
    setProviderRefresh((prev) => ({
      tesla: profileConnections?.tesla_connected ? { ...prev.tesla, status: 'loading', updatedAt: nowIso } : prev.tesla,
      enphase: profileConnections?.enphase_connected ? { ...prev.enphase, status: 'loading', updatedAt: nowIso } : prev.enphase,
      solaredge: profileConnections?.solaredge_connected ? { ...prev.solaredge, status: 'loading', updatedAt: nowIso } : prev.solaredge,
      wallbox: profileConnections?.wallbox_connected ? { ...prev.wallbox, status: 'loading', updatedAt: nowIso } : prev.wallbox,
    }));
    
    try {
      // Lifetime totals
      let solarEnergy = 0;
      let evMiles = 0;
      let batteryDischarge = 0;
      let superchargerKwh = 0;
      let homeChargerKwh = 0;
      
      // Pending (since last mint) - starts at 0, updated from API responses
      let pendingSolar = 0;
      let pendingEvMiles = 0;
      let pendingBattery = 0;
      let pendingCharging = 0;
      let pendingSupercharger = 0;
      let pendingHomeCharger = 0;

      // Fetch data in parallel (including device labels and minted tokens)
      const fetchHomeChargingTotal = async () => {
        try {
          const userId = await getEffectiveUserId();
          if (!userId) return 0;
          const { data, error } = await supabase
            .from('home_charging_sessions')
            .select('total_session_kwh')
            .eq('user_id', userId)
            .eq('status', 'completed');
          if (error) { console.error('Home charging fetch error:', error); return 0; }
          return (data || []).reduce((sum, s) => sum + Number(s.total_session_kwh || 0), 0);
        } catch { return 0; }
      };

      // When viewing as another user, skip external API calls (they authenticate as admin, not target user).
      // Instead rely entirely on DB-stored data (devices, rewards, etc.) which uses getEffectiveUserId().
      const shouldCallAPIs = !isViewingAsOther;

      const [enphaseData, solarEdgeData, teslaData, wallboxData, rewardsData, referralTokens, deviceLabels, lifetimeMinted, devicesSnapshot, homeChargingMonitorKwh] = await Promise.all([
        shouldCallAPIs && profileConnections?.enphase_connected ? fetchEnphaseData() : null,
        shouldCallAPIs && profileConnections?.solaredge_connected ? fetchSolarEdgeData() : null,
        shouldCallAPIs && profileConnections?.tesla_connected ? fetchTeslaData() : null,
        shouldCallAPIs && profileConnections?.wallbox_connected ? fetchWallboxData() : null,
        shouldCallAPIs ? fetchRewardsData() : null,
        fetchReferralTokens(),
        fetchDeviceLabels(),
        fetchMintedTokens(),
        fetchDevicesSnapshot(),
        fetchHomeChargingTotal(),
      ]);

      // Update provider refresh state
      setProviderRefresh((prev) => {
        const toState = (d: any, connected?: boolean): ProviderRefreshState => {
          if (!connected) return { status: 'idle' };
          if (!d) return { status: 'error', updatedAt: nowIso, error: 'no_data' };
          // Check for needsReauth error state
          if (d?.error === 'needs_reauth' || d?.needsReauth) {
            return { status: 'error', updatedAt: nowIso, error: 'needs_reauth', needsReauth: true };
          }
          if (d?.error) {
            return { status: 'error', updatedAt: nowIso, error: d.error };
          }
          return {
            status: 'success',
            updatedAt: nowIso,
            cached: Boolean(d.cached),
            stale: Boolean(d.stale),
            rateLimited: Boolean((d as any).rate_limited),
          };
        };

        return {
          tesla: toState(teslaData, profileConnections?.tesla_connected),
          enphase: toState(enphaseData, profileConnections?.enphase_connected),
          solaredge: toState(solarEdgeData, profileConnections?.solaredge_connected),
          wallbox: toState(wallboxData, profileConnections?.wallbox_connected),
        };
      });

      // Fallback totals from backend snapshot (used when providers are cached/rate-limited)
      const fallback = (() => {
        const devices = (devicesSnapshot || []) as any[];

        const sum = (arr: any[], fn: (d: any) => number) => arr.reduce((acc, d) => acc + (Number(fn(d)) || 0), 0);
        const baselineSolarWh = (b: any) => Number(b?.solar_wh || b?.solar_production_wh || b?.total_solar_produced_wh || b?.lifetime_solar_wh || 0);
        const lifetimeSolarWh = (l: any) => Number(l?.solar_wh || l?.lifetime_solar_wh || 0);
        const baselineBatteryWh = (b: any) => Number(b?.battery_discharge_wh || b?.total_energy_discharged_wh || 0);
        const lifetimeBatteryWh = (l: any) => Number(l?.battery_discharge_wh || l?.lifetime_battery_discharge_wh || 0);

        const enphaseSolarDevices = devices.filter((d) => d.provider === 'enphase');
        const solaredgeSolarDevices = devices.filter((d) => d.provider === 'solaredge');
        const teslaDevices = devices.filter((d) => d.provider === 'tesla');

        const enphaseLifetimeWh = sum(enphaseSolarDevices, (d) => lifetimeSolarWh(d.lifetime_totals));
        const enphasePendingWh = sum(enphaseSolarDevices, (d) => Math.max(0, lifetimeSolarWh(d.lifetime_totals) - baselineSolarWh(d.baseline_data)));

        const solaredgeLifetimeWh = sum(solaredgeSolarDevices, (d) => lifetimeSolarWh(d.lifetime_totals));
        const solaredgePendingWh = sum(solaredgeSolarDevices, (d) => Math.max(0, lifetimeSolarWh(d.lifetime_totals) - baselineSolarWh(d.baseline_data)));

        // Use normalizer for consistent device type matching
        const teslaSolarWhTotal = sum(teslaDevices.filter((d) => canHaveSolarData(d.device_type)), (d) => lifetimeSolarWh(d.lifetime_totals));
        const teslaSolarWhPending = sum(teslaDevices.filter((d) => canHaveSolarData(d.device_type)), (d) => Math.max(0, lifetimeSolarWh(d.lifetime_totals) - baselineSolarWh(d.baseline_data)));

        const teslaBatteryWhTotal = sum(teslaDevices.filter((d) => isBatteryDevice(d.device_type)), (d) => lifetimeBatteryWh(d.lifetime_totals));
        const teslaBatteryWhPending = sum(teslaDevices.filter((d) => isBatteryDevice(d.device_type)), (d) => Math.max(0, lifetimeBatteryWh(d.lifetime_totals) - baselineBatteryWh(d.baseline_data)));

        const teslaVehicleMilesTotal = sum(teslaDevices.filter((d) => isVehicleDevice(d.device_type)), (d) => Number(d.lifetime_totals?.odometer || 0));
        const teslaVehicleMilesPending = sum(teslaDevices.filter((d) => isVehicleDevice(d.device_type)), (d) => Math.max(0, Number(d.lifetime_totals?.odometer || 0) - Number(d.baseline_data?.odometer || 0)));

        const teslaChargingKwhTotal = sum(teslaDevices.filter((d) => isVehicleDevice(d.device_type)), (d) => Number(d.lifetime_totals?.charging_kwh || 0));
        const teslaChargingKwhPending = sum(teslaDevices.filter((d) => isVehicleDevice(d.device_type)), (d) => Math.max(0, Number(d.lifetime_totals?.charging_kwh || 0) - Number(d.baseline_data?.charging_kwh || 0)));

        // Solar provider priority matches the dashboard: Enphase > SolarEdge > Tesla
        const solarLifetimeWh = profileConnections?.enphase_connected && enphaseLifetimeWh > 0
          ? enphaseLifetimeWh
          : profileConnections?.solaredge_connected && solaredgeLifetimeWh > 0
            ? solaredgeLifetimeWh
            : teslaSolarWhTotal;

        const solarPendingWh = profileConnections?.enphase_connected && enphaseLifetimeWh > 0
          ? enphasePendingWh
          : profileConnections?.solaredge_connected && solaredgeLifetimeWh > 0
            ? solaredgePendingWh
            : teslaSolarWhPending;

        return {
          solarLifetimeKwh: solarLifetimeWh / 1000,
          solarPendingKwh: solarPendingWh / 1000,
          batteryLifetimeKwh: teslaBatteryWhTotal / 1000,
          batteryPendingKwh: teslaBatteryWhPending / 1000,
          evMilesLifetime: teslaVehicleMilesTotal,
          evMilesPending: teslaVehicleMilesPending,
          chargingKwhLifetime: teslaChargingKwhTotal,
          chargingKwhPending: teslaChargingKwhPending,
        };
      })();
      // Solar source priority: Enphase > SolarEdge > Tesla
      // If Enphase or SolarEdge is connected, use that for solar (NOT Tesla)
      const hasDedicatedSolarProvider = profileConnections?.enphase_connected || profileConnections?.solaredge_connected;

      // Process Enphase data - use lifetime energy for solar
      if (enphaseData?.totals) {
        const apiLifetimeWh = Number(enphaseData.totals.lifetime_solar_wh || 0);

        // IMPORTANT: pending_solar_wh may legitimately be 0 after a successful mint.
        // We must treat "0" as a real value (not fall back to lifetime).
        const pendingRaw = (enphaseData.totals as any).pending_solar_wh;
        const hasPending = pendingRaw !== undefined && pendingRaw !== null;
        const apiPendingWh = Number(pendingRaw ?? 0);

        // If provider is cached/rate-limited and returns 0, fall back to last known backend totals
        const effectiveLifetimeKwh = apiLifetimeWh > 0 ? apiLifetimeWh / 1000 : fallback.solarLifetimeKwh;
        const effectivePendingKwh = apiLifetimeWh > 0
          ? (hasPending ? apiPendingWh / 1000 : effectiveLifetimeKwh)
          : fallback.solarPendingKwh;

        solarEnergy = effectiveLifetimeKwh;
        pendingSolar = effectivePendingKwh;

        console.log('Enphase solar:', solarEnergy, 'kWh, pending:', pendingSolar, 'kWh');
      }

      // Process SolarEdge data - use lifetime energy for solar
      if (solarEdgeData?.totals && !enphaseData?.totals) {
        // Only use SolarEdge if Enphase not available (Enphase takes priority)
        const apiLifetimeWh = Number(solarEdgeData.totals.lifetime_solar_wh || 0);

        // Same rule: 0 pending is valid after minting.
        const pendingRaw = (solarEdgeData.totals as any).pending_solar_wh;
        const hasPending = pendingRaw !== undefined && pendingRaw !== null;
        const apiPendingWh = Number(pendingRaw ?? 0);

        const effectiveLifetimeKwh = apiLifetimeWh > 0 ? apiLifetimeWh / 1000 : fallback.solarLifetimeKwh;
        const effectivePendingKwh = apiLifetimeWh > 0
          ? (hasPending ? apiPendingWh / 1000 : effectiveLifetimeKwh)
          : fallback.solarPendingKwh;

        solarEnergy = effectiveLifetimeKwh;
        pendingSolar = effectivePendingKwh;

        console.log('SolarEdge solar:', solarEnergy, 'kWh, pending:', pendingSolar, 'kWh');
      }

      // Process Wallbox data - home charger kWh
      // Wallbox API returns lifetime charging totals
      let wallboxChargerKwh = 0;
      let wallboxPendingKwh = 0;
      if (wallboxData?.totals) {
        wallboxChargerKwh = wallboxData.totals.home_charger_kwh || 
                           wallboxData.totals.lifetime_charging_kwh || 0;
        
        // Calculate pending from connected_devices baseline
        // Find the Wallbox device in the snapshot to get baseline
        const wallboxDevice = (devicesSnapshot || []).find(
          (d: any) => d.provider === 'wallbox' && isChargerDevice(d.device_type)
        );
        
        if (wallboxDevice) {
          const baseline = wallboxDevice.baseline_data as Record<string, any> | null;
          const baselineKwh = Number(baseline?.charging_kwh || 0);
          wallboxPendingKwh = Math.max(0, wallboxChargerKwh - baselineKwh);
          console.log('Wallbox pending calculation:', { 
            lifetime: wallboxChargerKwh, 
            baseline: baselineKwh, 
            pending: wallboxPendingKwh 
          });
        } else {
          // No baseline set yet, all is pending
          wallboxPendingKwh = wallboxChargerKwh;
        }
        
        console.log('Wallbox charging:', wallboxChargerKwh, 'kWh, pending:', wallboxPendingKwh, 'kWh');
      }

      // Process Tesla data - EV miles, battery storage, EV charging
      // Tesla API returns both lifetime and pending values
      if (teslaData?.totals) {
        // Lifetime values
        batteryDischarge = (teslaData.totals.battery_discharge_wh || 0) / 1000;
        evMiles = teslaData.totals.ev_miles || 0;
        superchargerKwh = teslaData.totals.supercharger_kwh || 0;
        // Tesla Wall Connector kWh
        const teslaWallConnectorKwh = teslaData.totals.wall_connector_kwh || 0;
        // Combine Tesla Wall Connector + Wallbox + Charge Monitor for total home charging
        homeChargerKwh = teslaWallConnectorKwh + wallboxChargerKwh + homeChargingMonitorKwh;

        // Pending values (since last mint baseline)
        // If pending not returned, use lifetime (no baseline set yet means all is pending)
        const teslaPendingSolar = teslaData.totals.pending_solar_wh !== undefined
          ? (teslaData.totals.pending_solar_wh / 1000)
          : (teslaData.totals.solar_production_wh || 0) / 1000;
        const teslaPendingBattery = teslaData.totals.pending_battery_discharge_wh !== undefined
          ? (teslaData.totals.pending_battery_discharge_wh / 1000)
          : batteryDischarge;
        const teslaPendingEvMiles = teslaData.totals.pending_ev_miles !== undefined
          ? teslaData.totals.pending_ev_miles
          : evMiles;
        const teslaPendingSupercharger = teslaData.totals.pending_supercharger_kwh !== undefined
          ? teslaData.totals.pending_supercharger_kwh
          : superchargerKwh;
        const teslaPendingWallConnector = teslaData.totals.pending_wall_connector_kwh !== undefined
          ? teslaData.totals.pending_wall_connector_kwh
          : teslaWallConnectorKwh;

        // Only use Tesla solar/pending if no dedicated solar provider
        if (!hasDedicatedSolarProvider) {
          solarEnergy += (teslaData.totals.solar_production_wh || 0) / 1000;
          pendingSolar = teslaPendingSolar;
        }

        pendingBattery = teslaPendingBattery;
        pendingEvMiles = teslaPendingEvMiles;
        pendingSupercharger = teslaPendingSupercharger;
        // Combine Tesla Wall Connector pending + Wallbox pending + Charge Monitor sessions
        // Charge monitor sessions have no mint baseline yet, so all completed kWh are pending
        pendingHomeCharger = teslaPendingWallConnector + wallboxPendingKwh + homeChargingMonitorKwh;
        pendingCharging = pendingSupercharger + pendingHomeCharger;

        console.log('Tesla data:', { batteryDischarge, evMiles, superchargerKwh, homeChargerKwh, hasDedicatedSolarProvider });
      }

      // If only Wallbox connected (no Tesla), set home charger from Wallbox data
      if (!teslaData?.totals && wallboxData?.totals) {
        homeChargerKwh = wallboxChargerKwh + homeChargingMonitorKwh;
        // Use the properly calculated pending value + charge monitor sessions
        pendingHomeCharger = wallboxPendingKwh + homeChargingMonitorKwh;
        pendingCharging = pendingHomeCharger;
      }

      // If neither Tesla nor Wallbox, but charge monitor has data
      if (!teslaData?.totals && !wallboxData?.totals && homeChargingMonitorKwh > 0) {
        homeChargerKwh = homeChargingMonitorKwh;
        pendingHomeCharger = homeChargingMonitorKwh;
        pendingCharging = pendingHomeCharger;
      }

      // Provider fallback when APIs fail but backend has last-known totals
      if (!teslaData?.totals && profileConnections?.tesla_connected) {
        evMiles = fallback.evMilesLifetime;
        batteryDischarge = fallback.batteryLifetimeKwh;
        pendingEvMiles = fallback.evMilesPending;
        pendingBattery = fallback.batteryPendingKwh;
        superchargerKwh = fallback.chargingKwhLifetime;
        pendingSupercharger = fallback.chargingKwhPending;
        pendingCharging = fallback.chargingKwhPending;

        // Also apply Tesla solar fallback when no dedicated solar provider
        if (!hasDedicatedSolarProvider && solarEnergy <= 0 && fallback.solarLifetimeKwh > 0) {
          solarEnergy = fallback.solarLifetimeKwh;
          pendingSolar = fallback.solarPendingKwh;
        }
      }

      // If dedicated solar provider is connected but returned 0 (rate-limited), use backend fallback
      if (hasDedicatedSolarProvider && solarEnergy <= 0 && fallback.solarLifetimeKwh > 0) {
        solarEnergy = fallback.solarLifetimeKwh;
        pendingSolar = fallback.solarPendingKwh;
      }

      // Total lifetime tokens (calculated from all activity - 1:1 rate)
      const tokensEarned =
        Math.floor(evMiles) +
        Math.floor(solarEnergy) +
        Math.floor(batteryDischarge) +
        Math.floor(superchargerKwh) +
        Math.floor(homeChargerKwh);
      
      // Pending activity units (1:1 ratio with activity, before any multipliers)
      const pendingActivityUnits = 
        Math.floor(pendingSolar) +
        Math.floor(pendingEvMiles) +
        Math.floor(pendingBattery) +
        Math.floor(pendingCharging);
      
      // Import dynamically to get current Live Beta state
      // Tokens = activity units × Live Beta multiplier (10x or 1x) × 75% user share
      const { calculatePendingTokens } = await import('@/lib/tokenomics');
      const pendingTokens = calculatePendingTokens(pendingActivityUnits);
      
      const earnedNFTs = rewardsData?.earned_nfts || [];

      // Build per-device arrays from devicesSnapshot
      const solarDevices: SolarDeviceData[] = [];
      const batteryDevices: BatteryDeviceData[] = [];
      const evDevices: EVDeviceData[] = [];
      const chargerDevices: ChargerDeviceData[] = [];
      
      // Helper functions for baseline/lifetime extraction
      const extractSolarWh = (obj: any): number => {
        if (!obj) return 0;
        return Number(obj.solar_wh || obj.lifetime_solar_wh || obj.solar_production_wh || obj.total_solar_produced_wh || 0);
      };
      
      const extractBatteryWh = (obj: any): number => {
        if (!obj) return 0;
        return Number(obj.battery_discharge_wh || obj.total_energy_discharged_wh || obj.lifetime_battery_discharge_wh || 0);
      };
      
      for (const device of (devicesSnapshot || []) as any[]) {
        const deviceName = device.device_name || `${device.provider?.charAt(0).toUpperCase() + device.provider?.slice(1)} Device`;
        
        // Solar devices - aggregate all Tesla solar data into one entry (same site)
        // Non-Tesla providers (Enphase, SolarEdge) are independent systems at different addresses
        // IMPORTANT: Only use isSolarDevice() here, NOT canHaveSolarData()
        // canHaveSolarData() includes batteries which can report solar, but we don't want
        // Powerwalls showing up as separate solar entries - they should only appear as batteries
        if (isSolarDevice(device.device_type) && device.provider) {
          const lifetimeWh = extractSolarWh(device.lifetime_totals);
          const baselineWh = extractSolarWh(device.baseline_data);
          const pendingWh = Math.max(0, lifetimeWh - baselineWh);
          
          // Only add if there's actual solar data
          if (lifetimeWh > 0) {
            // For Tesla devices: SKIP if a dedicated solar provider (Enphase/SolarEdge) is connected
            // This prevents duplicate solar entries when user has e.g. Enphase for monitoring + Tesla Powerwall
            // Tesla can also read solar production, but we want to use the dedicated provider as source of truth
            if (device.provider === 'tesla') {
              if (!hasDedicatedSolarProvider) {
                const existingTeslaSolar = solarDevices.find(d => d.provider === 'tesla');
                if (existingTeslaSolar) {
                  // Aggregate into existing Tesla solar entry
                  existingTeslaSolar.lifetimeKwh += lifetimeWh / 1000;
                  existingTeslaSolar.pendingKwh += pendingWh / 1000;
                } else {
                  // First Tesla solar device - create entry
                  solarDevices.push({
                    deviceId: device.device_id,
                    deviceName,
                    provider: 'tesla',
                    lifetimeKwh: lifetimeWh / 1000,
                    pendingKwh: pendingWh / 1000,
                  });
                }
              }
              // else: skip Tesla solar entirely - use Enphase/SolarEdge instead
            } else {
              // Non-Tesla providers (Enphase, SolarEdge) - keep as separate systems
              solarDevices.push({
                deviceId: device.device_id,
                deviceName,
                provider: device.provider as 'enphase' | 'solaredge',
                lifetimeKwh: lifetimeWh / 1000,
                pendingKwh: pendingWh / 1000,
              });
            }
          }
        }
        
        // Battery devices (Powerwalls) - aggregate all batteries at the same site into one entry
        // Tesla provides individual Powerwall data, but for customers with multiple Powerwalls
        // at the same location, we should aggregate them into one "battery system" entry
        if (isBatteryDevice(device.device_type) && device.provider) {
          const lifetimeWh = extractBatteryWh(device.lifetime_totals);
          const baselineWh = extractBatteryWh(device.baseline_data);
          const pendingWh = Math.max(0, lifetimeWh - baselineWh);
          
          // Check if we already have a battery device entry (aggregate multiple Powerwalls)
          // Use the first battery device's name as the system name
          if (batteryDevices.length > 0) {
            // Aggregate into existing entry
            batteryDevices[0].lifetimeKwh += lifetimeWh / 1000;
            batteryDevices[0].pendingKwh += pendingWh / 1000;
          } else {
            // First battery device - create the entry
            batteryDevices.push({
              deviceId: device.device_id,
              deviceName,
              provider: 'tesla',
              lifetimeKwh: lifetimeWh / 1000,
              pendingKwh: pendingWh / 1000,
            });
          }
        }
        
        // Vehicle devices (EVs)
        if (isVehicleDevice(device.device_type) && device.provider) {
          const lifetimeMiles = Number(device.lifetime_totals?.odometer || 0);
          const baselineMiles = Number(device.baseline_data?.odometer || 0);
          const pendingMilesVal = Math.max(0, lifetimeMiles - baselineMiles);
          
          const lifetimeChargingKwh = Number(device.lifetime_totals?.charging_kwh || 0);
          const baselineChargingKwh = Number(device.baseline_data?.charging_kwh || 0);
          const pendingChargingKwhVal = Math.max(0, lifetimeChargingKwh - baselineChargingKwh);
          
          const lifetimeSuperchargerKwh = Number(device.lifetime_totals?.supercharger_kwh || 0);
          const baselineSuperchargerKwh = Number(device.baseline_data?.supercharger_kwh || 0);
          const pendingSuperchargerKwhVal = Math.max(0, lifetimeSuperchargerKwh - baselineSuperchargerKwh);
          
          evDevices.push({
            deviceId: device.device_id,
            deviceName,
            provider: 'tesla',
            lifetimeMiles,
            pendingMiles: pendingMilesVal,
            lifetimeChargingKwh,
            pendingChargingKwh: pendingChargingKwhVal,
            lifetimeSuperchargerKwh,
            pendingSuperchargerKwh: pendingSuperchargerKwhVal,
          });
        }
        
        // Charger devices (Wall Connectors, Wallbox, etc.)
        if (isChargerDevice(device.device_type) && device.provider) {
          const lifetimeKwh = Number(device.lifetime_totals?.charging_kwh || device.lifetime_totals?.home_charger_kwh || 0);
          const baselineKwh = Number(device.baseline_data?.charging_kwh || 0);
          const pendingKwhVal = Math.max(0, lifetimeKwh - baselineKwh);
          
          chargerDevices.push({
            deviceId: device.device_id,
            deviceName,
            provider: device.provider as 'tesla' | 'wallbox',
            lifetimeKwh,
            pendingKwh: pendingKwhVal,
          });
        }
      }
      
      console.log('Per-device data:', { solarDevices, batteryDevices, evDevices, chargerDevices });

      const newData: ActivityData = {
        // Lifetime minted (from confirmed blockchain transactions)
        lifetimeMinted,
        // Lifetime totals (for NFT milestone progress)
        solarEnergyProduced: solarEnergy,
        evMilesDriven: evMiles,
        batteryStorageDischarged: batteryDischarge,
        teslaSuperchargerKwh: superchargerKwh,
        homeChargerKwh: homeChargerKwh,
        // Pending (since last mint, eligible for token rewards)
        pendingSolarKwh: pendingSolar,
        pendingEvMiles: pendingEvMiles,
        pendingBatteryKwh: pendingBattery,
        pendingChargingKwh: pendingCharging,
        pendingSuperchargerKwh: pendingSupercharger,
        pendingHomeChargerKwh: pendingHomeCharger,
        // Totals
        tokensEarned,
        pendingTokens,
        referralTokens,
        nftsEarned: earnedNFTs,
        co2OffsetPounds: 0,
        deviceLabels,
        // Per-device data
        solarDevices,
        batteryDevices,
        evDevices,
        chargerDevices,
      };

      // Always compute CO2 from the live dashboard metrics so it stays consistent with the UI
      newData.co2OffsetPounds = calculateCO2Offset(newData);

      setActivityData(newData);
      setLastUpdatedAt(nowIso);

      // Toast removed — was firing on every auto-refresh cycle, spamming the user
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [profileConnections, isViewingAsOther, fetchEnphaseData, fetchSolarEdgeData, fetchTeslaData, fetchWallboxData, fetchRewardsData, fetchReferralTokens, fetchDeviceLabels, fetchMintedTokens, fetchDevicesSnapshot]);

  // Auto-refresh once when the user has at least one connected provider.
  // FAST PATH: Show DB-cached data instantly, then update with fresh API data in background.
  useEffect(() => {
    if (!isOnDashboard) return;
    if (!profileConnections) return;
    if (hasAutoRefreshedOnce.current) return;

    const anyConnected =
      profileConnections.tesla_connected ||
      profileConnections.enphase_connected ||
      profileConnections.solaredge_connected ||
      profileConnections.wallbox_connected;

    if (!anyConnected) return;

    hasAutoRefreshedOnce.current = true;
    hasAutoRefreshedOnceGlobal = true;

    // Step 1: Show DB-stored data instantly (no API calls, ~200ms)
    buildFastPathData().then((fastData) => {
      if (fastData) {
        console.log('[Dashboard] Fast path loaded from DB');
        setActivityData(fastData);
        setLastUpdatedAt(new Date().toISOString());
      }
    });

    // Step 2: Full API refresh in background (updates when APIs respond)
    setIsAutoSyncing(true);
    refreshDashboard().finally(() => setIsAutoSyncing(false));
  }, [isOnDashboard, profileConnections, refreshDashboard, buildFastPathData]);

  // Auto-refresh when connections actually change (not on route transitions)
  const prevConnectionsRef = useRef<string | null>(cachedConnectionKey);
  useEffect(() => {
    if (!isOnDashboard) return;
    if (!profileConnections) return; // Wait until we have real data
    
    const connectionKey = [
      profileConnections.enphase_connected,
      profileConnections.solaredge_connected,
      profileConnections.tesla_connected,
      profileConnections.wallbox_connected,
    ].join(',');
    
    // Skip if connections haven't actually changed
    if (prevConnectionsRef.current === connectionKey) return;
    
    // On first render (or first time we have data), just record the state
    // without triggering a refresh — the auto-refresh-once effect handles initial load
    if (prevConnectionsRef.current === null) {
      prevConnectionsRef.current = connectionKey;
      return;
    }
    
    prevConnectionsRef.current = connectionKey;
    refreshDashboard();
  }, [isOnDashboard, profileConnections, refreshDashboard]);

  const connectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: true } : acc
      )
    );
    setProfileConnections(prev => prev ? { ...prev, [`${service}_connected`]: true } : null);
  }, []);

  const disconnectAccount = useCallback(async (service: ConnectedAccount['service']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // 1. Delete energy tokens for this provider
      const { error: tokenError } = await supabase
        .from('energy_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

      if (tokenError) {
        console.error('Failed to delete energy tokens:', tokenError);
      }

      // 2. Delete connected devices for this provider
      const { error: deviceError } = await supabase
        .from('connected_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

      if (deviceError) {
        console.error('Failed to delete connected devices:', deviceError);
      }

      // 3. Update profile to mark provider as disconnected
      const updateField = `${service}_connected`;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ [updateField]: false })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
        toast.error('Failed to disconnect account');
        return;
      }

      // 4. Update local state
      setConnectedAccounts(prev => 
        prev.map(acc => 
          acc.service === service ? { ...acc, connected: false } : acc
        )
      );
      setProfileConnections(prev => prev ? { ...prev, [`${service}_connected`]: false } : null);
      setActivityData(defaultActivityData);
      
      toast.success(`${service.charAt(0).toUpperCase() + service.slice(1)} disconnected`);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect account');
    }
  }, []);

  return {
    activityData,
    connectedAccounts,
    isLoading,
    connectAccount,
    disconnectAccount,
    refreshDashboard,
    lastUpdatedAt,
    providerRefresh,
    isAutoSyncing,
    setIsAutoSyncing,
  };
}
