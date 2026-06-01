/**
 * Single source of truth for competitor analysis.
 * Used by /admin/competitive-intel and /founders/competitive-landscape.
 *
 * ORDER: Sorted by directness of threat to ZenSolar — most direct competitor first.
 * Tiers: high (1–3) → medium (4–6) → low (7–9).
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
    name: "SolarCoin",
    website: "https://solarcoin.org",
    blockchain: "Base L2 (relaunch 2026)",
    focus: ["Solar Production"],
    tokenModel: "kSLR · 1 kSLR per kWh (relaunch, post-98B legacy pool)",
    funding: "Community/Foundation",
    stage: "Relaunched 2026 (legacy since 2014)",
    threatLevel: "high",
    patentStatus: "No patents found",
    keyDifferentiator: "Convergent relaunch on Base L2 with a 1 kSLR / kWh ratio — mirrors our chain + ratio choice, validating the category.",
    ourWedge: "No app, no embedded wallet, no paid subscription, no verification stack — just honor-system uploads sitting on top of a 98B legacy pool. Legacy SLR (the 2014 ERC-20 still trading on DigiFinex/Uniswap) sits in the fractions-of-a-cent range (~$0.0007–$0.002) on ~$1/day volume, and the new kSLR token on Base has no live trading pairs yet — SolarCoin's own Trading page just says 'pairs to be announced.' We have an embedded Coinbase Smart Wallet, Proof of Genesis™ UX, Proof-of-Delta™ verification, a paid subscription flywheel, 1T hard cap, and 20% burn-per-mint — that's how a token holds value.",
  },
  {
    name: "Daylight Energy",
    website: "https://daylight.energy",
    blockchain: "Ethereum / Solana (DePIN)",
    focus: ["Residential Solar Financing"],
    tokenModel: "Token-incentivized panel deployment (TIPIN)",
    funding: "$75M (Framework Ventures + Turtle Hill, Oct 2025)",
    stage: "Mainnet (US rollout)",
    threatLevel: "high",
    patentStatus: "No verification patents found",
    keyDifferentiator: "Removes upfront cost of solar via DePIN-financed panel installs",
    ourWedge: "Capital-heavy financing play — they own the hardware, then tokenize. We're software-only on the gear people already own. They build a fleet; we build the asset class.",
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
    name: "GridPay",
    website: "https://gridpay.com",
    blockchain: "Arbitrum One",
    focus: ["Solar Export (ERCOT)"],
    tokenModel: "GPT minted every 15 min from grid export",
    funding: "Pre-seed (seeking $5M @ $20M)",
    stage: "Live (March 2026, hackathon launch)",
    threatLevel: "medium",
    patentStatus: "No patents or verification IP disclosed",
    keyDifferentiator: "First autonomous mint from real home solar export (Texas only)",
    ourWedge: "Solo-founder hackathon project, ERCOT-only, no verification methodology, no patents. Their March 2026 launch validates the category — our nationwide multi-vertical scope + Proof-of-Delta™ stack is the moat.",
  },
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
