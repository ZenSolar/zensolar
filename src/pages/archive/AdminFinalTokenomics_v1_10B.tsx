import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  TrendingUp, 
  Flame, 
  Shield, 
  Users, 
  Rocket,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Zap,
  Lock,
  Globe,
  Lightbulb,
  Scale,
  Brain,
  ArrowRight,
  Copy,
  Check,
  Info,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { toast } from "sonner";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } }
};

// Definitions for each metric - used in popup dialogs
const metricDefinitions: Record<string, { title: string; definition: string; example?: string }> = {
  supply_model: {
    title: "Supply Model",
    definition: "Determines how tokens are created and distributed. A 'Utility Currency' model means tokens can be both spent (for goods/services) and held as an appreciating asset.",
    example: "Users earn $ZSOLAR for energy production and can spend it in the store or hold for price appreciation."
  },
  launch_price_strategy: {
    title: "Launch Price Strategy", 
    definition: "The initial price floor set when the token launches. A lower floor (like $0.10) creates a compelling '10x upside' narrative for early investors targeting $1.00.",
    example: "Starting at $0.10 means reaching $1.00 is a 10x return vs. starting at $0.50 which is only 2x."
  },
  burn_rate: {
    title: "Mint Burn Rate",
    definition: "The percentage of newly minted tokens that are immediately destroyed. Higher burn rates create scarcity and reduce sell pressure on the market.",
    example: "If 1,000 tokens are minted, a 20% burn rate means 200 are destroyed and only 800 enter circulation."
  },
  transfer_tax: {
    title: "Transfer Tax",
    definition: "A fee applied to every token transfer. This tax is split between permanent burns (reducing supply) and treasury (funding operations).",
    example: "A 7% tax with 3.5%/3.5% split means half is burned forever and half goes to the project treasury."
  },
  sell_pressure_assumption: {
    title: "Sell Rate Assumption",
    definition: "The estimated percentage of users who will sell their tokens each month. Lower sell rates mean more sustainable price floors.",
    example: "A 20% monthly sell rate means 1 in 5 token holders are expected to sell within any given month."
  },
  liquidity_depth_target: {
    title: "LP Depth Target",
    definition: "The target amount of liquidity in the trading pool. Deeper pools mean less price slippage and more stable trading.",
    example: "$1M+ LP depth means large trades won't dramatically move the price."
  },
  price_stability_mechanism: {
    title: "Price Stability Mechanism",
    definition: "Automated systems that defend the price floor. Hybrid approaches combine multiple strategies for resilience.",
    example: "Treasury buybacks during dips + auto LP injection from subscriptions create multi-layered defense."
  },
  lp_injection_source: {
    title: "LP Injection Sources",
    definition: "Where the liquidity pool gets its funding. Subscription-backed LP means 50% of monthly fees automatically add to trading liquidity.",
    example: "10,000 subscribers × $9.99/mo × 50% = ~$50K/month flowing into the LP automatically."
  },
  target_user_monthly_value: {
    title: "Monthly Reward Target",
    definition: "The dollar value of tokens an active user should expect to earn monthly. This drives user acquisition and retention.",
    example: "$300-$800/month in token rewards for an average solar + EV household."
  },
  reward_framing: {
    title: "Reward Framing",
    definition: "How rewards are presented to users psychologically. 'Dollar Value First' emphasizes the monetary worth rather than abstract token counts.",
    example: "'You earned $47.50 this week' is more compelling than 'You earned 475 tokens'."
  },
  reward_frequency: {
    title: "Reward Frequency",
    definition: "How often users receive their token rewards. Weekly batches balance engagement with gas efficiency.",
    example: "Weekly rewards keep users engaged without the high gas costs of daily transactions."
  },
  beta_user_treatment: {
    title: "Beta User Treatment",
    definition: "How early adopters are recognized at mainnet launch. Pioneer NFTs + vested tokens + multipliers reward loyalty without inflating supply.",
    example: "Beta users get commemorative NFTs and a 1.5x earning multiplier for their first 6 months post-launch."
  },
  investor_thesis: {
    title: "Investor Thesis",
    definition: "The core narrative that explains why the token will appreciate. The 'Flywheel Effect' describes how user growth compounds value.",
    example: "More users → more subscriptions → deeper LP → higher price → more users (self-reinforcing cycle)."
  },
  price_appreciation_story: {
    title: "10x Narrative / Flywheel Effect",
    definition: "The growth story that drives investor interest. The User Growth Flywheel shows how subscriptions create sustainable, compounding value.",
    example: "Each new subscriber adds $5/mo to LP permanently, creating unstoppable price floor growth."
  },
  moat_priority: {
    title: "Primary Moat",
    definition: "The main competitive advantage that protects the business. 'First-Mover Category Creation' means being first to tokenize verified energy data.",
    example: "No one else has patent-pending energy-to-blockchain verification with major hardware integrations."
  },
  total_addressable_market: {
    title: "TAM Sizing",
    definition: "Total Addressable Market — the maximum revenue opportunity if 100% market share is achieved.",
    example: "$50B clean energy TAM covers residential solar, EVs, batteries, and charging infrastructure."
  },
  auto_lp_mechanism: {
    title: "LP Automation",
    definition: "How liquidity is automatically managed. 'Auto LP Injection' means smart contracts add subscription revenue to the pool without manual intervention.",
    example: "Every subscription payment triggers an automatic LP deposit — no treasury decisions needed."
  },
  staking_mechanics: {
    title: "Staking Model",
    definition: "How users can lock tokens to earn additional rewards. Yield farming offers APY returns for providing liquidity.",
    example: "Stake $ZSOLAR to earn 15-25% APY, paid from transfer taxes and protocol revenue."
  },
  exchange_strategy: {
    title: "Exchange Strategy",
    definition: "The plan for where tokens will be tradeable. 'DEX First, CEX Later' builds organic liquidity before centralized exchange listings.",
    example: "Launch on Uniswap/Base, then pursue Coinbase/Binance listings after proving volume."
  },
  innovative_mechanisms: {
    title: "Innovations",
    definition: "Novel tokenomics features that differentiate the project. Bonding curves and rage-quit protection are advanced DeFi mechanisms.",
    example: "Bonding curve ensures price always has mathematical backing; rage-quit lets users exit at floor price."
  },
  founder_vesting: {
    title: "Founder Vesting",
    definition: "The schedule over which founder tokens unlock. Longer vesting periods align founder incentives with long-term success.",
    example: "3-4 year vest means founders can't dump tokens — they're committed to building value."
  },
  governance_model: {
    title: "Governance Model",
    definition: "How token holders participate in project decisions. Starting with no governance keeps things simple while building trust.",
    example: "Phase 1: team-led decisions. Phase 2: proposal voting. Phase 3: full DAO with parameter control."
  }
};

