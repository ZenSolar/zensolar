import { useState, useCallback } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset } from '@/types/dashboard';

// Demo data based on real user KPIs - substantial values showing active usage
const demoActivityData: ActivityData = {
  solarEnergyProduced: 12847, // ~13 MWh lifetime solar production
  evMilesDriven: 24532, // ~24.5k EV miles
  batteryStorageDischarged: 3218, // ~3.2 MWh battery discharge
  teslaSuperchargerKwh: 892, // Supercharger usage
  homeChargerKwh: 4127, // Home charging
  tokensEarned: 45616, // Total tokens earned
  referralTokens: 2500, // Bonus from referrals
  nftsEarned: [
    'Solar Genesis', 'Sunlink Pioneer', 'Photon Harvester', 'Rayfield Master',
    'EV Ignition', 'Road Cruiser', 'Autobahn Elite',
    'Spark Starter', 'Supercharger Pro', 'Megavolt Master',
    'Powerwall Guardian', 'Gridlink Hero',
    'Duality Achiever', 'Trifecta Champion'
  ],
  co2OffsetPounds: 0,
  deviceLabels: {
    vehicle: 'Model Y Long Range',
    powerwall: 'Powerwall 2',
    wallConnector: 'Wall Connector Gen 3',
    solar: 'Tesla Solar Roof',
    homeCharger: 'Wall Connector Gen 3',
  },
};

// Calculate CO2 offset
demoActivityData.co2OffsetPounds = calculateCO2Offset(demoActivityData);

const demoConnectedAccounts: ConnectedAccount[] = [
  { service: 'tesla', connected: true, label: 'Tesla' },
  { service: 'enphase', connected: false, label: 'Enphase' },
  { service: 'solaredge', connected: true, label: 'SolarEdge' },
  { service: 'wallbox', connected: false, label: 'Wallbox' },
];

const demoProfile = {
  display_name: 'Demo User',
  wallet_address: '0x1234...5678',
  referral_code: 'DEMO2024',
  tesla_connected: true,
  enphase_connected: false,
  solaredge_connected: true,
  wallbox_connected: false,
  facebook_connected: true,
  facebook_handle: 'demouser',
  instagram_connected: true,
  instagram_handle: 'zensolar_demo',
  tiktok_connected: false,
  tiktok_handle: null,
  twitter_connected: true,
  twitter_handle: 'zensolar_demo',
  linkedin_connected: false,
  linkedin_handle: null,
};

export function useDemoData() {
  const [activityData] = useState<ActivityData>(demoActivityData);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(demoConnectedAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [profile] = useState(demoProfile);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  const connectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: true } : acc
      )
    );
  }, []);

  const disconnectAccount = useCallback((service: ConnectedAccount['service']) => {
    setConnectedAccounts(prev => 
      prev.map(acc => 
        acc.service === service ? { ...acc, connected: false } : acc
      )
    );
  }, []);

  return {
    activityData,
    connectedAccounts,
    isLoading,
    profile,
    connectAccount,
    disconnectAccount,
    refreshDashboard,
  };
}
