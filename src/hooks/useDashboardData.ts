import { useState, useCallback, useEffect } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaultActivityData: ActivityData = {
  solarEnergyProduced: 0,
  evMilesDriven: 0,
  batteryStorageDischarged: 0,
  evCharging: 0,
  tokensEarned: 0,
  nftsEarned: [],
  co2OffsetPounds: 0,
};

interface ProfileConnections {
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
}

export function useDashboardData() {
  const [activityData, setActivityData] = useState<ActivityData>(defaultActivityData);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { service: 'tesla', connected: false, label: 'Tesla' },
    { service: 'enphase', connected: false, label: 'Enphase' },
    { service: 'solaredge', connected: false, label: 'SolarEdge' },
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
        .select('tesla_connected, enphase_connected, solaredge_connected')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileConnections(profile);
        setConnectedAccounts([
          { service: 'tesla', connected: profile.tesla_connected || false, label: 'Tesla' },
          { service: 'enphase', connected: profile.enphase_connected || false, label: 'Enphase' },
          { service: 'solaredge', connected: profile.solaredge_connected || false, label: 'SolarEdge' },
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
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch Enphase data:', error);
      return null;
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let solarEnergy = 0;

      // Fetch Enphase data if connected
      if (profileConnections?.enphase_connected) {
        const enphaseData = await fetchEnphaseData();
        if (enphaseData?.summary) {
          // Convert Wh to kWh
          solarEnergy = (enphaseData.summary.energy_lifetime || 0) / 1000;
        } else if (enphaseData?.energy) {
          solarEnergy = (enphaseData.energy.production?.[0] || 0) / 1000;
        }
      }

      // TODO: Fetch Tesla data when connected

      const newData: ActivityData = {
        solarEnergyProduced: solarEnergy,
        evMilesDriven: 0, // Will come from Tesla
        batteryStorageDischarged: 0,
        evCharging: 0,
        tokensEarned: Math.floor(solarEnergy), // Simple calculation
        nftsEarned: [],
        co2OffsetPounds: 0,
      };
      
      newData.co2OffsetPounds = calculateCO2Offset(newData);
      setActivityData(newData);
      
      if (solarEnergy > 0) {
        toast.success('Dashboard updated with real data!');
      }
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [profileConnections, fetchEnphaseData]);

  // Auto-refresh when connections change
  useEffect(() => {
    if (profileConnections?.enphase_connected || profileConnections?.tesla_connected) {
      refreshDashboard();
    }
  }, [profileConnections?.enphase_connected, profileConnections?.tesla_connected, refreshDashboard]);

  const connectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: true } : acc
      )
    );
    // Update local state
    setProfileConnections(prev => prev ? { ...prev, [`${service}_connected`]: true } : null);
  }, []);

  return {
    activityData,
    connectedAccounts,
    isLoading,
    connectAccount,
    refreshDashboard,
  };
}