// Question ID to human-readable label mapping
const questionLabels: Record<string, string> = {
  supply_model: "Supply Model",
  initial_circulating: "Initial Circulation",
  launch_price_strategy: "Launch Price Strategy",
  price_stability_mechanism: "Price Stability",
  burn_rate: "Mint Burn Rate",
  transfer_tax: "Transfer Tax",
  reward_framing: "Reward Framing",
  reward_frequency: "Reward Frequency",
  sell_pressure_assumption: "Sell Rate Assumption",
  lp_injection_source: "LP Injection Sources",
  governance_model: "Governance Model",
  utility_expansion: "Utility Expansion",
  founder_vesting: "Founder Vesting",
  beta_user_treatment: "Beta User Treatment",
  moat_priority: "Primary Moat",
  viral_mechanic: "Viral Mechanic",
  target_user_monthly_value: "Monthly Reward Target",
  risk_philosophy: "Risk Philosophy",
  investor_thesis: "Investor Thesis",
  investor_incentives: "Investor Incentives",
  price_appreciation_story: "10x Narrative",
  auto_lp_mechanism: "LP Automation",
  dynamic_burns: "Dynamic Burns",
  staking_mechanics: "Staking Model",
  innovative_mechanisms: "Innovations",
  exchange_strategy: "Exchange Strategy",
  liquidity_depth_target: "LP Depth Target",
  multi_chain: "Multi-Chain Strategy",
  runway_priority: "Runway Priority",
  raise_structure: "Raise Structure",
  investor_target: "Investor Target",
  total_addressable_market: "TAM Sizing",
  competitive_landscape: "Competitors",
  competitive_differentiation: "Differentiators",
  tesla_risk: "Tesla Risk",
  unit_economics: "Unit Economics",
  cac_ltv_confidence: "CAC:LTV Confidence",
  milestone_raise_mapping: "Milestone to Raise",
  token_necessity: "Token Necessity"
};

