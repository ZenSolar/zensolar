/**
 * Single source of truth for competitor analysis.
 * Used by /admin/competitive-intel and /founders/competitive-landscape.
 */

export interface Competitor {
  name: string;
  website: string;
  blockchain: string;
  focus: string[];
  tokenModel: string;
  funding: string;
  stage: string;
  threatLevel: "low" | "medium" | "high";
  patentStatus: string;
  keyDifferentiator: string;
  /** One-line "where they fall short vs ZenSolar" — founder-facing */
  ourWedge?: string;
}

export const competitors: Competitor[] = [
  {
    name: "EVearn (VeBetterDAO)",
    website: "https://evearn.io",
    blockchain: "VeChainThor",
    focus: ["EV Mileage"],
    tokenModel: "B3TR Pool Distribution (12-year emission)",
    funding: "VeChain Foundation Grant",
    stage: "Live Beta",
    threatLevel: "medium",
    patentStatus: "No patents found",
    keyDifferentiator: "Smartcar API for 37+ EV brands",
    ourWedge: "Single-vertical (EV miles only) on niche chain. We unify solar, battery, EV, and charging on Base L2 with cryptographic verification.",
  },
  {
    name: "Glow Protocol",
    website: "https://glowlabs.org",
    blockchain: "Ethereum (Custom L2)",
    focus: ["Solar Farms (B2B)"],
    tokenModel: "GLW Token + GCC Carbon Credits",
    funding: "$30M+ (Framework Ventures, Union Square)",
    stage: "Mainnet",
    threatLevel: "high",
    patentStatus: "No energy-to-token patents found",
    keyDifferentiator: "B2B solar farm focus, carbon credit integration",
    ourWedge: "B2B-only — requires hardware install on commercial solar farms. We're consumer-first, software-only, no hardware.",
  },
  {
    name: "Arkreen Network",
    website: "https://arkreen.com",
    blockchain: "Polygon / Solana",
    focus: ["Solar DePIN"],
    tokenModel: "AKRE Token Mining",
    funding: "Seed Round (undisclosed)",
    stage: "Testnet/Early",
    threatLevel: "medium",
    patentStatus: "No patents found",
    keyDifferentiator: "DePIN solar mining with hardware focus",
    ourWedge: "Hardware-dependent DePIN node. We aggregate existing OEM APIs — no extra device to buy.",
  },
  {
    name: "C+Charge",
    website: "https://c-charge.io",
    blockchain: "BSC",
    focus: ["EV Charging"],
    tokenModel: "CCHG Token + Carbon Credits",
    funding: "$1M+ ICO",
    stage: "Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Carbon credit rewards for EV charging",
    ourWedge: "Carbon-credit narrative without verification stack. We have Proof-of-Delta™ + Proof-of-Origin™ patent-pending IP.",
  },
  {
    name: "SolarCoin",
    website: "https://solarcoin.org",
    blockchain: "Custom PoS",
    focus: ["Solar Production"],
    tokenModel: "SLR Token (1 SLR per MWh)",
    funding: "Community/Foundation",
    stage: "Legacy (Since 2014)",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Longest-running solar crypto project",
    ourWedge: "Honor-system uploads from a 98B pre-minted pool. Dormant since 2014. We are Mint-on-Proof™ on Base L2 with live mints today.",
  },
  {
    name: "DeCharge",
    website: "https://decharge.io",
    blockchain: "Peaq Network",
    focus: ["EV Charging Infrastructure"],
    tokenModel: "Hardware Node Rewards",
    funding: "Seed (undisclosed)",
    stage: "Early Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Physical charging station network",
    ourWedge: "Requires owning physical charging hardware. We work with the chargers people already own (Wallbox, Tesla, etc.).",
  },
  {
    name: "PowerPod",
    website: "https://powerpod.pro",
    blockchain: "IoTeX",
    focus: ["EV Charging DePIN"],
    tokenModel: "PPD Token Mining",
    funding: "Pre-seed",
    stage: "Development",
    threatLevel: "low",
    patentStatus: "No patents found",
    keyDifferentiator: "Home charger sharing network",
    ourWedge: "Charger-sharing marketplace, not energy tokenization. Different category — we mint on energy events, not rentals.",
  },
];
