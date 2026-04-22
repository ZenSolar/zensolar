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
const ACCESS_CODE = 'TODD-2026'
const SIGNUP_URL = 'https://beta.zen.solar/auth?mode=signup'
const LOGIN_URL = 'https://beta.zen.solar/auth'
const APP_URL = 'https://beta.zen.solar'
const DEMO_MAGIC_URL = `https://beta.zen.solar/demo?code=${ACCESS_CODE}&from=install`

interface ToddAndroidInviteProps {
  firstName?: string
  trackUrl?: (key: string, destination: string) => string
}

const identityTrack = (_key: string, dest: string) => dest

const ToddAndroidInviteEmail = ({ firstName, trackUrl }: ToddAndroidInviteProps) => {
  const t = trackUrl || identityTrack
  const name = firstName || 'Todd'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${name} — your ZenSolar Founder VIP access. Create your account & install on Android.`}</Preview>
      <Body style={main} bgcolor={COLORS.background}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img src={LOGO_URL} alt="ZenSolar" width="220" height="65" style={logo} />
          </Section>

          <Text style={eyebrow}>Android · Founder VIP · Inner Circle</Text>

          <Heading style={heroTitle}>Welcome in, {name}.</Heading>

          <Text style={paragraph}>
            You&apos;ve been granted <strong>Founder VIP access</strong> to ZenSolar — the
            same patent-pending technology Michael and I are about to put in front of our first
            Founding Investors. You&apos;re seeing it before the rooms that decide what comes next.
          </Text>

          <Section style={noteCard}>
            <Text style={noteText}>
              <strong>Quick heads-up:</strong> read this email all the way through before tapping
              anything. The order matters. There are 3 simple steps: <strong>1) Create your account,
              2) Install the app on Android, 3) Log in and explore the Founders Area</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={sectionTitle}>Step 1 · Create your account</Text>
          <Text style={paragraph}>
            Use your email <strong>todd@zen.solar</strong> when you sign up — that&apos;s the
            address tied to your Founder VIP role. The moment you sign in, your VIP badge and the
            <strong> Founders Area</strong> in the sidebar menu unlock automatically.
          </Text>

          <Section style={pathCardRecommended}>
            <Text style={pathBadgeRecommended}>Start here</Text>
            <Text style={pathTitle}>Create your ZenSolar account</Text>
            <Text style={pathText}>
              Open in Chrome, sign up with <strong>todd@zen.solar</strong>, then verify your
              email if prompted.
            </Text>
            <Link href={t('cta_signup', SIGNUP_URL)} style={buttonPrimary}>
              Create my account
            </Link>
          </Section>

          <Hr style={divider} />

          <Text style={sectionTitle}>Step 2 · Install on Android (Home Screen)</Text>
          <Text style={paragraph}>
            ZenSolar installs like a real native app on Android — no Play Store required. It runs
            full-screen with its own icon on your Home Screen.
          </Text>

          <Section style={pathCardRecommended}>
            <Text style={pathBadgeRecommended}>Recommended · Install on Android</Text>
            <Text style={pathTitle}>Best Android experience</Text>
            <Text style={pathText}>
              Use <strong>Chrome on Android</strong> for the cleanest install (Samsung Internet
              and Edge also work).
            </Text>
            <Text style={step}><strong>1.</strong> Tap the button below to open ZenSolar in Chrome.</Text>
            <Text style={step}><strong>2.</strong> Tap the <strong>⋮</strong> (three-dot) menu in the top-right.</Text>
            <Text style={step}><strong>3.</strong> Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</Text>
            <Text style={step}><strong>4.</strong> Confirm <strong>Install</strong>.</Text>
            <Text style={stepLast}><strong>5.</strong> Open ZenSolar from your Home Screen — it launches full-screen, just like a native app.</Text>
            <Link href={t('cta_install', APP_URL)} style={buttonPrimary}>
              Open ZenSolar in Chrome
            </Link>
            <Text style={secondaryNote}>
              If you don&apos;t see &ldquo;Install app&rdquo; right away, scroll the page once or
              tap the menu again — Chrome surfaces it after a brief moment.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={sectionTitle}>Step 3 · Log in & explore</Text>
          <Text style={paragraph}>
            Open the app from your Home Screen and sign in with <strong>todd@zen.solar</strong>.
            Once you&apos;re in, look for the <strong>★ VIP</strong> badge next to your name in
            the sidebar — that&apos;s your confirmation that Founder access is live.
          </Text>

          <Section style={pathCardSecondary}>
            <Text style={pathBadgeSecondary}>Already installed?</Text>
            <Text style={pathTitle}>Log in</Text>
            <Link href={t('cta_login', LOGIN_URL)} style={buttonSecondary}>
              Log in to ZenSolar
            </Link>
          </Section>

          <Section style={mintCard}>
            <Text style={mintBadge}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>What to look for inside</span></font>
            </Text>
            <Text style={mintTitle}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>Founders Area + Tap-to-Mint™</span></font>
            </Text>
            <Text style={mintText}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>
                Open the <strong style={{ color: '#ffffff' }}>sidebar menu</strong> — you&apos;ll see a new
                <strong style={{ color: '#ffffff' }}> Founders Area</strong> with the Founders Pack, vault, and
                investor materials. Then head to the demo dashboard and{' '}
                <strong style={{ color: '#ffffff' }}>tap the glowing tile to mint your $ZSOLAR tokens</strong>.
                That little moment is the heart of ZenSolar — make sure you experience it.
              </span></font>
            </Text>
          </Section>

          <Section style={feedbackCard}>
            <Text style={feedbackTitle}>After you try it</Text>
            <Text style={feedbackText}>
              Tap the feedback bubble inside the app and tell me what you think — the good, the bad,
              and the confusing. Your honest take is exactly why you&apos;re in the inner circle.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={signatureWrap}>
            <Text style={signoff}>Muchas gracias,</Text>
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
  component: ToddAndroidInviteEmail,
  subject: (data: Record<string, any>) => {
    const name = data?.firstName || 'Todd'
    return `${name} — your Founder VIP access (Android setup inside)`
  },
  displayName: 'Todd Android invite',
  previewData: { firstName: 'Todd' },
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
const heroTitle = { margin: '0 0 24px', textAlign: 'center' as const, fontSize: '34px', lineHeight: '1.15', fontWeight: 800, color: COLORS.text }
const paragraph = { margin: '0 0 16px', fontSize: '16px', lineHeight: '28px', color: COLORS.text }
const noteCard = { margin: '20px 0', padding: '18px 20px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }
const noteText = { margin: '0', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const divider = { margin: '28px 0', borderColor: COLORS.border }
const sectionTitle = { margin: '0 0 12px', fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: COLORS.text }
const pathCardRecommended = { margin: '0 0 16px', padding: '20px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderStrong}` }
const pathCardSecondary = { margin: '0 0 16px', padding: '20px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }
const pathBadgeRecommended = { margin: '0 0 10px', fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const pathBadgeSecondary = { margin: '0 0 10px', fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: COLORS.muted }
const pathTitle = { margin: '0 0 10px', fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: COLORS.text }
const pathText = { margin: '0 0 12px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const step = { margin: '0 0 8px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const stepLast = { margin: '0 0 18px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const buttonPrimary = { display: 'inline-block', padding: '14px 22px', backgroundColor: COLORS.accent, color: '#ffffff', textDecoration: 'none', fontSize: '15px', lineHeight: '20px', fontWeight: 700 }
const buttonSecondary = { display: 'inline-block', padding: '14px 22px', backgroundColor: COLORS.text, color: '#ffffff', textDecoration: 'none', fontSize: '15px', lineHeight: '20px', fontWeight: 700 }
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