// Value to human-readable label mapping
const valueLabels: Record<string, string> = {
  utility_currency: "Utility Currency (Spend + Hold)",
  fixed: "Fixed Supply (Deflationary)",
  capped_elastic: "Capped with Elastic Minting",
  "1_percent": "1-2% (~100-200M)",
  "5_percent": "5% (~500M)",
  "10_percent": "10% (~1B)",
  floor_10c: "$0.10 Floor (10x Narrative)",
  floor_50c: "$0.50 Floor",
  floor_1: "$1.00 Floor",
  subscription_lp: "Subscription-Backed LP",
  treasury_buyback: "Treasury Buyback Program",
  hybrid_dynamic: "Hybrid Dynamic Response",
  burn_10_percent: "10%",
  burn_15_percent: "15%",
  burn_20_percent: "20%",
  burn_30_percent: "30%",
  none: "None",
  low_split: "3% (1.5% burn / 1.5% treasury)",
  moderate_split: "7% (3.5% burn / 3.5% treasury)",
  holder_reward: "5% with Holder Reflections",
  impact_first: "Impact + Rewards First",
  dollar_value: "Dollar Value First",
  token_accumulation: "Token Accumulation",
  gamified_tiers: "Gamified Achievement Tiers",
  daily: "Daily Batches",
  weekly: "Weekly Rewards",
  monthly: "Monthly Payouts",
  real_time: "Real-Time Streaming",
  sell_10_percent: "10% per month",
  sell_20_percent: "20% per month",
  sell_30_percent: "30% per month",
  sell_50_percent: "50% per month",
  subscriptions: "Subscription Fees (50% to LP)",
  nft_royalties: "NFT Secondary Royalties",
  partner_fees: "B2B Partner API Fees",
  carbon_credits: "Carbon Credit Revenue",
  staking_fees: "Staking/Unstaking Fees",
  none_initially: "No Governance (Phase 1)",
  proposal_voting: "Proposal Voting",
  parameter_control: "Parameter Governance",
  full_dao: "Full DAO Transition",
  premium_features: "Premium App Features",
  store_discounts: "Store Discounts",
  nft_minting: "NFT Minting Rights",
  partner_access: "Partner Perks",
  staking_boost: "Staking Boost Multipliers",
  "3_year": "3-Year Vest",
  "4_year": "4-Year Vest",
  pioneer_nfts: "Pioneer NFTs Only",
  vested_tokens: "Vested Token Allocation",
  multiplier_bonus: "Future Earning Multiplier",
  hybrid: "NFTs + Vested + Multiplier",
  first_mover: "First-Mover Category Creation",
  data_network: "Data Network Effects",
  provider_integrations: "Deep Provider Integrations",
  token_economics: "Sustainable Token Economics",
  referral_bonus: "Referral Bonuses",
  social_proof: "Social Proof Sharing",
  leaderboards: "Public Leaderboards",
  community_challenges: "Community Challenges",
  conservative: "Conservative (Stability First)",
  balanced: "Balanced",
  aggressive: "Aggressive (Growth First)",
  antifragile: "Antifragile",
  deflationary_scarcity: "Deflationary Scarcity Play",
  revenue_backing: "Revenue-Backed Asset",
  network_growth: "Flywheel Effect",
  staking_yield: "Staking Yield",
  holder_reflections: "Holder Reflections",
  governance_power: "Governance Power",
  buyback_burns: "Buyback & Burn Events",
  tiered_nft_access: "Tiered NFT Access",
  user_growth: "User Growth Flywheel",
  supply_shock: "Supply Shock",
  institutional_entry: "Institutional Entry",
  utility_expansion: "Utility Expansion",
  manual: "Manual Treasury Management",
  auto_inject: "Auto LP Injection",
  dynamic_rebalance: "Dynamic Rebalancing",
  protocol_owned: "Protocol-Owned Liquidity (POL)",
  price_reactive: "Price-Reactive Burns",
  volume_reactive: "Volume-Reactive Burns",
  epoch_halving: "Epoch-Based Halving",
  yield_farming: "Yield Farming (APY)",
  vote_escrow: "Vote-Escrowed (veToken)",
  reward_boost: "App Reward Boost",
  nft_staking: "NFT + Token Staking",
  bonding_curve: "Bonding Curve",
  rage_quit: "Rage Quit Protection",
  energy_oracle: "On-Chain Energy Oracle",
  carbon_nft: "Tradeable Carbon Credit NFTs",
  social_recovery: "Social Recovery Wallet",
  streaming_rewards: "Superfluid-Style Streaming",
  dex_only: "DEX Only",
  dex_first: "DEX First, CEX Later",
  simultaneous: "Simultaneous DEX + Tier 2 CEX",
  cex_focus: "Major CEX Focus",
  "125k": "$125K",
  "250k": "$250K",
  "500k": "$500K",
  "1m_plus": "$1M+",
  base_only: "Base Only",
  base_eth: "Base + Ethereum L1",
  base_sol: "Base + Solana",
  multichain_aggressive: "Aggressive Multi-Chain",
  development_first: "Development First",
  marketing_first: "Marketing First",
  balanced_burn: "Balanced Burn Rate",
  reserve_heavy: "Reserve Heavy",
  token_raise: "Token/SAFT Raise",
  equity_raise: "Equity Raise",
  hybrid_raise: "Hybrid (Equity + Token Warrants)",
  angels_only: "Angels/HNWIs Only",
  climate_vcs: "Climate-Focused VCs",
  crypto_native: "Crypto-Native Funds",
  tier_1_vcs: "Tier 1 VCs (a16z, YC)",
  tam_1_5b: "$1.5B (Residential Solar)",
  tam_10b: "$10B (Solar + Storage)",
  tam_50b: "$50B (Clean Energy)",
  tam_2t: "$2T+ (Energy Transition)",
  tesla_direct: "Tesla Direct Competition",
  chargepoint: "ChargePoint",
  sunrun: "Sunrun/Sunnova",
  no_direct: "No Direct Competition",
  verified_data: "Verified Data (API Integrations)",
  multi_vendor: "Multi-Vendor Neutral",
  blockchain_transparency: "Blockchain Transparency",
  subscription_model: "Subscription Model",
  patent_ip: "Patent IP",
  tesla_ignore: "Tesla Will Ignore Us",
  tesla_partnership: "Potential Partnership",
  tesla_compete: "May Compete Eventually",
  tesla_acquire: "Acquisition Target",
  proven: "Proven (Live Data)",
  modeled: "Modeled (Projections)",
  unknown: "Unknown/TBD",
  milestone_beta: "Beta → Pre-Seed",
  milestone_mainnet: "Mainnet → Seed",
  milestone_traction: "Traction → Series A",
  milestone_agnostic: "Milestone Agnostic",
  essential: "Essential (Verified Energy)",
  nice_to_have: "Nice-to-Have",
  speculative: "Speculative Premium"
};

