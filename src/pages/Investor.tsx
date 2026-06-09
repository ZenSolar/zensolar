import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Lock,
  FileText,
  PlayCircle,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  Mail,
  
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
import { LiveVerifiedCounter } from '@/components/investor/LiveVerifiedCounter';

import { isPreviewHost } from '@/lib/previewHost';
import { useInvestorRef } from '@/lib/investorRef';

import { writeInvestorPass } from '@/lib/investorPass';

const ACCESS_CODE = 'INVESTOR_LANDING';
const NDA_EMAIL_KEY = 'zen_nda_email';
const NDA_NAME_KEY = 'zen_nda_name';
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
    const email = state.email.toLowerCase().trim();
    localStorage.setItem(
      NDA_EMAIL_KEY,
      JSON.stringify({ email, ts: Date.now() }),
    );
    localStorage.setItem(NDA_NAME_KEY, state.fullName);
    localStorage.setItem(
      DEMO_ACCESS_KEY,
      JSON.stringify({ ts: Date.now(), ndaSigned: true, accessCode: ACCESS_CODE }),
    );
    // Long-lived investor pass — DemoAccessGate uses this to skip its own
    // NDA step entirely for visitors arriving from /investor with PIN+NDA done.
    writeInvestorPass({
      email,
      fullName: state.fullName,
      ndaVersion: '1.0',
      signedAt: state.signedAt,
    });
  } catch {
    /* storage blocked */
  }
}

function buildUnlocks(preview: boolean): Array<{
  icon: typeof PlayCircle;
  label: string;
  desc: string;
  to: string;
}> {
  return [
    { icon: FileText, label: 'Full Seed Round Deck', desc: '11 slides · PIN-gated', to: '/deck' },
    { icon: FileText, label: 'One-Pager', desc: 'The leave-behind summary', to: '/investor/one-pager' },
    { icon: PlayCircle, label: 'Live Investor Demo', desc: 'Full Tesla + Powerwall + Wallbox home', to: `${preview ? '/demo-leonardo' : '/demo'}?demo=investor` },
    { icon: FileText, label: 'Investor Data Room', desc: 'PoG, VPP, traction, IP, use of funds', to: '/investor/data-room' },
  ];
}

