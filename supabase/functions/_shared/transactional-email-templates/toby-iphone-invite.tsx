import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"
const LOGO_URL = "https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png"
const DEMO_URL = "https://beta.zen.solar/demo"
const SAFARI_DEEP_LINK = "x-safari-https://beta.zen.solar/demo"
const ACCESS_CODE = "LOBV-2026"

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
      <Head>
        <meta name="color-scheme" content="dark only" />
        <meta name="supported-color-schemes" content="dark only" />
        <style>{`
          :root { color-scheme: dark only; supported-color-schemes: dark only; }
          html, body { background-color: #0a0f0d !important; }
          u + .body .dark-bg { background-color: #0a0f0d !important; }
          [data-ogsc] .dark-bg { background-color: #0a0f0d !important; }
          [data-ogsc] .dark-text { color: #e8f0ec !important; }
          [data-ogsc] .dark-muted { color: #9bb0a6 !important; }
          [data-ogsc] .dark-accent { color: #34d399 !important; }
          @media (prefers-color-scheme: light) {
            .dark-bg { background-color: #0a0f0d !important; }
            .dark-text { color: #e8f0ec !important; }
            .dark-muted { color: #9bb0a6 !important; }
          }
        `}</style>
      </Head>
      <Preview>{`Your code: ${ACCESS_CODE} — 17 months → one tap. Read before you tap.`}</Preview>
      <Body style={main} className="body dark-bg">
        <Container style={container} className="dark-bg">

          <Section style={badgeWrap}>
            <Text style={badge} className="dark-accent">● iPHONE · iOS · INNER CIRCLE</Text>
          </Section>

          <Heading style={hero} className="dark-text">
            17 months in.<br />
            <span style={heroAccent} className="dark-accent">One tap on your iPhone.</span>
          </Heading>

          <Text style={greeting} className="dark-text">Hi {name},</Text>

          <Text style={paragraph} className="dark-text">
            On <strong style={emphasis}>November 3, 2024</strong>, I started researching what would
            become ZenSolar's patented technology. Twenty days later —{' '}
            <strong style={emphasis}>November 23, 2024</strong> — I worked up the balls to start
            copying and pasting code Grok was feeding me into a separate terminal, line by line,
            not really understanding half of it.
          </Text>

          <Text style={paragraph} className="dark-text">
            That was <strong style={emphasis}>17 months ago</strong>. Heads down. Almost every
            single day. Today it's a real product with patent-pending technology, and I want you
            to be one of the first people in my <strong style={emphasis}>inner circle</strong> to
            actually feel it — tuned specifically for your iPhone.
          </Text>

          {/* "One small ask" warning box — verbatim from the joemaushart.com version */}
          <Section style={readFirstBox}>
            <Text style={readFirstText} className="dark-text">
              <strong style={readFirstStrong}>One small ask before you tap anything:</strong>{' '}
              read this whole email down to my signature first. The order matters. The big green
              button is waiting for you at the bottom.
            </Text>
          </Section>

          {/* Access code */}
          <Section style={codeBlock}>
            <Text style={codeLabel} className="dark-accent">YOUR PERSONAL ACCESS CODE</Text>
            <Text style={codeValue} className="dark-text">{ACCESS_CODE}</Text>
            <Text style={codeHint} className="dark-muted">Unlocks a VIP welcome + ★ badge inside the app.</Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* Behind the scenes */}
          <Text style={sectionLabel} className="dark-muted">WHAT'S HAPPENING BEHIND THE SCENES</Text>

          <Text style={paragraph} className="dark-text">
            Right now I'm heads-down with <strong style={emphasis}>Michael Tschida</strong> — my
            best friend, co-founder, and CFO/CRO — finishing the investor presentation and the
            Founders Pack. We're opening a{' '}
            <strong style={emphasis}>$5M seed round for Founding Investors</strong>: a small,
            hand-picked group getting in at the earliest, friendliest terms before we go wider.
          </Text>

          <Text style={paragraph} className="dark-text">
            That's why getting your eyes on this <em>now</em> matters. You're seeing it before
            the rooms that decide what comes next — trademarked language, patent-pending tech,
            and a user experience that feels less like crypto and more like Apple.
          </Text>

          <Section style={pullQuote}>
            <Text style={pullQuoteText} className="dark-text">
              One iPhone. One tap. Then it lives on your Home Screen. Tell me what you feel.
            </Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* IP + protection */}
          <Text style={sectionLabel} className="dark-muted">PROTECTED & PATENT-PENDING</Text>

          <Text style={paragraph} className="dark-text">
            Core tech is <strong style={emphasis}>U.S. Patent Pending — App. No. 19/634,402</strong>{' '}
            (Tap-to-Mint™ verification engine). Trademarked: ZenSolar™, Tap-to-Mint™,
            Creating Currency From Energy™.
          </Text>

          <Hr style={sectionDivider} />

          {/* Install instructions */}
          <Text style={sectionLabel} className="dark-muted">INSTALL TO HOME SCREEN · 30 SEC</Text>

          <Section style={stepRow}>
            <Text style={stepText} className="dark-text">
              <span style={stepNum} className="dark-accent">1</span>{' '}
              Tap the green button below on your iPhone (opens in Safari).
            </Text>
          </Section>

          <Section style={stepRow}>
            <Text style={stepText} className="dark-text">
              <span style={stepNum} className="dark-accent">2</span>{' '}
              In Safari: <strong>Share</strong> icon → <strong>Add to Home Screen</strong> → <strong>Add</strong>.
            </Text>
          </Section>

          <Section style={stepRow}>
            <Text style={stepText} className="dark-text">
              <span style={stepNum} className="dark-accent">3</span>{' '}
              Enter code <strong style={codeInline}>{ACCESS_CODE}</strong>, then tap the glowing
              tiles to mint $ZSOLAR.
            </Text>
          </Section>

          <Section style={homescreenCard}>
            <Text style={homescreenLabel}>📱 AFTER YOU INSTALL</Text>
            <Text style={homescreenText} className="dark-text">
              Always launch from the green <strong style={emphasis}>$ZSOLAR icon</strong> on your
              Home Screen — full-screen, no browser bar, real app feel. That's{' '}
              <strong style={emphasis}>Tap-to-Mint™</strong>. Tap the floating feedback bubble
              and tell me what you think — good, bad, confusing.
            </Text>
          </Section>

          {/* Signature BEFORE the button — "down to my signature first" */}
          <Text style={signoff} className="dark-muted">Muchas gracias,</Text>

          <Section style={sigSection}>
            <Text style={sigName} className="dark-text">Joe Maushart</Text>
            <Text style={sigTitle} className="dark-muted">Founder, {SITE_NAME}</Text>
            <Text style={sigContactLine} className="dark-muted">
              <Link href="mailto:joe@zen.solar" style={sigLink}>joe@zen.solar</Link>
            </Text>
            <Text style={sigContactLine} className="dark-muted">
              <Link href="tel:+17202246233" style={sigLink}>720.224.6233</Link>
              <span style={sigDot}>  ·  </span>
              <Link href="sms:+17202246233" style={sigLink}>text</Link>
            </Text>
            <Text style={sigContactLineLast} className="dark-muted">
              <Link href={t('joemaushart', 'https://joemaushart.com')} style={sigLink}>joemaushart.com</Link>
            </Text>

            <Img
              src={LOGO_URL}
              alt="ZenSolar"
              width="160"
              height="auto"
              style={sigLogoBottom}
            />
          </Section>

          <Hr style={sectionDivider} />

          {/* THE BIG GREEN BUTTON — at the bottom, as promised */}
          <Section style={ctaSection}>
            <Text style={ctaPreface} className="dark-muted">
              You read it all? Good. Now —
            </Text>
            <Link href={t('cta_primary', DEMO_URL)} style={ctaButton}>
              Open on your iPhone  →
            </Link>
            <Text style={ctaCaption} className="dark-muted">~90 seconds · Safari recommended · Code: {ACCESS_CODE}</Text>
            <Text style={safariFallback} className="dark-muted">
              Opens inside Mail?{' '}
              <Link href={t('safari_force', SAFARI_DEEP_LINK)} style={inlineLink}>
                Force-open in Safari
              </Link>
            </Text>
          </Section>

          <Hr style={footerDivider} />
          <Text style={footer} className="dark-muted">
            © {new Date().getFullYear()} ZenSolar, LLC<br />
            ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™<br />
            U.S. Patent Pending — Application No. 19/634,402
          </Text>
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

