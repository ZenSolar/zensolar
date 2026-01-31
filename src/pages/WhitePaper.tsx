import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sun, Zap, Coins, Leaf, Users, Globe, ArrowRight, 
  TrendingUp, Shield, Cpu, Target, Sparkles, Battery,
  Car, Home, Building2, Landmark, Heart, Rocket,
  ChevronRight, ExternalLink, FileText, Share2, Star,
  DollarSign, Download, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { MintOnProofFlowDiagram } from '@/components/whitepaper/MintOnProofFlowDiagram';
import { MintOnProofComparison } from '@/components/whitepaper/MintOnProofComparison';
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Market data
const marketStats = [
  { label: "TAM", value: "$150B+", description: "Clean energy incentives market" },
  { label: "SAM", value: "$15B", description: "Residential solar/EV segment" },
  { label: "SOM", value: "$1.5B", description: "Early adopter households" },
];

// Stakeholder benefits
const userBenefits = [
  {
    icon: Coins,
    title: "Significant Side Income",
    description: "Earn $400-$1,000/month in $ZSOLAR tokens—transforming your clean energy activities into a meaningful income stream that rivals traditional tax incentives.",
  },
  {
    icon: Sparkles,
    title: "Beyond Tax Credits",
    description: "Federal incentives are one-time and bureaucratic. $ZSOLAR rewards are ongoing, automatic, and grow as the token appreciates—a renewable income source for renewable energy.",
  },
  {
    icon: Shield,
    title: "Hardware-Agnostic Platform",
    description: "Works with Tesla, Enphase, SolarEdge, Wallbox, and more. No new equipment needed—just connect your existing systems.",
  },
  {
    icon: TrendingUp,
    title: "Appreciating Utility Token",
    description: "As $ZSOLAR grows from $0.10 to $1.00+, early adopters multiply their rewards 10x—creating lasting income from sustainability.",
  },
];

const investorBenefits = [
  {
    icon: Landmark,
    title: "Revenue-Backed Token Economics",
    description: "Unlike speculative tokens, $ZSOLAR is backed by real subscription revenue. 50% of every $9.99/month subscription is automatically injected into the liquidity pool.",
  },
  {
    icon: Target,
    title: "Clear Path to 10x",
    description: "$0.10 launch floor with transparent mechanics driving toward $1.00. The 'Tipping Point' at 25,000 subscribers creates self-sustaining price support.",
  },
  {
    icon: Shield,
    title: "Aggressive Deflationary Mechanics",
    description: "20% of all minted tokens are permanently burned. 7% transfer tax (3% burn, 2% LP, 2% treasury) creates continuous scarcity.",
  },
  {
    icon: Cpu,
    title: "Patent-Pending Mint-on-Proof",
    description: "First-mover advantage with patent-pending 'Mint-on-Proof' verification system. Hardware-neutral approach creates defensible moat.",
  },
];

const worldBenefits = [
  {
    icon: Sun,
    title: "Market-Driven Solar Adoption",
    description: "By creating perpetual income incentives, $ZSOLAR accelerates solar adoption faster than one-time tax credits ever could—turning policy into profit.",
  },
  {
    icon: Car,
    title: "Supercharging EV Growth",
    description: "Every EV mile driven earns rewards. When driving electric generates $200+/month in side income, the economic case for EVs becomes undeniable.",
  },
  {
    icon: Battery,
    title: "Grid Resilience & Independence",
    description: "Battery storage rewards encourage homeowners to become distributed energy resources—reducing dependency on aging infrastructure and fossil peakers.",
  },
  {
    icon: Globe,
    title: "Policy-Proof Climate Finance",
    description: "Unlike federal incentives that change with elections, $ZSOLAR provides permanent, decentralized rewards—making clean energy adoption immune to political shifts.",
  },
];

