import { ExportButtons } from "@/components/admin/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, FileText, Rocket, Users, Lightbulb, PieChart, HelpCircle } from "lucide-react";

// YC Application data structured for export
const getYCData = () => [
  { section: "Company", question: "Company Name", answer: "ZenSolar" },
  { section: "Company", question: "50 chars or less", answer: "Earn crypto for your clean energy use." },
  { section: "Company", question: "Company URL", answer: "https://zensolar.lovable.app" },
  { section: "Company", question: "Demo Link", answer: "https://zensolar.lovable.app/demo" },
  { section: "Company", question: "Location", answer: "San Francisco Bay Area, California" },
  { section: "Progress", question: "Monthly Burn", answer: "$0/month — fully bootstrapped" },
  { section: "Progress", question: "Revenue", answer: "No revenue yet — free beta phase" },
  { section: "Equity", question: "Shares Outstanding", answer: "Will restructure to C-Corp upon funding (10M authorized)" },
  { section: "Equity", question: "Equity to Non-Founders", answer: "0% on crypto product; old LLC has ~15-20% to advisors (will dissolve)" },
];

export default function AdminYCApplication() {
  return (
    <div className="container max-w-4xl py-8 space-y-8 print:py-4 print:space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">YC Application</h1>
          <p className="text-muted-foreground">Summer 2025 — Complete Q&A Reference</p>
        </div>
        <ExportButtons 
          pageTitle="ZenSolar YC Application" 
          getData={getYCData}
          getFileName={() => `zensolar-yc-application-${new Date().toISOString().split('T')[0]}`}
        />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ZenSolar — YC Application (Summer 2025)</h1>
        <p className="text-sm text-muted-foreground">https://zensolar.lovable.app</p>
      </div>

      {/* Quick Reference Card */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
          <div><span className="font-medium">Company:</span> ZenSolar</div>
          <div><span className="font-medium">URL:</span> zensolar.lovable.app</div>
          <div><span className="font-medium">Tagline:</span> Earn crypto for your clean energy use.</div>
          <div><span className="font-medium">Location:</span> SF Bay Area, CA</div>
          <div className="md:col-span-2"><span className="font-medium">Demo:</span> zensolar.lovable.app/demo</div>
        </CardContent>
      </Card>

      <Separator />

      {/* Founders Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Founders
        </h2>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Who writes code? Who has been building?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>I'm a solo technical founder building with AI-assisted development. I write all code using Lovable (AI coding platform powered by Claude), with Grok (xAI) for strategy/tokenomics and Claude 3.5 Sonnet for code reviews.</p>
            <p>No non-founder has written code. The codebase includes 50+ React components, 20+ Supabase edge functions, and 3 Solidity smart contracts—all built in 9 months while learning blockchain development from scratch. This is my first software product, built entirely with AI tools.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Founder Video (1 min intro)
              <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600"><Clock className="h-3 w-3 mr-1" />To Record</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>60-second intro covering: who I am, 14 years in cleantech (SolarCity/Tesla ecosystem), what ZenSolar does, why now (tax credit phase-out), and what we're building.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Progress Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Progress
        </h2>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How far along are you?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Live beta with 11 users on Base Sepolia testnet. Fully functional integrations with Tesla Fleet API, Enphase Monitoring API, SolarEdge Monitoring API, and Wallbox API for real-time energy data. Smart contracts deployed: $ZSOLAR (ERC-20) and ZenSolarNFT (ERC-1155 with 42 milestone achievement tiers).</p>
            <p>Our patent-pending Mint-on-Proof™ architecture (provisional filed March 2025) enables one-tap minting directly from the app. Users connect their devices in 60 seconds via OAuth, see their real-time energy metrics on a dashboard, and mint tokens/NFTs without needing external wallets or blockchain knowledge.</p>
            <p className="font-medium">Key milestones:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Functional 4-layer gateway architecture (API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge)</li>
              <li>Multi-manufacturer OAuth flows working (Tesla, Enphase, SolarEdge, Wallbox)</li>
              <li>42-tier NFT achievement system with category-specific milestones</li>
              <li>In-app dropshipping store where users can redeem tokens for Tesla gift cards, power stations, and merch</li>
            </ul>
            <p><strong>Next:</strong> Coinbase Smart Wallet integration (embedded wallets for frictionless onboarding), auto-minting subscriptions ($9.99-$19.99/month), and mainnet launch.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How long have founders been working on this?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>9 months</strong> (since April 2024) in its current form as a crypto-rewards platform. However, ZenSolar as a company started in 2018 as a solar sales business. After the residential solar market contracted in 2022-2023, I pivoted to building this product—combining my cleantech domain expertise with the emerging crypto-rewards opportunity.</p>
            <p>The past 9 months have been intensive: learning blockchain development from scratch, building the entire product with AI tools (Lovable, Grok, Claude), deploying smart contracts, and onboarding 11 beta users. I've worked on this full-time, funding development through savings.</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Spend / Runway</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Current burn:</strong> $0/month — fully bootstrapped.</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Hosting: $0 (Lovable Cloud free tier)</li>
                <li>Development: $0 (AI tools, no contractors)</li>
                <li>Marketing: $0 (organic beta signups)</li>
              </ul>
              <p><strong>Runway:</strong> Indefinite at current burn. Seeking $1-2M seed for 18-24 month runway.</p>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Other Investors?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>No.</strong> ZenSolar is 100% bootstrapped. No angel investors, no pre-seed, no SAFEs issued.</p>
              <p className="mt-2">The old LLC (2018) had ~15-20% to advisors for the original solar sales business. That entity will be dissolved upon institutional funding.</p>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Full-time Commitment?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>Yes.</strong> I'm the sole founder and have been working full-time on ZenSolar since April 2024. No other employment or commitments.</p>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>No revenue yet.</strong> Currently in free beta phase on testnet. Monetization begins at mainnet launch with subscription tiers ($9.99-$19.99/month consumer, $99-$499/month commercial).</p>
            </CardContent>
          </Card>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gross Margin Per Transaction</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>Projected 85-90% gross margin</strong> on subscriptions (SaaS-like economics).</p>
            <p className="mt-2">In-app store margins: Tesla gift cards (~5-10%), Branded merch (~40-60%), Hardware (~15-25%).</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Company / Product Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Product
        </h2>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              What is your company going to make?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>ZenSolar is a mobile/web app that rewards solar owners and EV drivers with $ZSOLAR tokens and collectible NFTs for their verified clean energy use.</p>
            
            <p><strong>How it works:</strong> Users connect their Tesla, Enphase, SolarEdge, or Wallbox devices via secure OAuth. Our patent-pending Mint-on-Proof™ technology pulls real-time production data from manufacturer APIs, verifies it cryptographically, and lets users mint blockchain rewards with a single tap—no external wallets or crypto knowledge required.</p>
            
            <p><strong>Key features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Embedded wallet</strong> (coming soon): Sign up with email/Google, wallet auto-created. No seed phrases.</li>
              <li><strong>One-tap minting:</strong> $ZSOLAR tokens and milestone NFTs minted directly to your wallet, gasless.</li>
              <li><strong>In-app store:</strong> Redeem tokens for Tesla gift cards, solar equipment, and branded merch.</li>
              <li><strong>In-app cash-out</strong> (roadmap): Convert $ZSOLAR → USD → bank account.</li>
            </ul>

            <p><strong>Business model:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>$9.99/month (weekly auto-minting) — casual users</li>
              <li>$19.99/month (daily auto-minting) — power users</li>
              <li>$99-$499/month (commercial tier) — solar installers and EV fleet managers</li>
              <li>3.5% transaction fee on all token activity (1.5% burn, 2% treasury)</li>
            </ul>

            <p><strong>The Flywheel Effect:</strong> 50% of subscription revenue is automatically injected into our liquidity pool, creating a self-reinforcing cycle: more subscribers → larger LP → higher token floor price → more valuable rewards → more subscribers. At 25,000 subscribers (our "Tipping Point"), monthly LP injections match our initial seed capital—the protocol becomes self-sustaining.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Frontend:</strong> React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Framer Motion, Recharts, TanStack Query, react-router-dom v7, react-hook-form + Zod.</p>
            <p><strong>Mobile:</strong> Capacitor (iOS/Android), VitePWA with Web Push notifications.</p>
            <p><strong>Backend:</strong> Supabase (PostgreSQL, Auth, Edge Functions, Realtime).</p>
            <p><strong>Blockchain:</strong> Solidity on Base L2, wagmi + viem, Reown AppKit, Coinbase OnchainKit.</p>
            <p><strong>Security:</strong> Cloudflare Turnstile (bot protection), Google Analytics.</p>
            <p><strong>AI Stack:</strong> Lovable (primary development), Grok (strategy), Claude 3.5 Sonnet (reviews).</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Idea Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Idea
        </h2>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why did you pick this idea?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>I chose this idea because the clean energy transition is stalling: the "One Big Beautiful Bill" (signed 2025) phases out the 30% solar ITC and $7,500 EV credits by end of 2026. At the same time, millions of households already own solar panels, EVs, and batteries but lack ongoing motivation to maximize their use.</p>
            <p>ZenSolar fills that gap. But even if tax credits stayed forever—they're one-time acquisition incentives, not retention incentives. They don't reward daily use. <strong>We're the retention layer</strong>—providing the ongoing, compounding rewards that keep users engaged with their clean energy systems for years after installation.</p>
            <p><strong>Domain expertise:</strong> I have 14 years in cleantech—starting at SolarCity pre-IPO (Elon Musk, Chairman) where I worked closely with founders Lyndon and Peter Rive and CRO Toby Corey. That experience ignited my entrepreneurial spirit. I started ZenSolar in 2018 as a solar sales company but pivoted to this product after seeing the crypto-rewards opportunity.</p>
            <p>I also own a home solar + battery system and Tesla EV, so I personally experience the API silos and engagement drop-off this platform solves.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How do you know people need this?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Personal pain point:</strong> I own solar + battery + Tesla EV. After installation, engagement drops to zero—no ongoing reason to check production or optimize usage.</li>
              <li><strong>Beta user feedback (11 users):</strong> Users report checking ZenSolar daily to see their "pending rewards"—something they never did with their manufacturer apps.</li>
              <li><strong>Market signal:</strong> EVearn on VeChain has attracted users despite being EV-only and requiring external wallets.</li>
              <li><strong>Macro trend:</strong> 4M+ US households have solar. 8M+ EVs on US roads. These owners already spent $20-100K on clean energy infrastructure.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What's new about what you're making?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Mint-on-Proof™ (patent-pending):</strong> First system that mints tokens on-demand from verified API data rather than distributing from pre-minted pools.</li>
              <li><strong>Multi-vertical integration:</strong> Competitors focus on single verticals. We capture solar + battery + EV + charging in one dashboard.</li>
              <li><strong>Embedded wallet (coming):</strong> Email signup → auto-wallet → gasless minting → in-app cash-out.</li>
              <li><strong>Flywheel tokenomics:</strong> 50% of subscription revenue auto-injected into liquidity pool.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Competitors</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Direct competitor:</strong> EVearn by VeBetterDAO on VeChain—rewards EV drivers with $B3TR tokens for charging sessions.</p>
            <p><strong>What we understand that they don't:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Multi-vertical:</strong> EVearn rewards only EV charging. We capture the full clean energy stack.</li>
              <li><strong>Mint-on-Proof™:</strong> Our system mints on-demand—no pre-minted pools.</li>
              <li><strong>Embedded wallet:</strong> Competitors require external wallets. We're building frictionless onboarding.</li>
              <li><strong>Timing:</strong> Federal incentives phase out 2025-2026. We become the replacement.</li>
              <li><strong>Commercial tier:</strong> $99-$499/month for B2B—a revenue stream competitors haven't addressed.</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Equity Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Equity
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Shares Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>Structure pending.</strong> Currently operating as ZenSolar LLC (formed 2018). Will restructure to C-Corp (Delaware) upon institutional funding, with standard 10,000,000 authorized shares.</p>
              <p className="mt-2">The existing LLC will be dissolved—the crypto-rewards product is a clean-slate pivot.</p>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Equity to Non-Founders</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>For the crypto-rewards product:</strong> 0% — I own 100% of the product/IP.</p>
              <p className="mt-2"><strong>For the old LLC:</strong> ~15-20% was allocated to advisors for the original solar sales business. Those advisors understand the LLC is dormant and will be dissolved.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Curious Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Something Surprising You've Learned?</h2>

        <Card className="print:shadow-none bg-primary/5">
          <CardContent className="pt-6 text-sm space-y-2">
            <p><strong>The biggest surprise:</strong> Users engage MORE with testnet tokens than I expected.</p>
            <p>I assumed beta users would treat testnet $ZSOLAR as "fake money" with no engagement. Instead, they check the app daily, compete for NFT milestones, and ask when they can "actually sell" their tokens. The gamification layer (pending rewards counter, achievement NFTs, leaderboard potential) drives engagement even without real monetary value.</p>
            <p><strong>The insight:</strong> The token VALUE matters less than the TOKEN ACCUMULATION EXPERIENCE. People want to see numbers go up. This suggests mainnet launch will amplify engagement, not create it—the behavioral loop is already working.</p>
          </CardContent>
        </Card>
      </section>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
        ZenSolar — YC Application (Summer 2025) — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
