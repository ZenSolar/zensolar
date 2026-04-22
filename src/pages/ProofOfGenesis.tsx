import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { ProofOfGenesisThesis } from '@/components/tokenomics/ProofOfGenesisThesis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Coins,
  Layers,
  Award,
  Lock,
} from 'lucide-react';

/**
 * Proof-of-Genesis™ — dedicated NDA page
 *
 * Top: explainer of what PoG is + the BTC contrast (via the existing
 * <ProofOfGenesisThesis /> module).
 * Bottom: trademark portfolio with descriptions of each mark's strategic
 * power to the company.
 */

type Trademark = {
  mark: string;
  tagline: string;
  icon: typeof Sparkles;
  category: string;
  description: string;
  power: string;
};

const TRADEMARKS: Trademark[] = [
  {
    mark: 'Proof-of-Genesis™',
    tagline: 'The consensus primitive that eclipses Proof-of-Work.',
    icon: Sparkles,
    category: 'Consensus',
    description:
      'The unifying cryptographic thesis: Proof-of-Delta + Proof-of-Origin. Mints value when verified clean energy is produced or productively consumed — instead of burning energy to prove waste.',
    power:
      'Owns the narrative category. Whoever owns the consensus name owns the conversation. This is our "Proof-of-Work" — the term every analyst, regulator, and competitor will be forced to reference.',
  },
  {
    mark: 'Tap-to-Mint™',
    tagline: 'One tap turns real energy into on-chain currency.',
    icon: Zap,
    category: 'User Experience',
    description:
      'The signature consumer interaction. A single tap reads verified device data, runs the proof, and mints $ZSOLAR — collapsing crypto\'s complexity into something a 10-year-old can do.',
    power:
      'The "iPod click-wheel" of crypto. Defines the category for mainstream adoption and locks competitors out of the simplest possible UX language.',
  },
  {
    mark: 'Mint-on-Proof™',
    tagline: 'No proof, no mint. Period.',
    icon: ShieldCheck,
    category: 'Protocol Rule',
    description:
      'The protocol-level guarantee that every $ZSOLAR token is backed by a verified physical event — never a promise, never a faucet, never speculation.',
    power:
      'Regulator-friendly by construction. This is the phrase that makes ESG funds, governments, and utilities comfortable holding $ZSOLAR.',
  },
  {
    mark: 'Proof-of-Delta™',
    tagline: 'The math that proves change actually happened.',
    icon: Layers,
    category: 'Cryptographic Primitive',
    description:
      'Verifies a measurable change in energy state (kWh produced, kWh delivered) signed by the device itself — not by a centralized API. Half of what makes Proof-of-Genesis work.',
    power:
      'The patentable core. This is the technical moat the utility patent is built around — and the foundation of every audit, every proof, every mint.',
  },
  {
    mark: 'Proof-of-Origin™',
    tagline: 'Verifies the source — clean, real, and yours.',
    icon: Cpu,
    category: 'Cryptographic Primitive',
    description:
      'Proves the energy came from a specific verified device, owned by a specific verified user, from a clean source. The other half of Proof-of-Genesis.',
    power:
      'Eliminates double-mint, fraud, and greenwashing in a single primitive. Without it, "clean energy crypto" is just a marketing claim. With it, it\'s a settlement layer.',
  },
  {
    mark: '$ZSOLAR',
    tagline: 'Currency from energy.',
    icon: Coins,
    category: 'Token / Brand',
    description:
      'The native token of the ZenSolar protocol. 1 trillion hard cap. Backed by physics. Distributed by proof.',
    power:
      'A 4-letter ticker that says exactly what it is. Sits next to $BTC and $ETH on every exchange — and tells the entire story without a whitepaper.',
  },
  {
    mark: 'ZenSolar®',
    tagline: 'The clean-energy protocol layer.',
    icon: Award,
    category: 'Master Brand',
    description:
      'The umbrella brand. Calm, confident, civilizational. Owns the intersection of "energy" and "Zen" — abundance without waste.',
    power:
      'A brand that sounds like a religion and reads like a utility. Hard to copy. Easy to remember. Built to outlive the founders.',
  },
  {
    mark: 'Family Legacy Pact™',
    tagline: 'Founder supply locked to civilization-scale outcomes.',
    icon: Lock,
    category: 'Governance',
    description:
      'A public, immutable lockup binding founder allocations (Joseph 150B / Michael 50B) to long-horizon trillionaire price thresholds — not short-term liquidity events.',
    power:
      'The strongest possible signal of founder alignment. Investors don\'t have to trust us — the contract enforces it.',
  },
];