interface VersionRecord {
  id: string;
  version: number;
  version_name: string | null;
  is_active: boolean;
  answers: Record<string, string | string[] | number>;
  created_at: string;
  updated_at: string;
}

// Key metrics derived from answers
const getKeyMetrics = (answers: Record<string, string | string[] | number>) => {
  const supplyModel = valueLabels[answers.supply_model as string] || answers.supply_model || "Not set";
  const launchPrice = answers.launch_price_strategy === "floor_10c" ? "$0.10" : 
                      answers.launch_price_strategy === "floor_50c" ? "$0.50" : 
                      answers.launch_price_strategy === "floor_1" ? "$1.00" : "$0.10";
  
  // Handle both "burn_20_percent" and "20_percent" formats
  const burnRateRaw = answers.burn_rate as string;
  let burnRate = "20";
  if (burnRateRaw?.includes("20")) burnRate = "20";
  else if (burnRateRaw?.includes("15")) burnRate = "15";
  else if (burnRateRaw?.includes("10")) burnRate = "10";
  else if (burnRateRaw?.includes("30")) burnRate = "30";
  
  const taxMap: Record<string, string> = {
    moderate_split: "7",
    low_split: "3",
    none: "0"
  };
  const transferTax = taxMap[answers.transfer_tax as string] || "7";
  
  const lpDepthMap: Record<string, string> = {
    "125k": "$125K",
    "250k": "$250K", 
    "500k": "$500K",
    "1m_plus": "$1M+"
  };
  const lpDepth = lpDepthMap[answers.liquidity_depth_target as string] || "$300K";
  
  const targetReward = answers.target_user_monthly_value ? `$${answers.target_user_monthly_value}` : "$400-$800";
  
  // Handle both "sell_20_percent" and "20_percent" formats
  const sellRateRaw = answers.sell_pressure_assumption as string;
  let sellRate = "15-25%";
  if (sellRateRaw?.includes("20")) sellRate = "20%";
  else if (sellRateRaw?.includes("30")) sellRate = "30%";
  else if (sellRateRaw?.includes("10")) sellRate = "10%";
  else if (sellRateRaw?.includes("50")) sellRate = "50%";
  
  return { supplyModel, launchPrice, burnRate, transferTax, lpDepth, targetReward, sellRate };
};

