import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  FileBadge,
  Scale,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';

const headToHeadRows = [
  {
    category: 'Patent priority',
    zensolar: 'Provisional application 63/782,397 filed 04/02/2025.',
    gridpay: 'Non-provisional application 19/399,546 disclosed in footer as filed 11/24/2025.',
    investorTakeaway: 'ZenSolar appears earlier on filing date by nearly eight months.',
  },
  {
    category: 'Claim framing',
    zensolar: 'Broad system/method for tokenizing sustainable behaviors using blockchain; SEGI can use APIs or hardware and spans solar, EV, battery, charging, plus other verticals.',
    gridpay: 'Footer title is narrower: distributed energy export rewards using smart-meter data, blockchain-issued digital multipliers, and AI-driven VPP coordination.',
    investorTakeaway: 'ZenSolar looks broader and earlier; GridPay looks more narrowly Texas/export/VPP oriented.',
  },
  {
    category: 'Geographic scope',
    zensolar: 'National, hardware-agnostic, multi-provider positioning.',
    gridpay: 'Texas / ERCOT / home battery income narrative.',
    investorTakeaway: 'ZenSolar maps to a platform thesis; GridPay reads more like a regional wedge.',
  },
  {
    category: 'Data ingestion model',
    zensolar: 'SEGI pulls from APIs first, with hardware as an alternative path.',
    gridpay: 'Public language centers on smart-meter data and behind-the-meter aggregation.',
    investorTakeaway: 'ZenSolar is broader on source flexibility; GridPay appears narrower on metering/export signals.',
  },
  {
    category: 'User experience',
    zensolar: 'Connect energy accounts, verify new activity, mint on proof, hold in embedded wallet.',
    gridpay: 'Connect meter, validate at source, get paid for surplus, cash out.',
    investorTakeaway: 'Narrative overlap exists, but ZenSolar is positioned as deeper trust infrastructure.',
  },
  {
    category: 'Verification moat',
    zensolar: 'Proof-of-Delta™, Mint-on-Proof™, Proof-of-Origin™, and device watermark registry positioning.',
    gridpay: 'No public cryptographic anti-double-mint standard has been surfaced from public pages reviewed so far.',
    investorTakeaway: 'ZenSolar’s strongest investor moat is not just rewards, but verifiable issuance controls.',
  },
  {
    category: 'Token supply framing',
    zensolar: '10B max supply with staged release and revenue-backed liquidity logic.',
    gridpay: '5B total allotment referenced in prior materials shared by founder; public site emphasizes GPT utility token positioning.',
    investorTakeaway: 'GridPay may look numerically tighter on max supply, but supply discipline depends on reserve design, not headline count alone.',
  },
  {
    category: 'Economic support model',
    zensolar: 'Protocol-Owned Liquidity, subscription-funded LP growth, burn mechanics, treasury accumulation.',
    gridpay: 'Public claims emphasize payouts, multipliers, and utility; reserve mechanics remain less visible from public sources.',
    investorTakeaway: 'ZenSolar reads as more institutionally modeled; GridPay reads as more promotional unless reserve math is shown.',
  },
];

const zensolarTokenomics = [
  ['Max supply', '10,000,000,000 $ZSOLAR'],
  ['Community rewards', '9,000,000,000 tokens (90%)'],
  ['Founder allocation', '250,000,000 tokens (2.5%)'],
  ['Treasury allocation', '750,000,000 tokens (7.5%)'],
  ['Mint ratio', '1 $ZSOLAR per kWh or mile'],
  ['Launch floor design', '$0.10 launch floor with $300K USDC LP seed paired against 3M tokens'],
  ['Mint distribution', '75% user / 20% burn / 3% LP / 2% treasury'],
  ['Transfer tax', '7% total: 3% permanent burn / 2% LP / 2% treasury'],
  ['Redemption burn', '5% store redemption burn fee'],
  ['Liquidity engine', '50% of subscription revenue flows into protocol-owned liquidity'],
];

const gridpayTokenomics = [
  ['Token symbol', 'GPT (per public site/footer and earlier materials shared in this project context)'],
  ['Headline supply', '5,000,000,000 total allotment referenced in prior smart-contract/tokenomics materials you shared'],
  ['Headline floor claim', '$0.15 floor claim discussed in prior review'],
  ['Implied fully diluted support', 'A true $0.15 floor across 5B tokens implies $750M of support at full dilution'],
  ['Observed public framing', 'Utility token, battery income, export rewards, digital multipliers, and cash-out narrative'],
  ['Visibility gap', 'Public website does not currently surface enough reserve / redeemability / LP depth detail to verify a hard floor'],
  ['Investor diligence issue', 'Need reserve wallet proof, redeemability mechanics, or locked liquidity commitments before treating the floor as credible'],
];

