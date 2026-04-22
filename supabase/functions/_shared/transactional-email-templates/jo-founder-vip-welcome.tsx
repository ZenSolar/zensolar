import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ZenSolar'
const LOGO_URL = 'https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png'
const LOGIN_URL = 'https://beta.zen.solar/auth'
const APP_URL = 'https://beta.zen.solar'

interface JoFounderVipProps {
  firstName?: string
  trackUrl?: (key: string, destination: string) => string
}

const identityTrack = (_key: string, dest: string) => dest

const JoFounderVipEmail = ({ firstName, trackUrl }: JoFounderVipProps) => {
  const t = trackUrl || identityTrack
  const name = firstName || 'Jo'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${name} — Founder VIP access is live, plus a brand-new Founders Area in the sidebar.`}</Preview>
      <Body style={main} bgcolor={COLORS.background}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img src={LOGO_URL} alt="ZenSolar" width="220" height="65" style={logo} />
          </Section>

          <Text style={eyebrow}>Founder VIP · Inner Circle</Text>

          <Heading style={heroTitle}>You&apos;re in the inner circle, {name}.</Heading>

          <Text style={paragraph}>
            Quick update — I&apos;ve flipped on <strong>Founder VIP access</strong> for your
            account (<strong>jo@zen.solar</strong>). Next time you sign in, you&apos;ll notice
            two new things waiting for you.
          </Text>

          <Hr style={divider} />

          <Text style={sectionTitle}>1 · Your ★ VIP badge</Text>
          <Text style={paragraph}>
            In the <strong>sidebar menu</strong>, right next to your name, you&apos;ll now see a
            gold <strong>★ VIP</strong> badge. That&apos;s your confirmation that Founder access
            is live on your account.
          </Text>

          <Text style={sectionTitle}>2 · The Founders Area</Text>
          <Text style={paragraph}>
            Open the sidebar menu and look for the new <strong>Founders Area</strong> section.
            This is where I&apos;m staging everything Michael and I are using to take ZenSolar
            into the world:
          </Text>

          <Section style={listCard}>
            <Text style={listItem}>• <strong>Founders Pack</strong> — our Northstar doc; the story, the math, the moat.</Text>
            <Text style={listItem}>• <strong>Founders Vault</strong> — investor-grade materials and patents-in-progress.</Text>
            <Text style={listItem}>• <strong>Founders links</strong> — the same private resources Michael, Joe, and the inner circle use.</Text>
          </Section>

          <Section style={noteCard}>
            <Text style={noteText}>
              <strong>Heads up:</strong> the Clean Energy Center and dashboard you&apos;ll see are
              the standard demo experience (simulated data) — not the live admin views. The
              Founders Area is where the real signal lives.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={pathCardRecommended}>
            <Text style={pathBadgeRecommended}>Sign in to see it</Text>
            <Text style={pathTitle}>Open ZenSolar</Text>
            <Text style={pathText}>
              Sign in with <strong>jo@zen.solar</strong> and your VIP badge + Founders Area will
              be there automatically.
            </Text>
            <Link href={t('cta_login', LOGIN_URL)} style={buttonPrimary}>
              Sign in to ZenSolar
            </Link>
            <Text style={secondaryNote}>
              Already signed in on a device? Just refresh — the badge and the Founders Area will
              appear in the sidebar.
            </Text>
          </Section>

          <Section style={mintCard}>
            <Text style={mintBadge}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>While you&apos;re in there</span></font>
            </Text>
            <Text style={mintTitle}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>Read the Founders Pack</span></font>
            </Text>
            <Text style={mintText}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>
                It&apos;s the clearest picture of where we&apos;re headed — patent-pending tech,
                tokenomics, the team, and why this is shaping up to be a generational company.
                Tap any chapter bubble at the top to jump straight to that section.
              </span></font>
            </Text>
          </Section>

          <Section style={feedbackCard}>
            <Text style={feedbackTitle}>After you poke around</Text>
            <Text style={feedbackText}>
              Use the feedback bubble inside the app — or just text me. Anything that feels off,
              confusing, or missing in the Founders Area, I want to hear it.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={signatureWrap}>
            <Text style={signoff}>Welcome in,</Text>
            <Text style={signatureName}>Joe Maushart</Text>
            <Text style={signatureMeta}>Founder, {SITE_NAME}</Text>
            <Text style={signatureMeta}>
              <Link href="mailto:joe@zen.solar" style={inlineLink}>joe@zen.solar</Link>
              {' '}·{' '}
              <Link href="tel:+17202246233" style={inlineLink}>720.224.6233</Link>
              {' '}·{' '}
              <Link href="sms:+17202246233" style={inlineLink}>text</Link>
            </Text>
            <Img src={LOGO_URL} alt="ZenSolar" width="160" height="47" style={signatureLogo} />
          </Section>

          <Hr style={footerDivider} />
          <Section style={footerWrap}>
            <Text style={footer}>
              © {new Date().getFullYear()} ZenSolar, LLC<br />
              ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™<br />
              U.S. Patent Pending — Application No. 19/634,402
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JoFounderVipEmail,
  subject: (data: Record<string, any>) => {
    const name = data?.firstName || 'Jo'
    return `${name} — your Founder VIP access is live ★`
  },
  displayName: 'Jo Founder VIP welcome',
  previewData: { firstName: 'Jo' },
} satisfies TemplateEntry

const COLORS = {
  background: '#ffffff',
  surface: '#f3f4f6',
  surfaceAlt: '#eef6f2',
  border: '#d1d5db',
  borderStrong: '#b7e4cf',
  text: '#111827',
  muted: '#4b5563',
  accent: '#0f9f6e',
  accentDark: '#0b7a55',
}

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

const main = { margin: '0', padding: '16px 8px', backgroundColor: COLORS.background, color: COLORS.text, fontFamily }
const container = { width: '100%', maxWidth: '600px', margin: '0 auto', padding: '24px 16px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' as const }
const logoWrap = { textAlign: 'center' as const, padding: '0 0 12px' }
const logo = { display: 'block' as const, margin: '0 auto', border: '0', outline: 'none', textDecoration: 'none', backgroundColor: 'transparent' }
const eyebrow = { margin: '0 0 20px', textAlign: 'center' as const, fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const heroTitle = { margin: '0 0 24px', textAlign: 'center' as const, fontSize: '32px', lineHeight: '1.15', fontWeight: 800, color: COLORS.text }
const paragraph = { margin: '0 0 16px', fontSize: '16px', lineHeight: '28px', color: COLORS.text }
const noteCard = { margin: '20px 0', padding: '18px 20px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }
const noteText = { margin: '0', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const listCard = { margin: '0 0 16px', padding: '18px 20px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderStrong}` }
const listItem = { margin: '0 0 8px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const divider = { margin: '28px 0', borderColor: COLORS.border }
const sectionTitle = { margin: '0 0 12px', fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: COLORS.text }
const pathCardRecommended = { margin: '0 0 16px', padding: '20px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderStrong}` }
const pathBadgeRecommended = { margin: '0 0 10px', fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const pathTitle = { margin: '0 0 10px', fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: COLORS.text }
const pathText = { margin: '0 0 12px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const buttonPrimary = { display: 'inline-block', padding: '14px 22px', backgroundColor: COLORS.accent, color: '#ffffff', textDecoration: 'none', fontSize: '15px', lineHeight: '20px', fontWeight: 700 }
const secondaryNote = { margin: '12px 0 0', fontSize: '14px', lineHeight: '22px', color: COLORS.muted }
const mintCard = { margin: '0 0 16px', padding: '22px 20px', backgroundColor: '#064e36', border: `2px solid #064e36`, textAlign: 'center' as const }
const mintBadge = { margin: '0 0 10px', fontSize: '12px', lineHeight: '18px', fontWeight: 800, letterSpacing: '2px', color: '#ffffff' }
const mintTitle = { margin: '0 0 10px', fontSize: '22px', lineHeight: '28px', fontWeight: 800, color: '#ffffff' }
const mintText = { margin: '0', fontSize: '15px', lineHeight: '24px', color: '#ffffff' }
const feedbackCard = { margin: '0 0 8px', padding: '18px 20px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }
const feedbackTitle = { margin: '0 0 8px', fontSize: '18px', lineHeight: '26px', fontWeight: 700, color: COLORS.text }
const feedbackText = { margin: '0', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const signatureWrap = { margin: '20px 0 8px' }
const signoff = { margin: '0 0 8px', fontSize: '16px', lineHeight: '24px', color: COLORS.text }
const signatureName = { margin: '0 0 4px', fontSize: '18px', lineHeight: '24px', fontWeight: 700, color: COLORS.text }
const signatureMeta = { margin: '0 0 4px', fontSize: '14px', lineHeight: '22px', color: COLORS.muted }
const signatureLogo = { display: 'block' as const, margin: '12px 0 0', border: '0', outline: 'none' }
const inlineLink = { color: COLORS.accentDark, textDecoration: 'underline' }
const footerDivider = { margin: '20px 0 12px', borderColor: COLORS.border }
const footerWrap = { textAlign: 'center' as const }
const footer = { margin: '0', fontSize: '12px', lineHeight: '18px', color: COLORS.muted }
