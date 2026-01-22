import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
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
  Brain
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ExportButtons } from "@/components/admin/ExportButtons";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// Question ID to human-readable label mapping
const questionLabels: Record<string, string> = {
  supply_model: "Supply Model",
  initial_circulating: "Initial Circulation",
  launch_price_strategy: "Launch Price",
  price_stability_mechanism: "Price Stability",
  burn_rate: "Mint Burn Rate",
  transfer_tax: "Transfer Tax",
  reward_framing: "Reward Framing",
  reward_frequency: "Reward Frequency",
  sell_pressure_assumption: "Sell Rate Assumption",
  lp_injection_source: "LP Sources",
  governance_model: "Governance",
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
  multi_chain: "Multi-Chain",
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
  "1_percent": "1-2% (~100-200M tokens)",
  "5_percent": "5% (~500M tokens)",
  "10_percent": "10% (~1B tokens)",
  floor_10c: "$0.10 Floor (10x Growth Narrative)",
  floor_50c: "$0.50 Floor",
  floor_1: "$1.00 Floor",
  subscription_lp: "Subscription-Backed LP (50% of $9.99/mo)",
  treasury_buyback: "Treasury Buyback Program",
  hybrid_dynamic: "Hybrid Dynamic Response",
  burn_10_percent: "10% Burn Rate",
  burn_15_percent: "15% Burn Rate",
  burn_20_percent: "20% Burn Rate (Aggressive)",
  burn_30_percent: "30% Burn Rate",
  none: "No Tax/None",
  low_split: "3% Tax (1.5% burn / 1.5% treasury)",
  moderate_split: "7% Tax (3.5% burn / 3.5% treasury)",
  holder_reward: "5% Tax with Holder Reflections",
  impact_first: "Impact + Rewards First",
  dollar_value: "Dollar Value First",
  token_accumulation: "Token Accumulation",
  gamified_tiers: "Gamified Achievement Tiers",
  daily: "Daily Batches",
  weekly: "Weekly Rewards",
  monthly: "Monthly Payouts",
  real_time: "Real-Time Streaming",
  sell_10_percent: "10% Monthly Sell Rate",
  sell_20_percent: "20% Monthly Sell Rate",
  sell_30_percent: "30% Monthly Sell Rate",
  sell_50_percent: "50% Monthly Sell Rate",
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
  network_growth: "Network Growth Thesis",
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
                      answers.launch_price_strategy === "floor_1" ? "$1.00" : "Not set";
  const burnRate = answers.burn_rate === "20_percent" ? "20%" :
                   answers.burn_rate === "15_percent" ? "15%" :
                   answers.burn_rate === "10_percent" ? "10%" :
                   answers.burn_rate === "30_percent" ? "30%" : "Not set";
  const transferTax = answers.transfer_tax === "moderate_split" ? "7%" :
                      answers.transfer_tax === "low_split" ? "3%" :
                      answers.transfer_tax === "none" ? "0%" : "Not set";
  const lpDepth = valueLabels[answers.liquidity_depth_target as string] || "$300K";
  const targetReward = answers.target_user_monthly_value ? `$${answers.target_user_monthly_value}` : "$400-$800";
  const sellRate = answers.sell_pressure_assumption === "20_percent" ? "20%" :
                   answers.sell_pressure_assumption === "30_percent" ? "30%" :
                   answers.sell_pressure_assumption === "10_percent" ? "10%" : "15-25%";
  
  return { supplyModel, launchPrice, burnRate, transferTax, lpDepth, targetReward, sellRate };
};

