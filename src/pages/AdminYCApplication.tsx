import { ExportButtons } from "@/components/admin/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, FileText, Rocket, Users, Lightbulb, PieChart, HelpCircle, Shield, Heart } from "lucide-react";

// YC Application data structured for export
const getYCData = () => [
  { section: "Company", question: "Company Name", answer: "ZenSolar" },
  { section: "Company", question: "50 chars or less", answer: "Your clean energy earns you real money." },
  { section: "Company", question: "Company URL", answer: "https://beta.zen.solar" },
  { section: "Company", question: "Location", answer: "Austin, USA / Austin, USA" },
  { section: "Progress", question: "Monthly Burn", answer: "$0/month — fully bootstrapped" },
  { section: "Progress", question: "Revenue", answer: "No revenue yet — free beta phase" },
];

export default function AdminYCApplication() {
  return (
    <div className="container max-w-4xl py-8 space-y-8 print:py-4 print:space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">YC Application</h1>
          <p className="text-muted-foreground">Spring 2026 — Complete Q&A Reference</p>
        </div>
        <ExportButtons 
          pageTitle="ZenSolar YC Application" 
          getData={getYCData}
          getFileName={() => `zensolar-yc-application-${new Date().toISOString().split('T')[0]}`}
        />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ZenSolar — YC Application (Spring 2026)</h1>
        <p className="text-sm text-muted-foreground">https://beta.zen.solar</p>
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
          <div><span className="font-medium">URL:</span> beta.zen.solar</div>
          <div><span className="font-medium">Tagline:</span> Your clean energy earns you real money.</div>
          <div><span className="font-medium">Location:</span> Austin, USA</div>
          <div><span className="font-medium">Batch:</span> Spring 2026</div>
          <div><span className="font-medium">Category:</span> Crypto / Blockchain</div>
        </CardContent>
      </Card>

      {/* IP Protection Summary */}
      <Card className="print:shadow-none border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Intellectual Property Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-600">Patent</Badge>
              <span>Provisional filed March 2025 — Energy-to-blockchain verification system</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500 text-amber-600">Trademark</Badge>
              <span><strong>Mint-on-Proof™</strong> — Application pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500 text-amber-600">Trademark</Badge>
              <span><strong>SEGI™</strong> (Software-Enabled Gateway Interface) — Application pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-500 text-blue-600">Trade Secret</Badge>
              <span>Proprietary verification algorithms &amp; scoring logic</span>
            </div>
          </div>
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
              Who writes code, or does other technical work on your product? Was any of it done by a non-founder? Please explain.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>I'm a solo technical founder building with AI-assisted development. I write all code using Lovable (AI coding platform powered by Claude), with Grok (xAI) for strategy/tokenomics and Claude 3.5 Sonnet for code reviews. No non-founder has written code.</p>
            <p>The codebase includes 50+ React components, 20+ Supabase edge functions, and 3 Solidity smart contracts—all built in ~6 months while learning blockchain development from scratch. I've poured thousands of hours into understanding every line of code because I believe deeply that the details matter when you're building something that will handle real people's money and trust.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Are you looking for a cofounder?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Yes—specifically a technical cofounder with blockchain/Web3 experience. Ideally someone who shares my obsession with user experience and can own smart contract security, embedded wallet integration, and mainnet deployment while I focus on product, growth, and partnerships.</p>
            <p>I've learned that building alone can be lonely, and I'm genuinely excited about finding someone who complements my strengths and challenges my assumptions. The best products come from healthy tension between perspectives.</p>
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
            <p>60-second intro covering: who I am, my cleantech journey (SolarCity/Tesla ecosystem), what ZenSolar does, why this moment matters (tax credit phase-out), and the vision for where we're going.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Company Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Company
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Company name</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">ZenSolar</p>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Company URL</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">https://beta.zen.solar</p>
            </CardContent>
          </Card>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Describe what your company does in 50 characters or less.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-primary">"Your clean energy earns you real money." (41 chars)</p>
            <p className="text-muted-foreground text-xs mt-2">Alt: "Get paid for your solar and EV usage." (40 chars)</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              What is your company going to make? Please describe your product and what it does or will do.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>ZenSolar is a mobile/web app that rewards solar owners and EV drivers with $ZSOLAR tokens and collectible NFTs for their verified clean energy use. We're building the financial incentive layer that the clean energy transition desperately needs.</p>
            
            <p><strong>How it works:</strong> Users connect their Tesla, Enphase, SolarEdge, or Wallbox devices via secure OAuth. Our patent-pending <strong>Mint-on-Proof™</strong> technology—powered by our <strong>SEGI™</strong> (Software-Enabled Gateway Interface) architecture—pulls real-time production data from manufacturer APIs, verifies it cryptographically, and lets users mint blockchain rewards with a single tap.</p>
            
            <div>
              <p className="font-medium mb-1">What makes us different:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Zero external apps:</strong> Users never leave ZenSolar—wallet creation, minting, redemption, and cash-out all happen in-app.</li>
                <li><strong>Embedded wallet (Coinbase Smart Wallet):</strong> Sign up with email/Google, wallet auto-created. No seed phrases, no MetaMask, no browser extensions. Users don't even know they're using blockchain.</li>
                <li><strong>One-tap minting:</strong> $ZSOLAR tokens and milestone NFTs minted directly to your wallet, gasless.</li>
                <li><strong>In-app cash-out:</strong> Convert $ZSOLAR → USD → bank account without leaving the app—KYC and bank linking handled via embedded widget.</li>
                <li><strong>In-app store:</strong> Redeem tokens for Tesla gift cards, solar equipment, and branded merch.</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">IP Protection:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li><strong>Patent:</strong> Provisional filed March 2025 — Energy-to-blockchain verification system</li>
                <li><strong>Trademarks (pending):</strong> Mint-on-Proof™, SEGI™ (Software-Enabled Gateway Interface)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Where do you live now, and where would the company be based after YC?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">Austin, USA / Austin, USA</p>
            <p className="text-muted-foreground mt-1">Austin has become a hub for both cleantech and crypto innovation. The ecosystem here feels right—ambitious but grounded, technical but accessible.</p>
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
          <CardContent className="text-sm space-y-3">
            <p>Live beta with 19 users on Base Sepolia testnet. Fully functional integrations with Tesla Fleet API, Enphase Monitoring API, SolarEdge Monitoring API, and Wallbox API for real-time energy data.</p>
            
            <div>
              <p className="font-medium mb-1">Smart Contracts Deployed:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>$ZSOLAR (ERC-20) with built-in 7% transfer tax (3% burn, 2% LP, 2% treasury)</li>
                <li>ZenSolarNFT (ERC-1155) with 42 milestone achievement tiers across 5 categories</li>
              </ul>
            </div>

            <p>Our <strong>Mint-on-Proof™</strong> (trademark pending) architecture—built on our <strong>SEGI™</strong> (Software-Enabled Gateway Interface, trademark pending)—enables one-tap minting directly from the app. Patent provisional filed March 2025. Users connect their devices in 60 seconds via OAuth, see their real-time energy metrics on a dashboard, and mint tokens/NFTs without needing external wallets or blockchain knowledge.</p>
            
            <div>
              <p className="font-medium mb-1">Key milestones completed:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>4-layer SEGI gateway architecture (API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge)</li>
                <li>Multi-manufacturer OAuth flows (Tesla, Enphase, SolarEdge, Wallbox)</li>
                <li>42-tier NFT achievement system with category-specific milestones</li>
                <li>Coinbase Smart Wallet integration—users sign up with email, wallet auto-created, zero crypto friction</li>
                <li>In-app cash-out flow—convert $ZSOLAR to USD via embedded fiat off-ramp, directly to bank account</li>
                <li>In-app dropshipping store for token redemption</li>
                <li>Auto-minting subscription infrastructure ($9.99-$19.99/month)</li>
              </ul>
            </div>
            <p><strong>Next:</strong> Mainnet launch on Base L2.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How long have each of you been working on this? How much of that has been full-time? Please explain.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>I've been working on ZenSolar full-time since March 2025 (~6 months). Solo founder at this stage.</p>
            <p>This has been the most intellectually challenging and emotionally rewarding work of my career. Every day I'm learning something new—blockchain architecture, tokenomics design, smart contract security—while staying grounded in what I know well: clean energy systems and user experience.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              What tech stack are you using, or planning to use, to build this product? Include AI models and AI coding tools you use.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Frontend:</strong> React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Framer Motion, Recharts, TanStack Query, react-router-dom, react-hook-form + Zod.</p>
            <p><strong>Mobile:</strong> Capacitor (iOS/Android), VitePWA with Web Push notifications.</p>
            <p><strong>Backend:</strong> Supabase (PostgreSQL, Auth, Edge Functions, Realtime).</p>
            <p><strong>Blockchain:</strong> Solidity on Base L2, wagmi + viem, Reown AppKit, Coinbase OnchainKit (Smart Wallet).</p>
            <p><strong>AI Stack:</strong> Lovable (primary development), Grok (strategy/tokenomics), Claude 3.5 Sonnet (code reviews).</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How many active users or customers do you have? How many are paying? Who is paying you the most, and how much do they pay you?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>19 active users providing feedback during our testnet beta. None are paying yet—we're in free beta to validate the core experience before monetization.</p>
            <p>What's encouraging: every single user has said they would pay on mainnet launch. And they're checking the app daily to see "pending rewards"—engagement behavior we've never seen with the manufacturer apps they were using before.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Do you have revenue?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> Currently in free beta phase on testnet. Monetization begins at mainnet launch with subscription tiers:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>$9.99/month — Weekly auto-minting (casual users)</li>
              <li>$19.99/month — Daily auto-minting (power users)</li>
              <li>$99-$499/month — Commercial tier (solar installers, EV fleet managers)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you are applying with the same idea as a previous batch, did anything change? If you applied with a different idea, why did you pivot and what did you learn from the last idea?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>N/A — First-time applicant.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you have already participated or committed to participate in an incubator, "accelerator" or "pre-accelerator" program, please tell us about it.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>I have not applied to YC before, nor participated in any incubator, accelerator, or pre-accelerator program. This is my first time seeking formal support—I wanted to build something real first.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Idea Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Idea
        </h2>

        <Card className="print:shadow-none border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="font-medium text-primary">I believe deeply that people should earn ongoing rewards for making sustainable choices.</p>
            
            <p>The United States is falling behind in the global clean energy race. China dominates solar manufacturing, Europe leads in per-capita EV adoption, and American clean energy growth has stalled at the moment we need it most. We must offset as much carbon as possible—every kilowatt-hour of clean energy produced, every EV mile driven, every battery cycle stored matters. This isn't just a business opportunity for me; it's personal.</p>
            
            <p>ZenSolar is my answer to accelerating adoption by transforming passive clean energy owners into actively engaged participants. But it's not just about retention—it's a viral acquisition engine. When a solar owner posts "I generated 1,200 kWh and drove 800 miles in my Tesla this month—and earned $800 with ZenSolar," their friends without solar start asking questions. The platform turns every user into a walking billboard for clean energy adoption.</p>
            
            <p>This vision is only possible now due to blockchain technology, smart contracts, and a founding mission rooted in integrity. We can cryptographically verify real-world energy production, mint rewards transparently, and create an economic flywheel that makes clean energy use financially rewarding—all without intermediaries or trust assumptions.</p>
            
            <p>The timing is critical: the "One Big Beautiful Bill" (signed 2025) phases out the 30% solar ITC and $7,500 EV credits by end of 2026. Millions of households already own solar panels, EVs, and batteries but lack ongoing motivation to maximize their use—tax credits are one-time acquisition incentives, not retention incentives. <strong>ZenSolar is the retention layer.</strong></p>
            
            <div className="bg-background p-3 rounded-lg border">
              <p className="font-medium mb-2">My Domain Expertise (14 years in cleantech):</p>
              <p>I started at SolarCity pre-IPO, working closely with Elon Musk (Chairman) and founders Lyndon and Peter Rive. Those years taught me how to think big while obsessing over execution details. I learned that the best clean energy companies don't just sell products—they create movements.</p>
              <p className="mt-2">I started ZenSolar as an LLC in 2018 as a solar sales company but pivoted to this crypto-rewards product after seeing the opportunity to do something more transformational. I also own a home solar + battery system and Tesla EV, so I personally experience the API silos and engagement drop-off this platform solves.</p>
            </div>
            
            <p><strong>How I know people need this:</strong> (1) Our 19 beta users check the app daily to see "pending rewards"—something they never did with manufacturer apps, and (2) EVearn on VeChain has attracted users despite being EV-only and requiring external wallets. We're multi-vertical with a frictionless Web2 UX—the market is ready.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Who are your competitors? What do you understand about your business that they don't?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>Blockchain "X-to-Earn" sustainability dApps; the closest direct competitor is EVearn by VeBetterDAO on VeChain, which rewards EV drivers (starting with Tesla) with $B3TR tokens for charging sessions.</p>
            
            <div>
              <p className="font-medium mb-2">What we understand that they don't:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Multi-vertical advantage:</strong> EVearn rewards only EV charging—we capture the full clean energy stack (solar + battery + EV + charging). More touchpoints = more engagement = higher LTV.</li>
                <li><strong>Mint-on-Proof™ (trademark pending):</strong> Our SEGI™ (Software-Enabled Gateway Interface, trademark pending) architecture mints on-demand from verified API data—no pre-minted pools or inflation risk. Patent provisional filed March 2025.</li>
                <li><strong>True Web2 UX:</strong> Competitors require external wallets, seed phrases, and crypto knowledge. ZenSolar users sign up with email, earn rewards, and cash out to their bank—never leaving the app, never seeing a seed phrase. They don't even know they're using blockchain.</li>
                <li><strong>Timing:</strong> Federal incentives phase out 2025-2026—we become the replacement motivation layer as government support disappears.</li>
                <li><strong>Commercial tier:</strong> $99-$499/month B2B for solar installers and fleet managers—a revenue stream competitors haven't addressed.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How do or will you make money? How much could you make?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <p className="font-medium mb-2">Revenue Streams:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>$9.99/month</strong> — Weekly auto-minting (casual users)</li>
                <li><strong>$19.99/month</strong> — Daily auto-minting (power users)</li>
                <li><strong>$99-$499/month</strong> — Commercial tier (solar installers, EV fleet managers)</li>
                <li><strong>7% transfer tax</strong> on all $ZSOLAR trades (3% burn, 2% LP, 2% treasury) — deflationary by design</li>
              </ul>
            </div>
            
            <div className="bg-background p-3 rounded-lg border border-primary/30">
              <p className="font-medium mb-2 text-primary">The Flywheel Effect:</p>
              <p>50% of subscription revenue is automatically injected into our liquidity pool, creating a self-reinforcing cycle:</p>
              <p className="text-center my-2 font-medium">More subscribers → Larger LP → Higher token floor price → More valuable rewards → More subscribers</p>
              <p>At <strong>25,000 subscribers</strong> (our "Tipping Point"), monthly LP injections match our initial seed capital—the protocol becomes self-sustaining. This is the moment the flywheel spins on its own.</p>
            </div>

            <div className="bg-background p-3 rounded-lg border">
              <p className="font-medium mb-2">Tokenomics (10 Billion Supply):</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li>90% Community Pool — dual-gated for subscribers (earned through verified energy activity)</li>
                <li>7.5% Treasury — 2-year vesting for operations and market stabilization</li>
                <li>2.5% Founder — 3-year vesting with 6-month cliff</li>
                <li>20% mint burn on every token minted (aggressive deflation)</li>
                <li>7% transfer tax: 3% burn, 2% LP, 2% treasury</li>
                <li>$0.10 launch price floor supported by LP seed</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-2">Revenue at Scale:</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Users</th>
                    <th className="text-left py-1">Consumer</th>
                    <th className="text-left py-1">Commercial</th>
                    <th className="text-left py-1">ARR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted">
                    <td className="py-1">10,000</td>
                    <td className="py-1">9,500 × $12/avg</td>
                    <td className="py-1">500 × $150/avg</td>
                    <td className="py-1 font-medium">$2.3M</td>
                  </tr>
                  <tr className="border-b border-muted">
                    <td className="py-1">100,000</td>
                    <td className="py-1">90,000 × $15/avg</td>
                    <td className="py-1">10,000 × $250/avg</td>
                    <td className="py-1 font-medium">$48M</td>
                  </tr>
                  <tr>
                    <td className="py-1">1,000,000</td>
                    <td className="py-1">900,000 × $16/avg</td>
                    <td className="py-1">100,000 × $350/avg</td>
                    <td className="py-1 font-medium">$593M</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200">
              <p className="font-medium mb-2">Moonshot Scenarios — Multi-Year Wealth Creation (1,000 tokens/month):</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-300">
                    <th className="text-left py-1">Timeframe</th>
                    <th className="text-left py-1">Tokens</th>
                    <th className="text-left py-1">@ $1</th>
                    <th className="text-left py-1">@ $5</th>
                    <th className="text-left py-1">@ $10</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-amber-200">
                    <td className="py-1">Year 1</td>
                    <td className="py-1">12,000</td>
                    <td className="py-1">$12K</td>
                    <td className="py-1">$60K</td>
                    <td className="py-1">$120K</td>
                  </tr>
                  <tr className="border-b border-amber-200">
                    <td className="py-1">Year 5</td>
                    <td className="py-1">60,000</td>
                    <td className="py-1">$60K</td>
                    <td className="py-1">$300K</td>
                    <td className="py-1">$600K</td>
                  </tr>
                  <tr className="border-b border-amber-200">
                    <td className="py-1">Year 10</td>
                    <td className="py-1">120,000</td>
                    <td className="py-1">$120K</td>
                    <td className="py-1">$600K</td>
                    <td className="py-1">$1.2M</td>
                  </tr>
                  <tr>
                    <td className="py-1">Year 20</td>
                    <td className="py-1">240,000</td>
                    <td className="py-1">$240K</td>
                    <td className="py-1">$1.2M</td>
                    <td className="py-1">$2.4M</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">This is the story our users will tell their friends. This is why they become walking billboards.</p>
            </div>

            <p><strong>Tesla Partnership Vision:</strong> $ZSOLAR accepted for Supercharging and Tesla Store purchases—a closed-loop economy for Tesla users that deepens engagement across the entire ecosystem.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Which category best applies to your company?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">Crypto / Blockchain</p>
            <p className="text-muted-foreground text-xs mt-1">(Also applicable: Climate, Consumer, Fintech)</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you had any other ideas you considered applying with, please list them.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>N/A — This is the idea I've been building toward for years. Everything else was just preparation.</p>
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

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Have you formed ANY legal entity yet?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> The old ZenSolar LLC from 2018 (solar sales company) will be dissolved—the crypto-rewards product is a clean-slate pivot with entirely new IP. I plan to form a new C-Corp to house the current technology, trademarks, and cap table.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              If you have not formed the company yet, describe the planned equity ownership breakdown among the founders, employees and any other proposed stockholders.
              <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>I'll be honest—I could use guidance here. The numbers below are my starting framework, and I'm genuinely open to mentorship on structuring this properly.</p>
            <p><strong>Planned structure:</strong> Solo founder (CEO): ~70-80% equity at founding. Will allocate 10-15% employee option pool upon funding. Seeking technical cofounder who would receive a meaningful equity stake (10-25% depending on experience and timing of joining).</p>
            <p><strong>Token compensation:</strong> Considering offering employees $ZSOLAR token allocations in addition to traditional equity—this aligns incentives with protocol growth and gives employees direct stake in the token economy they're building. I want everyone to feel ownership in what we're creating.</p>
            <p><strong>Note:</strong> The 2018 LLC had ~15-20% held by advisors who are aware of the clean-slate technical pivot. That entity will be dissolved for the new C-Corp.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Have you taken any investment yet?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> ZenSolar is 100% bootstrapped. No angel investors, no pre-seed, no SAFEs issued. I wanted to prove the concept with real users before asking anyone else to believe in it.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Are you currently fundraising?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> Not actively fundraising—focusing on product and beta users until YC decision. If accepted, YC would be our first external capital.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Curious Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Curious
        </h2>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              What convinced you to apply to Y Combinator? Did someone encourage you to apply? Have you been to any YC events?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>YC's track record with crypto companies (Coinbase, OpenSea) and the network effects of the alumni community convinced me to apply. I've followed YC content for years—the emphasis on building something people actually want resonates deeply with how I think about product.</p>
            <p>No one specifically encouraged me; this is an application based on believing that ZenSolar fits YC's thesis of backing ambitious founders with unfair advantages. My unfair advantage: 14 years of cleantech experience, personal relationships with industry leaders, and a product that solves a problem I experience every day as a solar/EV owner myself.</p>
            <p>I believe ZenSolar can become a unicorn by doing what crypto has failed to do: onboard mainstream users without friction. Our users don't know they're using blockchain. They sign up, connect devices, earn rewards, and cash out—all without ever leaving the app or learning crypto terminology.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How did you hear about Y Combinator?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Toby Corey (SolarCity CRO, now YC-adjacent advisor) and years of following YC-backed companies in tech news. I've learned a lot from YC partners on X—especially about the importance of talking to users and building what they actually need.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Batch Preference */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Batch Preference</h2>
        <Card className="print:shadow-none">
          <CardContent className="pt-6 text-sm">
            <p><strong>Spring 2026</strong></p>
          </CardContent>
        </Card>
      </section>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
        ZenSolar — YC Application (Spring 2026) — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
