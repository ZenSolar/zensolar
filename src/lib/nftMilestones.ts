// NFT Milestone definitions for all activity categories
// These are the source of truth - frontend and backend both use these
// Updated: January 14, 2026 - Aligned with final_milestones-3.docx

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
  { id: 'solar_1', name: 'Sunspark', threshold: 500, description: '500 kWh generated', color: 'bg-lime-500', icon: 'sun' },
  { id: 'solar_2', name: 'Photonic', threshold: 1000, description: '1,000 kWh generated', color: 'bg-emerald-500', icon: 'zap' },
  { id: 'solar_3', name: 'Rayforge', threshold: 2500, description: '2,500 kWh generated', color: 'bg-teal-500', icon: 'shield' },
  { id: 'solar_4', name: 'Solaris', threshold: 5000, description: '5,000 kWh generated', color: 'bg-cyan-500', icon: 'flame' },
  { id: 'solar_5', name: 'Helios', threshold: 10000, description: '10,000 kWh generated', color: 'bg-blue-500', icon: 'lightbulb' },
  { id: 'solar_6', name: 'Sunforge', threshold: 25000, description: '25,000 kWh generated', color: 'bg-indigo-500', icon: 'package' },
  { id: 'solar_7', name: 'Gigasun', threshold: 50000, description: '50,000 kWh generated', color: 'bg-purple-500', icon: 'circuit-board' },
  { id: 'solar_8', name: 'Starforge', threshold: 100000, description: '100,000 kWh generated', color: 'bg-rose-500', icon: 'sparkles' },
];

// Battery Storage Discharge milestones (7 tiers: 500-50,000 kWh)
export const BATTERY_MILESTONES: NFTMilestone[] = [
  { id: 'battery_1', name: 'Voltbank', threshold: 500, description: '500 kWh discharged', color: 'bg-green-400', icon: 'battery' },
  { id: 'battery_2', name: 'Gridpulse', threshold: 1000, description: '1,000 kWh discharged', color: 'bg-green-500', icon: 'home' },
  { id: 'battery_3', name: 'Megacell', threshold: 2500, description: '2,500 kWh discharged', color: 'bg-emerald-500', icon: 'package' },
  { id: 'battery_4', name: 'Reservex', threshold: 5000, description: '5,000 kWh discharged', color: 'bg-emerald-600', icon: 'shield' },
  { id: 'battery_5', name: 'Dynamax', threshold: 10000, description: '10,000 kWh discharged', color: 'bg-teal-600', icon: 'gauge' },
  { id: 'battery_6', name: 'Ultracell', threshold: 25000, description: '25,000 kWh discharged', color: 'bg-cyan-700', icon: 'circuit-board' },
  { id: 'battery_7', name: 'Gigavolt', threshold: 50000, description: '50,000 kWh discharged', color: 'bg-cyan-800', icon: 'sparkles' },
];

// EV Charging milestones - combined supercharger + home (8 tiers: 100-25,000 kWh)
export const EV_CHARGING_MILESTONES: NFTMilestone[] = [
  { id: 'charge_1', name: 'Ignite', threshold: 100, description: '100 kWh charged', color: 'bg-yellow-400', icon: 'zap' },
  { id: 'charge_2', name: 'Voltcharge', threshold: 500, description: '500 kWh charged', color: 'bg-yellow-500', icon: 'plug' },
  { id: 'charge_3', name: 'Kilovolt', threshold: 1000, description: '1,000 kWh charged', color: 'bg-orange-500', icon: 'battery-charging' },
  { id: 'charge_4', name: 'Ampforge', threshold: 1500, description: '1,500 kWh charged', color: 'bg-orange-600', icon: 'activity' },
  { id: 'charge_5', name: 'Chargeon', threshold: 2500, description: '2,500 kWh charged', color: 'bg-red-500', icon: 'target' },
  { id: 'charge_6', name: 'Gigacharge', threshold: 5000, description: '5,000 kWh charged', color: 'bg-red-600', icon: 'circuit-board' },
  { id: 'charge_7', name: 'Megacharge', threshold: 10000, description: '10,000 kWh charged', color: 'bg-red-700', icon: 'gauge' },
  { id: 'charge_8', name: 'Teracharge', threshold: 25000, description: '25,000 kWh charged', color: 'bg-red-800', icon: 'sparkles' },
];

