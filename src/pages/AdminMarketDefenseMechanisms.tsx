import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { 
  Loader2, 
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Flame,
  Lock,
  Zap,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  ShoppingBag,
  Users,
  ArrowDown,
  ArrowUp,
  Target,
  Activity,
  DollarSign,
  Rocket,
  Code,
  GitBranch,
  Package,
  PieChart,
  BarChart3,
  CircuitBoard,
  Scale,
  Layers,
  Eye,
  Gauge,
} from 'lucide-react';
import {
  MINT_DISTRIBUTION,
  TRANSFER_TAX,
  PRICES,
  SUBSCRIPTION,
  formatPercent,
} from '@/lib/tokenomics';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// === THREE-TIER DEFENSE FRAMEWORK ===

interface DefenseMechanism {
  id: string;
  name: string;
  description: string;
  trigger?: string;
  effect: string;
  status: 'live' | 'development' | 'planned';
  icon: React.ReactNode;
  details?: string[];
  soliditySnippet?: string;
  reference?: string;
}

// --- TIER 1: CRITICAL (Existential Threats) ---
const tier1Mechanisms: DefenseMechanism[] = [
  {
    id: 'revenue-buyback',
    name: 'Automated Revenue-Backed Buybacks',
    description: 'Smart contract that automatically swaps subscription USDC for $ZSOLAR on Uniswap, then burns purchased tokens',
    trigger: '7-day TWAP drops >15% below $0.10 floor',
    effect: 'Creates buy pressure + supply reduction simultaneously using real revenue',
    status: 'development',
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    details: [
      'Chainlink price oracle monitors 7-day TWAP',
      'Treasury USDC is used to market-buy $ZSOLAR from LP',
      'Purchased tokens are immediately burned (not recycled)',
      'Buyback intensity scales with deviation from floor',
      'Lesson from Terra/Luna: backed by fiat revenue, NOT algorithmic minting',
    ],
    soliditySnippet: `function executeBuyback(uint256 usdcAmount) external onlyAutomation {
    require(getTWAP() < FLOOR_PRICE * 85 / 100, "Above threshold");
    // Swap USDC → ZSOLAR via Uniswap V3
    uint256 tokensBought = router.exactInputSingle(params);
    // Burn all purchased tokens
    ZSOLAR.burn(tokensBought);
    emit BuybackExecuted(usdcAmount, tokensBought);
}`,
    reference: 'Lessons from: Aave Safety Module, MakerDAO Surplus Auctions',
  },
  {
    id: 'erc7265-circuit-breaker',
    name: 'ERC-7265 Circuit Breaker',
    description: 'Emergency pause on asset outflows when withdrawal velocity exceeds safe thresholds — prevents flash crashes and exploit drains',
    trigger: '>30% of LP drained within 1 hour OR >50% within 24 hours',
    effect: 'Temporarily pauses all sells/transfers, protecting remaining LP from cascade liquidation',
    status: 'planned',
    icon: <CircuitBoard className="h-5 w-5 text-red-500" />,
    details: [
      'Implements ERC-7265 standard (proposed by OpenZeppelin team)',
      'Monitors outflow velocity per rolling time window',
      'Tier 1 trigger (>30%/1hr): 1-hour cooldown, admin notification',
      'Tier 2 trigger (>50%/24hr): Full pause until governance review',
      'Auto-expires after 24hr max pause to prevent permanent lockup',
      'Whitelisted addresses (LP contracts, staking) exempt from pause',
      'Prevents "bank run" dynamics that killed Terra/Luna',
    ],
    soliditySnippet: `// ERC-7265 Circuit Breaker Implementation
modifier circuitBreakerCheck(uint256 amount) {
    uint256 hourlyOutflow = _getOutflow(1 hours);
    uint256 dailyOutflow = _getOutflow(24 hours);
    uint256 lpDepth = _getLPTokenBalance();
    
    require(hourlyOutflow + amount <= lpDepth * 30 / 100, 
        "Circuit breaker: hourly limit");
    require(dailyOutflow + amount <= lpDepth * 50 / 100, 
        "Circuit breaker: daily limit");
    
    _recordOutflow(amount);
    _;
}`,
    reference: 'Standard: ERC-7265 (ethereum-magicians.org)',
  },
  {
    id: 'progressive-sell-tax',
    name: 'Progressive Sell Tax (Anti-Dump)',
    description: 'Dynamic tax brackets that scale with sell size relative to total supply — small users pay base 7%, whale dumps pay up to 40%',
    trigger: 'Applied on every sell, scales with transaction size vs supply',
    effect: 'Makes large coordinated dumps economically irrational while protecting retail users',
    status: 'planned',
    icon: <Scale className="h-5 w-5 text-orange-500" />,
    details: [
      'Bracket 1: ≤0.1% of supply → 7% tax (standard)',
      'Bracket 2: 0.1–0.5% of supply → 15% tax',
      'Bracket 3: 0.5–1.0% of supply → 25% tax',
      'Bracket 4: >1.0% of supply → 40% tax',
      'Tax revenue split: 50% burned, 30% to LP, 20% to treasury',
      'Prevents flash crash scenarios from single whale dumps',
      'Wallet-level tracking prevents split-sell circumvention',
    ],
    soliditySnippet: `function _calculateProgressiveTax(uint256 sellAmount) internal view returns (uint256) {
    uint256 supplyBps = sellAmount * 10000 / totalSupply();
    
    if (supplyBps <= 10)   return sellAmount * 700 / 10000;  // 7%
    if (supplyBps <= 50)   return sellAmount * 1500 / 10000; // 15%
    if (supplyBps <= 100)  return sellAmount * 2500 / 10000; // 25%
    return sellAmount * 4000 / 10000;                         // 40%
}`,
    reference: 'Inspired by: SafeMoon progressive tax, Reflect Finance',
  },
];

