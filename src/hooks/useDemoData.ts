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

const createDemoActivityData = (): ActivityData => ({
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
  pendingSuperchargerKwh: Math.round(892 * 0.3),
  pendingHomeChargerKwh: Math.round(4127 * 0.3),
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
});

const demoConnectedAccounts: ConnectedAccount[] = [
  { service: 'tesla', connected: true, label: 'Tesla' },
  { service: 'enphase', connected: false, label: 'Enphase' },
  { service: 'solaredge', connected: true, label: 'SolarEdge' },
  { service: 'wallbox', connected: false, label: 'Wallbox' },
];

const createDemoProfile = () => ({
  display_name: 'Demo',
  wallet_address: '0xDemo1234...5678', // Pre-connected wallet address
  referral_code: 'DEMO2026',
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
});

// Demo eligibility data - calculated based on actual demo activity thresholds
const createDemoEligibility = (hasWelcomeNFT: boolean, mintedNfts: number[]) => {
  // Based on demo values: Solar 12847, EV Miles 24532, Battery 3218, Charging 5019
  const eligibleMilestoneNFTs = [
    // Solar NFTs earned (500, 1000, 2500, 5000, 10000 thresholds - demo has 12847)
    { tokenId: 1, category: 'solar', name: 'Sunspark', threshold: 500, description: '500 kWh solar generated' },
    { tokenId: 2, category: 'solar', name: 'Photonic', threshold: 1000, description: '1,000 kWh solar generated' },
    { tokenId: 3, category: 'solar', name: 'Rayforge', threshold: 2500, description: '2,500 kWh solar generated' },
    { tokenId: 4, category: 'solar', name: 'Solaris', threshold: 5000, description: '5,000 kWh solar generated' },
    { tokenId: 5, category: 'solar', name: 'Helios', threshold: 10000, description: '10,000 kWh solar generated' },
    // Battery NFTs earned (500, 1000, 2500 thresholds - demo has 3218)
    { tokenId: 9, category: 'battery', name: 'Voltbank', threshold: 500, description: '500 kWh battery discharged' },
    { tokenId: 10, category: 'battery', name: 'Gridpulse', threshold: 1000, description: '1,000 kWh battery discharged' },
    { tokenId: 11, category: 'battery', name: 'Megacell', threshold: 2500, description: '2,500 kWh battery discharged' },
    // EV Charging NFTs earned (100, 500, 1000, 1500, 2500, 5000 thresholds - demo has 5019)
    { tokenId: 16, category: 'charging', name: 'Ignite', threshold: 100, description: '100 kWh EV charging' },
    { tokenId: 17, category: 'charging', name: 'Voltcharge', threshold: 500, description: '500 kWh EV charging' },
    { tokenId: 18, category: 'charging', name: 'Kilovolt', threshold: 1000, description: '1,000 kWh EV charging' },
    { tokenId: 19, category: 'charging', name: 'Ampforge', threshold: 1500, description: '1,500 kWh EV charging' },
    { tokenId: 20, category: 'charging', name: 'Chargeon', threshold: 2500, description: '2,500 kWh EV charging' },
    { tokenId: 21, category: 'charging', name: 'Gigacharge', threshold: 5000, description: '5,000 kWh EV charging' },
    // EV Miles NFTs earned (100, 500, 1000, 5000, 10000 thresholds - demo has 24532)
    { tokenId: 24, category: 'ev_miles', name: 'Ignitor', threshold: 100, description: '100 EV miles driven' },
    { tokenId: 25, category: 'ev_miles', name: 'Velocity', threshold: 500, description: '500 EV miles driven' },
    { tokenId: 26, category: 'ev_miles', name: 'Autobahn', threshold: 1000, description: '1,000 EV miles driven' },
    { tokenId: 27, category: 'ev_miles', name: 'Hyperdrive', threshold: 5000, description: '5,000 EV miles driven' },
    { tokenId: 28, category: 'ev_miles', name: 'Electra', threshold: 10000, description: '10,000 EV miles driven' },
  ].filter(nft => !mintedNfts.includes(nft.tokenId));

  const eligibleComboNFTs = [
    { tokenId: 34, name: 'Duality', comboType: 'category_count', description: 'Earned NFTs in 2 categories' },
    { tokenId: 35, name: 'Trifecta', comboType: 'category_count', description: 'Earned NFTs in 3 categories' },
    { tokenId: 36, name: 'Quadrant', comboType: 'nft_count', description: 'Earned 5+ category NFTs' },
    { tokenId: 37, name: 'Constellation', comboType: 'nft_count', description: 'Earned 10+ category NFTs' },
  ].filter(nft => !mintedNfts.includes(nft.tokenId));

  return {
    hasWelcomeNFT,
    ownedNFTs: mintedNfts,
    eligibleMilestoneNFTs,
    eligibleComboNFTs,
    totalEligible: eligibleMilestoneNFTs.length + eligibleComboNFTs.length,
  };
};

