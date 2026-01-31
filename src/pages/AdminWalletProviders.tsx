import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle,
  DollarSign,
  Users,
  Shield,
  Zap,
  Building2,
  Code,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Clock,
  Wrench
} from "lucide-react";
import { SEO } from "@/components/SEO";

interface WalletProvider {
  name: string;
  logo: string;
  description: string;
  pricing: {
    free: string;
    paid: string;
    enterprise?: string;
  };
  features: {
    emailLogin: boolean;
    socialLogin: boolean;
    smsLogin: boolean;
    gasSponsorship: boolean;
    accountAbstraction: boolean;
    mpcSecurity: boolean;
    crossChain: boolean;
    fiatOnRamp: boolean;
    customBranding: boolean;
    baseSupport: boolean;
  };
  pros: string[];
  cons: string[];
  website: string;
  recommendation: "recommended" | "good" | "consider" | "not-recommended";
}

const providers: WalletProvider[] = [
  {
    name: "Privy",
    logo: "🔐",
    description: "Most popular embedded wallet. Excellent docs, battle-tested at scale. Used by Friend.tech, Zora, and major projects.",
    pricing: {
      free: "500 MAU free",
      paid: "$299/mo (2,500 MAU)",
      enterprise: "Custom pricing"
    },
    features: {
      emailLogin: true,
      socialLogin: true,
      smsLogin: true,
      gasSponsorship: true,
      accountAbstraction: true,
      mpcSecurity: true,
      crossChain: true,
      fiatOnRamp: true,
      customBranding: true,
      baseSupport: true
    },
    pros: [
      "Best developer experience & docs",
      "Battle-tested at massive scale",
      "Strong security (SOC 2 Type II)",
      "Native Base chain support",
      "Built-in gas sponsorship"
    ],
    cons: [
      "Gets expensive at scale ($299/mo+)",
      "Vendor lock-in concerns",
      "Some advanced features require enterprise plan"
    ],
    website: "https://privy.io",
    recommendation: "recommended"
  },
  {
    name: "Thirdweb",
    logo: "🔷",
    description: "Full Web3 development platform with embedded wallets. Great free tier and comprehensive SDK.",
    pricing: {
      free: "Generous free tier",
      paid: "$99/mo (Growth)",
      enterprise: "Custom"
    },
    features: {
      emailLogin: true,
      socialLogin: true,
      smsLogin: true,
      gasSponsorship: true,
      accountAbstraction: true,
      mpcSecurity: true,
      crossChain: true,
      fiatOnRamp: true,
      customBranding: true,
      baseSupport: true
    },
    pros: [
      "Very generous free tier",
      "All-in-one platform (contracts, storage, etc.)",
      "Good documentation",
      "Native account abstraction",
      "Active community"
    ],
    cons: [
      "Less battle-tested than Privy",
      "Platform-centric (may want more than just wallets)",
      "Some complexity in setup"
    ],
    website: "https://thirdweb.com",
    recommendation: "recommended"
  },
  {
    name: "Coinbase Smart Wallet",
    logo: "🔵",
    description: "Free account abstraction wallet from Coinbase. Native Base integration, gasless by design.",
    pricing: {
      free: "Free forever",
      paid: "No paid tiers",
      enterprise: "N/A"
    },
    features: {
      emailLogin: false,
      socialLogin: true,
      smsLogin: false,
      gasSponsorship: true,
      accountAbstraction: true,
      mpcSecurity: false,
      crossChain: false,
      fiatOnRamp: true,
      customBranding: false,
      baseSupport: true
    },
    pros: [
      "Completely FREE",
      "Native Base chain support",
      "Gasless transactions built-in",
      "Coinbase brand trust",
      "Passkey-based security"
    ],
    cons: [
      "Limited customization",
      "Coinbase branding always visible",
      "No email-only login",
      "Base-focused (limited multi-chain)"
    ],
    website: "https://www.coinbase.com/wallet/smart-wallet",
    recommendation: "recommended"
  },
  {
    name: "Dynamic",
    logo: "⚡",
    description: "Enterprise-grade wallet infrastructure. Recently acquired by Fireblocks. Strong compliance focus.",
    pricing: {
      free: "Free tier available",
      paid: "Usage-based",
      enterprise: "Custom"
    },
    features: {
      emailLogin: true,
      socialLogin: true,
      smsLogin: true,
      gasSponsorship: true,
      accountAbstraction: true,
      mpcSecurity: true,
      crossChain: true,
      fiatOnRamp: true,
      customBranding: true,
      baseSupport: true
    },
    pros: [
      "Enterprise-grade (Fireblocks backing)",
      "Strong compliance features",
      "Excellent multi-chain support",
      "Server-side wallets available"
    ],
    cons: [
      "Can be complex for simple use cases",
      "Pricing less transparent",
      "Newer in the embedded wallet space"
    ],
    website: "https://dynamic.xyz",
    recommendation: "good"
  },
  {
    name: "Web3Auth",
    logo: "🌐",
    description: "Mature MPC wallet solution. Acquired by Consensys. Wide social login support.",
    pricing: {
      free: "1,000 MAW free",
      paid: "$0.05/MAW",
      enterprise: "Custom"
    },
    features: {
      emailLogin: true,
      socialLogin: true,
      smsLogin: true,
      gasSponsorship: false,
      accountAbstraction: false,
      mpcSecurity: true,
      crossChain: true,
      fiatOnRamp: false,
      customBranding: true,
      baseSupport: true
    },
    pros: [
      "Mature, battle-tested",
      "Consensys backing",
      "Wide range of social logins",
      "Good free tier"
    ],
    cons: [
      "No built-in gas sponsorship",
      "UI can feel dated",
      "Setup more complex than alternatives"
    ],
    website: "https://web3auth.io",
    recommendation: "good"
  },
  {
    name: "Magic",
    logo: "✨",
    description: "Pioneer in passwordless Web3 login. Simple SDK, focus on ease of use.",
    pricing: {
      free: "1,000 MAW free",
      paid: "$99/mo + $0.04/MAW",
      enterprise: "Custom"
    },
    features: {
      emailLogin: true,
      socialLogin: true,
      smsLogin: true,
      gasSponsorship: false,
      accountAbstraction: false,
      mpcSecurity: true,
      crossChain: true,
      fiatOnRamp: true,
      customBranding: true,
      baseSupport: true
    },
    pros: [
      "Very simple integration",
      "Pioneer in the space",
      "Good developer experience",
      "Wide chain support"
    ],
    cons: [
      "No native gas sponsorship",
      "No account abstraction",
      "Less feature-rich than competitors"
    ],
    website: "https://magic.link",
    recommendation: "consider"
  }
];

