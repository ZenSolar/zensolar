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
  Brain,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  sell_10_percent: "10%/mo",
  sell_20_percent: "20%/mo",
  sell_30_percent: "30%/mo",
  sell_50_percent: "50%/mo",
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
                      answers.launch_price_strategy === "floor_1" ? "$1.00" : "$0.10";
  
  const burnRateMap: Record<string, string> = {
    burn_20_percent: "20",
    burn_15_percent: "15",
    burn_10_percent: "10",
    burn_30_percent: "30"
  };
  const burnRate = burnRateMap[answers.burn_rate as string] || "20";
  
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
  
  const sellRateMap: Record<string, string> = {
    sell_20_percent: "20%",
    sell_30_percent: "30%",
    sell_10_percent: "10%",
    sell_50_percent: "50%"
  };
  const sellRate = sellRateMap[answers.sell_pressure_assumption as string] || "15-25%";
  
  return { supplyModel, launchPrice, burnRate, transferTax, lpDepth, targetReward, sellRate };
};

export default function AdminFinalTokenomics() {
  const { user, isLoading } = useAuth();
  const { isAdmin, isChecking } = useAdminCheck();
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const coreEconomics = [
    { key: "supply_model", icon: Coins, category: "Supply" },
    { key: "launch_price_strategy", icon: DollarSign, category: "Price" },
    { key: "burn_rate", icon: Flame, category: "Deflation" },
    { key: "transfer_tax", icon: Scale, category: "Tax" },
  ];

  const sustainabilityMetrics = [
    { key: "sell_pressure_assumption", icon: TrendingUp, category: "Sell Rate" },
    { key: "liquidity_depth_target", icon: Globe, category: "LP Depth" },
    { key: "price_stability_mechanism", icon: Shield, category: "Floor Defense" },
    { key: "lp_injection_source", icon: Zap, category: "LP Sources" },
  ];

  const userExperience = [
    { key: "target_user_monthly_value", icon: Target, category: "Target Reward" },
    { key: "reward_framing", icon: Brain, category: "Psychology" },
    { key: "reward_frequency", icon: Rocket, category: "Frequency" },
    { key: "beta_user_treatment", icon: Users, category: "Beta Users" },
  ];

  const investorPitch = [
    { key: "investor_thesis", icon: Target, category: "Thesis" },
    { key: "price_appreciation_story", icon: TrendingUp, category: "10x Story" },
    { key: "moat_priority", icon: Shield, category: "Moat" },
    { key: "total_addressable_market", icon: Globe, category: "TAM" },
  ];

  const technicalInnovation = [
    { key: "auto_lp_mechanism", icon: Lightbulb, category: "LP Automation" },
    { key: "staking_mechanics", icon: Lock, category: "Staking" },
    { key: "exchange_strategy", icon: Globe, category: "Exchange" },
    { key: "innovative_mechanisms", icon: Zap, category: "Innovations" },
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
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerChildren}
      className="container mx-auto pt-4 pb-8 px-4 max-w-7xl space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            FINAL $ZSOLAR TOKENOMICS
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Your consolidated economic strategy — ready for investor decks and smart contract deployment.
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
          <motion.div variants={fadeIn} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Max Supply", value: "10B", color: "primary" },
              { label: "Launch Floor", value: metrics.launchPrice, color: "green" },
              { label: "Target Price", value: "$1.00", color: "amber" },
              { label: "Mint Burn", value: `${metrics.burnRate}%`, color: "red" },
              { label: "Transfer Tax", value: `${metrics.transferTax}%`, color: "purple" },
              { label: "LP Seed", value: metrics.lpDepth, color: "blue" },
              { label: "Reward/Mo", value: metrics.targetReward, color: "cyan" },
            ].map((item, idx) => (
              <Card 
                key={idx} 
                className={`bg-gradient-to-br from-${item.color}-500/10 to-transparent border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-colors`}
              >
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
                  <p className={`text-xl font-bold mt-1 text-${item.color}-600 dark:text-${item.color}-400`}>{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Core Economics Card */}
          <motion.div variants={fadeIn}>
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Core Economics</CardTitle>
                      <CardDescription>Foundational tokenomics parameters</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {coreEconomics.map(({ key, icon: Icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{questionLabels[key]}</p>
                          <p className="text-xs text-muted-foreground">{category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{getDisplayValue(answers[key])}</p>
                        {notes[key] && (
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{notes[key]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Scale className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Sustainability</CardTitle>
                      <CardDescription>LP depth, sell pressure, floor defense</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sustainabilityMetrics.map(({ key, icon: Icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[180px] truncate">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* User Experience */}
            <motion.div variants={fadeIn}>
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">User Experience</CardTitle>
                      <CardDescription>Rewards, psychology, frequency</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userExperience.map(({ key, icon: Icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[180px] truncate">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Investor Pitch */}
            <motion.div variants={fadeIn}>
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Target className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Investor Value Proposition</CardTitle>
                      <CardDescription>Thesis, moat, 10x narrative</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {investorPitch.map(({ key, icon: Icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[180px] truncate">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Technical Innovation */}
            <motion.div variants={fadeIn}>
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Lightbulb className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Smart Contract Innovation</CardTitle>
                      <CardDescription>LP automation, staking, exchanges</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {technicalInnovation.map(({ key, icon: Icon, category }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">{questionLabels[key]}</span>
                      </div>
                      <span className="text-sm font-semibold text-right max-w-[180px] truncate">{getDisplayValue(answers[key])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Smart Contract Parameters */}
          <motion.div variants={fadeIn}>
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-foreground/5">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Smart Contract Parameters</CardTitle>
                    <CardDescription>Copy these values for contract deployment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {contractParams.map((param) => (
                    <div 
                      key={param.label}
                      className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors group cursor-pointer"
                      onClick={() => copyToClipboard(param.label, param.raw)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">{param.label}</p>
                        {copiedField === param.label ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <p className="font-mono text-lg font-bold">{param.value}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="grid sm:grid-cols-3 gap-4">
                  {allocationParams.map((param) => (
                    <div key={param.label} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground font-medium mb-2">{param.label}</p>
                      <div className="flex items-baseline gap-2">
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
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">
                    Active version: <span className="font-medium text-foreground">{versionName || "Default"}</span>
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
  );
}