export interface DemoMintResult {
  success: boolean;
  txHash: string;
  message: string;
  tokensMinted?: number;
  nftsMinted?: number[];
  nftNames?: string[];
}

export function useDemoData() {
  const [activityData, setActivityData] = useState<ActivityData>(() => {
    const data = createDemoActivityData();
    data.co2OffsetPounds = calculateCO2Offset(data);
    return data;
  });
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(demoConnectedAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(createDemoProfile);
  const [hasWelcomeNFT, setHasWelcomeNFT] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<number[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  
  // Provider refresh state for UI indicators
  const [providerRefresh] = useState({
    tesla: { status: 'success' as const, updatedAt: new Date().toISOString() },
    enphase: { status: 'idle' as const },
    solaredge: { status: 'success' as const, updatedAt: new Date().toISOString() },
    wallbox: { status: 'idle' as const },
  });

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdatedAt(new Date().toISOString());
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

  const connectWallet = useCallback((address: string) => {
    setProfile(prev => ({ ...prev, wallet_address: address }));
  }, []);

  const disconnectWallet = useCallback(() => {
    setProfile(prev => ({ ...prev, wallet_address: null }));
    setHasWelcomeNFT(false);
    setMintedNFTs([]);
  }, []);

  // Fake minting functions with 4-second blockchain simulation
  const simulateMintWelcomeNFT = useCallback(async (): Promise<DemoMintResult> => {
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4-second blockchain delay
    
    if (hasWelcomeNFT) {
      return {
        success: true,
        txHash: '0xdemo...already',
        message: "You already have your Welcome NFT! Keep earning to unlock milestone NFTs.",
      };
    }
    
    setHasWelcomeNFT(true);
    setMintedNFTs(prev => [...prev, 0]); // Token ID 0 = Welcome NFT
    
    return {
      success: true,
      txHash: '0xdemo' + Math.random().toString(16).slice(2, 10) + '...',
      message: 'Welcome NFT successfully minted to Base Sepolia! 🎉',
      nftsMinted: [0],
      nftNames: ['Welcome NFT'],
    };
  }, [hasWelcomeNFT]);

  const simulateMintTokens = useCallback(async (category: string): Promise<DemoMintResult> => {
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4-second blockchain delay
    
    // Calculate tokens based on category
    let tokens = 0;
    const breakdown: Record<string, number> = {};
    
    if (category === 'all' || category === 'solar') {
      breakdown.solarKwh = activityData.pendingSolarKwh || 0;
      tokens += breakdown.solarKwh;
    }
    if (category === 'all' || category === 'ev_miles') {
      breakdown.evMiles = activityData.pendingEvMiles || 0;
      tokens += breakdown.evMiles;
    }
    if (category === 'all' || category === 'battery') {
      breakdown.batteryKwh = activityData.pendingBatteryKwh || 0;
      tokens += breakdown.batteryKwh;
    }
    if (category === 'all' || category === 'charging') {
      breakdown.chargingKwh = activityData.pendingChargingKwh || 0;
      tokens += breakdown.chargingKwh;
    }
    
    // User receives 75% (20% burn, 3% LP, 2% treasury)
    const userTokens = Math.floor(tokens * 0.75);
    
    // Clear pending rewards after mint
    setActivityData(prev => ({
      ...prev,
      pendingSolarKwh: category === 'all' || category === 'solar' ? 0 : prev.pendingSolarKwh,
      pendingEvMiles: category === 'all' || category === 'ev_miles' ? 0 : prev.pendingEvMiles,
      pendingBatteryKwh: category === 'all' || category === 'battery' ? 0 : prev.pendingBatteryKwh,
      pendingChargingKwh: category === 'all' || category === 'charging' ? 0 : prev.pendingChargingKwh,
      pendingSuperchargerKwh: category === 'all' || category === 'charging' ? 0 : prev.pendingSuperchargerKwh,
      pendingHomeChargerKwh: category === 'all' || category === 'charging' ? 0 : prev.pendingHomeChargerKwh,
      lifetimeMinted: prev.lifetimeMinted + userTokens,
      tokensEarned: prev.tokensEarned + userTokens,
    }));
    
    return {
      success: true,
      txHash: '0xdemo' + Math.random().toString(16).slice(2, 10) + '...',
      message: `${userTokens.toLocaleString()} $ZSOLAR tokens successfully minted to Base Sepolia! 🎉`,
      tokensMinted: userTokens,
    };
  }, [activityData]);

  const simulateMintMilestoneNFT = useCallback(async (tokenId: number, name: string): Promise<DemoMintResult> => {
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4-second blockchain delay
    
    if (mintedNFTs.includes(tokenId)) {
      return {
        success: true,
        txHash: '0xdemo...already',
        message: `You already own ${name}!`,
      };
    }
    
    setMintedNFTs(prev => [...prev, tokenId]);
    
    return {
      success: true,
      txHash: '0xdemo' + Math.random().toString(16).slice(2, 10) + '...',
      message: `${name} NFT successfully minted to Base Sepolia! 🎉`,
      nftsMinted: [tokenId],
      nftNames: [name],
    };
  }, [mintedNFTs]);

  const simulateBatchMintNFTs = useCallback(async (tokenIds: number[], names: string[]): Promise<DemoMintResult> => {
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4-second blockchain delay
    
    const newTokens = tokenIds.filter(id => !mintedNFTs.includes(id));
    const newNames = names.filter((_, i) => !mintedNFTs.includes(tokenIds[i]));
    
    if (newTokens.length === 0) {
      return {
        success: true,
        txHash: '0xdemo...already',
        message: 'All selected NFTs are already owned!',
      };
    }
    
    setMintedNFTs(prev => [...prev, ...newTokens]);
    
    return {
      success: true,
      txHash: '0xdemo' + Math.random().toString(16).slice(2, 10) + '...',
      message: `${newTokens.length} NFT${newTokens.length > 1 ? 's' : ''} successfully minted to Base Sepolia! 🎉`,
      nftsMinted: newTokens,
      nftNames: newNames,
    };
  }, [mintedNFTs]);

  // Get eligibility with current minted state
  const getEligibility = useCallback(() => {
    const eligibility = createDemoEligibility(hasWelcomeNFT, mintedNFTs);
    eligibility.totalEligible = eligibility.eligibleMilestoneNFTs.length + eligibility.eligibleComboNFTs.length;
    return eligibility;
  }, [hasWelcomeNFT, mintedNFTs]);

  return {
    activityData,
    connectedAccounts,
    isLoading,
    profile,
    connectAccount,
    disconnectAccount,
    refreshDashboard,
    connectWallet,
    disconnectWallet,
    lastUpdatedAt,
    providerRefresh,
    // Demo minting
    hasWelcomeNFT,
    mintedNFTs,
    getEligibility,
    simulateMintWelcomeNFT,
    simulateMintTokens,
    simulateMintMilestoneNFT,
    simulateBatchMintNFTs,
  };
}
