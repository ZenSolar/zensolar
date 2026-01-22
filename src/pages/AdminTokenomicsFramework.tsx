import { useState, useMemo, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Lightbulb,
  Target,
  Shield,
  TrendingUp,
  Users,
  Coins,
  Lock,
  Rocket,
  RefreshCw,
  Brain,
  Gem,
  Scale,
  Flame,
  Globe,
  Save,
  Cloud,
  CloudOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the framework
interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface FrameworkQuestion {
  id: string;
  dimension: string;
  dimensionIcon: React.ReactNode;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'text' | 'number' | 'scale';
  options?: QuestionOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  insight?: string;
}

// Strategic framework questions across 10+ dimensions
const frameworkQuestions: FrameworkQuestion[] = [
  // 1. SUPPLY ARCHITECTURE
  {
    id: 'supply_model',
    dimension: 'Supply Architecture',
    dimensionIcon: <Coins className="h-5 w-5" />,
    question: 'What supply model best aligns with your long-term vision?',
    subtitle: 'This foundational choice shapes all downstream tokenomics decisions.',
    type: 'single',
    options: [
      { value: 'fixed', label: 'Fixed Supply (Deflationary)', description: 'Bitcoin-style scarcity. Maximum 10B tokens, burns reduce supply over time.' },
      { value: 'capped_elastic', label: 'Capped with Elastic Minting', description: 'Hard cap with activity-driven issuance that slows as cap approaches.' },
      { value: 'dynamic', label: 'Dynamic Equilibrium', description: 'Algorithmic supply adjustment based on network velocity and demand signals.' },
    ],
    insight: '💡 First-Mover Advantage: ZenSolar is creating a new category—your supply model should reflect pioneering confidence.',
  },
  {
    id: 'initial_circulating',
    dimension: 'Supply Architecture',
    dimensionIcon: <Coins className="h-5 w-5" />,
    question: 'What percentage of total supply should be circulating at launch?',
    subtitle: 'Lower initial circulation creates scarcity; higher enables liquidity depth.',
    type: 'single',
    options: [
      { value: '1_percent', label: '1-2% (~100-200M tokens)', description: 'Maximum scarcity. Requires strong LP seed to maintain floor.' },
      { value: '5_percent', label: '5% (~500M tokens)', description: 'Balanced approach. Room for early adopter rewards + LP depth.' },
      { value: '10_percent', label: '10% (~1B tokens)', description: 'Higher liquidity. Better for active trading volume.' },
    ],
    insight: '💡 Your $125K LP seed paired with 250K tokens currently implies ultra-scarcity positioning.',
  },
  
  // 2. PRICE DISCOVERY
  {
    id: 'launch_price_strategy',
    dimension: 'Price Discovery',
    dimensionIcon: <TrendingUp className="h-5 w-5" />,
    question: 'What launch price strategy creates the best user psychology?',
    subtitle: 'Price anchoring affects perceived value and reward excitement.',
    type: 'single',
    options: [
      { value: 'floor_50c', label: '$0.50 Floor (Current)', description: 'Conservative entry. Users earn 800 tokens = $400/month.' },
      { value: 'floor_1', label: '$1.00 Floor', description: 'Premium positioning. Users earn 400 tokens = $400/month.' },
      { value: 'floor_10c', label: '$0.10 Floor', description: 'Accessible entry. Users earn 4,000 tokens = $400/month. Higher volume psychology.' },
    ],
    insight: '💡 Lower unit price with more tokens often creates stronger "accumulation excitement" among retail users.',
  },
  {
    id: 'price_stability_mechanism',
    dimension: 'Price Discovery',
    dimensionIcon: <TrendingUp className="h-5 w-5" />,
    question: 'How should the protocol defend the price floor?',
    type: 'single',
    options: [
      { value: 'subscription_lp', label: 'Subscription-Backed LP (Current)', description: '50% of $9.99/mo subscriptions inject into LP continuously.' },
      { value: 'treasury_buyback', label: 'Treasury Buyback Program', description: 'Treasury deploys USDC to buy tokens when price drops below floor.' },
      { value: 'hybrid_dynamic', label: 'Hybrid Dynamic Response', description: 'Algorithmic switching between LP injection and buybacks based on market conditions.' },
    ],
  },
  
  // 3. DEFLATION MECHANICS
  {
    id: 'burn_rate',
    dimension: 'Deflation Mechanics',
    dimensionIcon: <Flame className="h-5 w-5" />,
    question: 'What mint burn rate creates optimal deflation pressure?',
    subtitle: 'Higher burns accelerate scarcity but reduce immediate user rewards.',
    type: 'single',
    options: [
      { value: '10_percent', label: '10% Burn', description: 'Light deflation. Maximizes user take-home rewards.' },
      { value: '15_percent', label: '15% Burn (Current)', description: 'Balanced approach. Meaningful deflation while preserving reward value.' },
      { value: '20_percent', label: '20% Burn', description: 'Aggressive deflation. Strong long-term price support, lower immediate rewards.' },
      { value: '30_percent', label: '30% Burn', description: 'Ultra-deflationary. Best for "hold for value" user psychology.' },
    ],
    insight: '💡 Every 1% increase in burn rate compounds significantly over time with millions of mints.',
  },
  {
    id: 'transfer_tax',
    dimension: 'Deflation Mechanics',
    dimensionIcon: <Flame className="h-5 w-5" />,
    question: 'Should transfers include a tax? If so, how should it be allocated?',
    type: 'single',
    options: [
      { value: 'none', label: 'No Transfer Tax', description: 'Maximum liquidity and exchange compatibility.' },
      { value: 'low_split', label: '3% Tax (1.5% burn / 1.5% treasury)', description: 'Light friction, continuous deflation on trading.' },
      { value: 'moderate_split', label: '7% Tax (3.5% burn / 3.5% treasury)', description: 'Current model. Meaningful impact on trading velocity.' },
      { value: 'holder_reward', label: '5% Tax (2% burn / 3% holder reflections)', description: 'Rewards holding over trading. Builds loyalty.' },
    ],
  },
  
  // 4. USER REWARD PSYCHOLOGY
  {
    id: 'reward_framing',
    dimension: 'User Reward Psychology',
    dimensionIcon: <Brain className="h-5 w-5" />,
    question: 'How should rewards be framed to maximize user excitement?',
    subtitle: 'Psychological framing can dramatically impact perceived value.',
    type: 'single',
    options: [
      { value: 'dollar_value', label: 'Dollar Value First', description: '"Earn $400-$800/month in crypto rewards!"' },
      { value: 'token_accumulation', label: 'Token Accumulation', description: '"Earn 800+ $ZSOLAR tokens monthly! Stack for the future."' },
      { value: 'impact_first', label: 'Impact + Rewards', description: '"Your clean energy saved 2 tons CO2 AND earned $400 this month."' },
      { value: 'gamified_tiers', label: 'Gamified Achievement Tiers', description: '"You\'re a Solar Champion! Next tier unlocks 1.5x multiplier."' },
    ],
    insight: '💡 First-Mover Advantage: You\'re creating the narrative. Frame it to resonate with sustainability-minded crypto enthusiasts.',
  },
  {
    id: 'reward_frequency',
    dimension: 'User Reward Psychology',
    dimensionIcon: <Brain className="h-5 w-5" />,
    question: 'How often should users receive their rewards?',
    type: 'single',
    options: [
      { value: 'real_time', label: 'Real-Time Streaming', description: 'Watch tokens accumulate live. Maximum engagement.' },
      { value: 'daily', label: 'Daily Batches', description: 'Daily notification: "You earned 27 $ZSOLAR yesterday!"' },
      { value: 'weekly', label: 'Weekly Rewards', description: 'Bigger number, more satisfying. "189 $ZSOLAR this week!"' },
      { value: 'monthly', label: 'Monthly Payouts', description: 'Largest single reward. Subscription renewal moment.' },
    ],
  },
  
  // 5. SUSTAINABILITY ECONOMICS
  {
    id: 'sell_pressure_assumption',
    dimension: 'Sustainability Economics',
    dimensionIcon: <Scale className="h-5 w-5" />,
    question: 'What monthly sell rate should the model be designed to absorb?',
    subtitle: 'Conservative assumptions prevent economic collapse under stress.',
    type: 'single',
    options: [
      { value: '10_percent', label: '10% Monthly Sell Rate', description: 'Optimistic. Users are holding for value appreciation.' },
      { value: '20_percent', label: '20% Monthly Sell Rate', description: 'Realistic baseline. Mixed holder/seller behavior.' },
      { value: '30_percent', label: '30% Monthly Sell Rate', description: 'Conservative. Assumes many users monetize immediately.' },
      { value: '50_percent', label: '50% Monthly Sell Rate', description: 'Stress-test scenario. Build for the worst case.' },
    ],
    insight: '💡 Current model assumes 15-25%. Building for 30%+ creates robust foundations.',
  },
  {
    id: 'lp_injection_source',
    dimension: 'Sustainability Economics',
    dimensionIcon: <Scale className="h-5 w-5" />,
    question: 'Beyond subscriptions, what additional LP injection sources should exist?',
    type: 'multiple',
    options: [
      { value: 'subscriptions', label: 'Subscription Fees (50% to LP)', description: 'Current primary source. $4.995/user/month.' },
      { value: 'nft_royalties', label: 'NFT Secondary Royalties', description: '5-10% of NFT resales flow to LP.' },
      { value: 'partner_fees', label: 'B2B Partner API Fees', description: 'Enterprise data access fees support LP.' },
      { value: 'carbon_credits', label: 'Carbon Credit Revenue', description: 'Verified impact monetized and injected.' },
      { value: 'staking_fees', label: 'Staking/Unstaking Fees', description: 'Small % on stake/unstake operations.' },
    ],
  },
  
  // 6. GOVERNANCE & UTILITY
  {
    id: 'governance_model',
    dimension: 'Governance & Utility',
    dimensionIcon: <Users className="h-5 w-5" />,
    question: 'What governance rights should token holders have?',
    type: 'single',
    options: [
      { value: 'none_initially', label: 'No Governance (Phase 1)', description: 'Team maintains full control during growth phase.' },
      { value: 'proposal_voting', label: 'Proposal Voting', description: 'Token holders vote on major protocol decisions.' },
      { value: 'parameter_control', label: 'Parameter Governance', description: 'Vote on rates, burns, allocation percentages.' },
      { value: 'full_dao', label: 'Full DAO Transition', description: 'Progressive decentralization to community control.' },
    ],
  },
  {
    id: 'utility_expansion',
    dimension: 'Governance & Utility',
    dimensionIcon: <Users className="h-5 w-5" />,
    question: 'What additional utility should $ZSOLAR unlock?',
    type: 'multiple',
    options: [
      { value: 'premium_features', label: 'Premium App Features', description: 'Advanced analytics, custom dashboards, API access.' },
      { value: 'store_discounts', label: 'Store Discounts', description: 'Pay with $ZSOLAR for 10-20% off merchandise.' },
      { value: 'nft_minting', label: 'NFT Minting Rights', description: 'Stake tokens to unlock exclusive NFT mints.' },
      { value: 'partner_access', label: 'Partner Perks', description: 'Discounts at EV charging networks, solar installers.' },
      { value: 'staking_boost', label: 'Staking Boost Multipliers', description: 'Stake tokens to boost earning rate.' },
    ],
    insight: '💡 Multiple utility vectors create natural demand sinks that reduce sell pressure.',
  },
  
  // 7. VESTING & DISTRIBUTION
  {
    id: 'founder_vesting',
    dimension: 'Vesting & Distribution',
    dimensionIcon: <Lock className="h-5 w-5" />,
    question: 'What founder/team vesting schedule signals long-term commitment?',
    type: 'single',
    options: [
      { value: '2_year', label: '2-Year Vest', description: '24-month linear vest with 6-month cliff.' },
      { value: '3_year', label: '3-Year Vest (Current)', description: '36-month linear vest with 12-month cliff.' },
      { value: '4_year', label: '4-Year Vest', description: '48-month linear vest. Maximum alignment signal.' },
      { value: '5_year_backloaded', label: '5-Year Backloaded', description: 'Accelerating release. Most tokens unlock in years 4-5.' },
    ],
  },
  {
    id: 'beta_user_treatment',
    dimension: 'Vesting & Distribution',
    dimensionIcon: <Lock className="h-5 w-5" />,
    question: 'How should beta users\' historical energy data be rewarded?',
    subtitle: 'Balancing early adopter loyalty vs. economic sustainability.',
    type: 'single',
    options: [
      { value: 'pioneer_nfts', label: 'Pioneer NFTs Only (Current)', description: 'Tiered NFTs (Bronze→Platinum) recognize contribution without inflation.' },
      { value: 'vested_tokens', label: 'Vested Token Allocation', description: '6-month linear vest of historical rewards. Reduces dump risk.' },
      { value: 'multiplier_bonus', label: 'Future Earning Multiplier', description: 'Beta users earn 1.5x on future activity. Forward-looking.' },
      { value: 'hybrid', label: 'NFTs + Vested Tokens + Multiplier', description: 'Full recognition package for early believers.' },
    ],
    insight: '💡 Early adopters become your strongest evangelists when treated exceptionally.',
  },
  
  // 8. COMPETITIVE MOAT
  {
    id: 'moat_priority',
    dimension: 'Competitive Moat',
    dimensionIcon: <Shield className="h-5 w-5" />,
    question: 'Rank your primary competitive moat (most defensible advantage):',
    type: 'single',
    options: [
      { value: 'first_mover', label: 'First-Mover Category Creation', description: 'You\'re defining the clean energy + crypto rewards category.' },
      { value: 'data_network', label: 'Data Network Effects', description: 'More users = better benchmarks, predictions, community value.' },
      { value: 'provider_integrations', label: 'Deep Provider Integrations', description: 'Tesla, Enphase, SolarEdge partnerships are hard to replicate.' },
      { value: 'token_economics', label: 'Sustainable Token Economics', description: 'Revenue-backed LP model is structurally superior.' },
    ],
    insight: '💡 First-Mover Advantage: ZenSolar is the first platform to directly connect verified clean energy production with blockchain token rewards—creating a new category in the intersection of sustainability and Web3.',
  },
  
  // 9. GROWTH LEVERS
  {
    id: 'viral_mechanic',
    dimension: 'Growth Levers',
    dimensionIcon: <Rocket className="h-5 w-5" />,
    question: 'What viral mechanic should drive organic growth?',
    type: 'single',
    options: [
      { value: 'referral_bonus', label: 'Referral Bonuses', description: 'Both referrer and referee get bonus tokens.' },
      { value: 'social_proof', label: 'Social Proof Sharing', description: '"I earned $400 from my solar panels this month! 🌞"' },
      { value: 'leaderboards', label: 'Public Leaderboards', description: 'Competitive ranking drives engagement and sharing.' },
      { value: 'community_challenges', label: 'Community Challenges', description: '"Help ZenSolar offset 1M tons CO2—bonus rewards for all!"' },
    ],
  },
  {
    id: 'target_user_monthly_value',
    dimension: 'Growth Levers',
    dimensionIcon: <Rocket className="h-5 w-5" />,
    question: 'What monthly reward value triggers "I have to tell everyone" behavior?',
    subtitle: 'The viral trigger point—when rewards become too good not to share.',
    type: 'number',
    placeholder: 'Enter target monthly USD value (e.g., 500)',
    min: 100,
    max: 2000,
    insight: '💡 Current model targets $400-$800/month for active households. Is this the right viral trigger?',
  },
  
  // 10. RISK TOLERANCE
  {
    id: 'risk_philosophy',
    dimension: 'Risk Tolerance',
    dimensionIcon: <Target className="h-5 w-5" />,
    question: 'What\'s your overall risk philosophy for tokenomics design?',
    type: 'single',
    options: [
      { value: 'conservative', label: 'Conservative (Stability First)', description: 'Prioritize price floor defense over aggressive growth.' },
      { value: 'balanced', label: 'Balanced (Current)', description: 'Moderate assumptions. Defend floor while enabling growth.' },
      { value: 'aggressive', label: 'Aggressive (Growth First)', description: 'Higher rewards, faster scaling. Accept more volatility.' },
      { value: 'antifragile', label: 'Antifragile', description: 'Design to get stronger from stress. Build for black swans.' },
    ],
  },
  
  // BONUS: VISION ALIGNMENT
  {
    id: 'north_star',
    dimension: 'Vision Alignment',
    dimensionIcon: <Gem className="h-5 w-5" />,
    question: 'In one sentence, what does success look like for $ZSOLAR in 5 years?',
    subtitle: 'Your north star guides every tokenomics decision.',
    type: 'text',
    placeholder: 'e.g., "Every clean energy household earns $500+/month in $ZSOLAR, funding their transition to full sustainability."',
    insight: '💡 Great tokenomics serves a clear mission. What\'s yours?',
  },
  {
    id: 'biggest_fear',
    dimension: 'Vision Alignment',
    dimensionIcon: <Gem className="h-5 w-5" />,
    question: 'What\'s your biggest fear for the token economy?',
    subtitle: 'Naming fears helps design safeguards against them.',
    type: 'text',
    placeholder: 'e.g., "A death spiral where sell pressure exceeds LP injection..."',
  },
];

// Group questions by dimension
const dimensionGroups = frameworkQuestions.reduce((acc, q) => {
  if (!acc[q.dimension]) {
    acc[q.dimension] = [];
  }
  acc[q.dimension].push(q);
  return acc;
}, {} as Record<string, FrameworkQuestion[]>);

const dimensions = Object.keys(dimensionGroups);

export default function AdminTokenomicsFramework() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const currentQuestion = frameworkQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / frameworkQuestions.length) * 100;
  
  const currentDimension = currentQuestion?.dimension;
  const questionsInDimension = dimensionGroups[currentDimension] || [];
  const questionIndexInDimension = questionsInDimension.findIndex(q => q.id === currentQuestion?.id) + 1;
  
  const answeredCount = Object.keys(answers).length;
  const isCurrentAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;

  // Load saved answers from database
  const loadSavedAnswers = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoadingData(true);
      const { data, error } = await supabase
        .from('tokenomics_framework_responses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.answers) {
        setAnswers(data.answers as Record<string, string | string[] | number>);
        setLastSaved(new Date(data.updated_at));
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
      toast.error('Failed to load saved answers');
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  // Save answers to database
  const saveAnswers = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('tokenomics_framework_responses')
        .upsert({
          user_id: user.id,
          answers: answers,
          version: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Framework responses saved successfully');
    } catch (error) {
      console.error('Error saving answers:', error);
      toast.error('Failed to save responses');
    } finally {
      setIsSaving(false);
    }
  }, [user, answers]);

  // Load saved answers on mount
  useEffect(() => {
    if (user && isAdmin) {
      loadSavedAnswers();
    }
  }, [user, isAdmin, loadSavedAnswers]);
  
  // Handle answer changes
  const handleSingleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    setHasUnsavedChanges(true);
  };
  
  const handleMultipleAnswer = (value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[currentQuestion.id] as string[]) || [];
      if (checked) {
        return { ...prev, [currentQuestion.id]: [...current, value] };
      } else {
        return { ...prev, [currentQuestion.id]: current.filter(v => v !== value) };
      }
    });
    setHasUnsavedChanges(true);
  };
  
  const handleTextAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    setHasUnsavedChanges(true);
  };
  
  const handleNumberAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    setHasUnsavedChanges(true);
  };
  
  const goNext = () => {
    if (currentQuestionIndex < frameworkQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowAnalysis(true);
    }
  };
  
  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const resetFramework = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('tokenomics_framework_responses')
        .delete()
        .eq('user_id', user.id);
      
      setAnswers({});
      setCurrentQuestionIndex(0);
      setShowAnalysis(false);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      toast.success('Framework reset successfully');
    } catch (error) {
      console.error('Error resetting framework:', error);
      toast.error('Failed to reset framework');
    }
  };
  
  // Generate analysis based on answers
  const analysis = useMemo(() => {
    if (!showAnalysis) return null;
    
    const insights: { category: string; finding: string; recommendation: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    // Supply Architecture Analysis
    if (answers.supply_model === 'fixed') {
      insights.push({
        category: 'Supply',
        finding: 'Fixed deflationary supply chosen',
        recommendation: 'Ensure burn mechanics are aggressive enough to create meaningful scarcity within 2-3 years.',
        priority: 'high'
      });
    }
    
    // Price Strategy Analysis
    if (answers.launch_price_strategy === 'floor_10c') {
      insights.push({
        category: 'Psychology',
        finding: 'Low unit price strategy selected',
        recommendation: 'Emphasize token accumulation in marketing. "Stack $ZSOLAR" messaging resonates with this approach.',
        priority: 'medium'
      });
    }
    
    // Burn Rate Analysis
    if (answers.burn_rate === '30_percent') {
      insights.push({
        category: 'Deflation',
        finding: 'Ultra-aggressive 30% burn rate selected',
        recommendation: 'Communicate clearly to users that 70% rewards + 30% ecosystem health creates long-term value.',
        priority: 'high'
      });
    }
    
    // Sell Pressure Analysis
    if (answers.sell_pressure_assumption === '50_percent') {
      insights.push({
        category: 'Risk',
        finding: 'Stress-test sell rate assumption (50%)',
        recommendation: 'Build LP depth to handle worst case. Consider 60%+ subscription-to-LP ratio.',
        priority: 'high'
      });
    }
    
    // Beta User Treatment
    if (answers.beta_user_treatment === 'hybrid') {
      insights.push({
        category: 'Community',
        finding: 'Full recognition package for beta users',
        recommendation: 'Create "Founding Member" narrative. These users become brand ambassadors.',
        priority: 'medium'
      });
    }
    
    // Viral Target
    const viralTarget = answers.target_user_monthly_value as number;
    if (viralTarget && viralTarget > 600) {
      insights.push({
        category: 'Growth',
        finding: `High viral trigger target: $${viralTarget}/month`,
        recommendation: 'Ensure LP can sustain this reward level. May need higher subscription price or additional revenue sources.',
        priority: 'high'
      });
    }
    
    return insights;
  }, [showAnalysis, answers]);

  if (authLoading || adminLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading tokenomics framework...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>This page is restricted to administrators.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Analysis View
  if (showAnalysis) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Analysis Complete</Badge>
          <h1 className="text-3xl font-bold">Your Tokenomics Profile</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Based on your {answeredCount} responses, here's a strategic analysis of your tokenomics framework.</p>
        </motion.div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Risk Profile</span>
              </div>
              <p className="text-2xl font-bold capitalize">{answers.risk_philosophy || 'Balanced'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Burn Rate</span>
              </div>
              <p className="text-2xl font-bold">{answers.burn_rate?.toString().replace('_percent', '%') || '15%'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold">Primary Moat</span>
              </div>
              <p className="text-2xl font-bold capitalize">{(answers.moat_priority as string)?.replace(/_/g, ' ') || 'First Mover'}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Strategic Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Strategic Insights
            </CardTitle>
            <CardDescription>Key findings and recommendations based on your responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis && analysis.length > 0 ? (
              analysis.map((insight, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold",
                    insight.priority === 'high' ? 'bg-red-500' : insight.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  )}>
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{insight.category}</Badge>
                      <Badge className={cn(
                        insight.priority === 'high' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                        insight.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      )}>{insight.priority} priority</Badge>
                    </div>
                    <p className="font-medium">{insight.finding}</p>
                    <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Complete more questions to generate detailed insights.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Your Answers Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Your Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {frameworkQuestions.map((q) => {
                const answer = answers[q.id];
                if (!answer) return null;
                
                let displayAnswer = '';
                if (Array.isArray(answer)) {
                  displayAnswer = answer.map(a => q.options?.find(o => o.value === a)?.label || a).join(', ');
                } else if (typeof answer === 'number') {
                  displayAnswer = `$${answer}`;
                } else {
                  displayAnswer = q.options?.find(o => o.value === answer)?.label || answer;
                }
                
                return (
                  <div key={q.id} className="flex justify-between items-start p-3 rounded-lg border bg-card/50 text-sm">
                    <span className="text-muted-foreground">{q.question}</span>
                    <span className="font-medium text-right max-w-[50%]">{displayAnswer}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Vision Statement */}
        {answers.north_star && (
          <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Your North Star</p>
                  <p className="text-lg font-medium italic">"{answers.north_star}"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-center gap-4">
          <Button onClick={saveAnswers} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Analysis
          </Button>
          <Button onClick={resetFramework} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Question View
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">Admin • Strategic Framework</Badge>
        <h1 className="text-3xl font-bold">Tokenomics Optimization Framework</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Answer strategic questions across 10 dimensions to optimize your $ZSOLAR token economics.
          <span className="block mt-1 text-sm font-medium text-primary">First-Mover Advantage: You're creating a new category.</span>
        </p>
      </motion.div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentQuestionIndex + 1} of {frameworkQuestions.length}</span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex flex-wrap gap-2 mt-3">
          {dimensions.map((dim) => {
            const dimQuestions = dimensionGroups[dim];
            const answeredInDim = dimQuestions.filter(q => answers[q.id] !== undefined).length;
            const isCurrentDim = dim === currentDimension;
            
            return (
              <Badge 
                key={dim} 
                variant={isCurrentDim ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  answeredInDim === dimQuestions.length && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}
              >
                {dim} {answeredInDim}/{dimQuestions.length}
              </Badge>
            );
          })}
        </div>
      </div>
      
      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {currentQuestion.dimensionIcon}
                </div>
                <Badge variant="secondary">{currentQuestion.dimension}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {questionIndexInDimension}/{questionsInDimension.length} in dimension
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
              {currentQuestion.subtitle && (
                <CardDescription className="text-base">{currentQuestion.subtitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Single Choice */}
              {currentQuestion.type === 'single' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] as string || ''}
                  onValueChange={handleSingleAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div 
                      key={option.value}
                      className={cn(
                        "flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50",
                        answers[currentQuestion.id] === option.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-card"
                      )}
                      onClick={() => handleSingleAnswer(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {/* Multiple Choice */}
              {currentQuestion.type === 'multiple' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                    const isChecked = currentAnswers.includes(option.value);
                    
                    return (
                      <div 
                        key={option.value}
                        className={cn(
                          "flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50",
                          isChecked ? "border-primary bg-primary/5" : "border-border bg-card"
                        )}
                        onClick={() => handleMultipleAnswer(option.value, !isChecked)}
                      >
                        <Checkbox 
                          id={option.value} 
                          checked={isChecked}
                          onCheckedChange={(checked) => handleMultipleAnswer(option.value, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={option.value} className="font-medium cursor-pointer">
                            {option.label}
                          </Label>
                          {option.description && (
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Text Input */}
              {currentQuestion.type === 'text' && (
                <Textarea
                  value={answers[currentQuestion.id] as string || ''}
                  onChange={(e) => handleTextAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="min-h-[120px] text-base"
                />
              )}
              
              {/* Number Input */}
              {currentQuestion.type === 'number' && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={answers[currentQuestion.id] as number || ''}
                    onChange={(e) => handleNumberAnswer(parseInt(e.target.value) || 0)}
                    placeholder={currentQuestion.placeholder}
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    className="text-xl font-bold h-14"
                  />
                  {currentQuestion.min !== undefined && currentQuestion.max !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Range: ${currentQuestion.min} - ${currentQuestion.max}
                    </p>
                  )}
                </div>
              )}
              
              {/* Insight Box */}
              {currentQuestion.insight && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">{currentQuestion.insight}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={goPrev} 
          disabled={currentQuestionIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-3">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasUnsavedChanges ? (
              <>
                <CloudOff className="h-4 w-4 text-amber-500" />
                <span>Unsaved</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud className="h-4 w-4 text-emerald-500" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
          
          {/* Save Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveAnswers} 
            disabled={isSaving || !hasUnsavedChanges}
            className="gap-1"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>
          
          {isCurrentAnswered && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </motion.div>
          )}
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {frameworkQuestions.length} answered
          </span>
        </div>
        
        <Button onClick={goNext} className="gap-2">
          {currentQuestionIndex === frameworkQuestions.length - 1 ? (
            <>
              View Analysis
              <Sparkles className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      
      {/* Quick Jump */}
      <Separator />
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">Jump to dimension:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {dimensions.map((dim, i) => {
            const firstQuestionIndex = frameworkQuestions.findIndex(q => q.dimension === dim);
            return (
              <Button
                key={dim}
                variant={currentDimension === dim ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(firstQuestionIndex)}
                className="text-xs"
              >
                {dim}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