// --- TIER 2: HIGH PRIORITY (Operational Resilience) ---
const tier2Mechanisms: DefenseMechanism[] = [
  {
    id: 'treasury-diversification',
    name: 'Treasury Diversification (60/40 Rule)',
    description: 'Maintain ≥60% of treasury in non-$ZSOLAR assets to ensure 18+ months operational runway regardless of token price',
    trigger: 'Continuous rebalancing via governance',
    effect: 'Protocol survives even if $ZSOLAR drops 90% — operational costs covered by stablecoins',
    status: 'development',
    icon: <PieChart className="h-5 w-5 text-blue-500" />,
    details: [
      '40% USDC (immediate operational expenses)',
      '15% ETH (gas reserves + blue-chip exposure)',
      '5% RWA tokens (real-world asset yield)',
      '40% $ZSOLAR (protocol alignment, buyback reserves)',
      'Quarterly rebalancing with on-chain governance votes',
      '18-month operational runway minimum at all times',
      'Lesson from: Olympus DAO (treasury 95% in OHM → death spiral)',
    ],
    reference: 'Best practice from: Aave Treasury, Uniswap Foundation',
  },
  {
    id: 'real-yield-staking',
    name: 'Real Yield Staking (USDC Dividends)',
    description: 'Distribute protocol revenue (USDC from subscriptions) to stakers instead of minting new inflationary tokens',
    trigger: 'User voluntarily stakes $ZSOLAR tokens',
    effect: 'Stakers earn real USDC yield — not inflated token emissions that dilute everyone',
    status: 'planned',
    icon: <Coins className="h-5 w-5 text-green-500" />,
    details: [
      '30-day lock: Base yield (share of 10% subscription revenue)',
      '90-day lock: 1.5x yield multiplier',
      '180-day lock: 2.5x yield multiplier',
      'Yield paid in USDC, not $ZSOLAR (no dilution)',
      'Removes tokens from sell pressure during downturns',
      'Lesson from: GMX real yield model (sustained through bear market)',
    ],
    soliditySnippet: `// Real Yield: distribute USDC, not minted tokens
function claimYield() external {
    uint256 share = stakedBalance[msg.sender] * yieldPerToken;
    uint256 multiplier = _getLockMultiplier(msg.sender);
    uint256 payout = share * multiplier / 1e18;
    USDC.transfer(msg.sender, payout); // Real yield!
}`,
    reference: 'Model from: GMX, GNS (survived 2022 bear market)',
  },
  {
    id: 'diamond-hands',
    name: '"Diamond Hands" Lock Incentives',
    description: 'Time-weighted staking with increasing multipliers to incentivize holding during volatility',
    trigger: 'User voluntarily locks tokens for fixed duration',
    effect: 'Removes tokens from circulating supply, reduces sell pressure during crashes',
    status: 'development',
    icon: <Lock className="h-5 w-5 text-cyan-500" />,
    details: [
      '30-day lock = 1.5x reward multiplier',
      '90-day lock = 2.0x reward multiplier',
      '180-day lock = 2.5x reward multiplier',
      '365-day lock = 3.0x reward multiplier + NFT badge',
      'Early withdrawal penalty: 50% of earned rewards forfeited',
      'Locked tokens cannot be sold (smart contract enforced)',
    ],
  },
  {
    id: 'lp-surge',
    name: 'Emergency LP Surge Protocol',
    description: 'Temporarily increase LP allocation from 50% to 70% of subscription revenue during market stress',
    trigger: 'Admin trigger OR automatic when floor breached >10%',
    effect: 'Accelerated floor defense with extra USDC injection',
    status: 'development',
    icon: <ArrowUp className="h-5 w-5 text-primary" />,
    details: [
      'Normal: 50% of subscription revenue → LP',
      'Crisis mode: 70% of subscription revenue → LP',
      'Extra $2/user/month enters LP during emergency',
      'Auto-reverts when price recovers above 95% of floor',
      'Reduces treasury accumulation temporarily for survival',
    ],
  },
];