// EV Miles Driven milestones (10 tiers: 100-200,000 miles)
export const EV_MILES_MILESTONES: NFTMilestone[] = [
  { id: 'ev_1', name: 'Ignitor', threshold: 100, description: '100 miles driven', color: 'bg-sky-400', icon: 'zap' },
  { id: 'ev_2', name: 'Velocity', threshold: 500, description: '500 miles driven', color: 'bg-sky-500', icon: 'car' },
  { id: 'ev_3', name: 'Autobahn', threshold: 1000, description: '1,000 miles driven', color: 'bg-blue-500', icon: 'route' },
  { id: 'ev_4', name: 'Hyperdrive', threshold: 5000, description: '5,000 miles driven', color: 'bg-blue-600', icon: 'map' },
  { id: 'ev_5', name: 'Electra', threshold: 10000, description: '10,000 miles driven', color: 'bg-indigo-500', icon: 'gauge' },
  { id: 'ev_6', name: 'Velocity Pro', threshold: 25000, description: '25,000 miles driven', color: 'bg-indigo-600', icon: 'activity' },
  { id: 'ev_7', name: 'Mach One', threshold: 50000, description: '50,000 miles driven', color: 'bg-violet-600', icon: 'crown' },
  { id: 'ev_8', name: 'Centaurion', threshold: 100000, description: '100,000 miles driven', color: 'bg-violet-700', icon: 'trophy' },
  { id: 'ev_9', name: 'Voyager', threshold: 150000, description: '150,000 miles driven', color: 'bg-purple-700', icon: 'rocket' },
  { id: 'ev_10', name: 'Odyssey', threshold: 200000, description: '200,000 miles driven', color: 'bg-purple-800', icon: 'sparkles' },
];

