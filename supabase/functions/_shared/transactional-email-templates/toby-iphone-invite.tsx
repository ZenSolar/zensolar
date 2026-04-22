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
const ACCESS_CODE = 'LOBV-2026'
const DEMO_URL_BROWSER = `https://beta.zen.solar/demo?code=${ACCESS_CODE}&from=browser`
const DEMO_URL_INSTALL = `https://beta.zen.solar/demo?code=${ACCESS_CODE}&from=install`
const SAFARI_DEEP_LINK = `x-safari-https://beta.zen.solar/demo?code=${ACCESS_CODE}&from=browser`

interface TobyIphoneInviteProps {
  firstName?: string
  trackUrl?: (key: string, destination: string) => string
}

const identityTrack = (_key: string, dest: string) => dest

const TobyIphoneInviteEmail = ({ firstName, trackUrl }: TobyIphoneInviteProps) => {
  const t = trackUrl || identityTrack
  const name = firstName || 'Toby'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your ZenSolar access code is ${ACCESS_CODE}. Open in browser or install to Home Screen.`}</Preview>
      <Body style={main} bgcolor={COLORS.background}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img
              src={LOGO_URL}
              alt="ZenSolar"
              width="220"
              height="65"
              style={logo}
            />
          </Section>

          <Text style={eyebrow}>iPhone · iOS · Inner Circle</Text>

          <Heading style={heroTitle}>One tap on your iPhone.</Heading>

          <Text style={greeting}>Hi {name},</Text>

          <Text style={paragraph}>
            On <strong>November 3, 2024</strong>, I started researching what would become
            ZenSolar&apos;s patented technology. Twenty days later — <strong>November 23, 2024</strong>
            {' '}— I worked up the courage to start copying and pasting code into a separate
            terminal, line by line, not really understanding half of it.
          </Text>

          <Text style={paragraph}>
            That was <strong>17 months ago</strong>. Heads down. Almost every single day.
            Today it&apos;s a real product with patent-pending technology, and I want you to be
            one of the first people in my <strong>inner circle</strong> to actually feel it — tuned
            specifically for your iPhone.
          </Text>

          <Section style={noteCard}>
            <Text style={noteText}>
              <strong>One small ask before you tap anything:</strong> read this whole email down to
              my signature first. The order matters. Your two ways in are waiting at the bottom.
            </Text>
          </Section>

          <Section style={codeCard}>
            <Text style={codeLabel}>YOUR PERSONAL ACCESS CODE</Text>
            <Text style={codeValue}>{ACCESS_CODE}</Text>
            <Text style={codeHint}>This unlocks a VIP welcome and badge inside the app.</Text>
          </Section>

          <Hr style={divider} />

          <Text style={sectionTitle}>What&apos;s happening behind the scenes</Text>

          <Text style={paragraph}>
            Right now I&apos;m heads-down with <strong>Michael Tschida</strong> — my best friend,
            co-founder, and CFO/CRO — finishing the investor presentation and the Founders Pack.
            We&apos;re opening a <strong>$5M seed round for Founding Investors</strong>: a small,
            hand-picked group getting in at the earliest, friendliest terms before we go wider.
          </Text>

          <Text style={paragraph}>
            That&apos;s why getting your eyes on this <em>now</em> matters. You&apos;re seeing it before
            the rooms that decide what comes next — trademarked language, patent-pending tech,
            and a user experience that feels less like crypto and more like Apple.
          </Text>

          <Hr style={divider} />

          <Text style={sectionTitle}>Pick your path</Text>
          <Text style={paragraph}>
            Both options open the same app with your code already loaded.
          </Text>

          <Section style={pathCardRecommended}>
            <Text style={pathBadgeRecommended}>Recommended · Install to Home Screen</Text>
            <Text style={pathTitle}>Best iPhone experience</Text>
            <Text style={pathText}>
              Opens in Safari so you can add ZenSolar to your Home Screen and launch it like a
              real app.
            </Text>
            <Text style={step}><strong>1.</strong> Tap the button below to open ZenSolar in Safari.</Text>
            <Text style={step}><strong>2.</strong> Tap the Share icon.</Text>
            <Text style={step}><strong>3.</strong> Tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</Text>
            <Text style={stepLast}><strong>4.</strong> Open ZenSolar from your Home Screen and tap the glowing tile.</Text>
            <Link href={t('cta_install', DEMO_URL_INSTALL)} style={buttonPrimary}>
              Install to Home Screen
            </Link>
          </Section>

          <Section style={pathCardSecondary}>
            <Text style={pathBadgeSecondary}>Fastest · Open in browser</Text>
            <Text style={pathTitle}>Quickest way in</Text>
            <Text style={pathText}>
              No install. No setup. Just open the app and go straight in.
            </Text>
            <Link href={t('cta_browser', DEMO_URL_BROWSER)} style={buttonSecondary}>
              Open in browser
            </Link>
            <Text style={secondaryNote}>
              If Mail opens it inside its own browser,{' '}
              <Link href={t('safari_force', SAFARI_DEEP_LINK)} style={inlineLink}>
                force-open it in Safari
              </Link>
              .
            </Text>
          </Section>

          <Section style={mintCard}>
            <Text style={mintBadge}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>The 2-step magic moment</span></font>
            </Text>
            <Text style={mintTitle}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>Tap-to-Mint, then peek at your Wallet</span></font>
            </Text>
            <Text style={mintText}>
              <font color="#ffffff"><span style={{ color: '#ffffff' }}>
                Once you&apos;re in the app, <strong style={{ color: '#ffffff' }}>tap the glowing tile to mint your $ZSOLAR tokens</strong>.
                Then <strong style={{ color: '#ffffff' }}>open the Wallet</strong> and watch your freshly minted balance land in
                real time. That little moment is the heart of ZenSolar — make sure you experience it.
              </span></font>
            </Text>
          </Section>

          <Section style={feedbackCard}>
            <Text style={feedbackTitle}>After you try it</Text>
            <Text style={feedbackText}>
              Tap the feedback bubble and tell me what you think — the good, the bad, and the
              confusing. Your honest take is the whole reason you&apos;re getting this email.
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
            <Text style={signatureMeta}>
              <Link href={t('joemaushart', 'https://joemaushart.com')} style={inlineLink}>
                joemaushart.com
              </Link>
            </Text>
            <Img
              src={LOGO_URL}
              alt="ZenSolar"
              width="160"
              height="47"
              style={signatureLogo}
            />
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
  component: TobyIphoneInviteEmail,
  subject: (data: Record<string, any>) => {
    const name = data?.firstName || 'Toby'
    return `${name} — inner circle access (your iPhone is ready)`
  },
  displayName: 'Toby iPhone invite',
  previewData: {
    firstName: 'Toby',
  },
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

const main = {
  margin: '0',
  padding: '16px 8px',
  backgroundColor: COLORS.background,
  color: COLORS.text,
  fontFamily,
}

const container = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px 16px',
  backgroundColor: COLORS.background,
  border: `1px solid ${COLORS.border}`,
  boxSizing: 'border-box' as const,
}

const logoWrap = {
  textAlign: 'center' as const,
  padding: '0 0 12px',
}

const logo = {
  display: 'block' as const,
  margin: '0 auto',
  border: '0',
  outline: 'none',
  textDecoration: 'none',
  backgroundColor: 'transparent',
}

const eyebrow = {
  margin: '0 0 20px',
  textAlign: 'center' as const,
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: 700,
  letterSpacing: '1.8px',
  textTransform: 'uppercase' as const,
  color: COLORS.accentDark,
}

const heroTitle = {
  margin: '0 0 24px',
  textAlign: 'center' as const,
  fontSize: '34px',
  lineHeight: '1.15',
  fontWeight: 800,
  color: COLORS.text,
}

const greeting = {
  margin: '0 0 16px',
  fontSize: '18px',
  lineHeight: '28px',
  fontWeight: 700,
  color: COLORS.text,
}

const paragraph = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '28px',
  color: COLORS.text,
}

const noteCard = {
  margin: '20px 0',
  padding: '18px 20px',
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
}

const noteText = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.text,
}

const codeCard = {
  margin: '0 0 8px',
  padding: '20px',
  backgroundColor: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.borderStrong}`,
  textAlign: 'center' as const,
}