// --- TIER 3: ADVANCED (Long-Term Moat) ---
const tier3Mechanisms: DefenseMechanism[] = [
  {
    id: 'dynamic-burn-oracle',
    name: 'Dynamic Burn Rate (Chainlink Oracle)',
    description: 'Use Chainlink price feeds to automatically increase burn percentages during sell pressure — creates adaptive deflation',
    trigger: 'BTC drops >25% in 30 days OR $ZSOLAR 7-day TWAP drops >20%',
    effect: 'Mint burn increases from 20% → 30%, transfer burn from 3% → 5%',
    status: 'planned',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    details: [
      'Chainlink BTC/USD and custom $ZSOLAR/USDC feeds',
      'Normal: 20% mint burn, 3% transfer burn',
      'Stress Level 1 (BTC -15%): 25% mint, 4% transfer',
      'Stress Level 2 (BTC -25%): 30% mint, 5% transfer',
      'Stress Level 3 (BTC -40%): 35% mint, 6% transfer',
      'Auto-reverts in 7-day increments as market recovers',
      'On-chain verifiable — no admin trust required',
    ],
    soliditySnippet: `function getMintBurnRate() public view returns (uint256) {
    int256 btcPrice = chainlinkBTC.latestAnswer();
    int256 btc30dAgo = _getHistoricalPrice(30 days);
    int256 drawdown = (btc30dAgo - btcPrice) * 10000 / btc30dAgo;
    
    if (drawdown > 4000) return 3500; // 35% burn
    if (drawdown > 2500) return 3000; // 30% burn
    if (drawdown > 1500) return 2500; // 25% burn
    return 2000;                       // 20% base
}`,
    reference: 'Oracle pattern from: Aave risk parameters, Compound governance',
  },
  {
    id: 'energy-fundamental-floor',
    name: 'Energy Production Fundamental Floor',
    description: 'Use verified energy data to establish a "fundamental value" for $ZSOLAR based on real-world energy production metrics',
    trigger: 'Continuous — updates with each Mint-on-Proof™ verification',
    effect: 'Creates a non-speculative floor: "Each $ZSOLAR represents X kWh of verified clean energy"',
    status: 'planned',
    icon: <Zap className="h-5 w-5 text-primary" />,
    details: [
      'Track total network kWh produced / circulating supply = kWh/token',
      'At 10M kWh and 1M tokens: each token = 10 kWh equivalent',
      'Average US electricity cost: $0.16/kWh → fundamental floor ~$1.60',
      'This metric only goes UP as energy is produced and tokens are burned',
      'Publishable on-chain metric for investor confidence',
      'Creates "energy-backed" narrative vs pure speculation',
    ],
    reference: 'Concept from: Carbon credit tokens (KlimaDAO, Toucan)',
  },
  {
    id: 'utility-acceleration',
    name: 'Bear Market Utility Acceleration',
    description: 'During downturns, offer enhanced store/redemption incentives to redirect sell pressure into utility spending',
    trigger: 'Token price drops >20% below target',
    effect: 'Users spend tokens instead of selling — removes from circulation with 5% burn',
    status: 'planned',
    icon: <ShoppingBag className="h-5 w-5 text-secondary" />,
    details: [
      '20% bonus store credit when redeeming tokens during crash',
      '$100 of tokens → $120 of store value (funded by treasury)',
      '5% redemption burn still applies on every redemption',
      'Creates positive feedback: crash → better deals → users spend not sell',
      'Time-limited flash sales during high volatility periods',
    ],
  },
];

