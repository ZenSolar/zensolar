import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Eye, Mail, LogIn } from 'lucide-react';
import { toast } from 'sonner';

// Faithful HTML/CSS mirror of supabase/functions/_shared/transactional-email-templates/weekly-energy-digest.tsx
// Lets founders review the exact layout/typography/colors without sending an email.

type KpiRow = { label: string; value: string; sub?: string; accent?: 'solar' | 'battery' | 'ev' | 'home' | 'super' | 'token' };
type DeviceLine = { label: string; provider: string; metric: string; value: string; partial?: boolean };
type DigestPayload = {
  firstName?: string;
  weekLabel?: string;
  narrative?: string;
  kpis?: KpiRow[];
  devices?: DeviceLine[];
  tokensThisWeek?: string;
  tokensLifetime?: string;
  co2KgThisWeek?: string;
  hadPartialData?: boolean;
  quietWeek?: boolean;
};

type UserOption = { id: string; email: string | null; device_count?: number; providers?: string[] };

const SITE_NAME = 'ZenSolar';
const LOGO_URL = 'https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png';

const COLORS = {
  page: '#000000',
  background: '#0a0a0a',
  surface: '#141414',
  surfaceAlt: '#101010',
  border: '#1f1f1f',
  borderStrong: '#2a2a2a',
  text: '#f5f5f5',
  textDim: '#cfcfcf',
  muted: '#7a7a7a',
  accent: '#f97316',
  accentDark: '#fb923c',
  tokenBg: '#0c0c0c',
  tokenGlow: 'rgba(249,115,22,0.35)',
};


const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const accentColor = (a?: KpiRow['accent']) => {
  switch (a) {
    case 'solar': return '#f5b300';
    case 'battery': return '#10b981';
    case 'ev': return '#3b82f6';
    case 'home': return '#0ea5e9';
    case 'super': return '#ef4444';
    case 'token': return '#f97316';
    default: return COLORS.accent;
  }
};

const PREVIEW: DigestPayload = {
  firstName: 'Michael',
  weekLabel: 'Mar 17 – Mar 23, 2026',
  narrative:
    "Your Powerwall pulled more weight than usual this week — discharging during peak hours while your panels ran flat-out on Wednesday's clear sky. Your EV mostly charged off home solar, which is exactly the flywheel we want.",
  tokensThisWeek: '428.6',
  tokensLifetime: '12,418.2',
  co2KgThisWeek: '21.4',
  kpis: [
    { label: 'Solar produced', value: '52.3 kWh', sub: 'Generated this week', accent: 'solar' },
    { label: 'Battery exported', value: '14.8 kWh', sub: 'Discharged to home', accent: 'battery' },
    { label: 'EV miles driven', value: '142 mi', sub: '5 days driven', accent: 'ev' },
    { label: 'Home charging', value: '24.1 kWh', sub: '3 sessions', accent: 'home' },
    { label: 'Tesla Supercharging', value: '12.0 kWh', sub: '1 session', accent: 'super' },

  ],
  devices: [
    { label: 'Tesla Powerwall', provider: 'tesla', metric: 'Battery discharged', value: '14.8 kWh' },
    { label: 'Enphase IQ8', provider: 'enphase', metric: 'Solar produced', value: '52.3 kWh' },
    { label: 'Tesla Model 3', provider: 'tesla', metric: 'Miles driven', value: '142 mi' },
    { label: 'Wallbox Pulsar Plus', provider: 'wallbox', metric: 'Home charging', value: '24.1 kWh' },
  ],
  hadPartialData: false,
};

