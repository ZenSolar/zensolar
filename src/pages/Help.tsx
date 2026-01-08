import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, FileText, ExternalLink } from "lucide-react";

const faqs = [
  {
    question: "How do I connect my solar system?",
    answer: "Navigate to the Dashboard and click on the 'Connect' button next to your solar provider (Enphase, Tesla, or SolarEdge). You'll be redirected to authenticate with your provider's account."
  },
  {
    question: "How are $ZSOLAR tokens calculated?",
    answer: "Tokens are calculated based on your verified clean energy production. The exact rates depend on energy type and amount. Check the Tokenomics page for detailed information."
  },
  {
    question: "What is the Sepolia testnet?",
    answer: "Sepolia is an Ethereum test network used for development and testing. During our beta phase, all tokens and NFTs are minted on Sepolia. They have no real-world value but allow you to test the full experience."
  },
  {
    question: "When will the app go live on mainnet?",
    answer: "We're gathering feedback during beta to refine the tokenomics. NFTs will launch first, followed by the full token economy. Subscribe to notifications for updates."
  },
  {
    question: "How do I earn NFTs?",
    answer: "NFTs are automatically minted to your connected wallet when you reach specific milestones (e.g., 100 kWh produced, 1000 miles driven). Check your activity metrics to track progress."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We only access the energy data needed to verify your production. Your private keys never leave your wallet, and we use industry-standard encryption for all data."
  }
];

export default function Help() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mx-auto">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions</p>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              Get Support
            </CardTitle>
            <CardDescription>Have a question not answered here?</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Documentation
            </CardTitle>
            <CardDescription>Read our detailed guides</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Docs
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Beta Feedback */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Beta Feedback</CardTitle>
          <CardDescription>Help us improve ZenSolar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            As a beta tester, your feedback is invaluable. Share your thoughts on the tokenomics, 
            user experience, or any features you'd like to see.
          </p>
          <Button>Share Feedback</Button>
        </CardContent>
      </Card>
    </div>
  );
}