// === PROGRESSIVE SELL TAX BRACKETS TABLE ===
const sellTaxBrackets = [
  { bracket: '≤ 0.1% of supply', dollarExample: '≤ ~$100K', tax: '7%', taxSplit: '3% burn / 2% LP / 2% treasury', intent: 'Retail-friendly base rate' },
  { bracket: '0.1% – 0.5%', dollarExample: '$100K – $500K', tax: '15%', taxSplit: '7% burn / 5% LP / 3% treasury', intent: 'Discourage medium dumps' },
  { bracket: '0.5% – 1.0%', dollarExample: '$500K – $1M', tax: '25%', taxSplit: '12% burn / 8% LP / 5% treasury', intent: 'Major dump deterrent' },
  { bracket: '> 1.0% of supply', dollarExample: '> $1M', tax: '40%', taxSplit: '20% burn / 12% LP / 8% treasury', intent: 'Flash crash prevention' },
];

// === TREASURY DIVERSIFICATION ===
const treasuryAllocation = [
  { asset: 'USDC', percentage: 40, purpose: 'Operational expenses, LP injection, buybacks', color: 'bg-green-500' },
  { asset: '$ZSOLAR', percentage: 40, purpose: 'Protocol alignment, governance, burn reserves', color: 'bg-primary' },
  { asset: 'ETH', percentage: 15, purpose: 'Gas reserves, blue-chip crypto exposure', color: 'bg-blue-500' },
  { asset: 'RWA Tokens', percentage: 5, purpose: 'Real-world asset yield generation', color: 'bg-yellow-500' },
];

// === SMART CONTRACT PHASES ===
interface ContractFeature {
  name: string;
  description: string;
  status: 'deployed' | 'v2' | 'separate';
  contractMethod?: string;
}

const v1Features: ContractFeature[] = [
  { name: '7% Transfer Tax', description: 'Adjustable via admin function', status: 'deployed', contractMethod: 'setTaxRates(burn, lp, treasury)' },
  { name: '20% Mint Burn', description: 'Built into minting controller', status: 'deployed', contractMethod: 'mint() → burns 20% automatically' },
  { name: 'Tax Exemptions', description: 'Whitelist addresses from transfer tax', status: 'deployed', contractMethod: 'setTaxExempt(address, bool)' },
  { name: 'Rate Adjustments', description: 'Modify burn/LP/treasury splits', status: 'deployed', contractMethod: 'setTaxRates(300, 200, 200)' },
];

const separateContracts: ContractFeature[] = [
  { name: 'Treasury Buyback Contract', description: 'Chainlink-triggered buy-and-burn', status: 'separate', contractMethod: 'executeBuyback(amount)' },
  { name: 'Diamond Hands Staking', description: 'Time-locked staking with USDC yield', status: 'separate', contractMethod: 'stake(amount, duration)' },
  { name: 'LP Manager Contract', description: 'Automates subscription → LP injection', status: 'separate', contractMethod: 'injectLiquidity(usdcAmount)' },
  { name: 'Circuit Breaker (ERC-7265)', description: 'Velocity-based outflow pause', status: 'separate', contractMethod: 'circuitBreakerCheck(amount)' },
];

const v2Features: ContractFeature[] = [
  { name: 'Progressive Sell Tax', description: 'Supply-weighted tax brackets per wallet', status: 'v2', contractMethod: '_calculateProgressiveTax(sellAmount)' },
  { name: 'Anti-Whale Circuit Breaker', description: 'Max single sell = 1% of LP, 4hr cooldown', status: 'v2', contractMethod: 'Requires transfer() modification' },
  { name: 'Dynamic Burn (Oracle)', description: 'Chainlink-driven adaptive burn rates', status: 'v2', contractMethod: 'getMintBurnRate() → oracle lookup' },
];

