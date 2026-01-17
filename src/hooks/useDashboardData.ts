import { useState, useCallback, useEffect } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset, DeviceLabels } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
};

interface ProfileConnections {
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
}

export function useDashboardData() {
  const [activityData, setActivityData] = useState<ActivityData>(defaultActivityData);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { service: 'tesla', connected: false, label: 'Tesla' },
    { service: 'enphase', connected: false, label: 'Enphase' },
    { service: 'solaredge', connected: false, label: 'SolarEdge' },
    { service: 'wallbox', connected: false, label: 'Wallbox' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileConnections, setProfileConnections] = useState<ProfileConnections | null>(null);

  type ProviderKey = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
  type ProviderRefreshState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    updatedAt?: string;
    cached?: boolean;
    stale?: boolean;
    rateLimited?: boolean;
    error?: string;
  };

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [providerRefresh, setProviderRefresh] = useState<Record<ProviderKey, ProviderRefreshState>>({
    tesla: { status: 'idle' },
    enphase: { status: 'idle' },
    solaredge: { status: 'idle' },
    wallbox: { status: 'idle' },
  });
  // Fetch profile connections separately
  useEffect(() => {
    const fetchConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tesla_connected, enphase_connected, solaredge_connected, wallbox_connected')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileConnections(profile);
        setConnectedAccounts([
          { service: 'tesla', connected: profile.tesla_connected || false, label: 'Tesla' },
          { service: 'enphase', connected: profile.enphase_connected || false, label: 'Enphase' },
          { service: 'solaredge', connected: profile.solaredge_connected || false, label: 'SolarEdge' },
          { service: 'wallbox', connected: profile.wallbox_connected || false, label: 'Wallbox' },
        ]);
      }
      setIsLoading(false);
    };

    fetchConnections();
  }, []);

  const fetchEnphaseData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

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
        } else if (errorMessage.includes('needsReauth') || errorMessage.includes('Token expired')) {
          toast.error('Tesla connection expired. Please reconnect your account.');
        }
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch Tesla data:', error);
      return null;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('referrals')
        .select('tokens_rewarded')
        .eq('referrer_id', user.id);

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

  // Fetch total tokens actually minted from mint_transactions
  const fetchMintedTokens = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('mint_transactions')
        .select('tokens_minted')
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data: devices, error } = await supabase
        .from('connected_devices')
        .select('device_type, device_name, provider')
        .eq('user_id', user.id);

      if (error) {
        console.error('Device labels fetch error:', error);
        return {};
      }

      const labels: DeviceLabels = {};

      for (const device of devices || []) {
        if (device.device_type === 'vehicle' && device.device_name) {
          labels.vehicle = device.device_name;
        } else if (device.device_type === 'powerwall' && device.device_name) {
          labels.powerwall = device.device_name;
        } else if (device.device_type === 'wall_connector' && device.device_name) {
          labels.wallConnector = device.device_name;
        } else if (device.device_type === 'charger' && device.provider === 'wallbox' && device.device_name) {
          // Wallbox chargers
          labels.homeCharger = device.device_name;
        } else if (device.device_type === 'solar_system' && device.device_name) {
          labels.solar = device.device_name;
        } else if (device.device_type === 'solar' && device.device_name) {
          // Tesla solar
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('connected_devices')
        .select('provider, device_type, baseline_data, lifetime_totals, last_minted_at')
        .eq('user_id', user.id);

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
      const [enphaseData, solarEdgeData, teslaData, wallboxData, rewardsData, referralTokens, deviceLabels, lifetimeMinted, devicesSnapshot] = await Promise.all([
        profileConnections?.enphase_connected ? fetchEnphaseData() : null,
        profileConnections?.solaredge_connected ? fetchSolarEdgeData() : null,
        profileConnections?.tesla_connected ? fetchTeslaData() : null,
        profileConnections?.wallbox_connected ? fetchWallboxData() : null,
        fetchRewardsData(),
        fetchReferralTokens(),
        fetchDeviceLabels(),
        fetchMintedTokens(),
        fetchDevicesSnapshot(),
      ]);

      // Update provider refresh state
      setProviderRefresh((prev) => {
        const toState = (d: any, connected?: boolean): ProviderRefreshState => {
          if (!connected) return { status: 'idle' };
          if (!d) return { status: 'error', updatedAt: nowIso, error: 'no_data' };
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

        const teslaSolarWhTotal = sum(teslaDevices.filter((d) => d.device_type === 'powerwall' || d.device_type === 'solar'), (d) => lifetimeSolarWh(d.lifetime_totals));
        const teslaSolarWhPending = sum(teslaDevices.filter((d) => d.device_type === 'powerwall' || d.device_type === 'solar'), (d) => Math.max(0, lifetimeSolarWh(d.lifetime_totals) - baselineSolarWh(d.baseline_data)));

        const teslaBatteryWhTotal = sum(teslaDevices.filter((d) => d.device_type === 'powerwall' || d.device_type === 'battery'), (d) => lifetimeBatteryWh(d.lifetime_totals));
        const teslaBatteryWhPending = sum(teslaDevices.filter((d) => d.device_type === 'powerwall' || d.device_type === 'battery'), (d) => Math.max(0, lifetimeBatteryWh(d.lifetime_totals) - baselineBatteryWh(d.baseline_data)));

        const teslaVehicleMilesTotal = sum(teslaDevices.filter((d) => d.device_type === 'vehicle'), (d) => Number(d.lifetime_totals?.odometer || 0));
        const teslaVehicleMilesPending = sum(teslaDevices.filter((d) => d.device_type === 'vehicle'), (d) => Math.max(0, Number(d.lifetime_totals?.odometer || 0) - Number(d.baseline_data?.odometer || 0)));

        const teslaChargingKwhTotal = sum(teslaDevices.filter((d) => d.device_type === 'vehicle'), (d) => Number(d.lifetime_totals?.charging_kwh || 0));
        const teslaChargingKwhPending = sum(teslaDevices.filter((d) => d.device_type === 'vehicle'), (d) => Math.max(0, Number(d.lifetime_totals?.charging_kwh || 0) - Number(d.baseline_data?.charging_kwh || 0)));

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
        const apiPendingWh = Number((enphaseData.totals as any).pending_solar_wh || 0);

        // If provider is cached/rate-limited and returns 0, fall back to last known backend totals
        const effectiveLifetimeKwh = apiLifetimeWh > 0 ? apiLifetimeWh / 1000 : fallback.solarLifetimeKwh;
        const effectivePendingKwh = apiLifetimeWh > 0
          ? (apiPendingWh > 0 ? apiPendingWh / 1000 : effectiveLifetimeKwh)
          : fallback.solarPendingKwh;

        solarEnergy = effectiveLifetimeKwh;
        pendingSolar = effectivePendingKwh;

        console.log('Enphase solar:', solarEnergy, 'kWh, pending:', pendingSolar, 'kWh');
      }

      // Process SolarEdge data - use lifetime energy for solar
      if (solarEdgeData?.totals && !enphaseData?.totals) {
        // Only use SolarEdge if Enphase not available (Enphase takes priority)
        const apiLifetimeWh = Number(solarEdgeData.totals.lifetime_solar_wh || 0);
        const apiPendingWh = Number((solarEdgeData.totals as any).pending_solar_wh || 0);

        const effectiveLifetimeKwh = apiLifetimeWh > 0 ? apiLifetimeWh / 1000 : fallback.solarLifetimeKwh;
        const effectivePendingKwh = apiLifetimeWh > 0
          ? (apiPendingWh > 0 ? apiPendingWh / 1000 : effectiveLifetimeKwh)
          : fallback.solarPendingKwh;

        solarEnergy = effectiveLifetimeKwh;
        pendingSolar = effectivePendingKwh;

        console.log('SolarEdge solar:', solarEnergy, 'kWh, pending:', pendingSolar, 'kWh');
      }

      // Process Tesla data - EV miles, battery storage, EV charging
      // Tesla API returns both lifetime and pending values
      if (teslaData?.totals) {
        // Lifetime values
        batteryDischarge = (teslaData.totals.battery_discharge_wh || 0) / 1000;
        evMiles = teslaData.totals.ev_miles || 0;
        superchargerKwh = teslaData.totals.supercharger_kwh || 0;
        homeChargerKwh = teslaData.totals.wall_connector_kwh || 0;

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
        const teslaPendingHomeCharger = teslaData.totals.pending_wall_connector_kwh !== undefined
          ? teslaData.totals.pending_wall_connector_kwh
          : homeChargerKwh;

        // Only use Tesla solar/pending if no dedicated solar provider
        if (!hasDedicatedSolarProvider) {
          solarEnergy += (teslaData.totals.solar_production_wh || 0) / 1000;
          pendingSolar = teslaPendingSolar;
        }

        pendingBattery = teslaPendingBattery;
        pendingEvMiles = teslaPendingEvMiles;
        pendingSupercharger = teslaPendingSupercharger;
        pendingHomeCharger = teslaPendingHomeCharger;
        pendingCharging = pendingSupercharger + pendingHomeCharger;

        console.log('Tesla data:', { batteryDischarge, evMiles, superchargerKwh, homeChargerKwh, hasDedicatedSolarProvider });
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
      
      // Pending activity units (1:1 ratio with activity)
      // User receives 93% of this as tokens (5% burn, 1% LP, 1% treasury)
      const pendingActivityUnits = 
        Math.floor(pendingSolar) +
        Math.floor(pendingEvMiles) +
        Math.floor(pendingBattery) +
        Math.floor(pendingCharging);
      
      // What user will actually receive after fee distribution
      const pendingTokens = Math.floor(pendingActivityUnits * 0.93);
      
      const earnedNFTs = rewardsData?.earned_nfts || [];

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
      };

      // Always compute CO2 from the live dashboard metrics so it stays consistent with the UI
      newData.co2OffsetPounds = calculateCO2Offset(newData);

      
      setActivityData(newData);
      setLastUpdatedAt(nowIso);

      if (solarEnergy > 0 || tokensEarned > 0) {
        toast.success('Dashboard updated with real data!');
      }

  // Auto-refresh when connections change
  useEffect(() => {
    if (profileConnections?.enphase_connected || profileConnections?.solaredge_connected || profileConnections?.tesla_connected || profileConnections?.wallbox_connected) {
      refreshDashboard();
    }
  }, [profileConnections?.enphase_connected, profileConnections?.solaredge_connected, profileConnections?.tesla_connected, profileConnections?.wallbox_connected, refreshDashboard]);

  const connectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: true } : acc
      )
    );
    setProfileConnections(prev => prev ? { ...prev, [`${service}_connected`]: true } : null);
  }, []);

  const disconnectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: false } : acc
      )
    );
    setProfileConnections(prev => prev ? { ...prev, [`${service}_connected`]: false } : null);
    setActivityData(defaultActivityData);
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
  };
}
