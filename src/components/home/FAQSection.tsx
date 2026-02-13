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
    a: 'ZenSolar is a rewards platform that pays you for the clean energy you already produce. Connect your solar panels, home battery, or EV — and earn $ZSOLAR tokens automatically based on your verified energy activity.',
  },
  {
    q: 'How do I start earning?',
    a: 'Sign up, connect your energy device (Tesla, Enphase, SolarEdge, or Wallbox), and your rewards start accruing automatically. No manual claiming, no complicated setup — it takes about 60 seconds.',
  },
  {
    q: 'Do I need any crypto experience?',
    a: 'Not at all. ZenSolar includes a built-in rewards wallet — no browser extensions, no seed phrases, no prior crypto knowledge needed. Think of it like a rewards account for your clean energy.',
  },
  {
    q: 'How does verification work?',
    a: 'We use a patent-pending system called Mint-on-Proof™ that reads your device\'s real energy data, verifies it hasn\'t been tampered with, and then issues your rewards. Every token is backed by real, verified energy activity.',
  },
  {
    q: 'What can I spend my tokens on?',
    a: 'You can redeem $ZSOLAR for Tesla gift cards, Anker & EcoFlow portable power stations, ZenSolar merch, and more in our built-in store. You can also cash out your balance whenever you want.',
  },
  {
    q: 'Are there any fees?',
    a: 'No transaction fees for users — ZenSolar covers all costs. Our subscription plans (starting at $9.99/mo) unlock higher earning rates and premium features, but there are no hidden charges.',
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
    a: 'Absolutely. We use encrypted API connections to read your device data — we never control your devices. Your energy data is verified and recorded using tamper-proof technology, giving you a permanent, auditable record of your impact.',
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