function EmailRender({ data }: { data: DigestPayload }) {
  const {
    firstName, weekLabel, narrative, kpis = [], devices = [],
    tokensThisWeek, tokensLifetime, co2KgThisWeek, hadPartialData, quietWeek,
  } = data;
  const name = firstName || 'there';
  const week = weekLabel || 'this past week';

  // styles copied verbatim from the email template
  const main: React.CSSProperties = { margin: 0, padding: '20px 8px', backgroundColor: COLORS.page, color: COLORS.text, fontFamily };
  const container: React.CSSProperties = { width: '100%', maxWidth: 600, margin: '0 auto', padding: '28px 20px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: 16, boxSizing: 'border-box' };
  const logoWrap: React.CSSProperties = { textAlign: 'center', padding: '0 0 14px' };
  const logo: React.CSSProperties = { display: 'block', margin: '0 auto', border: 0 };
  const eyebrow: React.CSSProperties = { margin: '0 0 12px', textAlign: 'center', fontSize: 10, lineHeight: '14px', fontWeight: 700, letterSpacing: '2.4px', textTransform: 'uppercase', color: COLORS.accentDark };
  const heroTitle: React.CSSProperties = { margin: '0 0 14px', textAlign: 'center', fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.5px', color: COLORS.text };
  const narrativeText: React.CSSProperties = { margin: '0 0 22px', fontSize: 15, lineHeight: '24px', color: COLORS.textDim, textAlign: 'center' };
  const warnCard: React.CSSProperties = { margin: '0 0 20px', padding: '14px 16px', backgroundColor: '#1a1408', border: '1px solid #463207', borderRadius: 10 };
  const warnText: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: '20px', color: '#f5c451' };
  const tokenCard: React.CSSProperties = { margin: '0 0 26px', padding: '28px 20px', backgroundColor: COLORS.tokenBg, border: `1px solid ${COLORS.accent}`, borderRadius: 14, textAlign: 'center', boxShadow: `0 0 0 1px ${COLORS.border}, 0 8px 32px ${COLORS.tokenGlow}` };
  const tokenBadge: React.CSSProperties = { margin: '0 0 10px', fontSize: 10, lineHeight: '14px', fontWeight: 800, letterSpacing: '2.4px', textTransform: 'uppercase', color: COLORS.accentDark };
  const tokenValue: React.CSSProperties = { margin: '0 0 8px', fontSize: 52, lineHeight: '54px', fontWeight: 800, letterSpacing: '-1.5px', color: '#ffffff' };
  const tokenSub: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: '20px', color: COLORS.textDim };
  const sectionTitle: React.CSSProperties = { margin: '24px 0 12px', fontSize: 11, lineHeight: '16px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.muted };
  const kpiCard: React.CSSProperties = { margin: '0 0 10px', padding: '14px 16px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10 };
  const kpiLabel: React.CSSProperties = { margin: '0 0 6px', fontSize: 10, lineHeight: '14px', fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: COLORS.muted };
  const kpiValue: React.CSSProperties = { margin: '0 0 4px', fontSize: 26, lineHeight: '30px', fontWeight: 800, letterSpacing: '-0.5px' };
  const kpiSub: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: '18px', color: COLORS.muted };
  const deviceList: React.CSSProperties = { margin: '0 0 8px', padding: '4px 14px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 10 };
  const deviceRow: React.CSSProperties = { margin: 0, padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` };
  const deviceName: React.CSSProperties = { margin: '0 0 2px', fontSize: 14, lineHeight: '20px', fontWeight: 600, color: COLORS.text };
  const deviceMetric: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: '18px', color: COLORS.muted };
  const partialTag: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#f5c451' };
  const divider: React.CSSProperties = { margin: '26px 0', border: 0, borderTop: `1px solid ${COLORS.border}` };
  const ctaWrap: React.CSSProperties = { textAlign: 'center', margin: '0 0 8px' };
  const buttonPrimary: React.CSSProperties = { display: 'inline-block', padding: '14px 26px', backgroundColor: COLORS.accent, color: '#0a0a0a', textDecoration: 'none', fontSize: 14, lineHeight: '20px', fontWeight: 800, letterSpacing: '0.3px', borderRadius: 10 };
  const footerDivider: React.CSSProperties = { margin: '24px 0 14px', border: 0, borderTop: `1px solid ${COLORS.border}` };
  const footer: React.CSSProperties = { margin: 0, fontSize: 11, lineHeight: '18px', color: COLORS.muted, textAlign: 'center', letterSpacing: '0.3px' };


  return (
    <div style={main}>
      <div style={container}>
        <div style={logoWrap}>
          <img src={LOGO_URL} alt={SITE_NAME} width={200} height={59} style={logo} />
        </div>

        <p style={eyebrow}>Weekly Energy Digest · {week}</p>
        <h1 style={heroTitle}>{quietWeek ? `Quiet week, ${name}.` : `Nice work this week, ${name}.`}</h1>

        {narrative ? (
          <p style={narrativeText}>{narrative}</p>
        ) : quietWeek ? (
          <p style={narrativeText}>
            We didn't see much activity from your connected devices this week — could be cloudy days,
            travel, or an API hiccup. Your lifetime impact is still adding up.
          </p>
        ) : null}

        {hadPartialData && (
          <div style={warnCard}>
            <p style={warnText}>
              <strong>Heads up:</strong> one or more of your device APIs reported partial data this week.
              The numbers below are conservative — anything missing will be picked up in next week's digest.
            </p>
          </div>
        )}

        <div style={tokenCard}>
          <p style={tokenBadge}>$ZSOLAR earned this week</p>
          <p style={tokenValue}>{tokensThisWeek || '0'}</p>
          <p style={tokenSub}>
            Lifetime: <strong>{tokensLifetime || '0'}</strong> $ZSOLAR
            {co2KgThisWeek ? ` · ${co2KgThisWeek} kg CO₂ avoided this week` : ''}
          </p>
        </div>

        {kpis.length > 0 && (
          <>
            <p style={sectionTitle}>This week, by the numbers</p>
            <div>
              {kpis.map((k, i) => (
                <div key={i} style={{ ...kpiCard, borderLeft: `4px solid ${accentColor(k.accent)}` }}>
                  <p style={kpiLabel}>{k.label}</p>
                  <p style={{ ...kpiValue, color: accentColor(k.accent) }}>{k.value}</p>
                  {k.sub && <p style={kpiSub}>{k.sub}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {devices.length > 0 && (
          <>
            <p style={sectionTitle}>Your connected devices</p>
            <div style={deviceList}>
              {devices.map((d, i) => (
                <div key={i} style={deviceRow}>
                  <p style={deviceName}>
                    {d.label}{d.partial && <span style={partialTag}> · partial</span>}
                  </p>
                  <p style={deviceMetric}>{d.metric}: <strong>{d.value}</strong></p>
                </div>
              ))}
            </div>
          </>
        )}

        <hr style={divider} />

        <div style={ctaWrap}>
          <a href="#" style={buttonPrimary} onClick={(e) => e.preventDefault()}>
            Open your Clean Energy Center
          </a>
        </div>

        <hr style={footerDivider} />
        <p style={footer}>
          © {new Date().getFullYear()} ZenSolar, LLC<br />
          ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™
        </p>
      </div>
    </div>
  );
}

export default function WeeklyDigestEmailPreview() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const [data, setData] = useState<DigestPayload>(PREVIEW);
  const [mode, setMode] = useState<'sample' | 'real'>('sample');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !isFounder) {
      toast.error('Founders only');
      navigate('/');
    }
  }, [isFounder, ready, navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-user-emails', { body: { withDevices: true } });
        if (error) throw error;
        const list: UserOption[] = (data?.users || []).filter((u: UserOption) => !!u.email);
        setUsers(list);
        if (user && list.some((u) => u.id === user.id)) setTargetUserId(user.id);
        else if (list[0]) setTargetUserId(list[0].id);
      } catch { /* silent */ }
    })();
  }, [session, user]);

  const loadReal = async () => {
    if (!session) { toast.error('Sign in required'); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('generate-weekly-digest', {
        body: { dryRun: true, userId: targetUserId || undefined },
      });
      if (error) throw error;
      if (res?.payload) {
        setData(res.payload);
        setMode('real');
        toast.success('Loaded real data');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load real data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/weekly-digest')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary shrink-0" />
            Email design preview
          </h1>
          <p className="text-sm text-muted-foreground">
            Exact rendering of the weekly digest email. No emails are sent from this page.
          </p>
        </div>
      </div>

      {!session && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6">
            <div className="flex-1 text-sm">
              Sign in to load real user data into the preview. Sample data still renders without signing in.
            </div>
            <Button onClick={() => navigate('/auth')} size="sm">
              <LogIn className="h-4 w-4 mr-2" /> Sign in
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data source</CardTitle>
          <CardDescription>
            Toggle between sample data and live data for a real user to review the layout under each scenario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant={mode === 'sample' ? 'default' : 'outline'}
              onClick={() => { setData(PREVIEW); setMode('sample'); }}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" /> Sample data
            </Button>
            <Select value={targetUserId} onValueChange={setTargetUserId} disabled={!session || users.length === 0}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder={
                  !session ? 'Sign in to load real data'
                  : users.length === 0 ? 'No registered users'
                  : 'Select a beta user'
                } />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => {
                  const provs = (u.providers || []).join(', ');
                  const tag = provs
                    ? ` · ${provs}${u.device_count ? '' : ' token'}`
                    : ' · no device';
                  return (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email}{user?.id === u.id ? ' (you)' : ''}{tag}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button onClick={loadReal} disabled={!session || loading || !targetUserId} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Load real data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Currently viewing: <strong>{mode === 'sample' ? 'sample preview data' : 'real data (dry run)'}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rendered email</CardTitle>
          <CardDescription>
            Pixel-faithful preview using the same colors, typography, and spacing as the sent email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-[#e5e7eb] p-4 sm:p-6 overflow-auto">
            <EmailRender data={data} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