// Celebratory combo milestones (across categories)
// Note: Only category NFTs count toward combos (not combo NFTs themselves)
// Total category NFTs: 8 solar + 7 battery + 8 charging + 10 EV miles = 33
export const COMBO_MILESTONES: NFTMilestone[] = [
  { id: 'combo_1', name: 'Duality', threshold: 2, description: 'Earn NFT in 2 categories', color: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: 'target' },
  { id: 'combo_2', name: 'Trifecta', threshold: 3, description: 'Earn NFT in 3 categories', color: 'bg-gradient-to-r from-orange-500 to-red-500', icon: 'flame' },
  { id: 'combo_3', name: 'Quadrant', threshold: 5, description: 'Earn 5 category NFTs', color: 'bg-gradient-to-r from-red-500 to-purple-500', icon: 'diamond' },
  { id: 'combo_4', name: 'Constellation', threshold: 10, description: 'Earn 10 category NFTs', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: 'star' },
  { id: 'combo_5', name: 'Cyber Echo', threshold: 20, description: 'Earn 20 category NFTs', color: 'bg-gradient-to-r from-pink-500 to-rose-500', icon: 'globe' },
  { id: 'combo_6', name: 'Zenith', threshold: 30, description: 'Earn 30 category NFTs', color: 'bg-gradient-to-r from-purple-600 to-amber-500', icon: 'shield' },
  { id: 'combo_7', name: 'ZenMaster', threshold: 1, description: 'Max out any category', color: 'bg-gradient-to-r from-rose-500 to-amber-500', icon: 'trophy' },
  { id: 'combo_8', name: 'Total Eclipse', threshold: 4, description: 'Max out all categories', color: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500', icon: 'crown' },
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

// Calculate combo achievements
export function calculateComboAchievements(
  solarEarned: NFTMilestone[],
  evMilesEarned: NFTMilestone[],
  evChargingEarned: NFTMilestone[],
  batteryEarned: NFTMilestone[]
): NFTMilestone[] {
  const combos: NFTMilestone[] = [];
  
  // Count categories with at least one earned NFT
  const categoriesWithNFTs = [
    solarEarned.length > 0,
    evMilesEarned.length > 0,
    evChargingEarned.length > 0,
    batteryEarned.length > 0,
  ].filter(Boolean).length;
  
  // Total category NFTs earned (combos don't count toward combo requirements)
  const totalCategoryNFTs = 
    solarEarned.length +
    evMilesEarned.length +
    evChargingEarned.length +
    batteryEarned.length;
  
  // Check if category is maxed out
  const solarMaxed = solarEarned.length === SOLAR_MILESTONES.length;
  const evMilesMaxed = evMilesEarned.length === EV_MILES_MILESTONES.length;
  const evChargingMaxed = evChargingEarned.length === EV_CHARGING_MILESTONES.length;
  const batteryMaxed = batteryEarned.length === BATTERY_MILESTONES.length;
  
  const categoriesMaxed = [solarMaxed, evMilesMaxed, evChargingMaxed, batteryMaxed].filter(Boolean).length;
  
  // Award combo milestones (based on category NFTs only, not combos)
  if (categoriesWithNFTs >= 2) combos.push(COMBO_MILESTONES[0]); // Duality
  if (categoriesWithNFTs >= 3) combos.push(COMBO_MILESTONES[1]); // Trifecta
  if (totalCategoryNFTs >= 5) combos.push(COMBO_MILESTONES[2]); // Quadrant
  if (totalCategoryNFTs >= 10) combos.push(COMBO_MILESTONES[3]); // Constellation
  if (totalCategoryNFTs >= 20) combos.push(COMBO_MILESTONES[4]); // Cyber Echo
  if (totalCategoryNFTs >= 30) combos.push(COMBO_MILESTONES[5]); // Zenith
  if (categoriesMaxed >= 1) combos.push(COMBO_MILESTONES[6]); // ZenMaster
  if (categoriesMaxed >= 4) combos.push(COMBO_MILESTONES[7]); // Total Eclipse
  
  return combos;
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
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  
  return [
    ...earned,
    ...solarEarned.map(m => m.name),
    ...batteryEarned.map(m => m.name),
    ...evChargingEarned.map(m => m.name),
    ...evMilesEarned.map(m => m.name),
    ...comboEarned.map(m => m.name),
  ];
}

// Get total NFT count
export function getTotalNftCount(): number {
  return 1 + // Welcome NFT
    SOLAR_MILESTONES.length +
    BATTERY_MILESTONES.length +
    EV_CHARGING_MILESTONES.length +
    EV_MILES_MILESTONES.length +
    COMBO_MILESTONES.length;
}

// Priority milestone with category context
export interface PriorityMilestone extends NFTMilestone {
  category: 'solar' | 'battery' | 'ev_miles' | 'charging';
  currentValue: number;
  unit: string;
}

// Get the next priority milestone across all categories
// Priority order: Solar → Battery → EV Miles → EV Charging
export function getNextPriorityMilestone(
  solarKwh: number,
  batteryKwh: number,
  evMiles: number,
  chargingKwh: number
): PriorityMilestone | null {
  const solarNext = getNextMilestone(solarKwh, SOLAR_MILESTONES);
  if (solarNext) {
    return { ...solarNext, category: 'solar', currentValue: solarKwh, unit: 'kWh' };
  }
  
  const batteryNext = getNextMilestone(batteryKwh, BATTERY_MILESTONES);
  if (batteryNext) {
    return { ...batteryNext, category: 'battery', currentValue: batteryKwh, unit: 'kWh' };
  }
  
  const evNext = getNextMilestone(evMiles, EV_MILES_MILESTONES);
  if (evNext) {
    return { ...evNext, category: 'ev_miles', currentValue: evMiles, unit: 'miles' };
  }
  
  const chargeNext = getNextMilestone(chargingKwh, EV_CHARGING_MILESTONES);
  if (chargeNext) {
    return { ...chargeNext, category: 'charging', currentValue: chargingKwh, unit: 'kWh' };
  }
  
  return null; // All categories complete
}

// Get category display name
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    solar: 'Solar',
    battery: 'Battery',
    ev_miles: 'EV Miles',
    charging: 'Charging',
  };
  return names[category] || category;
}
