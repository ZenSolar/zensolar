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
    q: 'What is $ZSOLAR?',
    a: '$ZSOLAR is a utility token on the Base blockchain (Coinbase L2). It\'s earned by connecting your solar panels, batteries, or EVs and having your clean energy usage verified through our patent-pending Proof-of-Delta system.',
  },
  {
    q: 'How do I start earning?',
    a: 'Sign up, connect your energy device (Tesla, Enphase, SolarEdge, or Wallbox), and your rewards begin accruing automatically. No manual claiming required — tokens are minted directly to your wallet.',
  },
  {
    q: 'Do I need a crypto wallet?',
    a: 'We support Coinbase Smart Wallet for a gasless, seedless experience — no prior crypto knowledge needed. You can also connect MetaMask or WalletConnect-compatible wallets.',
  },
  {
    q: 'What is Proof-of-Delta?',
    a: 'It\'s our patent-pending verification engine. We compare your device\'s energy readings over time (the "delta") and create an on-chain proof that your kWh data is real — not faked or duplicated.',
  },
  {
    q: 'Are there any fees?',
    a: 'No gas fees for users. ZenSolar covers all blockchain transaction costs. There is a built-in 20% mint burn on every mint, which creates deflationary pressure and long-term value.',
  },
  {
    q: 'What are achievement NFTs?',
    a: 'As you hit energy milestones (first kWh, first 100 kWh, etc.), unique NFTs are minted to your wallet as permanent proof of your clean energy contribution. They\'re collectible and showcase your impact.',
  },
  {
    q: 'Is this available outside the US?',
    a: 'Currently we\'re focused on US-based users during the beta period since our device integrations (Tesla, Enphase, SolarEdge) are primarily US-focused. International expansion is on our roadmap.',
  },
  {
    q: 'What blockchain is $ZSOLAR on?',
    a: 'We\'re built on Base, Coinbase\'s Layer 2 network. This gives us Ethereum-level security with fast, low-cost transactions — perfect for frequent energy reward minting.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-[clamp(3rem,8vw,6rem)]">
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