interface OfframpProvider {
  name: string;
  description: string;
  countries: string;
  features: string[];
  pricing: string;
  integration: string;
  website: string;
}

const offrampProviders: OfframpProvider[] = [
  {
    name: "MoonPay",
    description: "Leading fiat on/off-ramp. Used by Uniswap, OpenSea, and major wallets.",
    countries: "180+ countries",
    features: ["Bank transfers", "Card payouts", "Apple Pay", "Custom tokens possible"],
    pricing: "~1-2% fee + spread",
    integration: "Widget SDK or API",
    website: "https://moonpay.com"
  },
  {
    name: "Transak",
    description: "Developer-focused on/off-ramp with wide coverage and custom token support.",
    countries: "64+ countries, 136 cryptos",
    features: ["Bank transfer", "Debit card", "SEPA", "Custom token listing available"],
    pricing: "~1-3% fee",
    integration: "Widget or API",
    website: "https://transak.com"
  },
  {
    name: "Ramp Network",
    description: "European-focused ramp with competitive rates and good UX.",
    countries: "150+ countries",
    features: ["Bank transfer", "Card", "Apple Pay", "Open Banking"],
    pricing: "~2-3% fee",
    integration: "Widget SDK",
    website: "https://ramp.network"
  },
  {
    name: "Coinbase Pay",
    description: "Coinbase's embedded payment solution. Seamless for Coinbase users.",
    countries: "100+ countries",
    features: ["Direct Coinbase integration", "Instant transfers", "Low friction"],
    pricing: "Coinbase exchange rates",
    integration: "SDK",
    website: "https://www.coinbase.com/cloud/products/pay-sdk"
  }
];

