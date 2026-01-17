import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { HelpCircle, FileText, ExternalLink, MessageCircle, BookOpen, Zap, Shield, Coins, Award, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SupportRequestForm } from "@/components/help/SupportRequestForm";

const faqs = [
  {
    question: "How do I connect my solar system?",
    answer: "Navigate to the Dashboard and click on the 'Connect' button next to your solar provider (Enphase, Tesla, or SolarEdge). You'll be redirected to authenticate with your provider's account.",
    icon: Zap,
    category: "Getting Started"
  },
  {
    question: "How are $ZSOLAR tokens calculated?",
    answer: "Tokens are calculated based on your verified clean energy production. The exact rates depend on energy type and amount. Check the Tokenomics page for detailed information.",
    icon: Coins,
    category: "Tokenomics"
  },
  {
    question: "What is the Sepolia testnet?",
    answer: "Sepolia is an Ethereum test network used for development and testing. During our beta phase, all tokens and NFTs are minted on Sepolia. They have no real-world value but allow you to test the full experience.",
    icon: Shield,
    category: "Blockchain"
  },
  {
    question: "When will the app go live on mainnet?",
    answer: "We're gathering feedback during beta to refine the tokenomics. NFTs will launch first, followed by the full token economy. Subscribe to notifications for updates.",
    icon: Sparkles,
    category: "Roadmap"
  },
  {
    question: "How do I earn NFTs?",
    answer: "NFTs are automatically minted to your connected wallet when you reach specific milestones (e.g., 100 kWh produced, 1000 miles driven). Check your activity metrics to track progress.",
    icon: Award,
    category: "NFTs"
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We only access the energy data needed to verify your production. Your private keys never leave your wallet, and we use industry-standard encryption for all data.",
    icon: Shield,
    category: "Security"
  }
];

export default function Help() {
  const navigate = useNavigate();

  const handleViewDocs = () => {
    window.open("https://zen.solar/docs", "_blank");
  };

  const handleShareFeedback = () => {
    navigate("/feedback");
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help Center</h1>
          <p className="text-muted-foreground mt-2">Find answers and get support for ZenSolar</p>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-3 grid-cols-2"
      >
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group" onClick={handleViewDocs}>
          <CardContent className="pt-6 pb-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Documentation</p>
                <p className="text-xs text-muted-foreground">Read detailed guides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20 hover:border-secondary/40 hover:shadow-lg transition-all cursor-pointer group" onClick={handleShareFeedback}>
          <CardContent className="pt-6 pb-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="font-semibold">Send Feedback</p>
                <p className="text-xs text-muted-foreground">Help us improve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <HelpCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => {
                const Icon = faq.icon;
                return (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b-0">
                    <AccordionTrigger className="text-left py-4 px-3 rounded-lg hover:bg-muted/50 hover:no-underline transition-colors [&[data-state=open]]:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{faq.question}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] font-normal opacity-60">
                            {faq.category}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground px-3 pb-4 pt-2 ml-10">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription>Can't find what you're looking for?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SupportRequestForm />
          </CardContent>
        </Card>
      </motion.div>

      {/* Beta Feedback CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Help Shape ZenSolar</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  As a beta tester, your feedback directly influences our roadmap. Share your thoughts on the tokenomics, user experience, or features you'd love to see.
                </p>
              </div>
              <Button className="mt-4" onClick={handleShareFeedback}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Share Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}