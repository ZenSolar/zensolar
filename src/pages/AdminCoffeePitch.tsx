import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Coffee, Sun, Zap, Coins, Shield, Flame, 
  TrendingUp, ArrowDown, ArrowRight, DollarSign, Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { TokenFlowCalculator } from "@/components/investor/TokenFlowCalculator";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function AdminCoffeePitch() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <motion.div {...fadeIn} className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Coffee className="h-6 w-6 text-primary" />
          <Badge variant="outline" className="text-xs">Coffee Pitch</Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          The ZenSolar Coffee Pitch
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to explain ZenSolar over a cup of coffee. High-level, compelling, and memorable.
        </p>
      </motion.div>

      {/* The One-Liner */}
      <motion.div {...fadeIn}>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">The One-Liner</p>
            <p className="text-xl md:text-2xl font-bold text-foreground italic">
              "We made solar panels print money — but backed by real energy, not hype."
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works - Simple */}
      <motion.div {...fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="h-5 w-5 text-primary" />
              "So how does it actually work?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Sun, label: "Connect", desc: "Link your solar panels, EV, or battery to ZenSolar." },
              { icon: Zap, label: "Generate", desc: "Every kilowatt-hour you produce or every mile you drive electric gets verified." },
              { icon: Coins, label: "Earn", desc: "1 kWh = 1 $ZSOLAR token. Simple." },
              { icon: Lock, label: "Permanent", desc: "Each token is a permanent, irreversible claim on that specific unit of energy. Nobody can ever tokenize it again." },
            ].map((step, i) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < 3 && <ArrowDown className="h-4 w-4 text-muted-foreground/40 mt-3 hidden md:block" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Why It's Not A Gimmick */}
      <motion.div {...fadeIn}>
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-accent" />
              "Why is this different from every other crypto?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-sm text-foreground font-medium mb-2">Bitcoin's scarcity:</p>
              <p className="text-sm text-muted-foreground">Scarce because of <strong className="text-foreground">math</strong> — an algorithm limits supply.</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground font-medium mb-2">$ZSOLAR's scarcity:</p>
              <p className="text-sm text-muted-foreground">Scarce because of <strong className="text-primary">physics AND math</strong> — your rooftop literally can't produce that energy twice. It's cryptographically retired upon minting.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The Business Model */}
      <motion.div {...fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              "How does it make money?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Users pay <strong className="text-foreground">$9.99 or $19.99/month</strong> for auto-minting. Here's the clever part:
            </p>
            <div className="grid gap-3">
              {[
                { pct: "50%", label: "→ Liquidity Pool", desc: "Creates a constantly rising price floor" },
                { pct: "50%", label: "→ Operations", desc: "Runs the platform, pays the team" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30">
                  <span className="text-lg font-bold text-primary min-w-[3rem]">{item.pct}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <p className="text-sm text-foreground">
                <strong>The magic number: 25,000 subscribers.</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                At 25K paying subscribers, monthly LP injections match the initial seed capital. The price floor becomes self-sustaining — no more outside funding needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Deflationary Mechanics */}
      <motion.div {...fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-destructive" />
              "What stops people from dumping their tokens?"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4">
              {[
                {
                  icon: Flame,
                  title: "20% Mint Burn",
                  desc: "Every time tokens are created, 20% are immediately destroyed. Earn 100 → get 75 in your wallet. The rest? Gone forever.",
                  color: "text-destructive",
                  bg: "bg-destructive/10",
                },
                {
                  icon: ArrowRight,
                  title: "7% Transfer Tax",
                  desc: "Every time tokens move: 3% burned permanently, 2% back to liquidity pool, 2% to treasury. Selling literally strengthens the ecosystem.",
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  icon: TrendingUp,
                  title: "Subscription LP Injection",
                  desc: "Real dollars flowing in every month from subscriptions — even during a crypto winter, there's fiat-backed buy pressure propping up the floor.",
                  color: "text-accent",
                  bg: "bg-accent/10",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl border border-border/30">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border/30 text-center">
              <p className="text-sm font-medium text-foreground italic">
                "Every transaction makes the token scarcer. Every subscription makes the floor higher. Time is on the holder's side."
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Interactive Token Flow Calculator */}
      <motion.div {...fadeIn}>
        <TokenFlowCalculator />
      </motion.div>

      {/* The Flywheel */}
      <motion.div {...fadeIn}>
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              The Flywheel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-4">
              {[
                "More users join",
                "More subscription revenue",
                "More liquidity in the pool",
                "Stronger token price floor",
                "Attracts more users",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground">{step}</p>
                  {i < 4 && <ArrowDown className="h-4 w-4 text-primary/40 absolute translate-y-10 hidden" />}
                </div>
              ))}
              <div className="w-px h-0 border-l-2 border-dashed border-primary/30" />
              <Badge className="bg-primary/15 text-primary border-primary/30">
                ↻ Repeat — the flywheel accelerates
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Early Adopter Hook */}
      <motion.div {...fadeIn}>
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Early Adopter Advantage</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Pioneer users earn <strong className="text-foreground">10x rewards</strong> during Live Beta, get exclusive Pioneer NFTs, and have their contributions recognized through vesting bonuses when mainnet launches.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