// === FAILED PROTOCOL LESSONS ===
const failedProtocols = [
  { name: 'Terra/Luna', failure: 'Algorithmic peg backed by nothing — death spiral when UST depegged', lesson: 'Our floor is backed by fiat subscription revenue (USDC), not algorithmic minting' },
  { name: 'Olympus DAO', failure: '95% treasury in own token — when OHM dropped, treasury collapsed too', lesson: '60/40 treasury rule: never hold >40% of treasury in native token' },
  { name: 'Iron Finance', failure: 'No circuit breakers — $2B → $0 in hours from cascading liquidations', lesson: 'ERC-7265 circuit breaker pauses outflows during velocity spikes' },
  { name: 'SafeMoon V1', failure: 'Flat sell tax easily circumvented by splitting transactions', lesson: 'Progressive tax with wallet-level tracking prevents split-sell attacks' },
];

function MechanismCard({ mechanism }: { mechanism: DefenseMechanism }) {
  const [showCode, setShowCode] = useState(false);

  const statusConfig = {
    live: { color: 'bg-green-500/10 text-green-500 border-green-500/30', label: 'Live', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    development: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', label: 'In Dev', icon: <Clock className="h-3 w-3 mr-1" /> },
    planned: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', label: 'Planned', icon: <Target className="h-3 w-3 mr-1" /> },
  };

  const config = statusConfig[mechanism.status];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">{mechanism.icon}</div>
            <div>
              <CardTitle className="text-base">{mechanism.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{mechanism.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={config.color}>
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mechanism.trigger && (
          <div className="flex items-start gap-2 text-xs">
            <Target className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Trigger: </span>
              <span className="font-medium">{mechanism.trigger}</span>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2 text-xs">
          <Activity className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-muted-foreground">Effect: </span>
            <span className="font-medium">{mechanism.effect}</span>
          </div>
        </div>
        {mechanism.details && (
          <div className="pt-2 border-t border-border/50">
            <ul className="space-y-1">
              {mechanism.details.map((detail, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}
        {mechanism.soliditySnippet && (
          <div className="pt-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <Code className="h-3 w-3" />
              {showCode ? 'Hide' : 'Show'} Solidity Reference
            </button>
            {showCode && (
              <pre className="mt-2 p-3 bg-muted rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap border border-border/50">
                {mechanism.soliditySnippet}
              </pre>
            )}
          </div>
        )}
        {mechanism.reference && (
          <p className="text-[10px] text-muted-foreground italic pt-1">
            📚 {mechanism.reference}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TierSection({ 
  tier, 
  title, 
  subtitle, 
  mechanisms, 
  color, 
  icon 
}: { 
  tier: number; 
  title: string; 
  subtitle: string; 
  mechanisms: DefenseMechanism[]; 
  color: string; 
  icon: React.ReactNode;
}) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Tier {tier}: {title}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mechanisms.map((m) => (
          <motion.div key={m.id} variants={fadeIn}>
            <MechanismCard mechanism={m} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function AdminMarketDefenseMechanisms() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getExportData = () => {
    const all = [
      ...tier1Mechanisms.map(m => ({ ...m, tier: 'Tier 1: Critical' })),
      ...tier2Mechanisms.map(m => ({ ...m, tier: 'Tier 2: High Priority' })),
      ...tier3Mechanisms.map(m => ({ ...m, tier: 'Tier 3: Advanced' })),
    ];
    return all.map(m => ({
      tier: m.tier,
      name: m.name,
      description: m.description,
      trigger: m.trigger || 'Always Active',
      effect: m.effect,
      status: m.status,
    }));
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Anti-Crash Defense Framework
            </h1>
          </div>
          <p className="text-muted-foreground">
            Three-tier counter-cyclical protection system — lessons from Terra, Olympus, and Iron Finance
          </p>
        </div>
        <ExportButtons pageTitle="Anti-Crash Defense Framework" getData={getExportData} />
      </motion.div>

      {/* Core Stats Banner */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-destructive/5 border-primary/20">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4">Current Defense Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-3 rounded-lg bg-background/80">
                <p className="text-xl font-bold text-destructive">{formatPercent(MINT_DISTRIBUTION.burn)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Mint Burn</p>
              </div>
              <div className="p-3 rounded-lg bg-background/80">
                <p className="text-xl font-bold text-orange-500">{formatPercent(TRANSFER_TAX.total)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Transfer Tax</p>
              </div>
              <div className="p-3 rounded-lg bg-background/80">
                <p className="text-xl font-bold text-green-500">{formatPercent(SUBSCRIPTION.lpContribution)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Sub → LP</p>
              </div>
              <div className="p-3 rounded-lg bg-background/80">
                <p className="text-xl font-bold text-primary">${PRICES.launchFloor}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Floor Price</p>
              </div>
              <div className="p-3 rounded-lg bg-background/80">
                <p className="text-xl font-bold text-cyan-500">60/40</p>
                <p className="text-[10px] text-muted-foreground uppercase">Treasury Rule</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Failed Protocol Lessons */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Why Others Failed — What We Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {failedProtocols.map((p) => (
                <div key={p.name} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-destructive">☠ {p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.failure}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Our answer: {p.lesson}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* === TIER 1: CRITICAL === */}
      <TierSection
        tier={1}
        title="Critical"
        subtitle="Existential threat defenses — prevents death spirals and flash crashes"
        mechanisms={tier1Mechanisms}
        color="bg-red-500/10"
        icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
      />

      {/* Progressive Sell Tax Detail Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Progressive Sell Tax Brackets (Detail)
            </CardTitle>
            <CardDescription>
              Retail users pay standard 7% — whale dumps face up to 40% friction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-xs">Sell Size (% of Supply)</th>
                    <th className="text-left py-2 px-2 font-semibold text-xs">Approx. Dollar Value</th>
                    <th className="text-center py-2 px-2 font-semibold text-xs">Tax Rate</th>
                    <th className="text-left py-2 px-2 font-semibold text-xs">Tax Split</th>
                    <th className="text-left py-2 px-2 font-semibold text-xs">Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {sellTaxBrackets.map((b, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 px-2 text-xs font-mono">{b.bracket}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{b.dollarExample}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className={
                          i === 0 ? 'text-green-500 border-green-500/30' :
                          i === 1 ? 'text-yellow-500 border-yellow-500/30' :
                          i === 2 ? 'text-orange-500 border-orange-500/30' :
                          'text-red-500 border-red-500/30'
                        }>
                          {b.tax}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-[10px] text-muted-foreground">{b.taxSplit}</td>
                      <td className="py-2 px-2 text-xs">{b.intent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              * Dollar values assume $1B fully diluted market cap. Wallet-level tracking prevents split-sell circumvention via 24-hour rolling window.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* === TIER 2: HIGH PRIORITY === */}
      <TierSection
        tier={2}
        title="High Priority"
        subtitle="Operational resilience — ensures protocol survives prolonged bear markets"
        mechanisms={tier2Mechanisms}
        color="bg-yellow-500/10"
        icon={<ShieldCheck className="h-5 w-5 text-yellow-500" />}
      />

      {/* Treasury Diversification Visual */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-blue-500" />
              Treasury Diversification Target (60/40 Rule)
            </CardTitle>
            <CardDescription>
              Never hold {">"} 40% of treasury in native token — lesson from Olympus DAO collapse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual bar */}
            <div className="flex h-8 rounded-lg overflow-hidden">
              {treasuryAllocation.map((a) => (
                <div
                  key={a.asset}
                  className={`${a.color} flex items-center justify-center`}
                  style={{ width: `${a.percentage}%` }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {a.percentage}%
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {treasuryAllocation.map((a) => (
                <div key={a.asset} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-3 w-3 rounded-full ${a.color}`} />
                    <span className="font-semibold text-sm">{a.asset}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{a.percentage}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.purpose}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                🎯 Key metric: 60% non-$ZSOLAR reserves = 18+ months operational runway even if token drops 90%
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* === TIER 3: ADVANCED === */}
      <TierSection
        tier={3}
        title="Advanced"
        subtitle="Long-term moat — establishes fundamental value floor and adaptive mechanics"
        mechanisms={tier3Mechanisms}
        color="bg-blue-500/10"
        icon={<Layers className="h-5 w-5 text-blue-500" />}
      />

      <Separator />

      {/* Counter-Cyclical Flywheel */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              The Counter-Cyclical Flywheel
            </CardTitle>
            <CardDescription>How all three tiers work together during a crash</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              {[
                { step: 1, icon: <TrendingDown className="h-6 w-6" />, label: 'BTC Crashes', sublabel: 'Market panic', color: 'text-destructive' },
                { step: 2, icon: <Zap className="h-6 w-6" />, label: 'Energy Unaffected', sublabel: 'Solar still produces', color: 'text-primary' },
                { step: 3, icon: <Scale className="h-6 w-6" />, label: 'Taxes Scale Up', sublabel: 'Progressive + dynamic', color: 'text-orange-500' },
                { step: 4, icon: <DollarSign className="h-6 w-6" />, label: 'Revenue Buys Back', sublabel: 'Auto floor defense', color: 'text-green-500' },
                { step: 5, icon: <Shield className="h-6 w-6" />, label: 'Floor Holds', sublabel: 'Price recovers', color: 'text-cyan-500' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className={`p-4 rounded-full bg-muted mb-2 ${item.color}`}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Contract Upgrade Path */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Smart Contract Upgrade Path
            </CardTitle>
            <CardDescription>Phased deployment — no migration required for Tier 1</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* V1 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Rocket className="h-3 w-3 mr-1" /> V1 Deployed
                </Badge>
                <span className="text-sm text-muted-foreground">Live in ZSOLAR.sol</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {v1Features.map((f) => (
                  <div key={f.name} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    {f.contractMethod && (
                      <code className="mt-2 block text-[10px] text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                        {f.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Separate Contracts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  <Package className="h-3 w-3 mr-1" /> Separate Contracts
                </Badge>
                <span className="text-sm text-muted-foreground">Deploy independently (no migration)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {separateContracts.map((f) => (
                  <div key={f.name} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                      <Code className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    </div>
                    {f.contractMethod && (
                      <code className="mt-2 block text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {f.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* V2 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                  <GitBranch className="h-3 w-3 mr-1" /> V2 Upgrade
                </Badge>
                <span className="text-sm text-muted-foreground">Requires token migration</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {v2Features.map((f) => (
                  <div key={f.name} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                      <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    </div>
                    {f.contractMethod && (
                      <code className="mt-2 block text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        {f.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Crypto Winter Resilience Comparison */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="bg-gradient-to-br from-cyan-500/5 via-transparent to-primary/5 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-cyan-500" />
              Crypto Winter Resilience Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold">Scenario</th>
                    <th className="text-center py-3 px-2 font-semibold text-orange-500">Bitcoin</th>
                    <th className="text-center py-3 px-2 font-semibold text-purple-500">Typical Alt</th>
                    <th className="text-center py-3 px-2 font-semibold text-primary">$ZSOLAR</th>
                    <th className="text-center py-3 px-2 font-semibold text-green-500">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { scenario: '30% BTC crash', btc: '-30%', alt: '-50-70%', zsolar: 'Floor Held ✓', why: 'Revenue buybacks + circuit breaker' },
                    { scenario: 'LP depth', btc: 'Drained', alt: 'Rugged', zsolar: '+Growing', why: 'Fiat subscription injection' },
                    { scenario: 'Revenue', btc: 'Fees drop', alt: 'Zero', zsolar: 'Subs continue', why: 'Non-crypto revenue stream' },
                    { scenario: 'Whale dump', btc: 'Cascades', alt: 'Death spiral', zsolar: '40% tax wall', why: 'Progressive sell tax' },
                    { scenario: 'Supply', btc: 'Fixed', alt: 'Unlock dumps', zsolar: 'Accelerated burn', why: 'Dynamic oracle burn' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 px-2 text-muted-foreground text-xs">{row.scenario}</td>
                      <td className="py-2 px-2 text-center text-destructive font-mono text-xs">{row.btc}</td>
                      <td className="py-2 px-2 text-center text-destructive font-mono text-xs">{row.alt}</td>
                      <td className="py-2 px-2 text-center text-green-500 font-semibold text-xs">{row.zsolar}</td>
                      <td className="py-2 px-2 text-center text-xs text-muted-foreground">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Investor Narrative */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Investor Narrative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm italic">
                "$ZSOLAR implements a <span className="font-semibold text-primary">three-tier anti-crash framework</span> informed by the failures of Terra/Luna, Olympus DAO, and Iron Finance:
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-red-500">T1.</span>
                  <span><strong>Existential defense:</strong> Automated buybacks, ERC-7265 circuit breakers, and progressive sell tax (7–40%) prevent flash crashes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-yellow-500">T2.</span>
                  <span><strong>Operational resilience:</strong> 60/40 treasury diversification ensures 18-month runway; real yield staking pays USDC not inflated tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">T3.</span>
                  <span><strong>Fundamental floor:</strong> Chainlink oracle-driven dynamic burns and energy-backed token valuation establish non-speculative price support</span>
                </li>
              </ol>
              <p className="mt-4 text-sm font-medium">
                The result: a utility token that can <span className="text-primary">appreciate during bear markets</span> as 
                fiat revenue injects into LP, burns accelerate, and user activity continues regardless of crypto sentiment."
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