const buildVsBuyAnalysis = {
  buildYourOwn: {
    title: "Build Your Own Embedded Wallet",
    timeline: "12-24 months",
    cost: "$2-5M+ (team, security audits, infrastructure)",
    complexity: "Extreme",
    requirements: [
      "MPC cryptography expertise (rare, expensive talent)",
      "HSM infrastructure for key storage",
      "SOC 2 Type II certification ($50K-150K)",
      "Penetration testing & security audits ($100K+)",
      "24/7 security monitoring",
      "Regulatory compliance (varies by jurisdiction)",
      "Key recovery & social recovery systems",
      "Multi-chain RPC infrastructure"
    ],
    risks: [
      "Security vulnerabilities = total loss of user funds",
      "Regulatory uncertainty",
      "Ongoing maintenance burden",
      "Liability for any losses"
    ],
    verdict: "NOT RECOMMENDED for startups. This is infrastructure companies build, not apps."
  },
  useProvider: {
    title: "Use Embedded Wallet Provider",
    timeline: "1-2 weeks",
    cost: "$0-500/mo initially, scales with users",
    complexity: "Low",
    benefits: [
      "Battle-tested security",
      "Provider handles compliance",
      "No liability for infrastructure",
      "Instant updates & improvements",
      "Focus on your product, not wallet infra",
      "Enterprise SLAs available"
    ],
    verdict: "RECOMMENDED. Let experts handle wallet security."
  }
};