export default function Investor() {
  const [pinUnlocked, setPinUnlocked] = useState<boolean>(() => readInvestorUnlocked());
  const [signed, setSigned] = useState<SignedState | null>(() => readSigned());
  const ndaRef = useRef<HTMLDivElement>(null);
  const { displayName: refDisplayName, firstName: refFirstName } = useInvestorRef();

  // Recheck server-side if local cache is empty.
  // IMPORTANT: this hook MUST run on every render (before any early return)
  // or React throws error #310 ("rendered more hooks than previous render")
  // when the PIN gate unlocks.
  useEffect(() => {
    if (!pinUnlocked) return;
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
  }, [signed, pinUnlocked]);

  if (!pinUnlocked) {
    return <InvestorPinGate onUnlocked={() => setPinUnlocked(true)} />;
  }

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
      toast.error('Could not resend right now', { description: 'Please email joe@zensolar.com.' });
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
        <title>ZenSolar — Investor Access · Seed Round</title>
        <meta
          name="description"
          content="Sign our NDA to access the ZenSolar seed deck, tokenomics model, and live demo. Creating currency from energy."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor" />
        <meta property="og:title" content="ZenSolar — Investor Access" />
        <meta property="og:description" content="NDA-gated seed deck, tokenomics, and live multi-OEM demo. Creating currency from energy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.zensolar.com/investor" />
        <meta property="og:image" content="https://zensolar.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZenSolar — Investor Access" />
        <meta name="twitter:description" content="NDA-gated seed deck, tokenomics, and live multi-OEM demo." />
        <meta name="twitter:image" content="https://zensolar.com/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.2),transparent_65%)]"
          />
          <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col items-center text-center">
            <img
              src={zenLogo}
              alt="ZenSolar"
              className="h-9 md:h-11 w-auto mb-10 opacity-95"
              loading="eager"
            />
            <span className="text-[11px] uppercase tracking-[0.28em] text-secondary/90 mb-5">
              {refFirstName ? `Welcome, ${refFirstName} · ` : ''}Investor Access · Seed Round
            </span>
            <h1 className="text-4xl md:text-6xl font-semibold leading-[1.02] tracking-tight">
              Creating Currency
              <br />
              From Energy.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              The patent-pending protocol turning verified clean energy into a hard-capped digital currency on Base.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-md">
              {[
                { k: '$0.10', v: 'Launch price' },
                { k: '1T', v: 'Hard cap' },
                { k: '50%', v: 'Mint to user' },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-2xl border border-border/60 bg-card/50 px-2 py-4"
                >
                  <div className="text-xl md:text-2xl font-semibold text-foreground tabular-nums">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            {!signed && (
              <Button
                onClick={scrollToNda}
                size="lg"
                className="mt-10 h-14 px-9 text-base bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_8px_30px_-12px_hsl(var(--secondary)/0.6)]"
              >
                Sign NDA to continue
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            )}
            {signed && (
              <a
                href="#unlocked"
                className="mt-10 inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80"
              >
                <CheckCircle2 className="h-4 w-4" /> Access already unlocked — view materials
              </a>
            )}
          </div>
        </section>

        <LiveVerifiedCounter />




        {/* Why now */}
        <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <div className="mb-8 text-center">
            <h2 className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Why now
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: '$1.7T',
                body: 'Global clean-energy capex — and no one has tokenized the kWh.',
              },
              {
                title: 'Patent-pending',
                body: 'U.S. App. 19/634,402 — Proof-of-Genesis™ on Base.',
              },
              {
                title: 'Live in beta',
                body: 'Tesla, Enphase, SolarEdge, Wallbox — already minting.',
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-secondary/30 transition-colors"
              >
                <div className="text-2xl font-semibold text-foreground">{t.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{t.body}</p>
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
              {buildUnlocks(isPreviewHost()).map(({ icon: Icon, label, desc, to }) => {
                const preview = isPreviewHost();
                const inner = (
                  <>
                    <div className="relative">
                      <Icon className="h-5 w-5 text-muted-foreground/70" />
                      <Lock className={`h-3 w-3 absolute -bottom-1 -right-1 bg-background rounded-full p-[1px] ${preview ? 'text-primary/60' : 'text-secondary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {desc}{preview ? ' · preview' : ''}
                      </div>
                    </div>
                  </>
                );
                const cls = `flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${preview ? 'border-primary/30 bg-card/40 hover:bg-card/70 active:bg-card' : 'border-border/60 bg-card/30'}`;
                if (!preview) {
                  return <div key={label} className={cls}>{inner}</div>;
                }
                if (to.startsWith('mailto:') || to.startsWith('http')) {
                  return <a key={label} href={to} className={cls}>{inner}</a>;
                }
                return <Link key={label} to={to} className={cls}>{inner}</Link>;
              })}
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
              <NdaSignatureStep accessCodeUsed={ACCESS_CODE} onSigned={handleSigned} defaultFullName={refDisplayName ?? undefined} />
            </div>
          ) : (
            <UnlockedPanel signed={signed} onResend={resendEmail} />
          )}
        </section>

        <footer className="border-t border-border/40 py-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            ZenSolar, LLC · Austin, TX · joe@zensolar.com
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
  const demoHref = `${isPreviewHost() ? '/demo-leonardo' : '/demo'}?demo=investor`;
  return (
    <div id="unlocked" className="space-y-6">
      <div className="rounded-2xl border border-secondary/20 bg-secondary/[0.04] px-5 py-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-secondary/80 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-foreground">
              Thank you, {firstName}.
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              NDA signed · copy emailed to{' '}
              <span className="text-foreground/90">{signed.email}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Canonical investor framing — flywheel + three revenue engines */}
      <div className="rounded-3xl border border-border/60 bg-card/30 p-6 md:p-9">
        <div className="mb-7 text-center">
          <div className="text-xs uppercase tracking-[0.28em] text-secondary mb-2">
            The Pitch · v2
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Three Revenue Engines. One Flywheel.
          </h3>
        </div>
        <ThreeRevenueEngines />
      </div>

      {/* Materials — the climax of the page */}
      <div className="pt-6">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.28em] text-secondary mb-2">
            Investor Materials
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Everything you need to evaluate.
          </h3>
        </div>

        {/* Primary CTA bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mb-6">
          <Button
            asChild
            size="lg"
            className="flex-1 h-14 text-base bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_8px_30px_-12px_hsl(var(--secondary)/0.6)]"
          >
            <Link to="/deck">
              <FileText className="h-5 w-5 mr-2" />
              View the Full Deck
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-base border-secondary/40 hover:bg-secondary/5"
          >
            <Link to={demoHref}>
              <PlayCircle className="h-5 w-5 mr-2" />
              Enter Live Demo
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UnlockedCard
            icon={FileText}
            title="Why This Round"
            body="Transparent breakdown of the $2.5M–$3.5M raise, use of funds, GTM approach, and our two-round path to self-sustainability."
            to="/investor/why-this-round"
            internal
          />
          <UnlockedCard
            icon={FileText}
            title="Full Seed Round Deck"
            body="11 slides · Title → Catalyst → Engines → Ask."
            to="/deck"
            internal
          />
          <UnlockedCard
            icon={FileText}
            title="One-Pager"
            body="The leave-behind. Everything on one screen."
            to="/investor/one-pager"
            internal
          />
          <UnlockedCard
            icon={PlayCircle}
            title="Live Investor Demo"
            body="Proof-of-Genesis™ on real data. Mobile-first."
            to={demoHref}
            internal
          />
          <UnlockedCard
            icon={FileText}
            title="Investor Data Room"
            body="PoG, VPP, traction, IP, use of funds."
            to="/investor/data-room"
            internal
          />
        </div>
      </div>

      <div className="pt-6 space-y-3 text-center">
        <p className="text-xs text-muted-foreground">
          Direct contact:{' '}
          <a
            href="mailto:joe@zensolar.com?subject=ZenSolar%20Investor%20Inquiry"
            className="text-secondary hover:text-secondary/80 underline-offset-4 hover:underline"
          >
            joe@zensolar.com
          </a>
        </p>
        <button
          onClick={onResend}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          Email me these links again
        </button>
        <p className="text-[10px] text-muted-foreground/80 pt-2">
          Materials are confidential under your signed NDA (v1.0). Do not share without written consent.
        </p>
      </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-secondary" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="text-[12px] text-muted-foreground leading-relaxed mt-1.5">{body}</div>
    </>
  );
  const className =
    'group rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-secondary/40 hover:bg-card/60 transition-colors block';
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
