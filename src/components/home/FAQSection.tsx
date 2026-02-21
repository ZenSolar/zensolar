import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'What is ZenSolar?',
    a: 'ZenSolar is the world\'s first platform that tokenizes clean energy at the kilowatt-hour level. Every kWh your solar panels produce, your battery exports, or your EV consumes is verified and minted as a $ZSOLAR token on-chain. Think of it as turning your clean energy into a permanent digital asset.',
  },
  {
    q: 'How do I start earning?',
    a: 'Sign up, connect your energy device (Tesla, Enphase, SolarEdge, or Wallbox), and your rewards start accruing automatically. No manual claiming, no complicated setup. It takes about 60 seconds.',
  },
  {
    q: 'Do I need any crypto experience?',
    a: 'Not at all. ZenSolar includes a built-in rewards wallet. No browser extensions, no seed phrases, no prior crypto knowledge needed. Think of it like a rewards account for your clean energy.',
  },
  {
    q: 'How does verification work?',
    a: 'We use a patent-pending system called Mint-on-Proof™ that reads your device\'s real energy data, verifies it hasn\'t been tampered with, and then issues your rewards. Every token is backed by real, verified energy activity.',
  },
  {
    q: 'How is $ZSOLAR different from tokenized gold or treasuries?',
    a: 'Bitcoin is scarce because of math. $ZSOLAR is scarce because of physics and math. When Wall Street tokenizes gold or treasuries, those assets can still be re-hypothecated, held by custodians, or duplicated across systems. When you mint $ZSOLAR, the underlying kilowatt-hour of energy that earned it is permanently, irreversibly consumed — cryptographically retired on-chain at the moment of minting. You can\'t re-tokenize a kWh that already happened. Our Proof-of-Delta™ system burns that unit of eligibility at mint time and our Device Watermark Registry makes any attempt to double-mint the same energy publicly provable as fraud. This is a fundamentally more defensible form of digital scarcity.',
  },
  {
    q: 'Where does the value of $ZSOLAR come from?',
    a: 'Your $ZSOLAR tokens are backed by a real USD cash reserve held on a public crypto exchange. As more members join, subscription revenue continuously grows this reserve, meaning your tokens always have a market to trade on and are designed to increase in USD value as the platform grows and more users mint their clean energy into real digital income. The short answer: the value comes from the amount of USD in our liquidity pool.',
  },
  {
    q: 'What can I do with my tokens?',
    a: 'You can redeem $ZSOLAR for Tesla gift cards, Anker & EcoFlow portable power stations, ZenSolar merch, and more in our built-in store. You can also trade them on the exchange or cash out your balance whenever you want.',
  },
  {
    q: 'Why hold my tokens?',
    a: 'As the ZenSolar platform grows, subscription revenue continuously flows into the cash reserve backing your tokens. Combined with built-in token burns that reduce supply over time, holding your tokens means you benefit from increasing demand against a shrinking supply. Early members are positioned to see the most growth.',
  },
  {
    q: 'Are there any fees?',
    a: 'No transaction fees for users. ZenSolar covers all costs. Our subscription plans (starting at $9.99/mo) unlock higher earning rates and premium features, but there are no hidden charges.',
  },
  {
    q: 'What are achievement NFTs?',
    a: 'As you hit energy milestones (your first 500 kWh, first 1,000 miles, etc.), you automatically earn digital collectibles that permanently prove your clean energy contribution. Think of them like badges or trophies for your impact.',
  },
  {
    q: 'Which devices are supported?',
    a: 'We currently support Tesla (Solar, Powerwall, and vehicles), Enphase solar inverters, SolarEdge solar systems, and Wallbox EV chargers. More integrations are on the way.',
  },
  {
    q: 'How much can I earn?',
    a: 'Earnings depend on your energy production and subscription tier. A typical solar homeowner on our Pro plan could earn $4,000–$9,000+ per year in token rewards based on projected rates.',
  },
  {
    q: 'Is ZenSolar available outside the US?',
    a: 'We\'re currently focused on US-based users during our beta period since our device integrations are primarily US-focused. International expansion is on our roadmap.',
  },
  {
    q: 'Is my energy data secure?',
    a: 'Absolutely. We use encrypted API connections to read your device data and we never control your devices. Your energy data is verified and recorded using tamper-proof technology, giving you a permanent, auditable record of your impact.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export function FAQSection() {
  return (
    <section id="faq" className="py-[clamp(3rem,8vw,6rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-energy/40 bg-energy/10 text-energy font-medium mb-4">
              FAQ
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border/60 rounded-lg px-4 bg-card/50 data-[state=open]:bg-card data-[state=open]:shadow-sm transition-all"
              >
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
