import { ExportButtons } from "@/components/admin/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, FileText, Rocket, Users, Lightbulb, PieChart, HelpCircle } from "lucide-react";

// YC Application data structured for export
const getYCData = () => [
  { section: "Company", question: "Company Name", answer: "ZenSolar" },
  { section: "Company", question: "50 chars or less", answer: "Earn crypto for your clean energy use." },
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
          <div><span className="font-medium">Tagline:</span> Earn crypto for your clean energy use.</div>
          <div><span className="font-medium">Location:</span> Austin, USA</div>
          <div><span className="font-medium">Batch:</span> Spring 2026</div>
          <div><span className="font-medium">Category:</span> Crypto / Blockchain</div>
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
            <p>I'm a solo technical founder building with AI-assisted development. I write all code using Lovable (AI coding platform powered by Claude), with Grok (xAI) for strategy/tokenomics and Claude 3.5 Sonnet for code reviews. No non-founder has written code. The codebase includes 50+ React components, 20+ Supabase edge functions, and 3 Solidity smart contracts—all built in ~6 months while learning blockchain development from scratch.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Are you looking for a cofounder?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Yes—specifically a technical cofounder with blockchain/Web3 experience. Ideally someone who can own smart contract security, embedded wallet integration, and mainnet deployment while I focus on product, growth, and partnerships.</p>
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
            <p>60-second intro covering: who I am, cleantech background (SolarCity/Tesla ecosystem), what ZenSolar does, why now (tax credit phase-out), and what we're building.</p>
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

        <Card className="print:shadow-none border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Describe what your company does in 50 characters or less.
              <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="space-y-1">
              <p className="font-medium text-primary">Option A: "Get paid for your solar and EV usage." (40 chars)</p>
              <p className="font-medium">Option B: "Turn your solar & EV into income." (37 chars)</p>
              <p className="font-medium">Option C: "Your clean energy earns crypto rewards." (41 chars)</p>
              <p className="font-medium">Option D: "Solar owners and EV drivers get paid." (39 chars)</p>
              <p className="font-medium">Option E: "Proof-of-energy rewards for solar & EVs." (42 chars)</p>
            </div>
            <p className="text-muted-foreground text-xs">Current: "Earn crypto for your clean energy use." (38 chars)</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              What is your company going to make? Please describe your product and what it does or will do.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>ZenSolar is a mobile/web app that rewards solar owners and EV drivers with $ZSOLAR tokens and collectible NFTs for their verified clean energy use. Users connect their Tesla, Enphase, SolarEdge, or Wallbox devices via OAuth. Our patent-pending Mint-on-Proof™ technology pulls real-time production data from manufacturer APIs, verifies it cryptographically, and lets users mint blockchain rewards with a single tap—no external wallets or crypto knowledge required.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Where do you live now, and where would the company be based after YC?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">Austin, USA / Austin, USA</p>
            <p className="text-muted-foreground mt-1">It's where I live and where there is a thriving start-up scene.</p>
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
          <CardContent className="text-sm">
            <p>Live beta with 19 users on Base Sepolia testnet. Fully functional integrations with Tesla Fleet API, Enphase Monitoring API, SolarEdge Monitoring API, and Wallbox API for real-time energy data. Smart contracts deployed: $ZSOLAR (ERC-20) and ZenSolarNFT (ERC-1155 with 42 milestone achievement tiers). One-tap minting directly from the app—users connect devices in 60 seconds via OAuth, see real-time metrics on a dashboard, and mint tokens/NFTs without needing external wallets.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How long have each of you been working on this? How much of that has been full-time? Please explain.
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>I (the founder) have been working on ZenSolar since March 2025 (~6 months full-time). So far, this is a solo-founder application at this stage.</p>
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
            <p><strong>Blockchain:</strong> Solidity on Base L2, wagmi + viem, Reown AppKit, Coinbase OnchainKit.</p>
            <p><strong>AI Stack:</strong> Lovable (primary development), Grok (strategy), Claude 3.5 Sonnet (reviews).</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How many active users or customers do you have? How many are paying? Who is paying you the most, and how much do they pay you?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>19 active users providing feedback. None are paying yet, but all said they would on mainnet launch.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Do you have revenue?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> Currently in free beta phase on testnet. Monetization begins at mainnet launch with subscription tiers ($9.99-$19.99/month consumer, $99-$499/month commercial).</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you are applying with the same idea as a previous batch, did anything change? If you applied with a different idea, why did you pivot and what did you learn from the last idea?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>N/A</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you have already participated or committed to participate in an incubator, "accelerator" or "pre-accelerator" program, please tell us about it.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>I have not applied to YC before, nor participated in any incubator, accelerator, or pre-accelerator program.</p>
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

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>The United States is falling behind in the global clean energy race. China dominates solar manufacturing, Europe leads in per-capita EV adoption, and American clean energy growth has stalled at the moment we need it most. We must offset as much carbon as possible—every kilowatt-hour of clean energy produced, every EV mile driven, every battery cycle stored matters. ZenSolar is the answer to accelerate adoption by transforming passive clean energy owners into actively engaged participants.</p>
            <p>But ZenSolar isn't just about retention—it's a viral acquisition engine. When a solar owner posts "I generated 1,200 kWh and drove 800 miles in my Tesla this month—and earned $800 with ZenSolar," their friends without solar start asking questions. The platform turns every user into a walking billboard for clean energy adoption. New buyers don't just want solar for savings—they want solar to join the earning community.</p>
            <p>This vision is only possible now due to blockchain technology, smart contracts, and a founding mission rooted in integrity. We can cryptographically verify real-world energy production, mint rewards transparently, and create an economic flywheel that makes clean energy use financially rewarding—all without intermediaries or trust assumptions.</p>
            <p>The timing is critical: the "One Big Beautiful Bill" (signed 2025) phases out the 30% solar ITC and $7,500 EV credits by end of 2026. Millions of households already own solar panels, EVs, and batteries but lack ongoing motivation to maximize their use—tax credits are one-time acquisition incentives, not retention incentives. ZenSolar is the retention layer.</p>
            <p>I have 14 years in cleantech—starting at SolarCity pre-IPO (Elon Musk, Chairman) where I worked closely with founders Lyndon and Peter Rive and CRO Toby Corey. I started ZenSolar in 2018 as a solar sales company but pivoted to this product after seeing the crypto-rewards opportunity. I also own a home solar + battery system and Tesla EV, so I personally experience the API silos and engagement drop-off this platform solves.</p>
            <p>I know people need this because: (1) our 19 beta users check the app daily to see "pending rewards"—something they never did with manufacturer apps, and (2) EVearn on VeChain has attracted users despite being EV-only and requiring external wallets.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Who are your competitors? What do you understand about your business that they don't?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Blockchain "X-to-Earn" sustainability dApps; the closest direct competitor is EVearn by VeBetterDAO on VeChain, which rewards EV drivers (starting with Tesla) with $B3TR tokens for charging sessions.</p>
            <p>What we understand that they don't: (1) <strong>Multi-vertical:</strong> EVearn rewards only EV charging—we capture the full clean energy stack (solar + battery + EV + charging). (2) <strong>Mint-on-Proof™:</strong> Our system mints on-demand from verified API data—no pre-minted pools. (3) <strong>Embedded wallet:</strong> Competitors require external wallets; we're building frictionless email-signup onboarding. (4) <strong>Timing:</strong> Federal incentives phase out 2025-2026—we become the replacement motivation layer. (5) <strong>Commercial tier:</strong> $99-$499/month B2B for solar installers and fleet managers—a revenue stream competitors haven't addressed.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              How do or will you make money? How much could you make?
              <Badge variant="secondary" className="ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <ul className="list-disc list-inside space-y-1">
              <li>$9.99/month (monthly auto-minting) — casual users</li>
              <li>$19.99/month (daily auto-minting) — power users</li>
              <li>$99-$499/month (commercial tier) — commercial solar users and EV fleet managers</li>
              <li>3.5% transaction fee on all token activity (1.5% burn, 2% treasury)</li>
            </ul>
            
            <div>
              <p className="font-medium mb-1">The Flywheel Effect:</p>
              <p>50% of subscription revenue is automatically injected into our liquidity pool, creating a self-reinforcing cycle: more subscribers → larger LP → higher token floor price → more valuable rewards → more subscribers. At 25,000 subscribers (our "Tipping Point"), monthly LP injections match our initial seed capital—the protocol becomes self-sustaining.</p>
            </div>

            <div>
              <p className="font-medium mb-2">Revenue at scale:</p>
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
                    <td className="py-1">9,500 × $12</td>
                    <td className="py-1">500 × $150</td>
                    <td className="py-1 font-medium">$2.3M</td>
                  </tr>
                  <tr className="border-b border-muted">
                    <td className="py-1">100,000</td>
                    <td className="py-1">90,000 × $15</td>
                    <td className="py-1">10,000 × $250</td>
                    <td className="py-1 font-medium">$48M</td>
                  </tr>
                  <tr>
                    <td className="py-1">1,000,000</td>
                    <td className="py-1">900,000 × $16</td>
                    <td className="py-1">100,000 × $350</td>
                    <td className="py-1 font-medium">$593M</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-medium mb-2">Moonshot Scenarios — Multi-Year Customer Wealth Creation (1,000 tokens/month):</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Timeframe</th>
                    <th className="text-left py-1">Tokens</th>
                    <th className="text-left py-1">Value at $1</th>
                    <th className="text-left py-1">Value at $5</th>
                    <th className="text-left py-1">Value at $10</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted">
                    <td className="py-1">Year 1</td>
                    <td className="py-1">12,000</td>
                    <td className="py-1">$12,000</td>
                    <td className="py-1">$60,000</td>
                    <td className="py-1">$120,000</td>
                  </tr>
                  <tr className="border-b border-muted">
                    <td className="py-1">Year 5</td>
                    <td className="py-1">60,000</td>
                    <td className="py-1">$60,000</td>
                    <td className="py-1">$300,000</td>
                    <td className="py-1">$600,000</td>
                  </tr>
                  <tr className="border-b border-muted">
                    <td className="py-1">Year 10</td>
                    <td className="py-1">120,000</td>
                    <td className="py-1">$120,000</td>
                    <td className="py-1">$600,000</td>
                    <td className="py-1">$1,200,000</td>
                  </tr>
                  <tr>
                    <td className="py-1">Year 20</td>
                    <td className="py-1">240,000</td>
                    <td className="py-1">$240,000</td>
                    <td className="py-1">$1,200,000</td>
                    <td className="py-1">$2,400,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p><strong>Tesla Partnership Vision:</strong> $ZSOLAR accepted for Supercharging and Tesla Store purchases—a closed-loop economy for Tesla users.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Which category best applies to your company?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">Crypto / Blockchain</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you had any other ideas you considered applying with, please list them.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>N/A</p>
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
            <p><strong>No.</strong> (The old ZenSolar LLC from 2018 will be dissolved—the crypto-rewards product is a clean-slate pivot.)</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you have not formed the company yet, describe the planned equity ownership breakdown among the founders, employees and any other proposed stockholders.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Solo founder (CEO): 100% equity at founding. Will allocate 10-15% employee option pool upon funding. Seeking technical cofounder who would receive meaningful equity stake (10-25% depending on experience and timing).</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Have you taken any investment yet?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> ZenSolar is 100% bootstrapped. No angel investors, no pre-seed, no SAFEs issued.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Are you currently fundraising?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>No.</strong> Not actively fundraising—focusing on product and beta users until YC decision.</p>
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
              <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>YC's track record with crypto companies (Coinbase, OpenSea) and the network effects of the alumni community convinced me to apply. I've followed YC content for years but haven't attended events. No one specifically encouraged me—this is a cold application based on believing ZenSolar fits YC's thesis of backing ambitious technical founders.</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How did you hear about Y Combinator?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Tech news coverage of YC-backed companies over the past decade, plus following YC partners on Twitter/X.</p>
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
