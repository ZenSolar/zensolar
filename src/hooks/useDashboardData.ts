import { useState, useCallback } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset } from '@/types/dashboard';

const mockActivityData: ActivityData = {
  solarEnergyProduced: 20924.401,
  evMilesDriven: 12000,
  batteryStorageDischarged: 2000,
  evCharging: 300,
  tokensEarned: 22424,
  nftsEarned: [1, 2, 3, 4],
  co2OffsetPounds: 0,
};

const initialConnectedAccounts: ConnectedAccount[] = [
  { service: 'tesla', connected: false, label: 'Tesla' },
  { service: 'enphase', connected: false, label: 'Enphase' },
  { service: 'solaredge', connected: false, label: 'SolarEdge' },
];

export function useDashboardData() {
  const [activityData, setActivityData] = useState<ActivityData>(() => {
    const data = { ...mockActivityData };
    data.co2OffsetPounds = calculateCO2Offset(data);
    return data;
  });
  
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(initialConnectedAccounts);
  const [isLoading, setIsLoading] = useState(false);

  const connectAccount = useCallback((service: ConnectedAccount['service']) => {
    // In production, this would redirect to OAuth flow
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: true } : acc
      )
    );
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setActivityData(prev => ({
      ...prev,
      co2OffsetPounds: calculateCO2Offset(prev),
    }));
    setIsLoading(false);
  }, []);

  return {
    activityData,
    connectedAccounts,
    isLoading,
    connectAccount,
    refreshDashboard,
  };
}
