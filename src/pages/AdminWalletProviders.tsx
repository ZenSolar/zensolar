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
  Wrench,
  Mail,
  Smartphone,
  Sun,
  Gift,
  Image,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Download
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

        <Tabs defaultValue="user-experience" className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto gap-1 h-auto p-1">
            <TabsTrigger value="user-experience" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">UX Flow</TabsTrigger>
            <TabsTrigger value="providers" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Providers</TabsTrigger>
            <TabsTrigger value="comparison" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Features</TabsTrigger>
            <TabsTrigger value="offramps" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Cash Out</TabsTrigger>
            <TabsTrigger value="build-vs-buy" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Build vs Buy</TabsTrigger>
          </TabsList>

          {/* User Experience Flow Tab */}
          <TabsContent value="user-experience" className="space-y-6">
            {/* Hero */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Customer Experience with Embedded Wallet
                </CardTitle>
                <CardDescription>
                  How a typical user would experience ZenSolar with Coinbase Smart Wallet or Privy integration
                </CardDescription>
              </CardHeader>
            </Card>

            {/* User Journey Steps */}
            <div className="space-y-4">
              {/* Step 1: Signup */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
                    <div>
                      <CardTitle className="text-lg">Sign Up (No Wallet Needed)</CardTitle>
                      <CardDescription>User creates account with familiar methods</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* What user sees */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">What the user sees:</h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="text-center space-y-4">
                          <div className="text-2xl font-bold">Welcome to ZenSolar ☀️</div>
                          <p className="text-sm text-muted-foreground">Start earning rewards for your solar energy</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                              <Mail className="h-5 w-5 text-primary" />
                              <span>Continue with Email</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                              <span>Continue with Google</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer">
                              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                              <span>Continue with Apple</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* What happens behind the scenes */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Behind the scenes:</h4>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                          <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            Crypto wallet created automatically
                          </div>
                          <p className="text-muted-foreground mt-1 ml-6">No seed phrase, no MetaMask, no extension</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                          <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            Wallet secured by passkey/biometrics
                          </div>
                          <p className="text-muted-foreground mt-1 ml-6">Face ID, Touch ID, or device PIN</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                          <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            User owns their wallet (non-custodial)
                          </div>
                          <p className="text-muted-foreground mt-1 ml-6">We never have access to their funds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Connect Solar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-solar flex items-center justify-center text-white font-bold">2</div>
                    <div>
                      <CardTitle className="text-lg">Connect Solar System</CardTitle>
                      <CardDescription>User links their Enphase, Tesla, or SolarEdge account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">What the user sees:</h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                            <Sun className="h-6 w-6 text-solar" />
                            <div className="flex-1">
                              <div className="font-medium">Enphase</div>
                              <div className="text-xs text-muted-foreground">Connect your system</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                            <Sun className="h-6 w-6 text-solar" />
                            <div className="flex-1">
                              <div className="font-medium">Tesla Solar</div>
                              <div className="text-xs text-muted-foreground">Connect your system</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">User experience:</h4>
                      <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
                        <p>• OAuth login to their solar provider</p>
                        <p>• We pull production data automatically</p>
                        <p>• No manual data entry ever needed</p>
                        <p>• Works exactly like connecting Spotify to other apps</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Earn Rewards */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-token flex items-center justify-center text-white font-bold">3</div>
                    <div>
                      <CardTitle className="text-lg">Earn $ZSOLAR Automatically</CardTitle>
                      <CardDescription>Tokens minted to their wallet as they produce solar energy</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">What the user sees:</h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-token">2,450 ZSOLAR</div>
                            <div className="text-sm text-muted-foreground">Your balance</div>
                          </div>
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                            <Gift className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="text-sm font-medium">+125 ZSOLAR earned today!</div>
                              <div className="text-xs text-muted-foreground">From 15.2 kWh solar production</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Behind the scenes:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 font-medium">
                            <Zap className="h-4 w-4 text-primary" />
                            Gasless transactions
                          </div>
                          <p className="text-muted-foreground mt-1">We sponsor all gas fees—user pays $0</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 font-medium">
                            <Shield className="h-4 w-4 text-primary" />
                            Real blockchain tokens
                          </div>
                          <p className="text-muted-foreground mt-1">Tokens are on Base—user truly owns them</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4: Collect NFTs */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-energy flex items-center justify-center text-white font-bold">4</div>
                    <div>
                      <CardTitle className="text-lg">Collect Milestone NFTs</CardTitle>
                      <CardDescription>Unlock achievement NFTs as they reach energy milestones</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">What the user sees:</h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-solar to-energy flex items-center justify-center">
                              <Image className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <div className="font-bold">SunSpark ☀️</div>
                              <div className="text-sm text-muted-foreground">100 kWh milestone</div>
                              <Badge className="mt-1 bg-green-500/10 text-green-500 text-xs">Claimed!</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 opacity-60">
                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-bold">Photonic 🌟</div>
                              <div className="text-sm text-muted-foreground">500 kWh milestone</div>
                              <div className="text-xs text-muted-foreground mt-1">350/500 kWh progress</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">User experience:</h4>
                      <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
                        <p>• One-tap claim when milestone unlocked</p>
                        <p>• NFT appears in their collection instantly</p>
                        <p>• No gas fees, no wallet popups</p>
                        <p>• Can view NFTs in any wallet (OpenSea, etc.)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 5: Cash Out */}
              <Card className="border-green-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-eco flex items-center justify-center text-white font-bold">5</div>
                    <div>
                      <CardTitle className="text-lg">Cash Out to Bank (Future)</CardTitle>
                      <CardDescription>Convert $ZSOLAR to USD and withdraw to bank account — <span className="text-green-500 font-medium">100% in-app</span></CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">What the user sees (never leaves ZenSolar app):</h4>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">Cash Out</div>
                            <div className="text-sm text-muted-foreground">Convert ZSOLAR to USD</div>
                          </div>
                          <div className="p-3 rounded-lg border bg-background">
                            <div className="text-sm text-muted-foreground mb-1">You're converting</div>
                            <div className="text-xl font-bold">1,000 ZSOLAR</div>
                          </div>
                          <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground" />
                          <div className="p-3 rounded-lg border bg-background">
                            <div className="text-sm text-muted-foreground mb-1">You'll receive</div>
                            <div className="text-xl font-bold text-eco">~$24.50 USD</div>
                          </div>
                          <div className="p-2 rounded bg-muted text-xs text-center text-muted-foreground">
                            Deposited to Chase Bank ****1234 in 1-2 business days
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Behind the scenes (invisible to user):</h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 rounded-lg border flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                          <div>
                            <div className="font-medium">ZSOLAR → ETH</div>
                            <div className="text-muted-foreground">Automatic swap via Uniswap (embedded)</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                          <div>
                            <div className="font-medium">ETH → USD</div>
                            <div className="text-muted-foreground">Off-ramp via MoonPay widget (embedded in ZenSolar)</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                          <div>
                            <div className="font-medium">USD → Bank</div>
                            <div className="text-muted-foreground">ACH/wire to linked bank account</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Critical clarification */}
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-sm space-y-2">
                        <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          User NEVER leaves ZenSolar
                        </div>
                        <ul className="text-muted-foreground ml-6 space-y-1">
                          <li>• MoonPay/Transak provide embedded widget SDKs</li>
                          <li>• Widget appears as modal inside our app</li>
                          <li>• Bank linking happens within the widget</li>
                          <li>• One-time KYC (like Venmo/Cash App)</li>
                          <li>• All branded with ZenSolar UI</li>
                        </ul>
                      </div>
                      
                      <Badge variant="outline" className="mt-2">Requires Uniswap LP (post-launch)</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison: Today vs Embedded */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Experience vs. Embedded Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Current */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-red-500">
                      <X className="h-4 w-4" />
                      Current: External Wallets
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        1. Download MetaMask extension/app
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        2. Write down 12-word seed phrase
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        3. Understand what "networks" are
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        4. Add Base Sepolia network manually
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        5. Approve every transaction in popup
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-muted-foreground">
                        6. Need ETH for gas fees
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                      <span className="font-medium text-red-500">Result:</span> 90%+ of non-crypto users abandon
                    </div>
                  </div>

                  {/* Embedded */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-green-500">
                      <Check className="h-4 w-4" />
                      Embedded Wallet Experience
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-muted-foreground">
                        1. Sign up with email or Google ✨
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-muted-foreground">
                        2. Connect solar system
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-muted-foreground">
                        3. Start earning automatically
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-muted-foreground opacity-30">
                        (no more steps)
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                      <span className="font-medium text-green-500">Result:</span> Same onboarding as Spotify or Venmo
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Recommended Implementation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🔵</span>
                      <h4 className="font-medium">Phase 1: Coinbase Smart Wallet</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Free forever (no monthly costs)</li>
                      <li>• Native Base chain support</li>
                      <li>• Gasless transactions built-in</li>
                      <li>• Add alongside existing MetaMask option</li>
                    </ul>
                    <Badge className="mt-3 bg-green-500/10 text-green-500">Start Here</Badge>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🔐</span>
                      <h4 className="font-medium">Phase 2: Privy (Scale)</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Add when approaching 500+ MAU</li>
                      <li>• Email-only login option</li>
                      <li>• Full customization & branding</li>
                      <li>• Enterprise features as needed</li>
                    </ul>
                    <Badge variant="outline" className="mt-3">Growth Phase</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
