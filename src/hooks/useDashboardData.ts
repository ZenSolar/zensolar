import { useState, useCallback, useEffect } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset, DeviceLabels } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaultActivityData: ActivityData = {
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

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    
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

      // Fetch data in parallel (including device labels)
      const [enphaseData, solarEdgeData, teslaData, wallboxData, rewardsData, referralTokens, deviceLabels] = await Promise.all([
        profileConnections?.enphase_connected ? fetchEnphaseData() : null,
        profileConnections?.solaredge_connected ? fetchSolarEdgeData() : null,
        profileConnections?.tesla_connected ? fetchTeslaData() : null,
        profileConnections?.wallbox_connected ? fetchWallboxData() : null,
        fetchRewardsData(),
        fetchReferralTokens(),
        fetchDeviceLabels(),
      ]);

      // Solar source priority: Enphase > SolarEdge > Tesla
      // If Enphase or SolarEdge is connected, use that for solar (NOT Tesla)
      const hasDedicatedSolarProvider = profileConnections?.enphase_connected || profileConnections?.solaredge_connected;

      // Process Enphase data - use lifetime energy for solar
      if (enphaseData?.totals) {
        solarEnergy = (enphaseData.totals.lifetime_solar_wh || 0) / 1000; // Wh to kWh
        // Enphase pending would come from baseline comparison (to be added)
        console.log('Enphase solar:', solarEnergy, 'kWh');
      }

      // Process SolarEdge data - use lifetime energy for solar
      if (solarEdgeData?.totals && !enphaseData?.totals) {
        // Only use SolarEdge if Enphase not available (Enphase takes priority)
        solarEnergy = (solarEdgeData.totals.lifetime_solar_wh || 0) / 1000; // Wh to kWh
        console.log('SolarEdge solar:', solarEnergy, 'kWh');
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
        pendingSolar = (teslaData.totals.pending_solar_wh || 0) / 1000;
        pendingBattery = (teslaData.totals.pending_battery_wh || 0) / 1000;
        pendingEvMiles = teslaData.totals.pending_ev_miles || 0;
        pendingCharging = teslaData.totals.pending_charging_kwh || 0;
        
        // Only add Tesla solar if no Enphase/SolarEdge connected
        if (!hasDedicatedSolarProvider) {
          solarEnergy += (teslaData.totals.solar_production_wh || 0) / 1000;
        }
        console.log('Tesla data:', { batteryDischarge, evMiles, superchargerKwh, homeChargerKwh, hasDedicatedSolarProvider });
      }

      // Process Wallbox data - home charger kWh
      if (wallboxData?.totals) {
        homeChargerKwh += wallboxData.totals.home_charger_kwh || 0;
        pendingCharging += wallboxData.totals.pending_charging_kwh || 0;
        console.log('Wallbox data:', { homeChargerKwh: wallboxData.totals.home_charger_kwh });
      }

      // Total lifetime tokens (for display)
      const tokensEarned =
        Math.floor(evMiles) +
        Math.floor(solarEnergy) +
        Math.floor(batteryDischarge) +
        Math.floor(superchargerKwh) +
        Math.floor(homeChargerKwh);
      
      // Pending tokens (available to mint) - from rewards API or calculated from pending values
      const pendingTokens = rewardsData?.tokens_pending || 
        Math.floor(pendingSolar) + 
        Math.floor(pendingEvMiles) + 
        Math.floor(pendingBattery) + 
        Math.floor(pendingCharging);
      
      const earnedNFTs = rewardsData?.earned_nfts || [];

      const newData: ActivityData = {
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
      
      if (solarEnergy > 0 || tokensEarned > 0) {
        toast.success('Dashboard updated with real data!');
      }
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [profileConnections, fetchEnphaseData, fetchSolarEdgeData, fetchTeslaData, fetchWallboxData, fetchRewardsData, fetchReferralTokens, fetchDeviceLabels]);

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
  };
}
