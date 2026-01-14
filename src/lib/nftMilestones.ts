// NFT Milestone definitions for all activity categories
// These are the source of truth - frontend and backend both use these
// Updated: January 14, 2026 - Aligned with final_milestones.docx

export interface NFTMilestone {
  id: string;
  name: string;
  threshold: number;
  description: string;
  color: string;
  icon: string; // Lucide icon name for reference
}

export interface NFTCategory {
  id: string;
  name: string;
  unit: string;
  milestones: NFTMilestone[];
}

// Welcome NFT - issued automatically on account registration (non-redeemable)
export const WELCOME_MILESTONE: NFTMilestone = {
  id: 'welcome',
  name: 'Welcome',
  threshold: 0,
  description: 'Welcome to ZenSolar',
  color: 'bg-gradient-to-r from-amber-400 to-yellow-500',
  icon: 'star'
};

// Solar Energy Production milestones (8 tiers: 500-100,000 kWh)
export const SOLAR_MILESTONES: NFTMilestone[] = [
  { id: 'solar_1', name: 'Sunlink', threshold: 500, description: '500 kWh generated', color: 'bg-lime-500', icon: 'sun' },
  { id: 'solar_2', name: 'Photon', threshold: 1000, description: '1,000 kWh generated', color: 'bg-emerald-500', icon: 'zap' },
  { id: 'solar_3', name: 'Rayfield', threshold: 2500, description: '2,500 kWh generated', color: 'bg-teal-500', icon: 'shield' },
  { id: 'solar_4', name: 'Solarflare', threshold: 5000, description: '5,000 kWh generated', color: 'bg-cyan-500', icon: 'flame' },
  { id: 'solar_5', name: 'Heliogen', threshold: 10000, description: '10,000 kWh generated', color: 'bg-blue-500', icon: 'lightbulb' },
  { id: 'solar_6', name: 'Sunvault', threshold: 25000, description: '25,000 kWh generated', color: 'bg-indigo-500', icon: 'package' },
  { id: 'solar_7', name: 'Gigasol', threshold: 50000, description: '50,000 kWh generated', color: 'bg-purple-500', icon: 'circuit-board' },
  { id: 'solar_8', name: 'Starpower', threshold: 100000, description: '100,000 kWh generated', color: 'bg-rose-500', icon: 'sparkles' },
];

// Battery Storage Discharge milestones (7 tiers: 500-50,000 kWh)
export const BATTERY_MILESTONES: NFTMilestone[] = [
  { id: 'battery_1', name: 'Powerwall', threshold: 500, description: '500 kWh discharged', color: 'bg-green-400', icon: 'battery' },
  { id: 'battery_2', name: 'Gridlink', threshold: 1000, description: '1,000 kWh discharged', color: 'bg-green-500', icon: 'home' },
  { id: 'battery_3', name: 'Megapack', threshold: 2500, description: '2,500 kWh discharged', color: 'bg-emerald-500', icon: 'package' },
  { id: 'battery_4', name: 'Reservoir', threshold: 5000, description: '5,000 kWh discharged', color: 'bg-emerald-600', icon: 'shield' },
  { id: 'battery_5', name: 'Dynamo', threshold: 10000, description: '10,000 kWh discharged', color: 'bg-teal-600', icon: 'gauge' },
  { id: 'battery_6', name: 'Gigabank', threshold: 25000, description: '25,000 kWh discharged', color: 'bg-cyan-700', icon: 'circuit-board' },
  { id: 'battery_7', name: 'Ultrabank', threshold: 50000, description: '50,000 kWh discharged', color: 'bg-cyan-800', icon: 'sparkles' },
];

// EV Charging milestones - combined supercharger + home (8 tiers: 100-25,000 kWh)
export const EV_CHARGING_MILESTONES: NFTMilestone[] = [
  { id: 'charge_1', name: 'Spark', threshold: 100, description: '100 kWh charged', color: 'bg-yellow-400', icon: 'zap' },
  { id: 'charge_2', name: 'Supercharger', threshold: 500, description: '500 kWh charged', color: 'bg-yellow-500', icon: 'plug' },
  { id: 'charge_3', name: 'Megavolt', threshold: 1000, description: '1,000 kWh charged', color: 'bg-orange-500', icon: 'battery-charging' },
  { id: 'charge_4', name: 'Amperage', threshold: 1500, description: '1,500 kWh charged', color: 'bg-orange-600', icon: 'activity' },
  { id: 'charge_5', name: 'Destination', threshold: 2500, description: '2,500 kWh charged', color: 'bg-red-500', icon: 'target' },
  { id: 'charge_6', name: 'Gigawatt', threshold: 5000, description: '5,000 kWh charged', color: 'bg-red-600', icon: 'circuit-board' },
  { id: 'charge_7', name: 'Megawatt', threshold: 10000, description: '10,000 kWh charged', color: 'bg-red-700', icon: 'gauge' },
  { id: 'charge_8', name: 'Terawatt', threshold: 25000, description: '25,000 kWh charged', color: 'bg-red-800', icon: 'sparkles' },
];