const codeLabel = {
  margin: '0 0 8px',
  fontSize: '11px',
  lineHeight: '16px',
  fontWeight: 700,
  letterSpacing: '1.8px',
  color: COLORS.accentDark,
}

const codeValue = {
  margin: '0 0 8px',
  fontSize: '30px',
  lineHeight: '36px',
  fontWeight: 800,
  letterSpacing: '2px',
  color: COLORS.text,
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
}

const codeHint = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '22px',
  color: COLORS.muted,
}

const divider = {
  margin: '28px 0',
  borderColor: COLORS.border,
}

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: '20px',
  lineHeight: '28px',
  fontWeight: 700,
  color: COLORS.text,
}

const pathCardRecommended = {
  margin: '0 0 16px',
  padding: '20px',
  backgroundColor: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.borderStrong}`,
}

const pathCardSecondary = {
  margin: '0 0 16px',
  padding: '20px',
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
}

const pathBadgeRecommended = {
  margin: '0 0 10px',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: COLORS.accentDark,
}

const pathBadgeSecondary = {
  margin: '0 0 10px',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: COLORS.muted,
}

const pathTitle = {
  margin: '0 0 10px',
  fontSize: '20px',
  lineHeight: '28px',
  fontWeight: 700,
  color: COLORS.text,
}

const pathText = {
  margin: '0 0 12px',
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.text,
}

const step = {
  margin: '0 0 8px',
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.text,
}

const stepLast = {
  margin: '0 0 18px',
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.text,
}

const buttonPrimary = {
  display: 'inline-block',
  padding: '14px 22px',
  backgroundColor: COLORS.accent,
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '15px',
  lineHeight: '20px',
  fontWeight: 700,
}

const buttonSecondary = {
  display: 'inline-block',
  padding: '14px 22px',
  backgroundColor: COLORS.text,
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '15px',
  lineHeight: '20px',
  fontWeight: 700,
}

const secondaryNote = {
  margin: '12px 0 0',
  fontSize: '14px',
  lineHeight: '22px',
  color: COLORS.muted,
}

const mintCard = {
  margin: '0 0 16px',
  padding: '22px 20px',
  backgroundColor: '#064e36',
  border: `2px solid #064e36`,
  textAlign: 'center' as const,
}