// ── Locked dark palette ──
const BG = '#0a0f0d'
const SURFACE = '#0f1714'
const SURFACE_2 = '#142019'
const BORDER = '#1f2e26'
const TEXT = '#e8f0ec'
const TEXT_MUTED = '#9bb0a6'
const TEXT_DIM = '#6b8278'
const ACCENT = '#10b981'
const ACCENT_SOFT = '#34d399'
const WARN_BG = '#3a2a0a'
const WARN_BORDER = '#d97706'
const WARN_TEXT = '#fbbf24'

const main = {
  backgroundColor: BG,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  WebkitFontSmoothing: 'antialiased' as const,
  color: TEXT,
  margin: '0',
  padding: '0',
}
const container = {
  padding: '36px 24px 28px',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: BG,
}
const badgeWrap = { textAlign: 'center' as const, margin: '0 0 22px' }
const badge = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700 as const,
  letterSpacing: '1.6px',
  color: ACCENT_SOFT,
  backgroundColor: 'rgba(16, 185, 129, 0.10)',
  border: '1px solid rgba(16, 185, 129, 0.35)',
  padding: '6px 14px',
  borderRadius: '999px',
  margin: '0',
}
const hero = {
  fontSize: '32px',
  lineHeight: '1.15',
  fontWeight: 800 as const,
  color: TEXT,
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  margin: '0 0 28px',
}
const heroAccent = { color: ACCENT_SOFT }
const greeting = { fontSize: '16px', color: TEXT, margin: '0 0 18px', fontWeight: 600 as const }
const paragraph = { fontSize: '15px', color: TEXT, lineHeight: '1.65', margin: '0 0 16px' }
const emphasis = { color: TEXT, fontWeight: 700 as const }

