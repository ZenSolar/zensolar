import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { 
  Sun, Zap, Coins, Leaf, Users, Globe, ArrowRight, 
  TrendingUp, Shield, Cpu, Target, Sparkles, Battery,
  Car, Home, Building2, Landmark, Heart, Rocket,
  ChevronRight, ChevronDown, ExternalLink, FileText, Share2, Star,
  DollarSign, Download, Loader2, AlertTriangle, Calendar,
  ArrowUp, BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { MintOnProofFlowDiagram } from '@/components/whitepaper/MintOnProofFlowDiagram';
import { MintOnProofComparison } from '@/components/whitepaper/MintOnProofComparison';
import { TokenomicsPieChart } from '@/components/whitepaper/TokenomicsPieChart';
import { RewardsFlywheelDiagram } from '@/components/whitepaper/RewardsFlywheelDiagram';
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { SectionDivider } from "@/components/ui/section-divider";


// Chapter Header component - editorial style, mobile-first
function ChapterHeader({ chapter, title, subtitle }: { chapter: number; title: string; subtitle?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary/60">
          Chapter {chapter}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}

// Collapsible chapter wrapper
function CollapsibleChapter({ 
  id, chapter, title, subtitle, children, isExpanded, onToggle 
}: { 
  id: string; chapter: number; title: string; subtitle?: string; 
  children: React.ReactNode; isExpanded: boolean; onToggle: () => void; 
}) {
  return (
    <motion.section id={id} {...fadeIn} className="scroll-mt-20">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left group cursor-pointer">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary/60">
                  Chapter {chapter}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight group-hover:text-primary/80 transition-colors">{title}</h2>
              {subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">{subtitle}</p>
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-6 mt-6">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.section>
  );
}

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
    title: "Patent-Pending Mint-on-Proof™",
    description: "First-mover advantage with patent-pending 'Mint-on-Proof™' verification system. Hardware-neutral approach creates defensible moat.",
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

const chapters = [
  { id: 'executive-summary', ch: '', title: 'Executive Summary' },
  { id: 'ch-1', ch: '1', title: 'Who We Are' },
  { id: 'ch-2', ch: '2', title: 'Our Mission' },
  { id: 'ch-3', ch: '3', title: 'The Opportunity' },
  { id: 'ch-4', ch: '4', title: 'Replacing Tax Incentives' },
  { id: 'ch-5', ch: '5', title: 'Tokenization Supercycle' },
  { id: 'ch-6', ch: '6', title: 'Market & Competitive Position' },
  { id: 'ch-7', ch: '7', title: 'How Users Benefit' },
  { id: 'ch-8', ch: '8', title: 'How Investors Benefit' },
  { id: 'ch-9', ch: '9', title: 'How the World Benefits' },
  { id: 'ch-10', ch: '10', title: 'The Vision' },
  { id: 'ch-11', ch: '11', title: 'Moonshot Scenarios' },
  { id: 'ch-12', ch: '12', title: 'Competitive Moat' },
  { id: 'ch-13', ch: '13', title: 'Roadmap' },
  { id: 'ch-14', ch: '14', title: 'Risk Factors' },
];

export default function WhitePaper() {
  const { toast } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeChapter, setActiveChapter] = useState('executive-summary');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['executive-summary', 'ch-1', 'ch-2', 'ch-3']);

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }, []);

  const contentRef = useRef<HTMLDivElement>(null);

  // Get active chapter info for floating chip
  const activeChapterInfo = chapters.find(c => c.id === activeChapter);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  // Scroll progress + back-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active chapter tracking via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    chapters.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Fixed Navigation Header - only shown for unauthenticated users (landing page visitors) */}
      {!isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
          <div className="container max-w-7xl mx-auto px-4 flex h-14 items-center justify-between gap-4">
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

      {/* Two-column layout: sidebar TOC + content */}
      <div className={`container max-w-7xl mx-auto px-4 ${isAuthenticated ? 'pt-6' : 'pt-[calc(3.5rem+env(safe-area-inset-top)+1.5rem)]'}`}>
        <div className="xl:grid xl:grid-cols-[240px_1fr] xl:gap-10">

          {/* Sticky Sidebar TOC - desktop only */}
          <aside className="hidden xl:block">
            <div className="sticky top-20 py-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4 px-3">
                Contents
              </p>
              <nav className="space-y-0.5">
                {chapters.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg transition-all duration-200 leading-snug',
                      activeChapter === item.id
                        ? 'text-primary bg-primary/8 font-medium border-l-2 border-primary -ml-[2px]'
                        : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    {item.ch && (
                      <span className={cn(
                        'text-[11px] font-mono w-5 shrink-0 transition-colors',
                        activeChapter === item.id ? 'text-primary/70' : 'text-muted-foreground/40'
                      )}>
                        {item.ch}.
                      </span>
                    )}
                    {!item.ch && <span className="w-5 shrink-0" />}
                    {item.title}
                  </a>
                ))}
              </nav>

              {/* Sidebar progress indicator */}
              <div className="mt-6 px-3">
                <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">
                  {Math.round(scrollProgress)}% read
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div ref={contentRef} className="max-w-4xl pb-8 space-y-8 sm:space-y-14 [&_p.text-lg]:text-[15px] [&_p.text-lg]:sm:text-lg [&_.space-y-6]:space-y-4 [&_.space-y-6]:sm:space-y-6">
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
              White Paper v2.0 · February 2026
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
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-[1.15] tracking-tight">
            Turning Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Digital Income
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            ZenSolar is building the bridge between sustainable living and financial prosperity —
            rewarding households for the clean energy they already produce.
          </p>
        </div>
      </motion.div>

      <Separator className="bg-border/50" />

      {/* Mobile Table of Contents - collapsible, shown only below xl */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="xl:hidden">
        <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                <span className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Table of Contents
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
                  tocOpen && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-4 grid sm:grid-cols-2 gap-x-6 gap-y-0.5">
                {chapters.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setTocOpen(false)}
                    className={cn(
                      'flex items-center gap-1.5 py-1.5 text-[13px] transition-colors',
                      activeChapter === item.id
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground/70 hover:text-foreground'
                    )}
                  >
                    {item.ch && <span className="text-[11px] font-mono text-muted-foreground/40 w-5">{item.ch}.</span>}
                    {!item.ch && <span className="w-5" />}
                    {item.title}
                  </a>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Expand/Collapse All toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1.5"
          onClick={() => {
            const allIds = chapters.filter(c => c.ch).map(c => c.id);
            setExpandedChapters(prev => prev.length >= allIds.length ? [] : allIds);
          }}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedChapters.length >= chapters.filter(c => c.ch).length && "rotate-180")} />
          {expandedChapters.length >= chapters.filter(c => c.ch).length ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      <motion.section id="executive-summary" {...fadeIn} transition={{ delay: 0.1 }} className="scroll-mt-20">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl tracking-tight">
                Executive Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="prose prose-lg dark:prose-invert max-w-none relative z-10 space-y-4 prose-p:text-base sm:prose-p:text-lg">
            <p className="text-muted-foreground text-lg leading-relaxed">
              <strong className="text-foreground">ZenSolar</strong> is a blockchain-powered rewards platform that
              transforms clean energy production into verifiable digital assets. Using our patent-pending 
              <strong className="text-primary"> Mint-on-Proof™</strong> architecture powered by SEGI (Software-Enabled Gateway Interface), 
              users earn <strong className="text-foreground">$ZSOLAR tokens</strong> and collectible NFTs proportional 
              to their verified environmental impact—with just one tap.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're not asking anyone to change their behavior—we're <em>rewarding</em> the millions of homeowners 
              who have already invested in sustainability. Our mission is simple: make doing good for the planet 
              financially rewarding.
            </p>
            {/* Tokenization Supercycle Context */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 not-prose mt-2">
              <div className="p-2 rounded-lg bg-blue-500/10 shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Context · Coinbase Bytes & Bernstein Research · February 2026</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tokenized real-world assets reached a record <strong className="text-foreground">$24.5 billion</strong> in early 2026, with Bernstein Research declaring the arrival of a tokenization "supercycle" led by BlackRock, Franklin Templeton, and JPMorgan. Wall Street is racing to put financial claims—treasuries, gold, equities—on-chain. ZenSolar is doing something more defensible: tokenizing the <em>physical reality</em> of clean energy at the kilowatt-hour level, creating scarcity backed by the laws of thermodynamics, not just cryptography.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <SectionDivider variant="diamond" />

      {/* Who We Are */}
      <CollapsibleChapter id="ch-1" chapter={1} title="Who We Are" isExpanded={expandedChapters.includes('ch-1')} onToggle={() => toggleChapter('ch-1')}>
        
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
                  <h3 className="font-semibold text-lg mb-2">Patent-Pending Mint-on-Proof™ Technology</h3>
                  <p className="text-muted-foreground">
                    Our <strong className="text-foreground">Software-Enabled Gateway Interface (SEGI)</strong> powers the world's first 
                    <strong className="text-primary"> Mint-on-Proof™</strong> architecture—a proprietary system for tokenizing sustainable 
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Our Mission */}
      <CollapsibleChapter id="ch-2" chapter={2} title="Our Mission" isExpanded={expandedChapters.includes('ch-2')} onToggle={() => toggleChapter('ch-2')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Total Addressable Market */}
      <CollapsibleChapter id="ch-3" chapter={3} title="The Opportunity" isExpanded={expandedChapters.includes('ch-3')} onToggle={() => toggleChapter('ch-3')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Replacing Federal Incentives */}
      <CollapsibleChapter id="ch-4" chapter={4} title="Replacing Federal Tax Incentives" isExpanded={expandedChapters.includes('ch-4')} onToggle={() => toggleChapter('ch-4')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Tokenization Supercycle — External Validation */}
      <CollapsibleChapter id="ch-5" chapter={5} title="The Tokenization Supercycle" subtitle="Why ZenSolar is the clean energy layer of crypto's next major catalyst" isExpanded={expandedChapters.includes('ch-5')} onToggle={() => toggleChapter('ch-5')}>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden relative">
          <CardContent className="pt-6 space-y-6">
            {/* External validation banner */}
            {/* BlackRock / Larry Fink quote */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
                <Building2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Larry Fink, CEO of BlackRock · CNBC · October 14, 2025</p>
                <blockquote className="text-foreground font-medium leading-relaxed">
                  "We are at the beginning of the <span className="text-primary">tokenization of all assets</span>."
                </blockquote>
                <p className="text-xs text-muted-foreground mt-2">
                  BlackRock's digital holdings surpassed <strong className="text-foreground">$107.4 billion</strong>, with a strategy to 
                  "repot" traditional financial products into digital formats and access $4.1 trillion held in digital wallets globally.
                </p>
              </div>
            </div>

            {/* Coinbase / Bernstein quote */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/50 border border-border/60">
              <div className="p-2.5 rounded-xl bg-blue-500/10 shrink-0">
                <ExternalLink className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">External Validation · Coinbase Bytes · February 19, 2026</p>
                <blockquote className="text-foreground font-medium leading-relaxed">
                  "The tokenization of everything creates a tangible use case that attracts traditional capital. This provides the fundamental bedrock for the next cycle."
                </blockquote>
                <p className="text-xs text-muted-foreground mt-2">— Gautam Chhugani, Senior Analyst, Bernstein Research</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">The $24.5 Billion Market That Just Started</h3>
              <p className="text-muted-foreground leading-relaxed">
                On February 19, 2026, Coinbase published an analysis citing Bernstein Research's prediction of a tokenization 
                "supercycle" driven by the conversion of real-world assets into blockchain tokens. The tokenized asset market 
                hit a record <strong className="text-foreground">$24.5 billion</strong> that month—up 12% in 30 days on Ethereum alone.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                BlackRock, Franklin Templeton, JPMorgan, and other Wall Street giants are racing to tokenize treasuries, gold, 
                real estate, and private credit. Tokenized stocks grew <strong className="text-foreground">2,800%</strong> in a 
                single year. $432 million in VC funding has flowed into tokenization startups in 2026 alone.
              </p>
            </div>

            <Separator />

            {/* Comparison table */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What Wall Street Tokenizes vs. What ZenSolar Tokenizes</h3>
              <p className="text-muted-foreground leading-relaxed">
                The critical insight: Wall Street is tokenizing <em>financial claims</em>. ZenSolar tokenizes 
                <strong className="text-primary"> physical reality</strong>—the most granular, tamper-evident, 
                real-world asset class in crypto.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Traditional Tokenized Assets
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      { asset: 'U.S. Treasuries', risk: 'Counterparty / custody risk' },
                      { asset: 'Tokenized Gold', risk: 'Paper gold risk, re-hypothecation' },
                      { asset: 'Real Estate', risk: 'Legal title, jurisdiction risk' },
                      { asset: 'Tokenized Stocks', risk: 'Regulatory, issuer risk' },
                    ].map(({ asset, risk }) => (
                      <li key={asset} className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{asset}</span>
                        <span className="text-xs text-muted-foreground/70">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-primary/5 border border-primary/30 space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    $ZSOLAR Tokenized Assets
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      { asset: '1 kWh solar produced', proof: 'Cryptographically retired at mint' },
                      { asset: '1 kWh battery discharged', proof: 'Proof-of-Delta™ hash chain' },
                      { asset: '1 mile EV driven', proof: 'Device Watermark Registry' },
                      { asset: '1 kWh EV charged', proof: 'Immutable on-chain record' },
                    ].map(({ asset, proof }) => (
                      <li key={asset} className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{asset}</span>
                        <span className="text-xs text-primary/70">{proof}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Permanent Scarcity: Physics + Math</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bitcoin is scarce because of math. $ZSOLAR is scarce because of both physics and math.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Shield,
                    title: 'No Re-Tokenization',
                    desc: 'A kWh of solar that minted $ZSOLAR is permanently consumed. It cannot be tokenized again on any chain — your Proof-of-Delta™ baseline burns that unit of eligibility at mint time.',
                    color: 'text-primary',
                    bg: 'bg-primary/5 border-primary/20',
                  },
                  {
                    icon: Globe,
                    title: 'Cross-Chain Defense',
                    desc: 'Timestamped hash chains and on-chain Merkle root snapshots provide publicly verifiable evidence to disprove any attempt to tokenize the same energy elsewhere.',
                    color: 'text-accent',
                    bg: 'bg-accent/5 border-accent/20',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Uncaptured Territory',
                    desc: 'The $24.5B tokenized asset market is dominated by treasuries and gold. Clean energy tokenization at the kilowatt-hour level is essentially an open frontier.',
                    color: 'text-secondary',
                    bg: 'bg-secondary/5 border-secondary/20',
                  },
                ].map((item) => (
                  <div key={item.title} className={`p-5 rounded-xl border ${item.bg} space-y-2`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">
                ZenSolar's Position in the Tokenization Wave
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
                While Wall Street races to tokenize financial instruments, ZenSolar is tokenizing the physical actions 
                that drive the clean energy economy — at the kilowatt-hour level. We are not competing with BlackRock's 
                treasury fund. We are building the clean energy layer of the tokenization supercycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Market Landscape & Competitive Positioning */}
      <CollapsibleChapter id="ch-6" chapter={6} title="Market Landscape & Competitive Positioning" isExpanded={expandedChapters.includes('ch-6')} onToggle={() => toggleChapter('ch-6')}>

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
                models prevalent in the market to a <strong className="text-primary">Mint-on-Proof™</strong> model where every token 
                in circulation is backed by verified clean energy impact. Each reading is cryptographically secured via 
                <strong className="text-primary"> Proof-of-Delta™</strong> hash chains, and every physical device is permanently 
                tracked on-chain through <strong className="text-primary"> Proof-of-Origin™</strong> (the Device Watermark Registry), 
                making cross-platform double-minting provably impossible.
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
              <h3 className="font-semibold text-lg mb-3">Intellectual Property: The Trademark Trilogy</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ZenSolar's first-mover advantage is reinforced by a deliberate intellectual property strategy anchored by three 
                patent-pending verification systems, each protected as a trademark:
              </p>
              
              <div className="space-y-4 mb-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">Mint-on-Proof™</Badge>
                    <span className="text-xs text-muted-foreground">Absolute Reward Engine</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mints $ZSOLAR tokens based on absolute energy metrics (kWh produced, miles driven, battery cycles stored). 
                    Every token in circulation is backed by verified, real-world clean energy activity. No pre-minted pools, 
                    no inflation risk.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 text-xs">Proof-of-Delta™</Badge>
                    <span className="text-xs text-muted-foreground">Incremental Verification Logic</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The cryptographic verification standard powering SEGI Layer 3. Each data reading generates a linked hash chain: 
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mx-1">SHA-256(device_id | timestamp | value | prevHash)</code>. 
                    This ensures tokens are issued only for verified <em>incremental</em> energy activity, creating an immutable, 
                    tamper-evident audit trail that prevents gaming and double-counting.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">Proof-of-Origin™</Badge>
                    <span className="text-xs text-muted-foreground">Device-Bound Anti-Double-Mint Standard</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The industry's first on-chain, hardware-bound anti-fraud system. The Device Watermark Registry maps deterministic 
                    device hashes (<code className="text-xs bg-muted px-1.5 py-0.5 rounded mx-1">keccak256(manufacturer_id | device_id)</code>) 
                    to total tokenized energy on a public smart contract. If you sell your Tesla, the new owner starts fresh. 
                    If a competitor tries to tokenize the same energy, the fraud is publicly provable.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Patent Status:</strong> Non-provisional utility patent application filed 
                ("Gamifying and Tokenizing Sustainable Behaviors By Using Blockchain Technology") covering the SEGI architecture 
                with Mint-on-Proof™, Proof-of-Delta™, and Proof-of-Origin™ as dependent claims. Comprehensive patent landscape 
                research has identified no existing claims covering this methodology.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/5 via-background to-primary/5 rounded-xl p-6 border border-amber-500/20">
              <h3 className="font-semibold text-lg mb-3">Permanent Energy Scarcity — The Deepest Moat</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Every $ZSOLAR token is a permanent, irreversible claim on a specific unit of clean energy that can 
                never be tokenized again — by anyone, anywhere, on any platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The 1st kilowatt-hour a solar system ever generates can only produce one token. The 2nd kilowatt-hour — one token. 
                The 500th mile an EV ever drives — one token. Once claimed, that energy unit is cryptographically retired from 
                future tokenization forever. Even if the device changes owners, the watermark persists — a new owner's baseline 
                starts where the previous owner left off. Nothing resets. Nothing double-counts.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This isn't abstract scarcity like Bitcoin's 21M cap. This is scarcity backed by physical reality — every token 
                maps to a real kilowatt-hour that was actually generated by real hardware, verified through manufacturer APIs, 
                cryptographically proven via SHA-256 hash chains, and permanently recorded in our on-chain Device Watermark 
                Registry. Bitcoin is scarce because of math. <strong className="text-primary">$ZSOLAR is scarce because of physics and math.</strong>
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* How Users Benefit */}
      <CollapsibleChapter id="ch-7" chapter={7} title="How Users Benefit" isExpanded={expandedChapters.includes('ch-7')} onToggle={() => toggleChapter('ch-7')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* How Investors Benefit */}
      <CollapsibleChapter id="ch-8" chapter={8} title="How Investors Benefit" isExpanded={expandedChapters.includes('ch-8')} onToggle={() => toggleChapter('ch-8')}>
        
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

        {/* Tokenomics Pie Chart */}
        <TokenomicsPieChart />

        {/* Rewards Flywheel Diagram */}
        <RewardsFlywheelDiagram />

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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* How the World Benefits */}
      <CollapsibleChapter id="ch-9" chapter={9} title="How the World Benefits" isExpanded={expandedChapters.includes('ch-9')} onToggle={() => toggleChapter('ch-9')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* The Vision */}
      <CollapsibleChapter id="ch-10" chapter={10} title="The Vision" isExpanded={expandedChapters.includes('ch-10')} onToggle={() => toggleChapter('ch-10')}>
        
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Moonshot Scenarios */}
      <CollapsibleChapter id="ch-11" chapter={11} title="Moonshot Scenarios" isExpanded={expandedChapters.includes('ch-11')} onToggle={() => toggleChapter('ch-11')}>
        
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 not-prose">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Illustrative projections only. Not financial advice.</strong> Token prices are inherently volatile and speculative.
                The scenarios below are hypothetical models based on stated tokenomic mechanics and are not guarantees of future performance.
                Past performance of other tokens does not predict $ZSOLAR outcomes. Always conduct your own research before making any financial decisions.
              </p>
            </div>

            <p className="text-muted-foreground text-lg">
              While our <strong className="text-foreground">$1.00 target</strong> creates noticeable passive income, 
              aggressive deflation, viral adoption, and institutional demand could drive $ZSOLAR to{' '}
              <strong className="text-foreground">$5, $10, or even $20+ per token</strong>. These are aspirational scenarios, 
              not promises. Actual outcomes depend on adoption, market conditions, and regulatory developments.
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Competitive Advantage */}
      <CollapsibleChapter id="ch-12" chapter={12} title="Competitive Moat" isExpanded={expandedChapters.includes('ch-12')} onToggle={() => toggleChapter('ch-12')}>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                { title: "Trademark Trilogy IP", description: "Mint-on-Proof™, Proof-of-Delta™, and Proof-of-Origin™ protected by pending patents and trademarks", icon: Shield },
                { title: "Device Watermark Registry", description: "On-chain, device-bound anti-double-mint standard makes cross-platform fraud publicly provable", icon: Cpu },
                { title: "First-Mover Advantage", description: "No competitors in verified, on-demand energy-backed token minting", icon: Rocket },
                { title: "Hardware Neutrality", description: "Works with Tesla, Enphase, SolarEdge, Wallbox—not locked to one provider", icon: Globe },
                { title: "Flywheel Network Effects", description: "More subscribers → deeper LP → higher token floor → more valuable rewards → more subscribers", icon: Users },
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
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Roadmap */}
      <CollapsibleChapter id="ch-13" chapter={13} title="Roadmap" subtitle="Where we are, and the paths ahead" isExpanded={expandedChapters.includes('ch-13')} onToggle={() => toggleChapter('ch-13')}>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              ZenSolar is pre-launch. The platform, smart contracts, tokenomics, and patent application are built. 
              What comes next depends on capital. We are actively pursuing accelerator programs and investor partnerships, 
              with parallel planning for a self-funded bootstrap path.
            </p>

            <div className="space-y-4">
              {[
                {
                  phase: 'Completed',
                  color: 'bg-emerald-500',
                  items: [
                    'Full-stack platform built (React, Supabase, Base L2)',
                    'Smart contracts deployed on Base Sepolia testnet',
                    'Patent-pending utility application filed (Mint-on-Proof, Proof-of-Delta, Proof-of-Origin)',
                    'Device integrations live: Tesla, Enphase, SolarEdge, Wallbox',
                    'White Paper v2.0 published',
                    'Tokenomics framework finalized with anti-crash architecture',
                  ],
                },
                {
                  phase: 'In Progress (Q1 2026)',
                  color: 'bg-amber-500',
                  items: [
                    'Refining UX, security, and documentation',
                    'Y Combinator S25 application submitted',
                    'Accelerator and investor outreach',
                    'Stress-testing tokenomic models and liquidity scenarios',
                  ],
                },
                {
                  phase: 'Next: Funded Path',
                  color: 'bg-blue-500',
                  items: [
                    'Mainnet deployment on Base L2',
                    'Seed liquidity pool ($10K+ USDC initial)',
                    'Beta launch with first 100 households',
                    'App Store and Google Play distribution',
                    'Scale to 1,000+ subscribers within 6 months',
                  ],
                },
                {
                  phase: 'Next: Bootstrap Path',
                  color: 'bg-violet-500',
                  items: [
                    'Self-funded mainnet launch with lean liquidity seeding',
                    'Grassroots community growth via solar forums, EV communities, and referral loops',
                    'Revenue-first approach: subscription income funds LP before scaling',
                    'Organic growth to 500+ subscribers, then reassess fundraising',
                  ],
                },
                {
                  phase: 'Long-Term Vision (2027+)',
                  color: 'bg-primary',
                  items: [
                    '$ZSOLAR Debit Card and utility bill integration',
                    'White-label SEGI licensing to energy providers',
                    'International expansion beyond US market',
                    'Carbon credit marketplace integration',
                    'Target: 100K+ households in the global clean energy economy',
                  ],
                },
              ].map((milestone) => (
                <div key={milestone.phase} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${milestone.color} shrink-0 mt-1.5`} />
                    <div className="w-px flex-1 bg-border/50" />
                  </div>
                  <div className="pb-6">
                    <h4 className="font-semibold text-foreground mb-2">{milestone.phase}</h4>
                    <ul className="space-y-1">
                      {milestone.items.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">A note on honesty:</strong> ZenSolar is a solo-founded, pre-revenue startup. 
                The timeline above reflects genuine uncertainty. Whether through accelerator backing, angel investment, or a 
                disciplined bootstrap, the technology is built and the market timing is right. The variable is capital, not capability.
              </p>
            </div>
          </CardContent>
        </Card>
      </CollapsibleChapter>

      <SectionDivider variant="diamond" />

      {/* Risk Factors */}
      <CollapsibleChapter id="ch-14" chapter={14} title="Risk Factors" isExpanded={expandedChapters.includes('ch-14')} onToggle={() => toggleChapter('ch-14')}>

        <Card className="border-destructive/20">
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Transparency is a core value. Prospective users and investors should carefully consider the following risks 
              before participating in the ZenSolar ecosystem.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: 'Token Price Volatility',
                  description: '$ZSOLAR is a utility token on a public blockchain. Its price is subject to market forces, speculation, and broader crypto market conditions. The stated $0.10 floor and $1.00 target are design goals, not guarantees. Token value may decrease, including to zero.',
                },
                {
                  title: 'Regulatory Uncertainty',
                  description: 'The regulatory landscape for digital assets is evolving. Changes in securities law, tax treatment of tokens, or energy regulation could materially impact the platform, token utility, or user earnings. ZenSolar is designed as a utility token, not a security, but regulatory classification is ultimately determined by authorities.',
                },
                {
                  title: 'Early-Stage Company Risk',
                  description: 'ZenSolar is a pre-revenue, pre-launch startup. The platform has not yet been tested at scale. There is no guarantee that user adoption targets will be met, that the liquidity pool will reach sufficient depth, or that the economic flywheel will perform as modeled.',
                },
                {
                  title: 'Smart Contract Risk',
                  description: 'While our contracts will undergo professional auditing before mainnet deployment, all smart contracts carry inherent risk of bugs, exploits, or unforeseen interactions. Users should not commit funds they cannot afford to lose.',
                },
                {
                  title: 'Third-Party API Dependency',
                  description: 'ZenSolar relies on manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox) for energy data. Changes to these APIs, rate limits, deprecations, or access restrictions could impact platform functionality.',
                },
                {
                  title: 'Liquidity Risk',
                  description: 'During the early launch phase, the liquidity pool will be shallow. Large sell orders could significantly impact token price. The progressive sell tax and circuit breaker mechanisms are designed to mitigate this, but cannot eliminate it entirely.',
                },
                {
                  title: 'No Guarantee of Returns',
                  description: 'All earning projections in this document ($400-$1,000/month, $96,000 over 20 years, moonshot scenarios) are illustrative models based on specific assumptions about token price, adoption rates, and energy production. Actual results will vary. This is not financial advice.',
                },
              ].map((risk) => (
                <div key={risk.title} className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-1">{risk.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleChapter>

      {/* CTA */}
      <motion.section {...fadeIn} transition={{ delay: 0.65 }} className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30">
          <CardContent className="py-10">
            <div className="text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">Join the Clean Energy Revolution</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're a homeowner ready to monetize your sustainability investments, or an investor 
                looking for the next paradigm shift in climate finance. ZenSolar welcomes you.
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
      <motion.div {...fadeIn} transition={{ delay: 0.7 }}>
        <footer className="py-10 border-t border-border/40 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="container max-w-5xl mx-auto px-4 space-y-6 text-center">
            {/* Disclaimer */}
            <div className="space-y-2 max-w-xl mx-auto">
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                This white paper is for informational purposes only. $ZSOLAR tokens have no monetary value during 
                beta testing on Base Sepolia testnet. Tokenomics and features are subject to change.
              </p>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-muted-foreground px-4">
              <Link to="/how-it-works" className="hover:text-foreground transition-colors whitespace-nowrap">How It Works</Link>
              <Link to="/technology" className="hover:text-foreground transition-colors whitespace-nowrap">Technology</Link>
              <Link to="/demo" className="hover:text-foreground transition-colors whitespace-nowrap">Demo</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">Privacy</Link>
            </div>

            <p className="text-xs text-muted-foreground/60">© 2026 ZenSolar. Patent Pending. Built on Base L2.</p>
          </div>
        </footer>
      </motion.div>

      </div> {/* end main content column */}
      </div> {/* end grid */}
      </div> {/* end container */}

      {/* Floating chapter indicator chip - mobile only */}
      <AnimatePresence>
        {showBackToTop && activeChapterInfo && (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 xl:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/10"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                  {activeChapterInfo.ch ? `${activeChapterInfo.ch}. ` : ''}{activeChapterInfo.title}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
              </motion.button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="px-4 pt-2 pb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 px-2">
                  Jump to chapter
                </p>
                <nav className="space-y-0.5">
                  {chapters.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                        activeChapter === item.id
                          ? 'text-primary bg-primary/8 font-medium'
                          : 'text-muted-foreground/70 active:bg-muted/40'
                      )}
                    >
                      {item.ch ? (
                        <span className={cn(
                          'text-[11px] font-mono w-5 shrink-0',
                          activeChapter === item.id ? 'text-primary/70' : 'text-muted-foreground/40'
                        )}>
                          {item.ch}.
                        </span>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </AnimatePresence>

      {/* Back to top button - repositioned for mobile chip */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-4 z-50 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      </div>
    </>
  );
}