const mintBadge = {
  margin: '0 0 10px',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: 800,
  letterSpacing: '2px',
  color: '#ffffff',
}

const mintTitle = {
  margin: '0 0 10px',
  fontSize: '22px',
  lineHeight: '28px',
  fontWeight: 800,
  color: '#ffffff',
}

const mintText = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#ffffff',
}

const feedbackCard = {
  margin: '0 0 8px',
  padding: '18px 20px',
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
}

const feedbackTitle = {
  margin: '0 0 8px',
  fontSize: '18px',
  lineHeight: '26px',
  fontWeight: 700,
  color: COLORS.text,
}

const feedbackText = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '24px',
  color: COLORS.text,
}

const signoff = {
  margin: '0 0 10px',
  textAlign: 'center' as const,
  fontSize: '16px',
  lineHeight: '24px',
  color: COLORS.text,
}

const signatureName = {
  margin: '0 0 4px',
  textAlign: 'center' as const,
  fontSize: '18px',
  lineHeight: '26px',
  fontWeight: 700,
  color: COLORS.text,
}

const signatureMeta = {
  margin: '0 0 6px',
  textAlign: 'center' as const,
  fontSize: '13px',
  lineHeight: '20px',
  color: COLORS.muted,
  wordBreak: 'break-word' as const,
}

const signatureWrap = {
  margin: '0 auto 16px',
  padding: '0 8px',
  textAlign: 'center' as const,
}

const signatureLogo = {
  display: 'block' as const,
  margin: '16px auto 0',
  border: '0',
  outline: 'none',
  textDecoration: 'none',
  backgroundColor: 'transparent',
  maxWidth: '100%',
  height: 'auto' as const,
}

const footerWrap = {
  margin: '0 auto',
  padding: '0 8px',
  textAlign: 'center' as const,
}

const inlineLink = {
  color: COLORS.accentDark,
  textDecoration: 'underline',
}

const footerDivider = {
  margin: '24px 0 16px',
  borderColor: COLORS.border,
}

const footer = {
  margin: '0',
  textAlign: 'center' as const,
  fontSize: '12px',
  lineHeight: '20px',
  color: COLORS.muted,
}
