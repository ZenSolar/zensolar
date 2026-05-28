import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Eye, Mail } from 'lucide-react';
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
  background: '#ffffff',
  surface: '#f3f4f6',
  surfaceAlt: '#eef6f2',
  border: '#d1d5db',
  text: '#111827',
  muted: '#4b5563',
  accent: '#f97316',
  accentDark: '#c2410c',
  tokenBg: '#0b1f17',
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
    { label: 'Solar produced', value: '52.3 kWh', sub: '+8% vs last week', accent: 'solar' },
    { label: 'Battery exported', value: '14.8 kWh', sub: 'Peak-hour offset', accent: 'battery' },
    { label: 'EV miles driven', value: '142 mi', sub: '38 kWh consumed', accent: 'ev' },
    { label: 'Home charging', value: '24.1 kWh', sub: '76% from solar', accent: 'home' },
    { label: 'Supercharging', value: '12.0 kWh', sub: '1 session', accent: 'super' },
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
  const main: React.CSSProperties = { margin: 0, padding: '16px 8px', backgroundColor: COLORS.background, color: COLORS.text, fontFamily };
  const container: React.CSSProperties = { width: '100%', maxWidth: 600, margin: '0 auto', padding: '24px 16px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' };
  const logoWrap: React.CSSProperties = { textAlign: 'center', padding: '0 0 12px' };
  const logo: React.CSSProperties = { display: 'block', margin: '0 auto', border: 0 };
  const eyebrow: React.CSSProperties = { margin: '0 0 14px', textAlign: 'center', fontSize: 11, lineHeight: '16px', fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: COLORS.accentDark };
  const heroTitle: React.CSSProperties = { margin: '0 0 16px', textAlign: 'center', fontSize: 28, lineHeight: 1.2, fontWeight: 800, color: COLORS.text };
  const narrativeText: React.CSSProperties = { margin: '0 0 20px', fontSize: 16, lineHeight: '26px', color: COLORS.text, textAlign: 'center' };
  const warnCard: React.CSSProperties = { margin: '0 0 20px', padding: '14px 16px', backgroundColor: '#fff8e6', border: '1px solid #f5d97a' };
  const warnText: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: '22px', color: '#7a5500' };
  const tokenCard: React.CSSProperties = { margin: '0 0 24px', padding: '24px 20px', backgroundColor: COLORS.tokenBg, border: `2px solid ${COLORS.accent}`, textAlign: 'center' };
  const tokenBadge: React.CSSProperties = { margin: '0 0 8px', fontSize: 11, lineHeight: '16px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffffff' };
  const tokenValue: React.CSSProperties = { margin: '0 0 8px', fontSize: 44, lineHeight: '48px', fontWeight: 800, color: '#ffffff' };
  const tokenSub: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: '22px', color: '#ffffff' };
  const sectionTitle: React.CSSProperties = { margin: '20px 0 12px', fontSize: 18, lineHeight: '24px', fontWeight: 700, color: COLORS.text };
  const kpiCard: React.CSSProperties = { margin: '0 0 10px', padding: '12px 14px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` };
  const kpiLabel: React.CSSProperties = { margin: '0 0 4px', fontSize: 12, lineHeight: '16px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: COLORS.muted };
  const kpiValue: React.CSSProperties = { margin: '0 0 2px', fontSize: 22, lineHeight: '28px', fontWeight: 800 };
  const kpiSub: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: '18px', color: COLORS.muted };
  const deviceList: React.CSSProperties = { margin: '0 0 8px', padding: '8px 12px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` };
  const deviceRow: React.CSSProperties = { margin: '6px 0', padding: '8px 0', borderBottom: `1px dashed ${COLORS.border}` };
  const deviceName: React.CSSProperties = { margin: '0 0 2px', fontSize: 14, lineHeight: '20px', fontWeight: 700, color: COLORS.text };
  const deviceMetric: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: '18px', color: COLORS.muted };
  const partialTag: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#b45309' };
  const divider: React.CSSProperties = { margin: '24px 0', border: 0, borderTop: `1px solid ${COLORS.border}` };
  const ctaWrap: React.CSSProperties = { textAlign: 'center', margin: '0 0 8px' };
  const buttonPrimary: React.CSSProperties = { display: 'inline-block', padding: '14px 22px', backgroundColor: COLORS.accent, color: '#ffffff', textDecoration: 'none', fontSize: 15, lineHeight: '20px', fontWeight: 700 };
  const footerDivider: React.CSSProperties = { margin: '20px 0 12px', border: 0, borderTop: `1px solid ${COLORS.border}` };
  const footer: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: '18px', color: COLORS.muted, textAlign: 'center' };

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
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder={
                  !session ? 'Sign in to load real data'
                  : users.length === 0 ? 'No beta users with a connected device'
                  : 'Beta user with connected device'
                } />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => {
                  const provs = (u.providers || []).join(', ');
                  return (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email}{user?.id === u.id ? ' (you)' : ''}{provs ? ` · ${provs}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
