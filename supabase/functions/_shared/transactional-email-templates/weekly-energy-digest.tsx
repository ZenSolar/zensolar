import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ZenSolar'
const LOGO_URL = 'https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png'
const APP_URL = 'https://beta.zen.solar'

export interface DeviceLine {
  label: string         // e.g. "Tesla Powerwall"
  provider: string      // tesla | enphase | solaredge | wallbox
  metric: string        // e.g. "Battery exported"
  value: string         // formatted, e.g. "12.4 kWh"
  partial?: boolean
}

export interface KpiRow {
  label: string
  value: string
  sub?: string
  accent?: 'solar' | 'battery' | 'ev' | 'home' | 'super' | 'token'
}

interface WeeklyDigestProps {
  firstName?: string
  weekLabel?: string                 // "Mar 17 – Mar 23, 2026"
  narrative?: string                 // AI-generated 2-3 sentences
  kpis?: KpiRow[]
  devices?: DeviceLine[]
  tokensThisWeek?: string            // e.g. "428.6"
  tokensLifetime?: string            // e.g. "12,418.2"
  co2KgThisWeek?: string             // e.g. "21.4"
  hadPartialData?: boolean
  quietWeek?: boolean
  trackUrl?: (key: string, destination: string) => string
}

const identityTrack = (_k: string, d: string) => d

const accentColor = (a?: KpiRow['accent']) => {
  switch (a) {
    case 'solar': return '#f5b300'
    case 'battery': return '#10b981'
    case 'ev': return '#3b82f6'
    case 'home': return '#0ea5e9'
    case 'super': return '#ef4444'
    case 'token': return '#f97316'
    default: return COLORS.accent
  }
}

