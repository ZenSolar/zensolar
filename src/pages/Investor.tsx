import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Lock,
  FileText,
  Presentation,
  BarChart3,
  Users,
  PlayCircle,
  Calendar,
  CheckCircle2,
  ArrowDown,
  Mail,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NdaSignatureStep } from '@/components/demo/NdaSignatureStep';
import { supabase } from '@/integrations/supabase/client';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { toast } from 'sonner';
import {
  InvestorPinGate,
  readInvestorUnlocked,
} from '@/components/investor/InvestorPinGate';
import { ThreeRevenueEngines } from '@/components/investor/ThreeRevenueEngines';
import { isPreviewHost } from '@/lib/previewHost';

const ACCESS_CODE = 'INVESTOR_LANDING';
const NDA_EMAIL_KEY = 'zen_nda_email';
const DEMO_ACCESS_KEY = 'zen_demo_access';
const INVESTOR_SIGNED_KEY = 'zs_investor_nda_signed';

interface SignedState {
  email: string;
  fullName: string;
  signedAt: string;
}

function readSigned(): SignedState | null {
  // Preview/localhost: synthesize a signed state so reviewers see the unlocked panel directly.
  if (isPreviewHost()) {
    return {
      email: 'preview@zen.solar',
      fullName: 'Preview Reviewer',
      signedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(INVESTOR_SIGNED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignedState;
    if (parsed?.email && parsed?.fullName) return parsed;
  } catch {
    /* noop */
  }
  return null;
}

function persistSigned(state: SignedState) {
  try {
    localStorage.setItem(INVESTOR_SIGNED_KEY, JSON.stringify(state));
    // Interop with existing /demo gate so investors flow straight in.
    localStorage.setItem(
      NDA_EMAIL_KEY,
      JSON.stringify({ email: state.email.toLowerCase().trim() }),
    );
    localStorage.setItem(
      DEMO_ACCESS_KEY,
      JSON.stringify({ ts: Date.now(), ndaSigned: true, accessCode: ACCESS_CODE }),
    );
  } catch {
    /* storage blocked */
  }
}

const UNLOCKS = [
  { icon: Presentation, label: 'Seed Pitch Deck', desc: 'Full investor narrative' },
  { icon: FileText, label: 'One-Pager', desc: 'Catalyst, moat, capital plan' },
  { icon: BarChart3, label: 'Tokenomics Model', desc: '1T cap · $0.10 launch math' },
  { icon: Users, label: 'Founder Bios', desc: 'Joseph Maushart · Michael Tschida' },
  { icon: PlayCircle, label: 'Live Investor Demo', desc: 'Tap-to-Mint™ in your hand' },
  { icon: Calendar, label: 'Schedule a Call', desc: 'Direct to the founders' },
];

export default function Investor() {
  const [pinUnlocked, setPinUnlocked] = useState<boolean>(() => readInvestorUnlocked());
  const [signed, setSigned] = useState<SignedState | null>(() => readSigned());
  const ndaRef = useRef<HTMLDivElement>(null);

  if (!pinUnlocked) {
    return <InvestorPinGate onUnlocked={() => setPinUnlocked(true)} />;
  }

  // Recheck server-side if local cache is empty.
  useEffect(() => {
    if (signed) return;
    let saved: { email?: string } | null = null;
    try {
      const raw = localStorage.getItem(NDA_EMAIL_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* noop */
    }
    const email = saved?.email?.toLowerCase().trim();
    if (!email) return;
    (async () => {
      const { data: signedRpc } = await supabase.rpc('check_nda_signed', { _email: email });
      if (!signedRpc) return;
      const { data: name } = await supabase.rpc('get_nda_signer_name', { _email: email });
      const state: SignedState = {
        email,
        fullName: (name as string) || email,
        signedAt: new Date().toISOString(),
      };
      persistSigned(state);
      setSigned(state);
    })();
  }, [signed]);

  const handleSigned = (email?: string, fullName?: string) => {
    if (!email || !fullName) return;
    const state: SignedState = {
      email: email.toLowerCase().trim(),
      fullName,
      signedAt: new Date().toISOString(),
    };
    persistSigned(state);
    setSigned(state);
    setTimeout(() => {
      document.getElementById('unlocked')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const resendEmail = async () => {
    if (!signed) return;
    const { error } = await supabase.functions.invoke('send-nda-copy', {
      body: {
        recipientEmail: signed.email,
        recipientName: signed.fullName,
        signedAt: signed.signedAt,
        ndaVersion: '1.0',
      },
    });
    if (error) {
      toast.error('Could not resend right now', { description: 'Please email joe@zen.solar.' });
    } else {
      toast.success('Sent', { description: `Links sent to ${signed.email}` });
    }
  };

  const scrollToNda = () => {
    ndaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Investor Access — ZenSolar</title>
        <meta
          name="description"
          content="Sign our NDA to access the ZenSolar seed deck, tokenomics model, and live demo. Creating currency from energy."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor" />
        <meta property="og:url" content="https://www.zensolar.com/investor" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-3xl px-5 pt-12 pb-16 md:pt-20 md:pb-24 flex flex-col items-center text-center">
            <img
              src={zenLogo}
              alt="ZenSolar"
              className="h-9 md:h-11 w-auto mb-8 opacity-95"
              loading="eager"
            />
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">
              Investor Access
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              Creating Currency
              <br />
              From Energy.
            </h1>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-md">
              Seed round open. Patent-pending Tap-to-Mint™ protocol turning verified clean-energy
              production into a hard-capped, asset-backed digital currency on Base.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 w-full max-w-md">
              {[
                { k: '$0.10', v: 'Launch price' },
                { k: '1T', v: 'Hard cap' },
                { k: '75%', v: 'Mint to user' },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-border/60 bg-card/50 px-2 py-3"
                >
                  <div className="text-base md:text-lg font-semibold text-foreground">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            {!signed && (
              <Button
                onClick={scrollToNda}
                size="lg"
                className="mt-8 h-12 px-7 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                Sign NDA to continue
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            )}
            {signed && (
              <a
                href="#unlocked"
                className="mt-8 inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80"
              >
                <CheckCircle2 className="h-4 w-4" /> Access already unlocked — view materials
              </a>
            )}
          </div>
        </section>

        {/* Why now */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            Why now
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: '$1.7T',
                body: 'Annual clean-energy capex globally — no one has tokenized the kWh itself.',
              },
              {
                title: 'Patent-pending',
                body: 'U.S. App. 19/634,402 covers Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™.',
              },
              {
                title: 'Live in beta',
                body: 'Real Tesla, Enphase, SolarEdge installs minting against verified production.',
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-border/60 bg-card/40 p-4"
              >
                <div className="text-lg font-semibold text-foreground">{t.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Unlock preview */}
        {!signed && (
          <section className="mx-auto max-w-3xl px-5 pb-12">
            <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
              You'll unlock
            </h2>
            <div className="grid gap-2.5 md:grid-cols-2">
              {UNLOCKS.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 text-muted-foreground/70" />
                    <Lock className="h-3 w-3 text-secondary absolute -bottom-1 -right-1 bg-background rounded-full p-[1px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NDA / Unlocked */}
        <section
          ref={ndaRef}
          id="nda"
          className="mx-auto max-w-3xl px-5 pb-20"
        >
          {!signed ? (
            <div className="rounded-3xl border border-border/60 bg-card/40 overflow-hidden">
              <NdaSignatureStep accessCodeUsed={ACCESS_CODE} onSigned={handleSigned} />
            </div>
          ) : (
            <UnlockedPanel signed={signed} onResend={resendEmail} />
          )}
        </section>

        <footer className="border-t border-border/40 py-6 text-center">
          <p className="text-[11px] text-muted-foreground/70">
            ZenSolar, LLC · Austin, TX · joe@zen.solar
          </p>
        </footer>
      </div>
    </>
  );
}

function UnlockedPanel({
  signed,
  onResend,
}: {
  signed: SignedState;
  onResend: () => void;
}) {
  const firstName = signed.fullName.split(' ')[0] || 'there';
  return (
    <div id="unlocked" className="space-y-6">
      <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Thank you, {firstName}.
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              NDA signed {new Date(signed.signedAt).toLocaleString()}. A copy was emailed to{' '}
              <span className="text-foreground">{signed.email}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Canonical investor framing — flywheel + three revenue engines */}
      <div className="rounded-3xl border border-border/60 bg-card/30 p-5 md:p-7">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-[0.22em] text-secondary mb-1.5">
            The Pitch · v2
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
            Three Revenue Engines. One Flywheel.
          </h3>
        </div>
        <ThreeRevenueEngines />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <UnlockedCard
          icon={Sparkles}
          title="Investor Pitch · v2"
          body="Canonical pitch: flywheel, three engines, multi-OEM moat, the ask."
          to="/investor/pitch"
          internal
        />
        <UnlockedCard
          icon={PlayCircle}
          title="Live Investor Demo"
          body="Tap-to-Mint™ flow on real data. Mobile-first."
          to="/demo"
          internal
        />
        <UnlockedCard
          icon={FileText}
          title="Full Seed Pitch"
          body="Catalyst, flywheel, moat, capital plan, milestones."
          to="/founders/seed-pitch-greg"
          internal
        />
        <UnlockedCard
          icon={BarChart3}
          title="Tokenomics & LP Model"
          body="1T cap, 75/20/3/2 split, $0.10 LP-seeded tranches."
          to="/tokenomics"
          internal
        />
        <UnlockedCard
          icon={Users}
          title="Founder Bios"
          body="Joseph Maushart · Michael Tschida."
          to="mailto:joe@zen.solar?subject=ZenSolar%20Founder%20Bios"
        />
        <UnlockedCard
          icon={Calendar}
          title="Schedule a Call"
          body="Direct to the founders. 30 min."
          to="mailto:joe@zen.solar?subject=ZenSolar%20Investor%20Call&body=Hi%20Joseph%2C%20I%27d%20like%20to%20schedule%20a%20call."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Button
          variant="outline"
          onClick={onResend}
          className="flex-1 h-11"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email me these links again
        </Button>
        <Button asChild className="flex-1 h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link to="/demo">
            <PlayCircle className="h-4 w-4 mr-2" />
            Enter live demo
          </Link>
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
        Materials are confidential under your signed NDA (v1.0). Do not share without written
        consent.
      </p>
    </div>
  );
}

function UnlockedCard({
  icon: Icon,
  title,
  body,
  to,
  internal,
}: {
  icon: typeof PlayCircle;
  title: string;
  body: string;
  to: string;
  internal?: boolean;
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-secondary mb-2.5" />
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">{body}</div>
    </>
  );
  const className =
    'group rounded-2xl border border-border/60 bg-card/40 p-4 hover:border-secondary/40 hover:bg-card/60 transition-colors block';
  if (internal) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a href={to} className={className}>
      {content}
    </a>
  );
}