// EV Miles Driven milestones (10 tiers: 100-200,000 miles)
export const EV_MILES_MILESTONES: NFTMilestone[] = [
  { id: 'ev_1', name: 'Ignition', threshold: 100, description: '100 miles driven', color: 'bg-sky-400', icon: 'zap' },
  { id: 'ev_2', name: 'Cruiser', threshold: 500, description: '500 miles driven', color: 'bg-sky-500', icon: 'car' },
  { id: 'ev_3', name: 'Autobahn', threshold: 1000, description: '1,000 miles driven', color: 'bg-blue-500', icon: 'route' },
  { id: 'ev_4', name: 'Hyperlane', threshold: 5000, description: '5,000 miles driven', color: 'bg-blue-600', icon: 'map' },
  { id: 'ev_5', name: 'Roadster', threshold: 10000, description: '10,000 miles driven', color: 'bg-indigo-500', icon: 'gauge' },
  { id: 'ev_6', name: 'Plaid', threshold: 25000, description: '25,000 miles driven', color: 'bg-indigo-600', icon: 'activity' },
  { id: 'ev_7', name: 'Ludicrous', threshold: 50000, description: '50,000 miles driven', color: 'bg-violet-600', icon: 'crown' },
  { id: 'ev_8', name: 'Centurion', threshold: 100000, description: '100,000 miles driven', color: 'bg-violet-700', icon: 'trophy' },
  { id: 'ev_9', name: 'Voyager', threshold: 150000, description: '150,000 miles driven', color: 'bg-purple-700', icon: 'rocket' },
  { id: 'ev_10', name: 'Legend', threshold: 200000, description: '200,000 miles driven', color: 'bg-purple-800', icon: 'sparkles' },
];

// All categories for UI display
export const NFT_CATEGORIES: NFTCategory[] = [
  { id: 'solar', name: 'Solar Production', unit: 'kWh', milestones: SOLAR_MILESTONES },
  { id: 'battery', name: 'Battery Discharge', unit: 'kWh', milestones: BATTERY_MILESTONES },
  { id: 'ev_charging', name: 'EV Charging', unit: 'kWh', milestones: EV_CHARGING_MILESTONES },
  { id: 'ev_miles', name: 'EV Miles Driven', unit: 'miles', milestones: EV_MILES_MILESTONES },
];

// Helper function to calculate earned NFTs for a category
export function calculateEarnedMilestones(
  value: number, 
  milestones: NFTMilestone[]
): NFTMilestone[] {
  return milestones.filter((m) => value >= m.threshold);
}

// Helper function to check if welcome NFT is earned (always true for registered users)
export function isWelcomeNftEarned(isRegisteredUser: boolean): boolean {
  return isRegisteredUser;
}

// Helper function to get next milestone
export function getNextMilestone(
  value: number, 
  milestones: NFTMilestone[]
): NFTMilestone | null {
  return milestones.find((m) => value < m.threshold) || null;
}

// Export all NFT names for backend matching
export function getAllEarnedNFTNames(
  solarKwh: number,
  batteryKwh: number,
  evChargingKwh: number,
  evMiles: number,
  isRegisteredUser: boolean = true
): string[] {
  const earned: string[] = [];
  
  // Welcome NFT (always earned for registered users)
  if (isRegisteredUser) {
    earned.push(WELCOME_MILESTONE.name);
  }
  
  // Category milestones
  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  
  return [
    ...earned,
    ...solarEarned.map(m => m.name),
    ...batteryEarned.map(m => m.name),
    ...evChargingEarned.map(m => m.name),
    ...evMilesEarned.map(m => m.name),
  ];
}

// Get total NFT count
export function getTotalNftCount(): number {
  return 1 + // Welcome NFT
    SOLAR_MILESTONES.length +
    BATTERY_MILESTONES.length +
    EV_CHARGING_MILESTONES.length +
    EV_MILES_MILESTONES.length;
}
