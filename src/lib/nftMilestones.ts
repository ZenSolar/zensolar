// NFT Milestone definitions for all activity categories
// These are the source of truth - frontend and backend both use these

export interface NFTMilestone {
  id: string;
  name: string;
  threshold: number;
  description: string;
  color: string;
  icon: string; // emoji for visual flair
}

export interface NFTCategory {
  id: string;
  name: string;
  unit: string;
  milestones: NFTMilestone[];
}

// Solar Energy Production milestones
export const SOLAR_MILESTONES: NFTMilestone[] = [
  { id: 'solar_welcome', name: 'Welcome', threshold: 0, description: 'Sign up reward', color: 'bg-amber-500', icon: '🌟' },
  { id: 'solar_1', name: 'First Harvest', threshold: 500, description: '500 kWh generated', color: 'bg-lime-500', icon: '🌱' },
  { id: 'solar_2', name: 'Solar Pioneer', threshold: 1000, description: '1,000 kWh generated', color: 'bg-emerald-500', icon: '☀️' },
  { id: 'solar_3', name: 'Energy Guardian', threshold: 2500, description: '2,500 kWh generated', color: 'bg-teal-500', icon: '🛡️' },
  { id: 'solar_4', name: 'Eco Warrior', threshold: 5000, description: '5,000 kWh generated', color: 'bg-cyan-500', icon: '⚔️' },
  { id: 'solar_5', name: 'Green Innovator', threshold: 10000, description: '10,000 kWh generated', color: 'bg-blue-500', icon: '💡' },
  { id: 'solar_6', name: 'Sustainability Champion', threshold: 25000, description: '25,000 kWh generated', color: 'bg-indigo-500', icon: '🏆' },
  { id: 'solar_7', name: 'Renewable Hero', threshold: 50000, description: '50,000 kWh generated', color: 'bg-purple-500', icon: '🦸' },
  { id: 'solar_8', name: 'Solar Zen Master', threshold: 100000, description: '100,000 kWh generated', color: 'bg-rose-500', icon: '🧘' },
];

// EV Miles Driven milestones
export const EV_MILES_MILESTONES: NFTMilestone[] = [
  { id: 'ev_1', name: 'First Drive', threshold: 100, description: '100 miles driven', color: 'bg-sky-400', icon: '🚗' },
  { id: 'ev_2', name: 'Road Tripper', threshold: 500, description: '500 miles driven', color: 'bg-sky-500', icon: '🛣️' },
  { id: 'ev_3', name: 'Highway Hero', threshold: 1000, description: '1,000 miles driven', color: 'bg-blue-500', icon: '🦸' },
  { id: 'ev_4', name: 'Cross Country', threshold: 5000, description: '5,000 miles driven', color: 'bg-blue-600', icon: '🗺️' },
  { id: 'ev_5', name: 'Electric Explorer', threshold: 10000, description: '10,000 miles driven', color: 'bg-indigo-500', icon: '🧭' },
  { id: 'ev_6', name: 'Mile Master', threshold: 25000, description: '25,000 miles driven', color: 'bg-indigo-600', icon: '👑' },
  { id: 'ev_7', name: 'EV Legend', threshold: 50000, description: '50,000 miles driven', color: 'bg-violet-600', icon: '🏅' },
];

// EV Charging kWh milestones
export const EV_CHARGING_MILESTONES: NFTMilestone[] = [
  { id: 'charge_1', name: 'First Charge', threshold: 100, description: '100 kWh charged', color: 'bg-yellow-400', icon: '🔌' },
  { id: 'charge_2', name: 'Charging Champion', threshold: 500, description: '500 kWh charged', color: 'bg-yellow-500', icon: '⚡' },
  { id: 'charge_3', name: 'Power Player', threshold: 1000, description: '1,000 kWh charged', color: 'bg-orange-500', icon: '🎮' },
  { id: 'charge_4', name: 'Energy Enthusiast', threshold: 2500, description: '2,500 kWh charged', color: 'bg-orange-600', icon: '🔋' },
  { id: 'charge_5', name: 'Charging Pro', threshold: 5000, description: '5,000 kWh charged', color: 'bg-red-500', icon: '💪' },
  { id: 'charge_6', name: 'Megawatt Master', threshold: 10000, description: '10,000 kWh charged', color: 'bg-red-600', icon: '⚡' },
];

// Battery Storage Discharge kWh milestones
export const BATTERY_MILESTONES: NFTMilestone[] = [
  { id: 'battery_1', name: 'Grid Guardian', threshold: 500, description: '500 kWh discharged', color: 'bg-green-400', icon: '🔋' },
  { id: 'battery_2', name: 'Power Backup Pro', threshold: 1000, description: '1,000 kWh discharged', color: 'bg-green-500', icon: '🏠' },
  { id: 'battery_3', name: 'Storage Specialist', threshold: 2500, description: '2,500 kWh discharged', color: 'bg-emerald-500', icon: '📦' },
  { id: 'battery_4', name: 'Energy Reserve Hero', threshold: 5000, description: '5,000 kWh discharged', color: 'bg-emerald-600', icon: '🦸' },
  { id: 'battery_5', name: 'Battery Boss', threshold: 10000, description: '10,000 kWh discharged', color: 'bg-teal-600', icon: '👔' },
  { id: 'battery_6', name: 'Powerwall Prodigy', threshold: 25000, description: '25,000 kWh discharged', color: 'bg-cyan-700', icon: '🧠' },
];