export default function WhitePaper() {
  const { toast } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: "ZenSolar White Paper",
      text: "Turning Clean Energy Into Digital Income - Learn how $ZSOLAR rewards households for sustainable living.",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard!" });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard!" });
      }
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExportingPDF(true);
    toast({ title: "Generating PDF...", description: "This may take a moment." });

    const fileName = `ZenSolar-WhitePaper-${new Date().toISOString().split("T")[0]}.pdf`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = contentRef.current;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: fileName,
        image: { type: "jpeg" as const, quality: 0.9 },
        html2canvas: { 
          scale: isMobile ? 1.5 : 2, 
          useCORS: true, 
          logging: false,
          allowTaint: true,
          scrollY: -window.scrollY,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      if (isMobile) {
        // Mobile: generate blob and try multiple download methods
        try {
          const pdfBlob = await html2pdf().set(opt).from(element).outputPdf("blob");
          const blobUrl = URL.createObjectURL(pdfBlob);
          
          // Try using navigator.share for iOS/Android
          if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName, { type: "application/pdf" })] })) {
            const file = new File([pdfBlob], fileName, { type: "application/pdf" });
            await navigator.share({ files: [file], title: "ZenSolar White Paper" });
            toast({ title: "PDF ready to share!" });
          } else {
            // Fallback: open in new tab (works better on iOS Safari)
            const newTab = window.open(blobUrl, "_blank");
            if (newTab) {
              toast({ title: "PDF opened in new tab", description: "Use your browser's share/save option." });
            } else {
              // Last resort: create download link
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = fileName;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
              }, 1000);
              toast({ title: "PDF downloading...", description: "Check your Downloads folder." });
            }
          }
          
          // Cleanup after delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        } catch (mobileError) {
          console.error("Mobile PDF error:", mobileError);
          // Ultimate fallback: use browser print
          toast({ 
            title: "Opening print dialog", 
            description: "Select 'Save as PDF' from the options." 
          });
          setTimeout(() => window.print(), 500);
        }
      } else {
        // Desktop: standard save
        await html2pdf().set(opt).from(element).save();
        toast({ title: "PDF downloaded!", description: fileName });
      }
    } catch (error) {
      console.error("PDF export error:", error);
      // Fallback to browser print for all errors
      toast({ 
        title: "Opening print dialog", 
        description: "Select 'Save as PDF' to download." 
      });
      setTimeout(() => window.print(), 500);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <SEO 
        title="ZenSolar White Paper - Clean Energy Blockchain Rewards"
        url="https://zensolar.lovable.app/white-paper"
        image="https://zensolar.lovable.app/og-whitepaper.png"
      />
      <div className="min-h-screen bg-background">
      {/* Fixed Navigation Header - only shown for unauthenticated users (landing page visitors) */}
      {!isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
          <div className="container max-w-4xl mx-auto px-4 flex h-14 items-center justify-between gap-4">
            <Link to="/" className="flex items-center shrink-0">
              <img 
                src={zenLogo} 
                alt="ZenSolar" 
                className="h-8 w-auto dark:animate-logo-glow"
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">Log In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 px-2 sm:px-4">
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main content with proper top padding - different for authenticated vs unauthenticated */}
      <div ref={contentRef} className={`container max-w-4xl mx-auto px-4 pb-8 space-y-12 ${isAuthenticated ? 'pt-6' : 'pt-[calc(3.5rem+env(safe-area-inset-top)+1.5rem)]'}`}>
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center space-y-6 pt-4"
      >
        {/* Clean Logo - transparent background */}
        <div className="inline-block">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-16 w-auto md:h-24 object-contain mx-auto dark:animate-logo-glow"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="px-4 py-1.5 border-primary/40 bg-primary/10 text-sm font-medium">
              <FileText className="h-3.5 w-3.5 mr-2 text-primary" />
              White Paper v1.0
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="gap-1.5"
            >
              {isExportingPDF ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              PDF
            </Button>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Turning Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Digital Income
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            ZenSolar is building the bridge between sustainable living and financial prosperity—
            rewarding households for the clean energy they already produce.
          </p>
        </div>
      </motion.div>

      <Separator className="bg-border/50" />

      {/* Executive Summary */}
      <motion.section {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg dark:prose-invert max-w-none relative z-10 space-y-4">
            <p className="text-muted-foreground text-lg leading-relaxed">
              <strong className="text-foreground">ZenSolar</strong> is a blockchain-powered rewards platform that 
              transforms clean energy production into verifiable digital assets. Using our patent-pending 
              <strong className="text-primary"> Mint-on-Proof</strong> architecture powered by SEGI (Software-Enabled Gateway Interface), 
              users earn <strong className="text-foreground">$ZSOLAR tokens</strong> and collectible NFTs proportional 
              to their verified environmental impact—with just one tap.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're not asking anyone to change their behavior—we're <em>rewarding</em> the millions of homeowners 
              who have already invested in sustainability. Our mission is simple: make doing good for the planet 
              financially rewarding.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Who We Are */}
      <motion.section {...fadeIn} transition={{ delay: 0.15 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 1</Badge>
          <h2 className="text-3xl font-bold">Who We Are</h2>
        </div>
        
        <Card>
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              ZenSolar was founded on a fundamental observation: <strong className="text-foreground">millions of 
              households are generating clean energy every day, yet receive no recognition beyond their utility bill.</strong>
            </p>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're a team of climate tech enthusiasts, blockchain developers, and renewable energy advocates who 
              believe the transition to clean energy should be financially rewarding for everyone—not just corporations 
              and governments. We've built a platform that connects to the world's leading energy hardware providers 
              (Tesla, Enphase, SolarEdge, Wallbox) and converts verified activity data into blockchain-certified rewards.
            </p>

            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 shrink-0">
                  <Cpu className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Patent-Pending Mint-on-Proof Technology</h3>
                  <p className="text-muted-foreground">
                    Our <strong className="text-foreground">Software-Enabled Gateway Interface (SEGI)</strong> powers the world's first 
                    <strong className="text-primary"> Mint-on-Proof</strong> architecture—a proprietary system for tokenizing sustainable 
                    behaviors using blockchain. Unlike hardware-dependent solutions, SEGI works entirely through secure API 
                    connections—making onboarding instant and one-tap minting possible.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* SEGI Flow Diagram */}
        <MintOnProofFlowDiagram />

        {/* Mint-on-Proof Comparison */}
        <MintOnProofComparison autoPlay={true} showControls={false} />
      </motion.section>

      {/* Our Mission */}
      <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 2</Badge>
          <h2 className="text-3xl font-bold">Our Mission</h2>
        </div>
        
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
                <Heart className="h-10 w-10 text-white" />
              </div>
              
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed max-w-2xl mx-auto">
                "To recognize and reward everyday climate heroes by converting their sustainable actions into 
                verifiable, on-chain income."
              </blockquote>
              
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Climate change is the defining challenge of our generation. While governments debate and corporations 
                pivot, <strong className="text-foreground">millions of homeowners have already taken action</strong>—installing 
                solar panels, driving electric vehicles, and making sustainable choices every day. ZenSolar exists 
                to celebrate and compensate these pioneers.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center">
              <Sun className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Track</h3>
              <p className="text-sm text-muted-foreground">Securely connect your energy systems</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Verify</h3>
              <p className="text-sm text-muted-foreground">Authenticate production on-chain</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center">
              <Coins className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Reward</h3>
              <p className="text-sm text-muted-foreground">Earn tokens proportional to impact</p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Total Addressable Market */}
      <motion.section {...fadeIn} transition={{ delay: 0.25 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 3</Badge>
          <h2 className="text-3xl font-bold">The Opportunity</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              Total Addressable Market
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              The clean energy transition is accelerating. Globally, residential solar installations have grown 
              at 25%+ annually, and EV sales are projected to reach 40% of new car sales by 2030. Yet no platform 
              exists to reward individuals for their contribution to this transformation.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {marketStats.map((stat, i) => (
                <div key={stat.label} className="text-center p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-xl p-6 border border-border/50 space-y-4">
              <h3 className="font-semibold text-lg">Market Breakdown</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">4+ million</strong>
                    <span className="text-muted-foreground"> US households with solar installations (growing 25% YoY)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">3+ million</strong>
                    <span className="text-muted-foreground"> EVs on US roads (accelerating toward 40% of new sales by 2030)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Battery className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">500,000+</strong>
                    <span className="text-muted-foreground"> home battery systems installed (Tesla Powerwall alone)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-foreground">2+ million</strong>
                    <span className="text-muted-foreground"> smart EV chargers in homes (Wallbox, ChargePoint, etc.)</span>
                  </div>
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground text-lg">
              ZenSolar targets the intersection of these markets: <strong className="text-foreground">tech-savvy 
              households with multiple clean energy assets</strong> who want to maximize the return on their 
              sustainability investments.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Replacing Federal Incentives */}
      <motion.section {...fadeIn} transition={{ delay: 0.27 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 4</Badge>
          <h2 className="text-3xl font-bold">Replacing Federal Tax Incentives</h2>
        </div>
        
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Landmark className="h-5 w-5 text-amber-600" />
              </div>
              The Problem With Tax Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              For decades, federal and state tax incentives have been the primary driver of residential clean energy 
              adoption. The 30% Investment Tax Credit (ITC), EV tax credits up to $7,500, and various state rebates 
              have made sustainability more accessible. <strong className="text-foreground">But this model is fundamentally broken.</strong>
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <span className="text-lg">❌</span> One-Time Benefits
                </h4>
                <p className="text-sm text-muted-foreground">
                  Tax credits are claimed once, then disappear. Your solar panels produce value every day for 25+ years—
                  why should you only be rewarded once?
                </p>
              </div>
              <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <span className="text-lg">❌</span> Political Vulnerability
                </h4>
                <p className="text-sm text-muted-foreground">
                  Every election cycle threatens clean energy incentives. Subsidies change, expire, or get repealed—
                  creating uncertainty for homeowners and investors alike.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <span className="text-lg">❌</span> Bureaucratic Complexity
                </h4>
                <p className="text-sm text-muted-foreground">
                  Claiming tax credits requires navigating IRS forms, income thresholds, phase-outs, and transfer rules. 
                  Many eligible households simply don't claim what they're owed.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <span className="text-lg">❌</span> Inequitable Distribution
                </h4>
                <p className="text-sm text-muted-foreground">
                  Tax credits primarily benefit those with tax liability. Lower-income households who lease panels 
                  or don't owe enough taxes often receive reduced or zero benefit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
              The $ZSOLAR Solution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              <strong className="text-foreground">$ZSOLAR creates a perpetual, decentralized incentive layer</strong> that 
              works alongside—or entirely independent of—government policy. Instead of waiting for Washington to act, 
              we've built a market-driven reward system that pays users every single month.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                  <span className="text-lg">✓</span> Ongoing Rewards
                </h4>
                <p className="text-sm text-muted-foreground">
                  Earn $ZSOLAR every month based on verified production. Your solar panels, EV, and batteries 
                  generate income for as long as you own them—not just once.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                  <span className="text-lg">✓</span> Policy-Immune
                </h4>
                <p className="text-sm text-muted-foreground">
                  Blockchain rewards don't depend on elections or legislation. $ZSOLAR operates on immutable 
                  smart contracts—no politician can vote away your earnings.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                  <span className="text-lg">✓</span> Instant & Automatic
                </h4>
                <p className="text-sm text-muted-foreground">
                  No paperwork. No tax forms. No accountants. Connect your devices, and rewards appear in your 
                  wallet automatically—verified on-chain and ready to use.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                  <span className="text-lg">✓</span> Universally Accessible
                </h4>
                <p className="text-sm text-muted-foreground">
                  Whether you own or lease, have high or low tax liability—$ZSOLAR rewards are distributed 
                  proportionally to energy activity, not financial status.
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">The Math: $ZSOLAR vs. Federal Tax Credit</h4>
                  <p className="text-muted-foreground mb-4">
                    A typical $30,000 solar installation receives a one-time $9,000 federal tax credit. Compare that 
                    to $ZSOLAR earnings:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-lg bg-background/50">
                      <p className="font-semibold mb-2">Federal Tax Credit</p>
                      <p className="text-2xl font-bold text-muted-foreground">$9,000</p>
                      <p className="text-xs text-muted-foreground">One time, year of purchase</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-semibold mb-2">$ZSOLAR (at $1.00/token)</p>
                      <p className="text-2xl font-bold text-primary">$96,000+</p>
                      <p className="text-xs text-muted-foreground">~$400/mo × 20 years of production</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Driving Market Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              The clean energy market has historically relied on government incentives to drive adoption. 
              <strong className="text-foreground"> $ZSOLAR introduces a new demand catalyst:</strong> the promise of perpetual 
              income from sustainability investments.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Sun className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Accelerating Solar Sales</h4>
                  <p className="text-sm text-muted-foreground">
                    When solar installers can pitch "$400-$800/month in side income" alongside utility savings and tax 
                    credits, conversion rates will skyrocket. $ZSOLAR becomes a sales accelerator for the entire industry.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">EV Adoption Catalyst</h4>
                  <p className="text-sm text-muted-foreground">
                    The #1 barrier to EV adoption is upfront cost. When consumers realize their electric miles 
                    generate $100-$200/month in token income, the total cost of ownership becomes dramatically favorable.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Battery className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Battery Storage Demand</h4>
                  <p className="text-sm text-muted-foreground">
                    Home batteries have struggled for ROI justification. $ZSOLAR rewards for storage activity make 
                    batteries not just grid-resilient, but income-generating assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                The Flywheel Effect
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                More users → More demand for clean energy hardware → Larger TAM → More users discovering $ZSOLAR → 
                Deeper liquidity → Higher token value → Even more compelling user economics
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Market Landscape & Competitive Positioning */}
      <motion.section {...fadeIn} transition={{ delay: 0.3 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 5</Badge>
          <h2 className="text-3xl font-bold">Market Landscape & Competitive Positioning</h2>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">First-Mover Advantage in Verified Energy Tokenization</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The intersection of clean energy and blockchain technology represents one of the most compelling opportunities 
                in the emerging decentralized economy. While numerous projects have attempted to bridge these domains, the 
                market has lacked a comprehensive, consumer-accessible solution that transforms verified energy activity into 
                on-chain value without requiring specialized hardware, complex integrations, or technical expertise.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">ZenSolar enters this market as the first platform to deliver true on-demand 
                token minting triggered by real-time, API-verified energy data across multiple verticals</strong>—Solar Production, 
                Battery Storage, Electric Vehicle Usage, and EV Charging. This first-mover position is not merely temporal; it 
                represents a fundamental architectural breakthrough that existing and emerging approaches have not replicated.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">The SEGI Innovation: Patent-Pending Technology</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At the core of ZenSolar's competitive moat lies the <strong className="text-foreground">Software-Enabled Gateway 
                Interface (SEGI)</strong>—a patent-pending architecture that fundamentally reimagines how energy data translates 
                to blockchain value. Unlike legacy approaches that rely on hardware installations, periodic manual reporting, or 
                distribution from pre-minted token pools, SEGI operates as a pure software layer that:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Aggregates</strong> data from existing consumer devices (Tesla, Enphase, SolarEdge, Wallbox, and expandable to dozens of additional vehicle brands) without requiring proprietary hardware</li>
                <li><strong className="text-foreground">Verifies</strong> energy production, consumption, storage, and transportation metrics through authenticated API connections with millisecond-level precision</li>
                <li><strong className="text-foreground">Computes</strong> a unified "Impact Score" that translates diverse energy activities into a single, auditable reward metric</li>
                <li><strong className="text-foreground">Mints</strong> $ZSOLAR tokens directly to user wallets on Base L2 (Ethereum) in a trustless, verifiable transaction—not distributed from a pre-allocated pool, but created on-demand based on proven activity</li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This architecture represents a <strong className="text-foreground">paradigm shift</strong> from the "earn-from-pool" 
                models prevalent in the market to a "mint-on-proof" model where every token in circulation is backed by verified 
                clean energy impact.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Deflationary Economics: A First-of-Its-Kind Model</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ZenSolar's tokenomics introduce an innovative deflationary mechanism unprecedented in the energy-to-crypto sector. 
                While alternative approaches typically operate on inflationary emission schedules (distributing tokens from fixed 
                supplies over multi-year periods), ZenSolar implements a fundamentally different model:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Mint-Time Deflation:</strong> A portion of every reward mint is simultaneously burned—creating immediate deflationary pressure at the point of token creation</li>
                <li><strong className="text-foreground">Transfer-Time Sustainability:</strong> Secondary market transactions contribute to ecosystem health through allocations to permanent burns, liquidity pools, and development treasury</li>
                <li><strong className="text-foreground">No Pre-Minted Supply:</strong> Unlike projects with fixed total supplies awaiting distribution, $ZSOLAR's circulating supply is determined entirely by verified user activity—ensuring the token economy scales organically with real-world adoption</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This model solves the fundamental tension in reward-based tokenomics: how to incentivize participation without 
                creating unsustainable inflation. By applying burn mechanics at multiple points, ZenSolar creates a self-balancing 
                system where increased adoption actually strengthens token scarcity.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Unified Multi-Vertical Aggregation</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The clean energy ecosystem is inherently fragmented—solar installations, battery systems, electric vehicles, and 
                charging infrastructure each represent distinct hardware categories, API ecosystems, and data formats. Existing 
                market participants have universally focused on single verticals: solar-only rewards, EV-mileage tracking, or 
                charging-station tokens.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">ZenSolar is the first and only platform to unify all four energy verticals 
                into a single, cohesive rewards interface.</strong> A homeowner with rooftop solar, a home battery, an electric 
                vehicle, and a charger earns $ZSOLAR across their entire energy footprint—not through four separate apps with four 
                different tokens, but through one dashboard with one universal reward currency.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This unified approach creates powerful network effects: users who connect one device are incentivized to connect 
                additional devices, and the platform's value proposition strengthens with each integration. The milestone NFT 
                system further rewards multi-device adoption, creating a virtuous cycle of engagement.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Hardware Agnosticism as Strategic Moat</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A critical differentiator in ZenSolar's architecture is its complete hardware independence. The platform requires 
                no proprietary devices, no "mining nodes," no physical installations beyond what users already own. This creates 
                three strategic advantages:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Zero Barrier to Entry:</strong> Users with existing compatible devices can begin earning within 60 seconds of account creation</li>
                <li><strong className="text-foreground">Scalable Economics:</strong> Without hardware costs, the platform can operate at software-company margins while alternative approaches bear manufacturing, distribution, and support costs</li>
                <li><strong className="text-foreground">Future-Proof Extensibility:</strong> As new energy devices enter the market (next-generation batteries, bidirectional chargers, vehicle-to-grid systems), SEGI can integrate new APIs without hardware retrofits</li>
              </ol>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Intellectual Property Strategy</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ZenSolar's first-mover advantage is reinforced by a deliberate intellectual property strategy. The patent-pending 
                SEGI architecture covers the novel combination of:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>API-based energy data verification from consumer devices</li>
                <li>Real-time impact score computation across multiple energy categories</li>
                <li>On-demand token minting triggered by verified activity thresholds</li>
                <li>Deflationary burn mechanics applied at the point of minting</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Comprehensive patent landscape research has identified no existing claims covering this methodology. The closest 
                prior art addresses hardware-dependent systems rather than software-only gateway interfaces. This IP position 
                creates a defensive moat that compounds over time as the patent application progresses.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
              <h3 className="font-semibold text-lg mb-3">Competitive Positioning Summary</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                ZenSolar occupies a unique position in the market: the only platform combining verified on-demand minting, 
                deflationary tokenomics, multi-vertical aggregation, and hardware agnosticism into a consumer-accessible 
                application. This is not an incremental improvement over existing solutions—it represents a <strong className="text-foreground">
                category-defining innovation</strong> that establishes new standards for how clean energy participation 
                translates to blockchain value.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                As the clean energy transition accelerates and consumer adoption of solar, storage, and EVs continues its 
                exponential growth, ZenSolar is positioned to become the default rewards layer for the entire ecosystem—not 
                by competing on any single vertical, but by unifying them all under a technologically superior, economically 
                sustainable, and legally defensible platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How Users Benefit */}
      <motion.section {...fadeIn} transition={{ delay: 0.35 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 6</Badge>
          <h2 className="text-3xl font-bold">How Users Benefit</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {userBenefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <benefit.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💰</div>
              <div>
                <h3 className="font-semibold text-lg">Significant Side Income Potential</h3>
                <p className="text-muted-foreground">
                  Active solar households with EV can earn <strong className="text-foreground">$400-$1,000/month</strong> in 
                  $ZSOLAR tokens—transforming clean energy ownership into a recurring income stream that 
                  compounds as the token appreciates toward $1.00.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How Investors Benefit */}
      <motion.section {...fadeIn} transition={{ delay: 0.4 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 7</Badge>
          <h2 className="text-3xl font-bold">How Investors Benefit</h2>
        </div>
        
        <Card>
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg">
              $ZSOLAR is designed as a <strong className="text-foreground">utility currency</strong>—functional 
              for spending today, valuable for holding long-term. Unlike speculative tokens, our economics are 
              backed by real subscription revenue.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {investorBenefits.map((benefit, i) => (
                <div key={benefit.title} className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Token Economics at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">10B</p>
                <p className="text-xs text-muted-foreground">Max Supply</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">$0.10</p>
                <p className="text-xs text-muted-foreground">Launch Floor</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">20%</p>
                <p className="text-xs text-muted-foreground">Mint Burn Rate</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">$1.00</p>
                <p className="text-xs text-muted-foreground">Target Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/30">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📈</div>
              <div>
                <h3 className="font-semibold text-lg">The "Tipping Point"</h3>
                <p className="text-muted-foreground">
                  At <strong className="text-foreground">25,000 subscribers</strong>, the ecosystem generates 
                  <strong className="text-foreground"> $125,000/month</strong> in automatic LP injections—matching 
                  the initial seed and creating self-sustaining price support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How the World Benefits */}
      <motion.section {...fadeIn} transition={{ delay: 0.5 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 8</Badge>
          <h2 className="text-3xl font-bold">How the World Benefits</h2>
        </div>
        
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg">
              ZenSolar's impact extends beyond individual rewards. By creating direct financial incentives for 
              clean energy adoption, we're accelerating the transition that governments and corporations have 
              struggled to catalyze.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {worldBenefits.map((benefit, i) => (
                <div key={benefit.title} className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border/50">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shrink-0">
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <Leaf className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-semibold">Environmental Impact Tracking</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every $ZSOLAR token represents verified environmental impact. Our <strong className="text-foreground">Impact Score</strong> (0.7 kg CO2 per kWh) 
                translates user activity into tangible carbon offset metrics—creating accountability and transparency 
                in the fight against climate change.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* The Vision */}
      <motion.section {...fadeIn} transition={{ delay: 0.55 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 9</Badge>
          <h2 className="text-3xl font-bold">The Vision</h2>
        </div>
        
        <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/30 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
          <CardContent className="py-10 relative z-10">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              
              <blockquote className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                "In five years, every clean energy household earns $500+/month in $ZSOLAR—funding their 
                complete transition to sustainability."
              </blockquote>
              
              <p className="text-muted-foreground">
                We envision a world where sustainable living isn't just ethically rewarding—it's financially 
                transformative. Where solar panels aren't just an environmental choice, but an income-generating asset. 
                Where driving electric doesn't just save on gas, but builds generational wealth.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Moonshot Scenarios */}
      <motion.section {...fadeIn} transition={{ delay: 0.57 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 10</Badge>
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            Moonshot Scenarios <Rocket className="h-7 w-7 text-amber-500" />
          </h2>
        </div>
        
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5">
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg">
              While our <strong className="text-foreground">$1.00 target</strong> creates noticeable passive income, 
              aggressive deflation, viral adoption, and institutional demand could drive $ZSOLAR to{' '}
              <strong className="text-foreground">$5, $10, or even $20+ per token</strong>—transforming passive 
              income into genuine wealth creation.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center">
                <Star className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-amber-600">$5.00</p>
                <p className="text-sm text-muted-foreground mt-1">Conservative Moonshot</p>
                <p className="text-xs text-muted-foreground mt-2">50K+ subs, net-negative issuance</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 text-center">
                <Rocket className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-orange-600">$10.00</p>
                <p className="text-sm text-muted-foreground mt-1">Viral Adoption</p>
                <p className="text-xs text-muted-foreground mt-2">100K+ subs, institutional interest</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center">
                <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-purple-600">$20+</p>
                <p className="text-sm text-muted-foreground mt-1">ESG/Carbon Integration</p>
                <p className="text-xs text-muted-foreground mt-2">Carbon market adoption, regulatory tailwinds</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 border border-border/50 space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Wealth Creation Math
              </h4>
              <p className="text-muted-foreground">
                An active household earning <strong className="text-foreground">1,000 tokens/month</strong> over 
                8+ years accumulates <strong className="text-foreground">100,000+ $ZSOLAR</strong>:
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xl font-bold text-primary">$100K</p>
                  <p className="text-xs text-muted-foreground">at $1.00</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xl font-bold text-amber-600">$500K</p>
                  <p className="text-xs text-muted-foreground">at $5.00</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xl font-bold text-purple-600">$1M+</p>
                  <p className="text-xs text-muted-foreground">at $10.00</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Key Moonshot Drivers:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { title: "Aggressive Deflation", desc: "20% mint burn + 7% transfer tax compounds into net-negative issuance" },
                  { title: "Flywheel Scarcity", desc: "100K+ subs = $500K+/mo LP injections against shrinking supply" },
                  { title: "Institutional ESG Demand", desc: "Carbon credits, ESG funds, impact investors create external buy pressure" },
                  { title: "Regulatory Tailwinds", desc: "Government carbon pricing could supercharge verified energy tokens" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Competitive Advantage */}
      <motion.section {...fadeIn} transition={{ delay: 0.6 }} className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1">Chapter 10</Badge>
          <h2 className="text-3xl font-bold">Competitive Moat</h2>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                { title: "Patent-Pending IP", description: "Energy-to-blockchain verification system under patent protection", icon: Shield },
                { title: "First-Mover Advantage", description: "No competitors in verified energy-backed token rewards", icon: Rocket },
                { title: "Hardware Neutrality", description: "Works with Tesla, Enphase, SolarEdge, Wallbox—not locked to one provider", icon: Globe },
                { title: "Network Effects", description: "More users = deeper liquidity = stronger price floor = more users", icon: Users },
              ].map((item, i) => (
                <div key={item.title} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* CTA */}
      <motion.section {...fadeIn} transition={{ delay: 0.65 }} className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30">
          <CardContent className="py-10">
            <div className="text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">Join the Clean Energy Revolution</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're a homeowner ready to monetize your sustainability investments, or an investor 
                looking for the next paradigm shift in climate finance—ZenSolar welcomes you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2 shadow-lg">
                  <Link to="/">
                    Start Earning
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/tokenomics">
                    View Tokenomics
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/technology">
                    Explore Technology
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <motion.footer {...fadeIn} transition={{ delay: 0.7 }} className="text-center space-y-4 py-8">
        <Separator className="bg-border/50" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">ZenSolar</strong> • Patent Pending • Built on Base L2
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            This white paper is for informational purposes only. $ZSOLAR tokens have no monetary value during 
            beta testing on Sepolia testnet. Tokenomics and features are subject to change.
          </p>
        </div>
      </motion.footer>
      </div>
      </div>
    </>
  );
}