const timeline = [
  {
    date: '04/02/2025',
    label: 'ZenSolar provisional filed',
    detail: 'USPTO receipt shows provisional application 63/782,397 for “System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology.”',
  },
  {
    date: 'Q1 2025',
    label: 'ZenSolar public beta / product positioning',
    detail: 'Founder materials establish earlier public-facing product and architecture narrative around SEGI, token rewards, and milestone logic.',
  },
  {
    date: '11/22/2025',
    label: 'GridPay trademark filing disclosed',
    detail: 'GridPay footer claims trademark application serial no. 99511131.',
  },
  {
    date: '11/24/2025',
    label: 'GridPay non-provisional disclosed',
    detail: 'GridPay footer claims U.S. non-provisional application 19/399,546 for tokenized distributed energy export rewards using smart-meter data and AI-driven VPP coordination.',
  },
  {
    date: '03/05/2026',
    label: 'GridPay “first mint” marketing claim',
    detail: 'HackQuest language reviewed earlier in this project ties its “first mint” narrative to March 2026.',
  },
];

const diligenceQuestions = [
  'Does GridPay’s non-provisional claim merely export-reward workflows, or does it attempt to claim broader verification-gated token issuance?',
  'Do GridPay contracts actually prove reserve backing, redeemability, or locked liquidity sufficient to support a stated floor price?',
  'Is there any disclosed anti-double-mint or device identity registry comparable to ZenSolar’s Proof-of-Origin / watermark architecture?',
  'Are “digital multipliers” just a rewards marketing wrapper, or are they attempting to patent token issuance logic already disclosed by ZenSolar?',
  'How much of GridPay’s differentiation is actual technical architecture versus ERCOT go-to-market packaging?',
];