// "One small ask" warning box
const readFirstBox = {
  margin: '20px 0 22px',
  padding: '16px 18px',
  backgroundColor: WARN_BG,
  border: '2px solid ' + WARN_BORDER,
  borderRadius: '12px',
}
const readFirstStrong = { color: WARN_TEXT, fontWeight: 800 as const }
const readFirstText = {
  fontSize: '14px',
  color: WARN_TEXT,
  lineHeight: '1.55',
  margin: '0',
}

const ctaSection = { textAlign: 'center' as const, margin: '24px 0 20px' }
const ctaPreface = { fontSize: '14px', color: TEXT_MUTED, margin: '0 0 14px', fontStyle: 'italic' as const }
const ctaButton = {
  display: 'inline-block',
  backgroundColor: ACCENT,
  color: '#04140d',
  padding: '16px 36px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: 800 as const,
  fontSize: '16px',
  letterSpacing: '0.01em',
  border: '1px solid #34d399',
  boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.55)',
}
const ctaCaption = { fontSize: '13px', color: TEXT_DIM, margin: '12px 0 6px', fontStyle: 'italic' as const }
const safariFallback = { fontSize: '12px', color: TEXT_DIM, margin: '0' }

const codeBlock = {
  margin: '8px 0 4px',
  padding: '20px 18px',
  backgroundColor: SURFACE_2,
  border: '1px dashed ' + ACCENT,
  borderRadius: '14px',
  textAlign: 'center' as const,
}
const codeLabel = {
  fontSize: '10px', fontWeight: 700 as const, letterSpacing: '2px',
  color: ACCENT_SOFT, margin: '0 0 8px',
}
const codeValue = {
  fontSize: '28px', fontWeight: 800 as const, color: TEXT,
  letterSpacing: '0.10em', margin: '0 0 8px',
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
}
const codeHint = { fontSize: '12px', color: TEXT_DIM, margin: '0', fontStyle: 'italic' as const }
const codeInline = {
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  color: ACCENT_SOFT,
  padding: '2px 8px',
  borderRadius: '6px',
  letterSpacing: '0.05em',
}

const sectionDivider = { borderColor: BORDER, borderWidth: '1px 0 0', margin: '30px 0 22px' }
const sectionLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '2px',
  color: TEXT_DIM, margin: '0 0 14px', textAlign: 'center' as const,
}

const stepRow = {
  margin: '0 0 10px',
  padding: '12px 14px',
  backgroundColor: SURFACE,
  border: '1px solid ' + BORDER,
  borderLeft: '3px solid ' + ACCENT,
  borderRadius: '10px',
}
const stepNum = {
  display: 'inline-block',
  minWidth: '20px',
  fontSize: '14px',
  fontWeight: 800 as const,
  color: ACCENT_SOFT,
  marginRight: '4px',
}
const stepText = { fontSize: '15px', color: TEXT, lineHeight: '1.55', margin: '0' }

const homescreenCard = {
  margin: '18px 0 4px',
  padding: '16px 18px',
  backgroundColor: SURFACE_2,
  border: '1px solid rgba(16, 185, 129, 0.35)',
  borderRadius: '12px',
}
const homescreenLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '1.5px',
  color: ACCENT_SOFT, margin: '0 0 8px',
}
const homescreenText = { fontSize: '14px', color: TEXT, lineHeight: '1.6', margin: '0' }

const inlineLink = { color: ACCENT_SOFT, textDecoration: 'underline', fontWeight: 600 as const }

const pullQuote = {
  borderLeft: '4px solid ' + ACCENT,
  padding: '4px 0 4px 16px',
  margin: '20px 0',
}
const pullQuoteText = {
  fontSize: '16px', lineHeight: '1.55', color: TEXT,
  fontStyle: 'italic' as const, fontWeight: 500 as const, margin: '0', letterSpacing: '-0.005em',
}

const signoff = { fontSize: '15px', color: TEXT_MUTED, margin: '24px 0 16px' }
const sigSection = { margin: '0 0 20px' }
const sigName = { fontSize: '16px', color: TEXT, fontWeight: 700 as const, margin: '0 0 2px', letterSpacing: '-0.01em' }
const sigTitle = { fontSize: '14px', color: TEXT_DIM, margin: '0 0 10px', fontWeight: 500 as const }
const sigContactLine = { fontSize: '14px', color: TEXT_MUTED, margin: '0 0 4px', lineHeight: '1.5' }
const sigContactLineLast = { fontSize: '14px', color: TEXT_MUTED, margin: '0', lineHeight: '1.5' }
const sigLink = { color: ACCENT_SOFT, textDecoration: 'underline', fontWeight: 500 as const }
const sigDot = { color: TEXT_DIM }
const sigLogoBottom = { marginTop: '10px', display: 'block' as const, width: '160px', height: 'auto' }

const footerDivider = { borderColor: BORDER, margin: '8px 0 16px' }
const footer = { fontSize: '11px', color: TEXT_DIM, margin: '0', textAlign: 'center' as const, lineHeight: '1.6' }
