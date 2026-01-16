import { useState, useCallback } from 'react';
import { ActivityData, ConnectedAccount, calculateCO2Offset } from '@/types/dashboard';
import { getAllEarnedNFTNames } from '@/lib/nftMilestones';

// Demo data based on real user KPIs - substantial values showing active usage
// Values chosen to demonstrate realistic achievements across all categories
const DEMO_SOLAR_KWH = 12847;      // Earns: Sunspark, Photonic, Rayforge, Solaris, Helios
const DEMO_EV_MILES = 24532;       // Earns: Ignitor, Velocity, Autobahn, Hyperdrive, Electra
const DEMO_BATTERY_KWH = 3218;     // Earns: Voltbank, Gridpulse, Megacell
const DEMO_CHARGING_KWH = 5019;    // Combined supercharger + home = Ignite thru Gigacharge

// Calculate NFTs earned based on actual milestone thresholds
const demoNftsEarned = getAllEarnedNFTNames(
  DEMO_SOLAR_KWH,
  DEMO_BATTERY_KWH,
  DEMO_CHARGING_KWH,
  DEMO_EV_MILES,
  true // isRegisteredUser - includes Welcome NFT
);

const demoActivityData: ActivityData = {
  // Lifetime minted (demo shows some tokens already minted)
  lifetimeMinted: 31930,
  // Lifetime totals (for NFT milestone progress)
  solarEnergyProduced: DEMO_SOLAR_KWH,
  evMilesDriven: DEMO_EV_MILES,
  batteryStorageDischarged: DEMO_BATTERY_KWH,
  teslaSuperchargerKwh: 892,
  homeChargerKwh: 4127,
  // Pending rewards (simulating 30% pending since last mint)
  pendingSolarKwh: Math.round(DEMO_SOLAR_KWH * 0.3),
  pendingEvMiles: Math.round(DEMO_EV_MILES * 0.3),
  pendingBatteryKwh: Math.round(DEMO_BATTERY_KWH * 0.3),
  pendingChargingKwh: Math.round(5019 * 0.3),
  // Reward totals
  tokensEarned: 45616,
  pendingTokens: Math.round(45616 * 0.3),
  referralTokens: 2500,
  nftsEarned: demoNftsEarned,
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