// Celebratory combo milestones (across categories)
export const COMBO_MILESTONES: NFTMilestone[] = [
  { id: 'combo_1', name: 'Dual Achiever', threshold: 2, description: 'Earn NFT in 2 categories', color: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: '✌️' },
  { id: 'combo_2', name: 'Triple Threat', threshold: 3, description: 'Earn NFT in 3 categories', color: 'bg-gradient-to-r from-orange-500 to-red-500', icon: '🔥' },
  { id: 'combo_3', name: 'Quad Champion', threshold: 4, description: 'Earn NFT in all 4 categories', color: 'bg-gradient-to-r from-red-500 to-purple-500', icon: '💎' },
  { id: 'combo_4', name: 'Rising Star', threshold: 5, description: 'Earn 5 total NFTs', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '⭐' },
  { id: 'combo_5', name: 'Sustainability Legend', threshold: 10, description: 'Earn 10 total NFTs', color: 'bg-gradient-to-r from-pink-500 to-rose-500', icon: '🌍' },
  { id: 'combo_6', name: 'Category Master', threshold: 1, description: 'Max out any category', color: 'bg-gradient-to-r from-rose-500 to-amber-500', icon: '🏆' },
  { id: 'combo_7', name: 'Ultimate Zen Master', threshold: 4, description: 'Max out all categories', color: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500', icon: '🧘✨' },
];

// All categories for UI display
export const NFT_CATEGORIES: NFTCategory[] = [
  { id: 'solar', name: 'Solar Production', unit: 'kWh', milestones: SOLAR_MILESTONES },
  { id: 'ev_miles', name: 'EV Miles Driven', unit: 'miles', milestones: EV_MILES_MILESTONES },
  { id: 'ev_charging', name: 'EV Charging', unit: 'kWh', milestones: EV_CHARGING_MILESTONES },
  { id: 'battery', name: 'Battery Discharge', unit: 'kWh', milestones: BATTERY_MILESTONES },
];

// Helper function to calculate earned NFTs for a category
export function calculateEarnedMilestones(
  value: number, 
  milestones: NFTMilestone[], 
  isNewUser: boolean = false
): NFTMilestone[] {
  return milestones.filter((m) => {
    if (m.threshold === 0) return isNewUser; // Welcome NFT
    return value >= m.threshold;
  });
}

// Helper function to get next milestone
export function getNextMilestone(
  value: number, 
  milestones: NFTMilestone[]
): NFTMilestone | null {
  return milestones.find((m) => m.threshold > 0 && value < m.threshold) || null;
}

// Calculate combo achievements
export function calculateComboAchievements(
  solarEarned: NFTMilestone[],
  evMilesEarned: NFTMilestone[],
  evChargingEarned: NFTMilestone[],
  batteryEarned: NFTMilestone[]
): NFTMilestone[] {
  const combos: NFTMilestone[] = [];
  
  // Count categories with at least one earned NFT (excluding welcome)
  const categoriesWithNFTs = [
    solarEarned.filter(m => m.threshold > 0).length > 0,
    evMilesEarned.length > 0,
    evChargingEarned.length > 0,
    batteryEarned.length > 0,
  ].filter(Boolean).length;
  
  // Total NFTs earned (excluding welcome)
  const totalNFTs = 
    solarEarned.filter(m => m.threshold > 0).length +
    evMilesEarned.length +
    evChargingEarned.length +
    batteryEarned.length;
  
  // Check if category is maxed out
  const solarMaxed = solarEarned.length === SOLAR_MILESTONES.length;
  const evMilesMaxed = evMilesEarned.length === EV_MILES_MILESTONES.length;
  const evChargingMaxed = evChargingEarned.length === EV_CHARGING_MILESTONES.length;
  const batteryMaxed = batteryEarned.length === BATTERY_MILESTONES.length;
  
  const categoriesMaxed = [solarMaxed, evMilesMaxed, evChargingMaxed, batteryMaxed].filter(Boolean).length;
  
  // Award combo milestones
  if (categoriesWithNFTs >= 2) combos.push(COMBO_MILESTONES[0]); // Dual Achiever
  if (categoriesWithNFTs >= 3) combos.push(COMBO_MILESTONES[1]); // Triple Threat
  if (categoriesWithNFTs >= 4) combos.push(COMBO_MILESTONES[2]); // Quad Champion
  if (totalNFTs >= 5) combos.push(COMBO_MILESTONES[3]); // Rising Star
  if (totalNFTs >= 10) combos.push(COMBO_MILESTONES[4]); // Sustainability Legend
  if (categoriesMaxed >= 1) combos.push(COMBO_MILESTONES[5]); // Category Master
  if (categoriesMaxed >= 4) combos.push(COMBO_MILESTONES[6]); // Ultimate Zen Master
  
  return combos;
}

// Export all NFT names for backend matching
export function getAllEarnedNFTNames(
  solarKwh: number,
  evMiles: number,
  evChargingKwh: number,
  batteryKwh: number,
  isNewUser: boolean = true
): string[] {
  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES, isNewUser);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  
  return [
    ...solarEarned.map(m => m.name),
    ...evMilesEarned.map(m => m.name),
    ...evChargingEarned.map(m => m.name),
    ...batteryEarned.map(m => m.name),
    ...comboEarned.map(m => m.name),
  ];
}