export default function AdminWalletProviders() {
  const getRecommendationBadge = (rec: WalletProvider["recommendation"]) => {
    switch (rec) {
      case "recommended":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Recommended</Badge>;
      case "good":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Good Option</Badge>;
      case "consider":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Consider</Badge>;
      case "not-recommended":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Not Recommended</Badge>;
    }
  };

  return (
    <>
      <SEO title="Embedded Wallet Research | Admin" />
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            Embedded Wallet Research
          </h1>
          <p className="text-muted-foreground mt-1">
            Comparison of wallet providers, off-ramps, and build vs buy analysis
          </p>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Wallet Providers</TabsTrigger>
            <TabsTrigger value="comparison">Feature Matrix</TabsTrigger>
            <TabsTrigger value="offramps">Cash Out Options</TabsTrigger>
            <TabsTrigger value="build-vs-buy">Build vs Buy</TabsTrigger>
          </TabsList>

          {/* Wallet Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.name} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{provider.logo}</span>
                        {provider.name}
                      </CardTitle>
                      {getRecommendationBadge(provider.recommendation)}
                    </div>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {/* Pricing */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Pricing
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>Free: {provider.pricing.free}</p>
                        <p>Paid: {provider.pricing.paid}</p>
                      </div>
                    </div>

                    {/* Pros */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-green-500">Pros</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {provider.pros.slice(0, 3).map((pro, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Check className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-red-500">Cons</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {provider.cons.slice(0, 2).map((con, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <X className="h-3.5 w-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer">
                        Visit Website <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Feature Comparison Matrix */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Feature Comparison Matrix</CardTitle>
                <CardDescription>Side-by-side feature comparison of all providers</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Feature</TableHead>
                      {providers.map(p => (
                        <TableHead key={p.name} className="text-center min-w-[100px]">
                          {p.logo} {p.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Email Login</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.emailLogin ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Social Login</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.socialLogin ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Gas Sponsorship</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.gasSponsorship ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Account Abstraction</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.accountAbstraction ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MPC Security</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.mpcSecurity ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fiat On-Ramp</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.fiatOnRamp ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Custom Branding</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.customBranding ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Base Chain Support</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center">
                          {p.features.baseSupport ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium">Free Tier</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center text-xs">
                          {p.pricing.free}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium">Paid Tier</TableCell>
                      {providers.map(p => (
                        <TableCell key={p.name} className="text-center text-xs">
                          {p.pricing.paid}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Recommendation for ZenSolar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-3 rounded-lg bg-background border">
                    <div className="font-medium flex items-center gap-2 mb-1">
                      <span className="text-lg">🥇</span> Best Overall: Privy
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Best docs, most battle-tested, native Base support. Worth the $299/mo at scale.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <div className="font-medium flex items-center gap-2 mb-1">
                      <span className="text-lg">🥈</span> Best Free: Coinbase Smart Wallet
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Completely free, native Base, gasless. Limited customization but $0 cost.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <div className="font-medium flex items-center gap-2 mb-1">
                      <span className="text-lg">🥉</span> Best Balance: Thirdweb
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generous free tier, good features, all-in-one platform. Great for startups.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Out / Off-ramps Tab */}
          <TabsContent value="offramps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Cash Out Options (Fiat Off-Ramps)
                </CardTitle>
                <CardDescription>
                  How users can convert $ZSOLAR to fiat currency and withdraw to bank accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* How it works */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      How Cash-Out Would Work
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li><strong>$ZSOLAR → ETH:</strong> User swaps on Uniswap (requires liquidity pool - already planned)</li>
                      <li><strong>ETH → USD/EUR:</strong> Off-ramp provider converts ETH to fiat</li>
                      <li><strong>USD → Bank:</strong> Funds deposited to user's bank account (1-3 days)</li>
                    </ol>
                    <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Prerequisite:</strong> $ZSOLAR must have a Uniswap liquidity pool before users can swap to ETH. 
                          This is already in your roadmap.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Provider comparison */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Coverage</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Integration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offrampProviders.map((provider) => (
                        <TableRow key={provider.name}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-muted-foreground">{provider.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{provider.countries}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {provider.features.slice(0, 2).map((f, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{provider.pricing}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <a href={provider.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Debit Card Option */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Future Option: Crypto Debit Card
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      White-label debit card services (like Stella Pay) let users spend crypto directly via VISA. 
                      Users could spend $ZSOLAR anywhere VISA is accepted.
                    </p>
                    <Badge variant="outline">Series A Feature</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direct $ZSOLAR → BTC/ETH */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  Converting $ZSOLAR to BTC or ETH
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      $ZSOLAR → ETH
                      <Badge className="bg-green-500/10 text-green-500">Easy</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Once the Uniswap V3 liquidity pool is live, users can swap directly on Base. 
                      Could be embedded in-app via Uniswap widgets.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      $ZSOLAR → BTC
                      <Badge className="bg-yellow-500/10 text-yellow-500">Medium</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Requires: $ZSOLAR → ETH → Bridge to BTC chain, or use a CEX. 
                      Cross-chain bridges add complexity and fees.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Build vs Buy Tab */}
          <TabsContent value="build-vs-buy" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Build Your Own */}
              <Card className="border-red-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <Wrench className="h-5 w-5" />
                    {buildVsBuyAnalysis.buildYourOwn.title}
                  </CardTitle>
                  <CardDescription>Building MPC wallet infrastructure from scratch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Timeline</div>
                      <div className="font-medium text-red-500">{buildVsBuyAnalysis.buildYourOwn.timeline}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Cost</div>
                      <div className="font-medium text-red-500">{buildVsBuyAnalysis.buildYourOwn.cost}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Requirements:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {buildVsBuyAnalysis.buildYourOwn.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 text-red-500">Risks:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {buildVsBuyAnalysis.buildYourOwn.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <X className="h-3.5 w-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm font-medium text-red-500">
                      {buildVsBuyAnalysis.buildYourOwn.verdict}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Use Provider */}
              <Card className="border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-500">
                    <Building2 className="h-5 w-5" />
                    {buildVsBuyAnalysis.useProvider.title}
                  </CardTitle>
                  <CardDescription>Using Privy, Thirdweb, or similar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Timeline</div>
                      <div className="font-medium text-green-500">{buildVsBuyAnalysis.useProvider.timeline}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Cost</div>
                      <div className="font-medium text-green-500">{buildVsBuyAnalysis.useProvider.cost}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Benefits:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {buildVsBuyAnalysis.useProvider.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm font-medium text-green-500">
                      {buildVsBuyAnalysis.useProvider.verdict}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Bottom Line</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-medium mb-2">Can we build our own embedded wallet?</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Technically yes, but practically no.</strong> Building secure MPC wallet infrastructure 
                      is a multi-year, multi-million dollar endeavor requiring specialized cryptography expertise. 
                      Companies like Privy, Thirdweb, and Fireblocks have raised $100M+ and employ teams of 50+ 
                      engineers specifically for this. A single security vulnerability could mean total loss of user funds 
                      and complete destruction of trust.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Recommended Path for ZenSolar
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li><strong>Phase 1 (Now):</strong> Integrate Coinbase Smart Wallet (free) or Thirdweb alongside existing MetaMask/Base Wallet options</li>
                      <li><strong>Phase 2 (Post-launch):</strong> Add Privy for premium email-only onboarding experience</li>
                      <li><strong>Phase 3 (With liquidity):</strong> Integrate MoonPay/Transak for fiat off-ramps</li>
                      <li><strong>Phase 4 (Series A):</strong> Consider white-label debit card program</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