export default function ProofOfGenesis() {
  return (
    <>
      <SEO
        title="Proof-of-Genesis™ Thesis"
        url="https://zensolar.lovable.app/demo/proof-of-genesis"
      />

      <div className="container max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-8 sm:space-y-10">
        {/* ===== Page header ===== */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
          >
            NDA · Confidential
          </Badge>
          <h1 className="text-[26px] sm:text-4xl font-bold tracking-tight leading-[1.1]">
            Proof-of-Genesis™
          </h1>
          <p className="text-[14px] sm:text-base text-muted-foreground leading-snug max-w-2xl">
            The cryptographic primitive built to eclipse Bitcoin's Proof-of-Work — and the
            trademark portfolio that protects it.
          </p>
        </motion.header>

        {/* ===== What is Proof-of-Genesis (intro explainer) ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card relative">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at top left, hsl(var(--primary) / 0.16), transparent 60%)',
              }}
              aria-hidden
            />
            <CardHeader className="relative px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 mb-3">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <CardTitle className="text-[20px] sm:text-2xl leading-tight">
                What is Proof-of-Genesis?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 text-[14.5px] sm:text-[15px] leading-relaxed text-foreground/85">
              <p>
                <span className="font-semibold text-foreground">Proof-of-Genesis (PoG™)</span>{' '}
                is the consensus mechanism that powers $ZSOLAR. It combines two cryptographic
                primitives — <span className="font-semibold text-primary">Proof-of-Delta</span>{' '}
                (verified change in energy state) and{' '}
                <span className="font-semibold text-primary">Proof-of-Origin</span> (verified
                physical device + clean source) — into a single, hardware-backed proof.
              </p>
              <p>
                Where Bitcoin's Proof-of-Work secures value by{' '}
                <span className="text-foreground font-medium">burning</span> electricity,
                Proof-of-Genesis mints value by{' '}
                <span className="text-foreground font-medium">
                  verifying clean electricity was created or productively used
                </span>
                . One is extractive. The other is additive. Both are mathematically rigorous —
                only one is good for civilization.
              </p>
              <p className="italic text-foreground/75 border-l-2 border-primary/40 pl-3">
                Tagline: <span className="text-primary font-semibold not-italic">digital photosynthesis.</span>
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* ===== Existing thesis module: BTC vs ZSOLAR + 5–10x math ===== */}
        <ProofOfGenesisThesis />

        {/* ===== Trademark portfolio ===== */}
        <section className="space-y-5 sm:space-y-6 pt-4">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-primary uppercase tracking-[0.2em] text-[10px] font-bold px-2.5 py-1"
            >
              Trademark Portfolio
            </Badge>
            <h2 className="text-[22px] sm:text-3xl font-bold tracking-tight leading-tight">
              The names we own.
            </h2>
            <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-snug max-w-2xl">
              Every category-defining technology needs category-defining language. These are the
              marks ZenSolar owns — and the strategic power each one delivers to the company.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {TRADEMARKS.map((tm, i) => {
              const Icon = tm.icon;
              return (
                <motion.div
                  key={tm.mark}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.2) }}
                >
                  <Card className="h-full border-border/70 hover:border-primary/40 transition-colors duration-300">
                    <CardHeader className="px-5 pt-5 pb-2.5 sm:px-6 sm:pt-6 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary/12 border border-primary/25 shrink-0">
                          <Icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[9.5px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 shrink-0"
                        >
                          {tm.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-[17px] sm:text-lg leading-tight">
                          {tm.mark}
                        </CardTitle>
                        <p className="text-[12.5px] sm:text-[13px] text-primary/90 italic leading-snug">
                          {tm.tagline}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
                      <p className="text-[13.5px] sm:text-sm text-foreground/85 leading-relaxed">
                        {tm.description}
                      </p>
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary mb-1">
                          Strategic Power
                        </p>
                        <p className="text-[12.5px] sm:text-[13px] text-foreground/85 leading-snug">
                          {tm.power}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 text-center pt-3 leading-relaxed">
            Trademark filings in progress · Confidential under NDA
          </p>
        </section>
      </div>
    </>
  );
}