const WeeklyEnergyDigestEmail = ({
  firstName,
  weekLabel,
  narrative,
  kpis = [],
  devices = [],
  tokensThisWeek,
  tokensLifetime,
  co2KgThisWeek,
  hadPartialData,
  quietWeek,
  trackUrl,
}: WeeklyDigestProps) => {
  const t = trackUrl || identityTrack
  const name = firstName || 'there'
  const week = weekLabel || 'this past week'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your ${SITE_NAME} weekly energy digest — ${tokensThisWeek || '0'} $ZSOLAR earned`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="200" height="59" style={logo} />
          </Section>

          <Text style={eyebrow}>Weekly Energy Digest · {week}</Text>
          <Heading style={heroTitle}>
            {quietWeek ? `Quiet week, ${name}.` : `Nice work this week, ${name}.`}
          </Heading>

          {narrative ? (
            <Text style={narrativeText}>{narrative}</Text>
          ) : quietWeek ? (
            <Text style={narrativeText}>
              We didn&apos;t see much activity from your connected devices this week — could be cloudy
              days, travel, or an API hiccup. Your lifetime impact is still adding up.
            </Text>
          ) : null}

          {hadPartialData && (
            <Section style={warnCard}>
              <Text style={warnText}>
                <strong>Heads up:</strong> one or more of your device APIs reported partial data this
                week. The numbers below are conservative — anything missing will be picked up in next
                week&apos;s digest.
              </Text>
            </Section>
          )}

          {/* Hero $ZSOLAR card */}
          <Section style={tokenCard}>
            <Text style={tokenBadge}><span style={{ color: '#ffffff' }}>$ZSOLAR earned this week</span></Text>
            <Text style={tokenValue}><span style={{ color: '#ffffff' }}>{tokensThisWeek || '0'}</span></Text>
            <Text style={tokenSub}>
              <span style={{ color: '#ffffff' }}>
                Lifetime: <strong>{tokensLifetime || '0'}</strong> $ZSOLAR
                {co2KgThisWeek ? ` · ${co2KgThisWeek} kg CO₂ avoided this week` : ''}
              </span>
            </Text>
          </Section>

          {/* KPI grid */}
          {kpis.length > 0 && (
            <>
              <Text style={sectionTitle}>This week, by the numbers</Text>
              <Section style={kpiGrid}>
                {kpis.map((k, i) => (
                  <Section key={i} style={{ ...kpiCard, borderLeft: `4px solid ${accentColor(k.accent)}` }}>
                    <Text style={kpiLabel}>{k.label}</Text>
                    <Text style={{ ...kpiValue, color: accentColor(k.accent) }}>{k.value}</Text>
                    {k.sub && <Text style={kpiSub}>{k.sub}</Text>}
                  </Section>
                ))}
              </Section>
            </>
          )}

          {/* Per-device breakdown */}
          {devices.length > 0 && (
            <>
              <Text style={sectionTitle}>Your connected devices</Text>
              <Section style={deviceList}>
                {devices.map((d, i) => (
                  <Section key={i} style={deviceRow}>
                    <Text style={deviceName}>
                      {d.label}{d.partial && <span style={partialTag}> · partial</span>}
                    </Text>
                    <Text style={deviceMetric}>{d.metric}: <strong>{d.value}</strong></Text>
                  </Section>
                ))}
              </Section>
            </>
          )}

          <Hr style={divider} />

          <Section style={ctaWrap}>
            <Link href={t('cta_open_app', `${APP_URL}/clean-energy-center`)} style={buttonPrimary}>
              Open your Clean Energy Center
            </Link>
          </Section>

          <Hr style={footerDivider} />
          <Section style={footerWrap}>
            <Text style={footer}>
              © {new Date().getFullYear()} ZenSolar, LLC<br />
              ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WeeklyEnergyDigestEmail,
  subject: (data: Record<string, any>) => {
    const tokens = data?.tokensThisWeek || '0'
    return `Your ${SITE_NAME} weekly digest — ${tokens} $ZSOLAR earned`
  },
  displayName: 'Weekly Energy Digest',
  previewData: {
    firstName: 'Michael',
    weekLabel: 'Mar 17 – Mar 23, 2026',
    narrative:
      'Your Powerwall pulled more weight than usual this week — discharging during peak hours while your panels ran flat-out on Wednesday\'s clear sky. Your EV mostly charged off home solar, which is exactly the flywheel we want.',
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
  },
} satisfies TemplateEntry

const COLORS = {
  page: '#000000',          // outer email page background
  background: '#0a0a0a',    // card background (Tesla black)
  surface: '#141414',       // KPI tile
  surfaceAlt: '#101010',    // device list
  border: '#1f1f1f',        // hairline borders
  borderStrong: '#2a2a2a',
  text: '#f5f5f5',
  textDim: '#cfcfcf',
  muted: '#7a7a7a',
  accent: '#f97316',        // ZenSolar orange
  accentDark: '#fb923c',
  tokenBg: '#0c0c0c',       // hero token card
  tokenGlow: 'rgba(249,115,22,0.35)',
}

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

const main = { margin: '0', padding: '20px 8px', backgroundColor: COLORS.page, color: COLORS.text, fontFamily }
const container = { width: '100%', maxWidth: '600px', margin: '0 auto', padding: '28px 20px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: '16px', boxSizing: 'border-box' as const }
const logoWrap = { textAlign: 'center' as const, padding: '0 0 14px' }
const logo = { display: 'block' as const, margin: '0 auto', border: '0' }
const eyebrow = { margin: '0 0 12px', textAlign: 'center' as const, fontSize: '10px', lineHeight: '14px', fontWeight: 700, letterSpacing: '2.4px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const heroTitle = { margin: '0 0 14px', textAlign: 'center' as const, fontSize: '30px', lineHeight: '1.15', fontWeight: 800, letterSpacing: '-0.5px', color: COLORS.text }
const narrativeText = { margin: '0 0 22px', fontSize: '15px', lineHeight: '24px', color: COLORS.textDim, textAlign: 'center' as const }
const warnCard = { margin: '0 0 20px', padding: '14px 16px', backgroundColor: '#1a1408', border: '1px solid #463207', borderRadius: '10px' }
const warnText = { margin: '0', fontSize: '13px', lineHeight: '20px', color: '#f5c451' }
const tokenCard = { margin: '0 0 26px', padding: '28px 20px', backgroundColor: COLORS.tokenBg, border: `1px solid ${COLORS.accent}`, borderRadius: '14px', textAlign: 'center' as const, boxShadow: `0 0 0 1px ${COLORS.border}, 0 8px 32px ${COLORS.tokenGlow}` }
const tokenBadge = { margin: '0 0 10px', fontSize: '10px', lineHeight: '14px', fontWeight: 800, letterSpacing: '2.4px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const tokenValue = { margin: '0 0 8px', fontSize: '52px', lineHeight: '54px', fontWeight: 800, letterSpacing: '-1.5px', color: '#ffffff' }
const tokenSub = { margin: '0', fontSize: '13px', lineHeight: '20px', color: COLORS.textDim }
const sectionTitle = { margin: '24px 0 12px', fontSize: '11px', lineHeight: '16px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: COLORS.muted }
const kpiGrid = { margin: '0 0 8px' }
const kpiCard = { margin: '0 0 10px', padding: '14px 16px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '10px' }
const kpiLabel = { margin: '0 0 6px', fontSize: '10px', lineHeight: '14px', fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase' as const, color: COLORS.muted }
const kpiValue = { margin: '0 0 4px', fontSize: '26px', lineHeight: '30px', fontWeight: 800, letterSpacing: '-0.5px' }
const kpiSub = { margin: '0', fontSize: '12px', lineHeight: '18px', color: COLORS.muted }
const deviceList = { margin: '0 0 8px', padding: '4px 14px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: '10px' }
const deviceRow = { margin: '0', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }
const deviceName = { margin: '0 0 2px', fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: COLORS.text }
const deviceMetric = { margin: '0', fontSize: '12px', lineHeight: '18px', color: COLORS.muted }
const partialTag = { fontSize: '10px', fontWeight: 600, color: '#f5c451' }
const divider = { margin: '26px 0', border: '0', borderTop: `1px solid ${COLORS.border}` }
const ctaWrap = { textAlign: 'center' as const, margin: '0 0 8px' }
const buttonPrimary = { display: 'inline-block', padding: '14px 26px', backgroundColor: COLORS.accent, color: '#0a0a0a', textDecoration: 'none', fontSize: '14px', lineHeight: '20px', fontWeight: 800, letterSpacing: '0.3px', borderRadius: '10px' }
const footerDivider = { margin: '24px 0 14px', border: '0', borderTop: `1px solid ${COLORS.border}` }
const footerWrap = { textAlign: 'center' as const }
const footer = { margin: '0', fontSize: '11px', lineHeight: '18px', color: COLORS.muted, letterSpacing: '0.3px' }

