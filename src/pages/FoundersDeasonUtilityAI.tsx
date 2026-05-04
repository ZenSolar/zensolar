import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Brain,
  FileText,
  Mail,
  DollarSign,
  Sparkles,
  Lock,
  Calendar,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Car,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * FoundersDeasonUtilityAI — Planning page for the Deason AI Utility Optimizer
 * + Weekly Energy Intelligence revenue stream.
 * Lives at /founders/deason-utility-ai-revstream.
 */
export default function FoundersDeasonUtilityAI() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <VaultPinGate userId={user.id}>
      <Content />
    </VaultPinGate>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-foreground/85 leading-relaxed space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

function Content() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        <Link
          to="/founders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Founders Vault
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30">
            Planning · Post-Seed Implementation
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Deason AI Utility Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">
            New customer-value layer + recurring revenue stream. Key demo
            feature for the $5M Lyndon meeting.
          </p>
        </motion.div>

        {/* Overview */}
        <Section icon={Sparkles} title="Overview">
          <p>
            In addition to minting $ZSOLAR tokens, ZenSolar will deliver
            meaningful energy intelligence to every user through{" "}
            <strong>Deason</strong>, our AI energy advisor. This turns the
            product into a true <em>personal energy intelligence platform</em> —
            not just a minting app.
          </p>
        </Section>

        {/* Core Product */}
        <Section icon={Brain} title="1 · Deason AI Agent (Orange Chat Button)">
          <ul className="space-y-1.5">
            <li>• Intelligent AI chat agent that analyzes utility bills and connected devices.</li>
            <li>• <strong>Hybrid data approach:</strong> UtilityAPI for users who connect, photo/PDF bill upload for everyone else.</li>
            <li>• Tone: upbeat, academic, confidence-building — "frequent flyer miles" analogies before any jargon.</li>
            <li>• Context-aware: switches between patient educator (wallets, blockchain) and expert (rate plans, battery dispatch) automatically.</li>
            <li>• <strong>Monthly Deep Energy Insights:</strong> richer Deason-powered report sent once per month, unlocked by UtilityAPI connection or latest bill upload. Includes rate-plan optimization, savings forecasts, battery/EV recommendations, and peak/off-peak analysis.</li>
            <li>• <strong>In-App Personalized Energy Insights Page</strong> (at /energy-insights or inside Clean Energy Center): dedicated dashboard with charts, savings projections, and one-tap actions. Becomes the "home base" for the premium experience.</li>
          </ul>
        </Section>

        {/* Capabilities */}
        <Section icon={Zap} title="2 · Capabilities">
          <ul className="space-y-1.5">
            <li>• <strong>Bill analysis</strong> — line-item breakdown, hidden fees, demand charges, TOU exposure.</li>
            <li>• <strong>Rate-plan optimization</strong> — recommends the cheapest available plan for the user's usage shape.</li>
            <li>• <strong>Device-aware advice</strong> — Tesla Powerwall, Enphase, EVs, thermostats, solar panels.</li>
            <li>• <strong>Savings forecasts</strong> — annualized $ savings projections per recommendation.</li>
            <li>• <strong>One-tap actions</strong> — schedule switches, file utility forms, queue device automations.</li>
          </ul>
        </Section>

        {/* Weekly Report */}
        <Section icon={Mail} title="3 · Weekly Energy Report">
          <p className="font-medium text-foreground">Two-tier email sent every Saturday:</p>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">UNIVERSAL · ALL SUBSCRIBERS</Badge>
            </div>
            <p className="text-xs">
              Verified kWh produced, tokens minted, CO₂ offset, lifetime impact.
              The "proud moment" — keeps Base/Regular tiers engaged and reduces
              churn. Generated with Gemini 2.5 Flash for cost efficiency.
            </p>
          </div>
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px]">
                PREMIUM · POWER TIER OR +$4.99 ADD-ON
              </Badge>
            </div>
            <p className="text-xs">
              Personal narrative: "Your solar drove your Tesla 247 miles this
              week — that's Austin to Dallas on sunshine." Rate-plan deltas,
              device-level optimization, weather-adjusted forecasts. Generated
              with <strong>Gemini 2.5 Pro</strong> for narrative quality.
            </p>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={DollarSign} title="4 · Pricing">
          <ul className="space-y-1.5">
            <li>• <strong>Deason add-on:</strong> +$4.99 / month on any tier (unlocks full agent + premium report).</li>
            <li>• <strong>One-shot analysis:</strong> $19.99 single bill audit (no subscription required).</li>
            <li>• <strong>Power tier:</strong> $49.99 / month — Deason included free (primary upgrade incentive).</li>
          </ul>
        </Section>

        {/* Value Prop */}
        <Section icon={TrendingUp} title="5 · Value Proposition">
          <ul className="space-y-1.5">
            <li>• Universal Basic Report → retention floor for every paying tier.</li>
            <li>• Premium Report → clear upgrade ladder to Power tier or add-on.</li>
            <li>• Increases device utilization → more verified kWh → stronger minting flywheel.</li>
            <li>• High virality (shareable savings/impact moments).</li>
            <li>• Recurring revenue stream independent of token mechanics.</li>
          </ul>
        </Section>

        {/* Implementation Notes */}
        <Section icon={FileText} title="6 · Implementation Notes">
          <ul className="space-y-1.5">
            <li>• Edge function: <code className="text-xs bg-muted px-1 rounded">weekly-report-cron</code> — Saturday dispatcher, batches by user timezone.</li>
            <li>• Two React Email templates: <code className="text-xs bg-muted px-1 rounded">WeeklyReportBasic</code>, <code className="text-xs bg-muted px-1 rounded">WeeklyReportPremium</code>.</li>
            <li>• PVWatts API integration for "expected vs actual" production deltas.</li>
            <li>• UtilityAPI integration parked for post-seed; bill upload (photo/PDF) ships first.</li>
            <li>• Admin preview: render either tier as any user from the Subscription Admin panel.</li>
          </ul>

          {/* Locked Decisions subsection */}
          <div className="mt-5 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-foreground">Locked Decisions</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">1. Send-time</p>
                    <p className="text-xs text-foreground/80">
                      Weekly Energy Reports send <strong>Saturday at 8:00 AM in the user's local timezone</strong> (highest open-rate window).
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">2. Premium gating logic</p>
                    <p className="text-xs text-foreground/80">
                      Single boolean flag <code className="text-[10px] bg-muted px-1 rounded">deason_enabled</code>.
                      True if user is on <strong>Power tier OR</strong> has the <strong>+$4.99/month Deason add-on</strong>.
                      Report generation checks <em>only</em> this one flag.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">3. Narrative quality</p>
                    <p className="text-xs text-foreground/80">
                      Use <strong>Gemini 2.5 Pro</strong> (or highest-quality model) for the final narrative/personal storytelling pass in the premium report. <strong>Do not use Flash</strong> for the premium narrative.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">4. Unsubscribe handling</p>
                    <p className="text-xs text-foreground/80">
                      Separate user preference: <code className="text-[10px] bg-muted px-1 rounded">weekly_report_opt_out</code>.
                      Unsubscribing from the weekly report <strong>does not affect transactional emails</strong> (mint receipts, security alerts, etc.).
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">5. Data sufficiency fallback ("quiet week")</p>
                    <p className="text-xs text-foreground/80">
                      Graceful fallback template for weeks with low/zero verified activity — encouraging copy + lifetime stats so the report <strong>never feels broken or empty</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Status: Planned for immediate post-seed implementation.
        </p>
      </div>
    </div>
  );
}
