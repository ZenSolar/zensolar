import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'How is this structured from a regulatory standpoint?',
    a: 'This round is a SAFE (post-money) — the same instrument YC pioneered. $ZSOLAR is a utility token earned through verified clean-energy production, not sold to the public for fundraising. We have securities counsel and patent counsel engaged; full memo available in the data room.',
  },
  {
    q: 'Where is $ZSOLAR custodied?',
    a: 'Every user gets an embedded Coinbase Wallet on Base L2 — no seed phrases, no chrome extensions. Tokens and milestone NFTs land directly in that wallet. Users can self-custody at any time. Treasury funds sit in a multisig.',
  },
  {
    q: 'What is the token unlock schedule?',
    a: 'Total supply is hard-capped at 1T (cannot be changed). Founder pact-lock: 150B (Joseph) and 50B (Michael) only unlock when $ZSOLAR crosses $6.67 and $20 respectively. LP is seeded in tranches ($200K USDC + 2M $ZSOLAR per round) gated by verified producer growth — never time-released.',
  },
  {
    q: 'How much dilution can I expect at Series A?',
    a: 'Standard SAFE conversion math — we are targeting a Series A 18–24 months out with revenue from three engines (protocol, subscription, aggregated data) live. Cap table modeling and scenarios are in the data room.',
  },
  {
    q: 'What is the exit path?',
    a: 'Two paths. (1) Series A on hardened protocol revenue + multi-OEM moat. (2) Strategic acquisition by a clean-energy incumbent (Tesla, Enphase, Sunrun) wanting a homeowner-facing protocol layer. The patent (U.S. App. 19/634,402) materially improves both.',
  },
  {
    q: 'Who is the competition?',
    a: 'Energy-data aggregators (Sense, Span) lack tokenization. Crypto-energy projects (Powerledger, Energy Web) lack multi-OEM monitoring and consumer reach. We are the only team running first-of-its-kind unified Tesla + Enphase + SolarEdge + Wallbox monitoring live today, with Proof-of-Genesis™ minting on top.',
  },
];

export function InvestorFAQ() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
      <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
        Investor FAQ
      </h2>
      <div className="space-y-2">
        {FAQ.map((item) => (
          <Collapsible key={item.q}>
            <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-card/60 transition-colors">
                <span className="text-[13px] md:text-sm font-medium text-foreground">{item.q}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-4 pb-4 pt-1">
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}
