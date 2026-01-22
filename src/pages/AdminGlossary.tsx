import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { 
  Search, 
  BookOpen, 
  Loader2,
  TrendingUp,
  Coins,
  Shield,
  Users,
  Zap,
  Target,
  Scale,
  DollarSign,
  Flame,
  Lock,
  RefreshCw,
  BarChart3,
  Percent,
  Wallet,
  Globe,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Comprehensive glossary of tokenomics terms
const glossaryTerms = [
  {
    term: "AMM (Automated Market Maker)",
    category: "Liquidity",
    icon: RefreshCw,
    definition: "A decentralized exchange protocol that uses mathematical formulas to price assets. Instead of order books, AMMs use liquidity pools where users trade against the pool's reserves.",
    example: "When you swap $ZSOLAR for USDC, the AMM automatically calculates the exchange rate based on the pool's current reserves using the x*y=k formula."
  },
  {
    term: "Burn Rate",
    category: "Deflation",
    icon: Flame,
    definition: "The percentage of tokens permanently removed from circulation during specific actions. Burns reduce total supply, creating scarcity and upward price pressure over time.",
    example: "$ZSOLAR uses a 20% mint burn—when 1,000 tokens are minted, 200 are immediately burned, so only 800 enter circulation."
  },
  {
    term: "CAC (Customer Acquisition Cost)",
    category: "Business",
    icon: DollarSign,
    definition: "The total cost to acquire a new paying customer, including marketing, sales, and onboarding expenses. A key metric for evaluating business sustainability.",
    example: "If ZenSolar spends $50,000 on marketing and acquires 1,000 users, the CAC is $50 per user."
  },
  {
    term: "Deflation Mechanics",
    category: "Deflation",
    icon: TrendingUp,
    definition: "Economic mechanisms that reduce token supply over time, including burns, buybacks, and lockups. These create scarcity and support price appreciation.",
    example: "$ZSOLAR combines 20% mint burns + 3% permanent burns on transfers to continuously reduce circulating supply."
  },
  {
    term: "Flywheel Effect",
    category: "Growth",
    icon: RefreshCw,
    definition: "A self-reinforcing cycle where each component feeds into the next, creating compounding growth. In tokenomics, more users → more subscriptions → deeper liquidity → higher price → more users.",
    example: "At 25,000 subscribers, monthly LP injections ($125K) equal the initial seed, creating a self-sustaining economic engine."
  },
  {
    term: "Fresh Start Model",
    category: "Issuance",
    icon: Zap,
    definition: "A token issuance strategy where user baselines are captured at the moment of connection, and rewards are calculated only for new activity post-connection. Prevents historical data dumps.",
    example: "A user with 50,000 lifetime kWh joins ZenSolar—their baseline is set at 50,000, and they only earn tokens for kWh produced after joining."
  },
  {
    term: "Initial LP Seed",
    category: "Liquidity",
    icon: Wallet,
    definition: "The starting capital deposited into a liquidity pool at launch to enable trading. Determines the initial price floor and trading depth.",
    example: "$ZSOLAR launches with a $300K USDC + 3M token LP seed, establishing a $0.10 price floor."
  },
  {
    term: "LP Coverage Ratio",
    category: "Sustainability",
    icon: Shield,
    definition: "The ratio of liquidity pool inflows (subscriptions, fees) to expected sell pressure outflows. A ratio above 1.0 indicates sustainable tokenomics.",
    example: "If monthly LP injections are $125K and expected sell volume is $100K, the LP Coverage Ratio is 1.25 (healthy)."
  },
  {
    term: "LTV (Lifetime Value)",
    category: "Business",
    icon: BarChart3,
    definition: "The total revenue a customer generates over their entire relationship with the business. LTV:CAC ratio measures unit economics sustainability.",
    example: "A subscriber paying $9.99/month for 24 months has an LTV of ~$240. With $50 CAC, the LTV:CAC ratio is 4.8x (excellent)."
  },
  {
    term: "Liquidity Pool (LP)",
    category: "Liquidity",
    icon: Scale,
    definition: "A smart contract holding paired assets (e.g., $ZSOLAR + USDC) that enables decentralized trading. Users can swap between the two assets at prices determined by the pool ratio.",
    example: "The $ZSOLAR/USDC LP contains 3M tokens and 300K USDC. As users buy tokens, USDC increases and tokens decrease, raising the price."
  },
  {
    term: "Max Supply",
    category: "Supply",
    icon: Coins,
    definition: "The hard-coded maximum number of tokens that can ever exist. Creates a scarcity ceiling that supports long-term value appreciation.",
    example: "$ZSOLAR has a 10 billion max supply—once reached, no new tokens can ever be minted."
  },
  {
    term: "Mint Burn",
    category: "Deflation",
    icon: Flame,
    definition: "A percentage of newly minted tokens that are immediately burned upon creation. Reduces net issuance and creates deflationary pressure from day one.",
    example: "With 20% mint burn, minting 1,000 tokens only adds 800 to circulation—200 are burned permanently."
  },
  {
    term: "MOAT (Economic Moat)",
    category: "Strategy",
    icon: Shield,
    definition: "Sustainable competitive advantages that protect a business from competitors. In crypto, this includes network effects, data moats, and technical defensibility.",
    example: "ZenSolar's moat: First-mover in energy-to-blockchain verification, proprietary device integrations, and utility-backed tokenomics."
  },
  {
    term: "Price Floor",
    category: "Liquidity",
    icon: TrendingUp,
    definition: "The minimum sustainable token price based on liquidity pool depth and economic fundamentals. Can be maintained through deep liquidity and continuous LP injections.",
    example: "With $300K USDC in the LP, the $0.10 price floor is maintained as long as sell pressure doesn't exceed liquidity depth."
  },
  {
    term: "Protocol-Owned Liquidity (POL)",
    category: "Liquidity",
    icon: Lock,
    definition: "Liquidity that is owned by the protocol itself rather than external LPs. Provides permanent, stable liquidity that cannot be withdrawn during market stress.",
    example: "50% of $9.99 subscriptions flow into POL, building an ever-growing liquidity base that the protocol controls."
  },
  {
    term: "RLS (Row Level Security)",
    category: "Technical",
    icon: Shield,
    definition: "Database-level security policies that control which rows users can access. Essential for protecting user data in multi-tenant applications.",
    example: "RLS ensures users can only see their own energy data and wallet connections—not other users' information."
  },
  {
    term: "Revenue-Backed Token",
    category: "Tokenomics",
    icon: DollarSign,
    definition: "A token whose value is supported by real business revenue flowing into its liquidity. Unlike purely speculative tokens, revenue backing creates fundamental value.",
    example: "$ZSOLAR is backed by $9.99/month subscriptions—50% goes to LP, creating continuous buy pressure and price support."
  },
  {
    term: "SAFT (Simple Agreement for Future Tokens)",
    category: "Fundraising",
    icon: Scale,
    definition: "An investment contract used in token sales where investors receive rights to tokens upon network launch rather than immediate delivery. Common for pre-launch fundraising.",
    example: "Pre-seed investors sign SAFTs for $ZSOLAR at $0.05, receiving tokens at $0.10 launch (2x discount for early risk)."
  },
  {
    term: "Sell Pressure",
    category: "Market",
    icon: TrendingUp,
    definition: "The volume of tokens being sold on the market, which pushes prices down. Must be balanced by buy pressure and liquidity to maintain price stability.",
    example: "If 20% of users sell 50% of their tokens monthly, that's 10% net sell pressure the LP must absorb."
  },
  {
    term: "Slippage",
    category: "Trading",
    icon: Percent,
    definition: "The difference between expected and actual trade prices due to price movement during execution. Higher slippage occurs with larger trades or thin liquidity.",
    example: "A $10K sell in a $100K LP might experience 9% slippage—the trader receives less than the quoted price."
  },
  {
    term: "Subscription Flywheel",
    category: "Revenue",
    icon: RefreshCw,
    definition: "The mechanism where subscription revenue continuously flows into the liquidity pool, creating an ever-deepening price floor and sustainable economics.",
    example: "25,000 subscribers × $5/month to LP = $125,000/month in continuous LP injections."
  },
  {
    term: "TAM (Total Addressable Market)",
    category: "Business",
    icon: Globe,
    definition: "The total market demand for a product or service. Represents the maximum revenue opportunity if 100% market share is achieved.",
    example: "Clean energy rewards TAM: 150M+ US households × $120/year = $18B+ annual market opportunity."
  },
  {
    term: "Tipping Point",
    category: "Growth",
    icon: Target,
    definition: "The subscriber count where monthly LP injections equal or exceed the initial LP seed, creating self-sustaining economics. A critical milestone for long-term viability.",
    example: "At 25,000 subscribers ($125K/month), ZenSolar reaches the tipping point—the flywheel becomes self-reinforcing."
  },
  {
    term: "Token Velocity",
    category: "Economics",
    icon: Zap,
    definition: "How quickly tokens change hands in the economy. High velocity (frequent selling) can suppress prices; low velocity (holding) supports appreciation.",
    example: "Burns and staking reduce velocity by removing tokens from active circulation, supporting price stability."
  },
  {
    term: "Transfer Tax",
    category: "Deflation",
    icon: Percent,
    definition: "A percentage fee charged on token transfers or sales. Typically split between burns, LP injections, and treasury to create deflationary pressure.",
    example: "$ZSOLAR's 7% transfer tax: 3% permanent burn, 2% to LP, 2% to treasury—every trade strengthens the ecosystem."
  },
  {
    term: "Treasury",
    category: "Governance",
    icon: Wallet,
    definition: "Protocol-controlled funds used for development, marketing, partnerships, and ecosystem growth. Often funded by transfer taxes and initial token allocations.",
    example: "2% of every $ZSOLAR transfer goes to treasury for development costs and strategic partnerships."
  },
  {
    term: "TVL (Total Value Locked)",
    category: "DeFi",
    icon: Lock,
    definition: "The total value of assets deposited in a DeFi protocol or liquidity pool. A key metric for measuring protocol health and user trust.",
    example: "$ZSOLAR's TVL includes LP value + staked tokens + treasury = total ecosystem value."
  },
  {
    term: "Unit Economics",
    category: "Business",
    icon: BarChart3,
    definition: "The direct revenues and costs associated with a single unit (user, transaction, etc.). Positive unit economics mean each new user is profitable.",
    example: "If CAC is $50 and LTV is $240, each new subscriber generates $190 profit over their lifetime."
  },
  {
    term: "Utility Token",
    category: "Tokenomics",
    icon: Award,
    definition: "A token that provides access to a product or service rather than representing ownership or investment. Utility tokens have functional use cases within their ecosystem.",
    example: "$ZSOLAR is a utility token—required for on-chain minting, NFT claims, and premium feature access."
  },
  {
    term: "Vesting Schedule",
    category: "Distribution",
    icon: Lock,
    definition: "A time-based release schedule for tokens, preventing immediate selling and aligning holder incentives with long-term project success.",
    example: "Team tokens vest over 4 years with 1-year cliff—no tokens accessible for 12 months, then monthly releases."
  },
  {
    term: "x*y=k (Constant Product)",
    category: "AMM",
    icon: Scale,
    definition: "The mathematical formula underlying most AMMs where the product of token reserves must remain constant. Determines how prices change with trades.",
    example: "If LP has 1M $ZSOLAR × 100K USDC = 100B constant. Buying tokens reduces supply, raising price to maintain k."
  }
];

const categories = [...new Set(glossaryTerms.map(t => t.category))].sort();

export default function AdminGlossary() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch = 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.example.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || term.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (authLoading || adminLoading) {
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Tokenomics Glossary
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive reference for all $ZSOLAR tokenomics terms, concepts, and mechanisms
          </p>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search terms, definitions, or examples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => setSelectedCategory(null)}
                >
                  All ({glossaryTerms.length})
                </Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTerms.length} of {glossaryTerms.length} terms
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Glossary Grid */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTerms.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-l-primary/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{item.term}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.definition}
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 border-l-2 border-secondary">
                        <p className="text-xs font-medium text-secondary mb-1">Example:</p>
                        <p className="text-xs text-muted-foreground italic">
                          {item.example}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Empty State */}
        {filteredTerms.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No terms found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
