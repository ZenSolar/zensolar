import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Do I need any crypto experience to use ZenSolar?",
    answer: "No! ZenSolar is designed for regular people who happen to have solar panels or drive electric vehicles. We handle all the technical blockchain stuff behind the scenes. You just connect your devices, and we take care of the rest—including giving you a built-in wallet that works without downloading any crypto apps.",
  },
  {
    question: "How is this different from government solar incentives?",
    answer: "Government incentives like tax credits are typically one-time benefits when you install solar. ZenSolar rewards you continuously, every single day, for the energy you actually produce. It's ongoing income, not a one-time rebate—and it stacks on top of any government programs you already qualify for.",
  },
  {
    question: "What exactly is $ZSOLAR?",
    answer: "$ZSOLAR is the name of our reward token. Think of it like airline miles or credit card points—except these rewards can be converted to real money. Your $ZSOLAR accumulates automatically based on your verified energy production, and you can cash out to your bank account whenever you want.",
  },
  {
    question: "How do you verify my energy production?",
    answer: "When you connect your Tesla, Enphase, SolarEdge, or Wallbox account, we securely access your production data through their official APIs (the same data you see in their apps). This means every kilowatt-hour and every mile is verified by the hardware itself—no self-reporting or estimates.",
  },
  {
    question: "Is there a catch? What's the downside?",
    answer: "The main 'catch' is that ZenSolar is currently in beta, so reward amounts may adjust as we refine our system. We're transparent about this—we're building something new and learning as we go. There are no hidden fees, no upfront costs, and you can stop using ZenSolar anytime with no penalties.",
  },
  {
    question: "How much can I actually earn?",
    answer: "Earnings depend on your energy production. A typical home solar system producing 10,000 kWh/year would earn rewards throughout the year, plus milestone NFTs (digital collectibles) for hitting production targets. We're still in beta, so exact values are being calibrated—but early users will be rewarded when we launch fully.",
  },
  {
    question: "What happens to my data?",
    answer: "We only access energy production data (kWh generated, miles driven, charging sessions). We never access your personal information, financial data, or device controls. You can disconnect your devices anytime, and your data is deleted upon request.",
  },
  {
    question: "Can I use this outside the United States?",
    answer: "Currently, we support devices available in North America and Europe. If you have a supported device (Tesla, Enphase, SolarEdge, Wallbox) that works in your country, you can likely use ZenSolar. We're expanding support continuously.",
  },
];

export function HowItWorksFAQ() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-3">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground"
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm md:text-base"
        >
          Still have questions? Here are answers to the most common ones.
        </motion.p>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            Common Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <AccordionItem value={`item-${index}`} className="border-border/50">
                  <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline hover:text-primary transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.section>
  );
}
