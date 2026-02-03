import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { 
  Loader2, 
  Shield,
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

interface DefenseMechanism {
  id: string;
  name: string;
  description: string;
  trigger?: string;
  effect: string;
  status: 'implemented' | 'planned' | 'future';
  icon: React.ReactNode;
  details?: string[];
}

const implementedMechanisms: DefenseMechanism[] = [
  {
    id: 'mint-burn',
    name: '20% Mint Burn',
    description: 'Aggressive deflationary pressure on every token minted',
    effect: 'Permanently removes 20% of all minted tokens from circulation',
    status: 'implemented',
    icon: <Flame className="h-5 w-5 text-destructive" />,
    details: [
      'Automatic on every mint transaction',
      'No admin intervention required',
      'Reduces effective supply growth rate',
      'Creates constant upward price pressure',
    ],
  },
  {
    id: 'transfer-tax',
    name: '7% Transfer Tax',
    description: 'Triple-purpose tax on all token transfers',
    effect: '3% burn + 2% LP + 2% treasury on every transfer',
    status: 'implemented',
    icon: <Coins className="h-5 w-5 text-solar" />,
    details: [
      '3% permanently burned (deflationary)',
      '2% injected into liquidity pool (floor support)',
      '2% to treasury (buyback reserves)',
      'Discourages short-term speculation',
    ],
  },
  {
    id: 'subscription-lp',
    name: 'Subscription LP Injection',
    description: '50% of all subscription revenue flows to liquidity pool',
    effect: 'Continuous USDC injection regardless of crypto market conditions',
    status: 'implemented',
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    details: [
      `$${SUBSCRIPTION.monthlyPrice}/month × 50% = $${(SUBSCRIPTION.monthlyPrice * 0.5).toFixed(2)}/user/month`,
      'Fiat-denominated revenue (not crypto-correlated)',
      'Automatic injection on subscription billing',
      'Creates predictable floor support',
    ],
  },
  {
    id: 'utility-anchor',
    name: 'Real-World Utility Anchor',
    description: 'Token value tied to verified energy production, not speculation',
    effect: 'User activity continues regardless of BTC/ETH price movements',
    status: 'implemented',
    icon: <Zap className="h-5 w-5 text-primary" />,
    details: [
      'Solar panels produce energy regardless of crypto markets',
      'EVs are driven regardless of Bitcoin price',
      'Mint-on-Proof verifies real activity',
      'Creates non-correlated reward flow',
    ],
  },
];

const plannedMechanisms: DefenseMechanism[] = [
  {
    id: 'treasury-buyback',
    name: 'Treasury Buyback Protocol',
    description: 'Automated floor defense using treasury reserves',
    trigger: 'Token drops >15% below $0.10 floor',
    effect: 'Treasury buys and burns tokens from LP to restore floor',
    status: 'planned',
    icon: <Shield className="h-5 w-5 text-primary" />,
    details: [
      'Monitor price via on-chain oracle',
      'Trigger when 7-day average drops >15% below floor',
      'Use treasury USDC to buy $ZSOLAR from LP',
      'Immediately burn purchased tokens',
      'Creates buy pressure + supply reduction simultaneously',
    ],
  },
  {
    id: 'dynamic-burn',
    name: 'Dynamic Burn Amplifier',
    description: 'Increase burn rates during market stress',
    trigger: 'BTC drops >25% in 30 days (crisis mode)',
    effect: 'Temporarily increase mint burn to 30% and transfer burn to 5%',
    status: 'planned',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    details: [
      'Normal: 20% mint burn, 3% transfer burn',
      'Crisis: 30% mint burn, 5% transfer burn',
      'Auto-reverts when BTC recovers to -10% threshold',
      'Accelerates deflation during panic periods',
    ],
  },
  {
    id: 'diamond-hands',
    name: '"Diamond Hands" Staking Rewards',
    description: 'Incentivize holding during volatility',
    trigger: 'User voluntarily locks tokens',
    effect: 'Bonus reward multipliers for locked tokens',
    status: 'planned',
    icon: <Lock className="h-5 w-5 text-cyan-500" />,
    details: [
      '30-day lock = 1.5x reward multiplier',
      '90-day lock = 2.0x reward multiplier',
      '180-day lock = 2.5x reward multiplier',
      'Removes tokens from sell pressure during downturn',
      'Rewards loyalty with enhanced earnings',
    ],
  },
  {
    id: 'lp-surge',
    name: 'Subscription LP Surge',
    description: 'Emergency LP allocation increase',
    trigger: 'Manual admin trigger during crisis',
    effect: 'Temporarily increase LP allocation from 50% to 70%',
    status: 'planned',
    icon: <ArrowUp className="h-5 w-5 text-solar" />,
    details: [
      'Normal: 50% of subscription → LP',
      'Crisis: 70% of subscription → LP',
      'Extra USDC strengthens floor faster',
      'Reduces treasury accumulation temporarily',
    ],
  },
];

const futureMechanisms: DefenseMechanism[] = [
  {
    id: 'utility-acceleration',
    name: 'Utility Acceleration Program',
    description: 'Push users toward spending vs. selling during downturns',
    trigger: 'Token price drops >20%',
    effect: 'Offer 20% bonus store credit for token redemptions',
    status: 'future',
    icon: <ShoppingBag className="h-5 w-5 text-secondary" />,
    details: [
      'Users spend tokens in store instead of selling',
      'Removes tokens from circulation',
      '5% redemption burn still applies',
      'Creates positive feedback loop',
    ],
  },
  {
    id: 'anti-whale',
    name: 'Anti-Whale Circuit Breaker',
    description: 'Prevent coordinated large-scale dumps',
    trigger: 'Single transaction >1% of LP depth',
    effect: 'Transaction blocked or split across cooldown periods',
    status: 'future',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    details: [
      'Max single sell = 1% of LP token balance',
      '4-hour cooldown between large sells from same wallet',
      'Prevents flash crashes from whale dumps',
      'Smart contract level enforcement',
    ],
  },
  {
    id: 'progressive-tax',
    name: 'Progressive Sell Tax',
    description: 'Higher tax on larger sells during volatility',
    trigger: 'Market volatility index exceeds threshold',
    effect: 'Sell tax scales with transaction size',
    status: 'future',
    icon: <TrendingDown className="h-5 w-5 text-destructive" />,
    details: [
      'Base: 7% transfer tax',
      '>$1K sell: +2% additional tax',
      '>$10K sell: +5% additional tax',
      '>$50K sell: +10% additional tax',
      'Only active during high volatility periods',
    ],
  },
];

interface ContractFeature {
  name: string;
  description: string;
  status: 'deployed' | 'v2' | 'separate';
  contractMethod?: string;
}

const v1Features: ContractFeature[] = [
  {
    name: '7% Transfer Tax',
    description: 'Adjustable via admin function',
    status: 'deployed',
    contractMethod: 'setTaxRates(burn, lp, treasury)',
  },
  {
    name: '20% Mint Burn',
    description: 'Built into minting controller',
    status: 'deployed',
    contractMethod: 'mint() → burns 20% automatically',
  },
  {
    name: 'Tax Exemptions',
    description: 'Whitelist addresses from transfer tax',
    status: 'deployed',
    contractMethod: 'setTaxExempt(address, bool)',
  },
  {
    name: 'Rate Adjustments',
    description: 'Modify burn/LP/treasury splits',
    status: 'deployed',
    contractMethod: 'setTaxRates(300, 200, 200)',
  },
];

const v2Features: ContractFeature[] = [
  {
    name: 'Anti-Whale Circuit Breaker',
    description: 'Max single sell = 1% of LP, 4hr cooldown',
    status: 'v2',
    contractMethod: 'Requires transfer() modification',
  },
  {
    name: 'Progressive Sell Tax',
    description: 'Higher tax on larger sells during volatility',
    status: 'v2',
    contractMethod: 'Requires per-wallet tracking',
  },
  {
    name: 'On-Chain Staking',
    description: 'Native lock mechanism with multipliers',
    status: 'v2',
    contractMethod: 'Optional: integrate into V2 token',
  },
];

const separateContracts: ContractFeature[] = [
  {
    name: 'Treasury Buyback Contract',
    description: 'Monitors price, executes buy-and-burn',
    status: 'separate',
    contractMethod: 'executeBuyback(amount)',
  },
  {
    name: 'Staking Contract',
    description: 'Separate contract for token lockups',
    status: 'separate',
    contractMethod: 'stake(amount, duration)',
  },
  {
    name: 'LP Manager Contract',
    description: 'Automates subscription → LP injection',
    status: 'separate',
    contractMethod: 'injectLiquidity(usdcAmount)',
  },
];

function MechanismCard({ mechanism }: { mechanism: DefenseMechanism }) {
  const statusColors = {
    implemented: 'bg-green-500/10 text-green-500 border-green-500/30',
    planned: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    future: 'bg-muted text-muted-foreground border-muted',
  };

  const statusLabels = {
    implemented: 'Live',
    planned: 'In Development',
    future: 'Roadmap',
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {mechanism.icon}
            </div>
            <div>
              <CardTitle className="text-base">{mechanism.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {mechanism.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[mechanism.status]}>
            {mechanism.status === 'implemented' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {mechanism.status === 'planned' && <Clock className="h-3 w-3 mr-1" />}
            {statusLabels[mechanism.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mechanism.trigger && (
          <div className="flex items-start gap-2 text-xs">
            <Target className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Trigger: </span>
              <span>{mechanism.trigger}</span>
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
      </CardContent>
    </Card>
  );
}

export default function AdminMarketDefenseMechanisms() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  // Loading and auth checks
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
    const allMechanisms = [
      ...implementedMechanisms.map(m => ({ ...m, category: 'Implemented' })),
      ...plannedMechanisms.map(m => ({ ...m, category: 'Planned' })),
      ...futureMechanisms.map(m => ({ ...m, category: 'Future' })),
    ];
    
    return allMechanisms.map(m => ({
      category: m.category,
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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Market Defense Mechanisms
            </h1>
          </div>
          <p className="text-muted-foreground">
            Counter-cyclical protections for crypto market downturns
          </p>
        </div>
        <ExportButtons 
          pageTitle="Market Defense Mechanisms" 
          getData={getExportData}
        />
      </motion.div>

      {/* Core Thesis */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-solar/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">
                  Why $ZSOLAR Resists Crypto Winters
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlike speculative tokens tied to market sentiment, $ZSOLAR is anchored to 
                  <span className="text-primary font-medium"> real-world utility</span> and 
                  <span className="text-solar font-medium"> subscription revenue</span>—both 
                  continue regardless of Bitcoin's price.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-background/80">
                    <p className="text-xl font-bold text-destructive">{formatPercent(MINT_DISTRIBUTION.burn)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Mint Burn</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80">
                    <p className="text-xl font-bold text-solar">{formatPercent(TRANSFER_TAX.total)}</p>
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Counter-Cyclical Flywheel Diagram */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              The Counter-Cyclical Flywheel
            </CardTitle>
            <CardDescription>
              How $ZSOLAR maintains stability when crypto markets crash
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              {[
                { step: 1, icon: <TrendingDown className="h-6 w-6" />, label: 'BTC Drops', color: 'text-destructive' },
                { step: 2, icon: <Zap className="h-6 w-6" />, label: 'Solar Still Produces', color: 'text-solar' },
                { step: 3, icon: <Coins className="h-6 w-6" />, label: 'Users Still Earn', color: 'text-primary' },
                { step: 4, icon: <DollarSign className="h-6 w-6" />, label: 'Subs Still Pay', color: 'text-green-500' },
                { step: 5, icon: <Shield className="h-6 w-6" />, label: 'Floor Holds', color: 'text-cyan-500' },
              ].map((item, i) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className={`p-4 rounded-full bg-muted mb-2 ${item.color}`}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {i < 4 && (
                    <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-foreground">Result:</span> While speculative tokens crash with BTC, 
                $ZSOLAR's price floor is maintained by continuous fiat revenue injection—creating a 
                <span className="text-primary font-semibold"> "crypto hedge" narrative</span>.
              </p>
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
            <CardDescription>
              What's deployed at launch vs. what requires V2 upgrade or separate contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* V1 - Deployed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Rocket className="h-3 w-3 mr-1" />
                  V1 Deployed
                </Badge>
                <span className="text-sm text-muted-foreground">Live in ZSOLAR.sol</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {v1Features.map((feature) => (
                  <div key={feature.name} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    {feature.contractMethod && (
                      <code className="mt-2 block text-[10px] text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                        {feature.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Separate Contracts - Post-Launch */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  <Package className="h-3 w-3 mr-1" />
                  Separate Contracts
                </Badge>
                <span className="text-sm text-muted-foreground">Deploy independently post-launch</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {separateContracts.map((feature) => (
                  <div key={feature.name} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Code className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    </div>
                    {feature.contractMethod && (
                      <code className="mt-2 block text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {feature.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* V2 - Future Upgrade */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                  <GitBranch className="h-3 w-3 mr-1" />
                  V2 Upgrade
                </Badge>
                <span className="text-sm text-muted-foreground">Requires token contract upgrade</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {v2Features.map((feature) => (
                  <div key={feature.name} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    </div>
                    {feature.contractMethod && (
                      <code className="mt-2 block text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        {feature.contractMethod}
                      </code>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Note: V2 features require a token migration or proxy upgrade pattern. 
                These should only be considered if market conditions demand stronger protections.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Implemented Mechanisms */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Implemented
          </Badge>
          <h2 className="text-lg font-semibold">Active Defense Mechanisms</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {implementedMechanisms.map((mechanism) => (
            <motion.div key={mechanism.id} variants={fadeIn}>
              <MechanismCard mechanism={mechanism} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Planned Mechanisms */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            In Development
          </Badge>
          <h2 className="text-lg font-semibold">Planned Mechanisms</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plannedMechanisms.map((mechanism) => (
            <motion.div key={mechanism.id} variants={fadeIn}>
              <MechanismCard mechanism={mechanism} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Future Mechanisms */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">
            <Target className="h-3 w-3 mr-1" />
            Future Roadmap
          </Badge>
          <h2 className="text-lg font-semibold">Future Considerations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {futureMechanisms.map((mechanism) => (
            <motion.div key={mechanism.id} variants={fadeIn}>
              <MechanismCard mechanism={mechanism} />
            </motion.div>
          ))}
        </div>
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
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm italic">
                "$ZSOLAR is designed as a <span className="font-semibold text-primary">non-correlated crypto asset</span>. 
                When Bitcoin crashes 50%, our token maintains its floor because:
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Users don't stop driving EVs or producing solar when BTC drops</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Subscription revenue is fiat-denominated and keeps flowing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Our deflationary mechanisms accelerate during stress periods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Treasury buybacks create automated floor defense</span>
                </li>
              </ol>
              <p className="mt-4 text-sm font-medium">
                This makes $ZSOLAR a unique position in any crypto portfolio—a utility token that 
                can actually <span className="text-solar">appreciate during bear markets</span> as 
                users continue earning and the burn mechanics reduce supply."
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
