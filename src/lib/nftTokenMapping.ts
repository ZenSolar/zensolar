// NFT Token ID Mapping - Maps milestone IDs to on-chain token IDs
// This is the source of truth for token ID assignments in the ZenSolarNFT contract

export const MILESTONE_TO_TOKEN_ID: Record<string, number> = {
  // Welcome (Token 0)
  'welcome': 0,
  
  // Solar Production (Tokens 1-8)
  'solar_1': 1,   // Sunspark - 500 kWh
  'solar_2': 2,   // Photonic - 1,000 kWh
  'solar_3': 3,   // Rayforge - 2,500 kWh
  'solar_4': 4,   // Solaris - 5,000 kWh
  'solar_5': 5,   // Helios - 10,000 kWh
  'solar_6': 6,   // Sunforge - 25,000 kWh
  'solar_7': 7,   // Gigasun - 50,000 kWh
  'solar_8': 8,   // Starforge - 100,000 kWh
  
  // Battery Storage Exported (Tokens 9-15)
  'battery_1': 9,   // Voltbank - 500 kWh
  'battery_2': 10,  // Gridpulse - 1,000 kWh
  'battery_3': 11,  // Megacell - 2,500 kWh
  'battery_4': 12,  // Reservex - 5,000 kWh
  'battery_5': 13,  // Dynamax - 10,000 kWh
  'battery_6': 14,  // Ultracell - 25,000 kWh
  'battery_7': 15,  // Gigavolt - 50,000 kWh
  
  // EV Charging (Tokens 16-23)
  'charge_1': 16,  // Ignite - 100 kWh
  'charge_2': 17,  // Voltcharge - 500 kWh
  'charge_3': 18,  // Kilovolt - 1,000 kWh
  'charge_4': 19,  // Ampforge - 1,500 kWh
  'charge_5': 20,  // Chargeon - 2,500 kWh
  'charge_6': 21,  // Gigacharge - 5,000 kWh
  'charge_7': 22,  // Megacharge - 10,000 kWh
  'charge_8': 23,  // Teracharge - 25,000 kWh
  
  // EV Miles Driven (Tokens 24-33)
  'ev_1': 24,   // Ignitor - 100 miles
  'ev_2': 25,   // Velocity - 500 miles
  'ev_3': 26,   // Autobahn - 1,000 miles
  'ev_4': 27,   // Hyperdrive - 5,000 miles
  'ev_5': 28,   // Electra - 10,000 miles
  'ev_6': 29,   // Velocity Pro - 25,000 miles
  'ev_7': 30,   // Mach One - 50,000 miles
  'ev_8': 31,   // Centaurion - 100,000 miles
  'ev_9': 32,   // Voyager - 150,000 miles
  'ev_10': 33,  // Odyssey - 200,000 miles
  
  // Combo Achievements (Tokens 34-41)
  'combo_1': 34,  // Duality - 2 categories
  'combo_2': 35,  // Trifecta - 3 categories
  'combo_3': 36,  // Quadrant - 5 total NFTs
  'combo_4': 37,  // Constellation - 10 total NFTs
  'combo_5': 38,  // Cyber Echo - 20 total NFTs
  'combo_6': 39,  // Zenith - 30 total NFTs
  'combo_7': 40,  // ZenMaster - Max 1 category
  'combo_8': 41,  // Total Eclipse - Max all categories
};

// Reverse mapping: Token ID to Milestone ID
export const TOKEN_ID_TO_MILESTONE: Record<number, string> = Object.fromEntries(
  Object.entries(MILESTONE_TO_TOKEN_ID).map(([k, v]) => [v, k])
);

// Get token ID for a milestone
export function getTokenIdForMilestone(milestoneId: string): number | null {
  return MILESTONE_TO_TOKEN_ID[milestoneId] ?? null;
}

// Get milestone ID for a token
export function getMilestoneForTokenId(tokenId: number): string | null {
  return TOKEN_ID_TO_MILESTONE[tokenId] ?? null;
}

// Total number of NFT types
export const TOTAL_NFT_TYPES = 42;

// Token ID ranges by category
export const TOKEN_ID_RANGES = {
  welcome: { start: 0, end: 0 },
  solar: { start: 1, end: 8 },
  battery: { start: 9, end: 15 },
  charging: { start: 16, end: 23 },
  ev_miles: { start: 24, end: 33 },
  combo: { start: 34, end: 41 },
} as const;