export default function GridPayCompetition() {
  return (
    <>
      <SEO
        title="GridPay Comparison for Investors"
        description="Detailed ZenSolar vs GridPay comparison covering patent timing, tokenomics, market scope, verification architecture, and investor diligence issues."
        url="https://zensolar.lovable.app/competition/gridpay"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'ZenSolar vs GridPay Investor Comparison',
          description:
            'Detailed investor comparison of ZenSolar and GridPay across patent dates, tokenomics, verification architecture, and market strategy.',
          mainEntityOfPage: 'https://zensolar.lovable.app/competition/gridpay',
        }}
      />

      <main className="min-h-screen bg-background">
        <section className="border-b border-border bg-muted/20">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-5xl space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Investor Brief</Badge>
                <Badge variant="secondary">Competitive Intelligence</Badge>
                <Badge variant="outline">GridPay Deep Dive</Badge>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  ZenSolar vs GridPay: detailed investor comparison
                </h1>
                <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  This page compares product architecture, patent timing, token design, and investor credibility so
                  the ZenSolar team can explain why its model is broader, earlier, and more defensible.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileBadge className="h-5 w-5 text-primary" />
                      Filing advantage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ZenSolar provisional: <strong className="text-foreground">04/02/2025</strong>.
                      GridPay disclosed non-provisional: <strong className="text-foreground">11/24/2025</strong>.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" />
                      Moat quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ZenSolar is framed as verification infrastructure with SEGI, proof-based minting, and anti-double-mint logic.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Coins className="h-5 w-5 text-primary" />
                      Economic model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ZenSolar exposes reserve and burn mechanics. GridPay’s public materials emphasize payouts and utility,
                      but not enough reserve math to validate a hard floor.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Executive summary
                </CardTitle>
                <CardDescription>
                  The key investor interpretation from the materials reviewed so far.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                <p>
                  <strong className="text-foreground">ZenSolar appears earlier, broader, and more infrastructural.</strong>{' '}
                  Its provisional filing and product narrative cover a general system for collecting sustainability activity,
                  verifying new activity, minting blockchain rewards, and extending the model across multiple sectors.
                </p>
                <p>
                  <strong className="text-foreground">GridPay appears later, narrower, and more market-wedge driven.</strong>{' '}
                  Its public language centers on Texas export rewards, smart-meter data, battery income, and AI-driven VPP coordination.
                  That may still create overlap risk, but it also suggests GridPay is trying to patent a more specific slice of the category.
                </p>
                <p>
                  <strong className="text-foreground">The sharpest investor distinction is credibility of issuance and price support.</strong>{' '}
                  ZenSolar already articulates verification architecture and reserve-backed liquidity design. GridPay’s public-facing story is compelling,
                  but a floor-price claim with a 5B allotment requires much more visible financial support than marketing language alone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Source discipline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">ZenSolar data sources:</strong> uploaded provisional filing, filing receipt,
                  in-app contract summary, and existing tokenomics pages.
                </p>
                <p>
                  <strong className="text-foreground">GridPay data sources:</strong> public website/footer, earlier public page review,
                  HackQuest references already captured in project context, and tokenomics/smart-contract materials previously shared in chat.
                </p>
                <p>
                  <strong className="text-foreground">Important caveat:</strong> GridPay’s actual non-provisional application text is not yet publicly available in the sources we could access,
                  so this page compares public disclosures and previously shared contract signals—not a formal claim chart.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Head-to-head comparison
              </CardTitle>
              <CardDescription>
                Structured investor comparison across scope, IP timing, token design, and defensibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Dimension</TableHead>
                    <TableHead className="min-w-[240px]">ZenSolar</TableHead>
                    <TableHead className="min-w-[240px]">GridPay</TableHead>
                    <TableHead className="min-w-[240px]">Investor read</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headToHeadRows.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="font-medium text-foreground">{row.category}</TableCell>
                      <TableCell className="text-muted-foreground">{row.zensolar}</TableCell>
                      <TableCell className="text-muted-foreground">{row.gridpay}</TableCell>
                      <TableCell className="text-muted-foreground">{row.investorTakeaway}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  ZenSolar tokenomics: contract-backed summary
                </CardTitle>
                <CardDescription>
                  Based on the current ZenSolar contract summary already maintained in this project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {zensolarTokenomics.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-4 md:flex-row md:items-start md:justify-between md:gap-4">
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="max-w-md text-sm text-muted-foreground md:text-right">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  GridPay tokenomics: public / prior-shared signal summary
                </CardTitle>
                <CardDescription>
                  Built from the public site review plus the GridPay tokenomics details previously shared in this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gridpayTokenomics.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-4 md:flex-row md:items-start md:justify-between md:gap-4">
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="max-w-md text-sm text-muted-foreground md:text-right">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Patent and market timeline</CardTitle>
              <CardDescription>
                The sequence matters because investors care about both first-mover advantage and defendability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={`${item.date}-${item.label}`} className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-[140px_28px_1fr] md:items-start">
                    <div className="font-mono text-sm font-semibold text-foreground">{item.date}</div>
                    <div className="hidden md:flex justify-center pt-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{item.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Why ZenSolar reads stronger to investors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                <p>
                  <strong className="text-foreground">1. Broader platform architecture.</strong> ZenSolar is not just “sell surplus power.”
                  It frames a generalized verification and issuance layer across solar, batteries, EV miles, charging, and eventually other verticals.
                </p>
                <p>
                  <strong className="text-foreground">2. More explicit trust infrastructure.</strong> The real moat is not the reward itself but the ability to prove what happened,
                  prevent double counting, and bind issuance to measurable activity.
                </p>
                <p>
                  <strong className="text-foreground">3. More legible institutional tokenomics.</strong> ZenSolar exposes burn logic, treasury flow,
                  LP seeding, and protocol-owned liquidity in a way investors can underwrite.
                </p>
                <p>
                  <strong className="text-foreground">4. Better strategic storytelling.</strong> GridPay may be a sharp regional wedge,
                  but ZenSolar reads as the larger protocol opportunity if execution and legal positioning hold.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where GridPay still deserves respect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                <p>
                  <strong className="text-foreground">1. Strong wedge clarity.</strong> Texas home battery income and ERCOT participation is easy for homeowners and investors to understand.
                </p>
                <p>
                  <strong className="text-foreground">2. VPP / export specificity.</strong> A narrower smart-meter and dispatch angle may let GridPay tell a crisp operational story even if the platform is smaller in scope.
                </p>
                <p>
                  <strong className="text-foreground">3. Marketing velocity.</strong> Their public site packages a vivid consumer narrative around income and cash out.
                </p>
                <p>
                  <strong className="text-foreground">4. Patent signaling.</strong> Even without a public spec, a non-provisional filing means investors may perceive a stronger legal posture unless ZenSolar explains its earlier filing and broader architecture clearly.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <Card>
            <CardHeader>
              <CardTitle>Questions sophisticated investors should ask about GridPay</CardTitle>
              <CardDescription>
                This is where ZenSolar can sound sharp, fair, and technical without sounding defensive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {diligenceQuestions.map((question) => (
                  <div key={question} className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p>{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-16 md:pb-20">
          <Card>
            <CardHeader>
              <CardTitle>Bottom-line investor framing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
              <p>
                The strongest investor summary is this: <strong className="text-foreground">GridPay validates the category; ZenSolar owns the bigger architecture story.</strong>
                GridPay demonstrates real market appetite for turning household energy behavior into blockchain-linked rewards, but ZenSolar’s earlier filing,
                broader SEGI architecture, proof-based issuance framing, and more institutionally legible tokenomics make it easier to position as the long-term category platform.
              </p>
              <p>
                Said differently, GridPay can be framed as evidence of market pull, while ZenSolar should be framed as the higher-upside,
                more defensible infrastructure and liquidity model—provided the team continues tightening its formal utility claims and claim-chart documentation.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