export default function AdminFinalTokenomics() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [versionName, setVersionName] = useState<string | null>(null);

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
    if (value === undefined || value === null) return "Not answered";
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return value.map(v => valueLabels[v] || v).join(", ");
    }
    return valueLabels[value] || value;
  };

  const coreEconomics = [
    { key: "supply_model", icon: <Coins className="h-4 w-4" />, category: "Supply" },
    { key: "launch_price_strategy", icon: <DollarSign className="h-4 w-4" />, category: "Price" },
    { key: "burn_rate", icon: <Flame className="h-4 w-4" />, category: "Deflation" },
    { key: "transfer_tax", icon: <Scale className="h-4 w-4" />, category: "Tax" },
  ];

  const sustainabilityMetrics = [
    { key: "sell_pressure_assumption", icon: <TrendingUp className="h-4 w-4" />, category: "Sell Rate" },
    { key: "liquidity_depth_target", icon: <Globe className="h-4 w-4" />, category: "LP Depth" },
    { key: "price_stability_mechanism", icon: <Shield className="h-4 w-4" />, category: "Floor Defense" },
    { key: "lp_injection_source", icon: <Zap className="h-4 w-4" />, category: "LP Sources" },
  ];

  const userExperience = [
    { key: "target_user_monthly_value", icon: <Target className="h-4 w-4" />, category: "Target Reward" },
    { key: "reward_framing", icon: <Brain className="h-4 w-4" />, category: "Psychology" },
    { key: "reward_frequency", icon: <Rocket className="h-4 w-4" />, category: "Frequency" },
    { key: "beta_user_treatment", icon: <Users className="h-4 w-4" />, category: "Beta Users" },
  ];

  const investorPitch = [
    { key: "investor_thesis", icon: <Target className="h-4 w-4" />, category: "Thesis" },
    { key: "price_appreciation_story", icon: <TrendingUp className="h-4 w-4" />, category: "10x Story" },
    { key: "moat_priority", icon: <Shield className="h-4 w-4" />, category: "Moat" },
    { key: "total_addressable_market", icon: <Globe className="h-4 w-4" />, category: "TAM" },
  ];

  const technicalInnovation = [
    { key: "auto_lp_mechanism", icon: <Lightbulb className="h-4 w-4" />, category: "LP Automation" },
    { key: "staking_mechanics", icon: <Lock className="h-4 w-4" />, category: "Staking" },
    { key: "exchange_strategy", icon: <Globe className="h-4 w-4" />, category: "Exchange" },
    { key: "innovative_mechanisms", icon: <Zap className="h-4 w-4" />, category: "Innovations" },
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

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerChildren}
      className="container mx-auto pt-4 pb-8 px-4 max-w-7xl space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-2">
          <Badge variant="outline" className="text-primary border-primary">
            <Coins className="h-3 w-3 mr-1" />
            Final Strategy
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            FINAL $ZSOLAR TOKENOMICS
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            Consolidated economic strategy from your completed framework
            {versionName && <span className="text-primary font-medium"> — {versionName}</span>}
          </p>
        </div>
        <ExportButtons 
          pageTitle="Final ZSOLAR Tokenomics" 
          getData={() => [
            { section: "Core Economics", metric: "Max Supply", value: "10,000,000,000 $ZSOLAR" },
            { section: "Core Economics", metric: "Supply Model", value: metrics.supplyModel },
            { section: "Core Economics", metric: "Launch Floor", value: metrics.launchPrice },
            { section: "Core Economics", metric: "Mint Burn Rate", value: metrics.burnRate },
            { section: "Core Economics", metric: "Transfer Tax", value: metrics.transferTax },
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
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Framework Completed</h3>
            <p className="text-muted-foreground mb-4">
              Complete the Tokenomics Framework wizard to see your consolidated strategy here.
            </p>
            <a href="/admin/tokenomics-framework" className="text-primary hover:underline font-medium">
              Go to Tokenomics Framework →
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics Summary */}
          <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Max Supply</p>
                <p className="text-lg font-bold text-primary">10B</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Launch Floor</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{metrics.launchPrice}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">$1.00</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Mint Burn</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{metrics.burnRate}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Transfer Tax</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{metrics.transferTax}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">LP Seed</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.lpDepth}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Reward/Mo</p>
                <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{metrics.targetReward}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Core Economics */}
          <motion.div variants={fadeIn}>
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Core Economics
                </CardTitle>
                <CardDescription>Foundational tokenomics parameters</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {coreEconomics.map(({ key, icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
                        <div>
                          <p className="font-medium">{questionLabels[key]}</p>
                          <p className="text-xs text-muted-foreground">{category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{getDisplayValue(answers[key])}</p>
                        {notes[key] && (
                          <p className="text-xs text-muted-foreground max-w-xs truncate">{notes[key]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sustainability */}
            <motion.div variants={fadeIn}>
              <Card className="h-full border-green-500/20">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-green-500" />
                    Sustainability Economics
                  </CardTitle>
                  <CardDescription>LP depth, sell pressure, floor defense</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sustainabilityMetrics.map(({ key, icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">{icon}</span>
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* User Experience */}
            <motion.div variants={fadeIn}>
              <Card className="h-full border-blue-500/20">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    User Experience
                  </CardTitle>
                  <CardDescription>Rewards, psychology, frequency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userExperience.map(({ key, icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">{icon}</span>
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Investor Pitch */}
            <motion.div variants={fadeIn}>
              <Card className="h-full border-amber-500/20">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    Investor Value Proposition
                  </CardTitle>
                  <CardDescription>Thesis, moat, 10x narrative</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {investorPitch.map(({ key, icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500">{icon}</span>
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[200px]">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Technical Innovation */}
            <motion.div variants={fadeIn}>
              <Card className="h-full border-purple-500/20">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-500" />
                    Smart Contract Innovation
                  </CardTitle>
                  <CardDescription>LP automation, staking, exchanges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {technicalInnovation.map(({ key, icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500">{icon}</span>
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[200px]">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Reference Card */}
          <motion.div variants={fadeIn}>
            <Card className="border-foreground/20 bg-gradient-to-br from-foreground/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Quick Reference: Smart Contract Parameters
                </CardTitle>
                <CardDescription>Copy these values for contract deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">MAX_SUPPLY</p>
                    <p className="font-mono text-sm font-bold">10,000,000,000</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">MINT_BURN_RATE</p>
                    <p className="font-mono text-sm font-bold">{metrics.burnRate.replace('%', '')}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">TRANSFER_TAX</p>
                    <p className="font-mono text-sm font-bold">{metrics.transferTax.replace('%', '')}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">INITIAL_LP_USDC</p>
                    <p className="font-mono text-sm font-bold">{metrics.lpDepth}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">FOUNDER_ALLOCATION</p>
                    <p className="font-mono text-sm font-bold">2.5% (250M tokens)</p>
                    <p className="text-xs text-muted-foreground mt-1">{getDisplayValue(answers.founder_vesting)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">TREASURY_ALLOCATION</p>
                    <p className="font-mono text-sm font-bold">7.5% (750M tokens)</p>
                    <p className="text-xs text-muted-foreground mt-1">2-year vest, multisig</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">COMMUNITY_REWARDS</p>
                    <p className="font-mono text-sm font-bold">90% (9B tokens)</p>
                    <p className="text-xs text-muted-foreground mt-1">Earned through activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion Status */}
          <motion.div variants={fadeIn}>
            <Card className="border-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Framework Completion</span>
                  <span className="text-sm font-medium">{completionCount} questions answered</span>
                </div>
                <Progress value={Math.min((completionCount / 40) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on your active version: {versionName || "Default"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