// Tappable metric row component
interface MetricRowProps {
  metricKey: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  note?: string;
  color?: string;
  onTap: (key: string) => void;
}

function MetricRow({ metricKey, icon: Icon, value, note, color = "primary", onTap }: MetricRowProps) {
  return (
    <button
      onClick={() => onTap(metricKey)}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all duration-200 text-left group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg bg-${color}-500/10 shrink-0`}>
          <Icon className={`h-4 w-4 text-${color}-500`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight">{questionLabels[metricKey] || metricKey}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Info className="h-3 w-3 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground">Tap for info</span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3 max-w-[45%]">
        <p className="font-semibold text-sm leading-tight">{value}</p>
        {note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{note}</p>
        )}
      </div>
    </button>
  );
}

export default function AdminFinalTokenomics() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    const loadActiveVersion = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('tokenomics_framework_responses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          const answerData = data.answers as Record<string, unknown>;
          const extractedAnswers: Record<string, string | string[] | number> = {};
          const extractedNotes: Record<string, string> = {};
          
          Object.entries(answerData).forEach(([key, value]) => {
            if (key.endsWith('_notes') && typeof value === 'string') {
              extractedNotes[key.replace('_notes', '')] = value;
            } else if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
              extractedAnswers[key] = value as string | string[] | number;
            }
          });
          
          setAnswers(extractedAnswers);
          setNotes(extractedNotes);
          setVersionName(data.version_name);
        }
      } catch (err) {
        console.error('Error loading framework:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActiveVersion();
  }, [user]);

  const metrics = useMemo(() => getKeyMetrics(answers), [answers]);

  const getDisplayValue = (value: string | string[] | number | undefined): string => {
    if (value === undefined || value === null) return "Not set";
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return value.map(v => valueLabels[v] || v).join(", ");
    }
    return valueLabels[value] || value;
  };

  const copyToClipboard = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMetricTap = (key: string) => {
    setSelectedMetric(key);
  };

  const selectedDefinition = selectedMetric ? metricDefinitions[selectedMetric] : null;

  const coreEconomics = [
    { key: "supply_model", icon: Coins, color: "primary" },
    { key: "launch_price_strategy", icon: DollarSign, color: "green" },
    { key: "burn_rate", icon: Flame, color: "red" },
    { key: "transfer_tax", icon: Scale, color: "purple" },
  ];

  const sustainabilityMetrics = [
    { key: "sell_pressure_assumption", icon: TrendingUp, color: "green" },
    { key: "liquidity_depth_target", icon: Globe, color: "green" },
    { key: "price_stability_mechanism", icon: Shield, color: "green" },
    { key: "lp_injection_source", icon: Zap, color: "green" },
  ];

  const userExperience = [
    { key: "target_user_monthly_value", icon: Target, color: "blue" },
    { key: "reward_framing", icon: Brain, color: "blue" },
    { key: "reward_frequency", icon: Rocket, color: "blue" },
    { key: "beta_user_treatment", icon: Users, color: "blue" },
  ];

  const investorPitch = [
    { key: "investor_thesis", icon: Target, color: "amber" },
    { key: "price_appreciation_story", icon: TrendingUp, color: "amber" },
    { key: "moat_priority", icon: Shield, color: "amber" },
    { key: "total_addressable_market", icon: Globe, color: "amber" },
  ];

  const technicalInnovation = [
    { key: "auto_lp_mechanism", icon: Lightbulb, color: "purple" },
    { key: "staking_mechanics", icon: Lock, color: "purple" },
    { key: "exchange_strategy", icon: Globe, color: "purple" },
    { key: "innovative_mechanisms", icon: Zap, color: "purple" },
  ];

  if (isLoading || isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAnswers = Object.keys(answers).length > 0;
  const completionCount = Object.keys(answers).filter(k => !k.endsWith('_notes') && answers[k]).length;

  // Contract parameters for quick reference
  const contractParams = [
    { label: "MAX_SUPPLY", value: "10,000,000,000", raw: "10000000000" },
    { label: "MINT_BURN_RATE", value: `${metrics.burnRate}%`, raw: metrics.burnRate },
    { label: "TRANSFER_TAX", value: `${metrics.transferTax}%`, raw: metrics.transferTax },
    { label: "INITIAL_LP_USDC", value: metrics.lpDepth, raw: metrics.lpDepth.replace(/[$,K+]/g, '') },
  ];

  const allocationParams = [
    { label: "FOUNDER_ALLOCATION", value: "2.5%", tokens: "250M", note: getDisplayValue(answers.founder_vesting) || "3-Year Vest" },
    { label: "TREASURY_ALLOCATION", value: "7.5%", tokens: "750M", note: "2-Year Vest, Multisig" },
    { label: "COMMUNITY_REWARDS", value: "90%", tokens: "9B", note: "Earned Through Activity" },
  ];

  return (
    <>
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerChildren}
        className="container mx-auto pt-4 pb-8 px-4 max-w-7xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Coins className="h-3 w-3 mr-1" />
                Final Strategy
              </Badge>
              {versionName && (
                <Badge variant="outline" className="text-muted-foreground">
                  {versionName}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              FINAL $ZSOLAR TOKENOMICS
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
              Your consolidated economic strategy — tap any metric to learn more.
            </p>
          </div>
          <ExportButtons 
            pageTitle="Final ZSOLAR Tokenomics" 
            getData={() => [
              { section: "Core Economics", metric: "Max Supply", value: "10,000,000,000 $ZSOLAR" },
              { section: "Core Economics", metric: "Supply Model", value: metrics.supplyModel },
              { section: "Core Economics", metric: "Launch Floor", value: metrics.launchPrice },
              { section: "Core Economics", metric: "Mint Burn Rate", value: `${metrics.burnRate}%` },
              { section: "Core Economics", metric: "Transfer Tax", value: `${metrics.transferTax}%` },
              { section: "Sustainability", metric: "Target LP Depth", value: metrics.lpDepth },
              { section: "Sustainability", metric: "Expected Sell Rate", value: metrics.sellRate },
              { section: "User Experience", metric: "Monthly Reward Target", value: metrics.targetReward },
              ...Object.entries(answers).map(([key, value]) => ({
                section: "Framework Answers",
                question: questionLabels[key] || key,
                answer: getDisplayValue(value),
                notes: notes[key] || ""
              }))
            ]} 
          />
        </motion.div>

        {!hasAnswers ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-6" />
              <h3 className="text-xl font-semibold mb-3">No Framework Completed</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Complete the Tokenomics Optimization Framework wizard to see your consolidated strategy here.
              </p>
              <Button asChild>
                <a href="/admin/tokenomics-framework">
                  Go to Framework <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hero Metrics */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {[
                { label: "Max Supply", value: "10B", bg: "from-primary/10", text: "text-primary" },
                { label: "Launch Floor", value: metrics.launchPrice, bg: "from-green-500/10", text: "text-green-600 dark:text-green-400" },
                { label: "Target Price", value: "$1.00", bg: "from-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
                { label: "Mint Burn", value: `${metrics.burnRate}%`, bg: "from-red-500/10", text: "text-red-600 dark:text-red-400" },
                { label: "Transfer Tax", value: `${metrics.transferTax}%`, bg: "from-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
                { label: "LP Seed", value: metrics.lpDepth, bg: "from-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
                { label: "Reward/Mo", value: metrics.targetReward, bg: "from-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
              ].map((item, idx) => (
                <Card 
                  key={idx} 
                  className={`bg-gradient-to-br ${item.bg} to-transparent border-0 shadow-sm`}
                >
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
                    <p className={`text-lg sm:text-xl font-bold mt-1 ${item.text}`}>{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Core Economics Card */}
            <motion.div variants={fadeIn}>
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Core Economics</CardTitle>
                      <CardDescription>Foundational tokenomics parameters</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  {coreEconomics.map(({ key, icon, color }) => (
                    <MetricRow
                      key={key}
                      metricKey={key}
                      icon={icon}
                      value={getDisplayValue(answers[key])}
                      note={notes[key]}
                      color={color}
                      onTap={handleMetricTap}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Two Column Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Sustainability */}
              <motion.div variants={fadeIn}>
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-green-500/10">
                        <Scale className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Sustainability</CardTitle>
                        <CardDescription>LP depth, sell pressure, floor defense</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {sustainabilityMetrics.map(({ key, icon, color }) => (
                      <MetricRow
                        key={key}
                        metricKey={key}
                        icon={icon}
                        value={getDisplayValue(answers[key])}
                        note={notes[key]}
                        color={color}
                        onTap={handleMetricTap}
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* User Experience */}
              <motion.div variants={fadeIn}>
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">User Experience</CardTitle>
                        <CardDescription>Rewards, psychology, frequency</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {userExperience.map(({ key, icon, color }) => (
                      <MetricRow
                        key={key}
                        metricKey={key}
                        icon={icon}
                        value={getDisplayValue(answers[key])}
                        note={notes[key]}
                        color={color}
                        onTap={handleMetricTap}
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Investor Pitch */}
              <motion.div variants={fadeIn}>
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10">
                        <Target className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Investor Value Proposition</CardTitle>
                        <CardDescription>Thesis, moat, 10x narrative</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {investorPitch.map(({ key, icon, color }) => (
                      <MetricRow
                        key={key}
                        metricKey={key}
                        icon={icon}
                        value={getDisplayValue(answers[key])}
                        note={notes[key]}
                        color={color}
                        onTap={handleMetricTap}
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Technical Innovation */}
              <motion.div variants={fadeIn}>
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10">
                        <Lightbulb className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Smart Contract Innovation</CardTitle>
                        <CardDescription>LP automation, staking, exchanges</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {technicalInnovation.map(({ key, icon, color }) => (
                      <MetricRow
                        key={key}
                        metricKey={key}
                        icon={icon}
                        value={getDisplayValue(answers[key])}
                        note={notes[key]}
                        color={color}
                        onTap={handleMetricTap}
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Smart Contract Parameters */}
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Smart Contract Parameters</CardTitle>
                      <CardDescription>Tap to copy values for deployment</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {contractParams.map((param) => (
                      <button 
                        key={param.label}
                        className="p-4 rounded-xl bg-muted/50 border hover:border-primary/50 hover:bg-muted transition-all active:scale-[0.98] text-left group"
                        onClick={() => copyToClipboard(param.label, param.raw)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] text-muted-foreground font-medium">{param.label}</p>
                          {copiedField === param.label ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="font-mono text-base sm:text-lg font-bold">{param.value}</p>
                      </button>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="grid sm:grid-cols-3 gap-3">
                    {allocationParams.map((param) => (
                      <div key={param.label} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[11px] text-muted-foreground font-medium mb-2">{param.label}</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-mono text-lg font-bold">{param.value}</span>
                          <span className="text-sm text-muted-foreground">({param.tokens})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{param.note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completion Status */}
            <motion.div variants={fadeIn}>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Framework Completion</span>
                    <span className="text-sm text-muted-foreground">{completionCount} questions answered</span>
                  </div>
                  <Progress value={Math.min((completionCount / 40) * 100, 100)} className="h-2" />
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground">
                      Active version: <span className="font-medium text-foreground">{versionName || "Version 1"}</span>
                    </p>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/admin/tokenomics-framework">
                        Edit Framework <ArrowRight className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Definition Dialog */}
      <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {selectedDefinition?.title || questionLabels[selectedMetric || ''] || 'Definition'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {selectedDefinition?.definition || 'No definition available for this metric.'}
            </p>
            {selectedDefinition?.example && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-1">Example</p>
                <p className="text-sm">{selectedDefinition.example}</p>
              </div>
            )}
            {selectedMetric && answers[selectedMetric] && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs font-medium text-muted-foreground mb-1">Your Selection</p>
                <p className="text-sm font-semibold">{getDisplayValue(answers[selectedMetric])}</p>
                {notes[selectedMetric] && (
                  <p className="text-xs text-muted-foreground mt-1">{notes[selectedMetric]}</p>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => setSelectedMetric(null)} className="w-full mt-2">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
