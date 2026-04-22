import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"
const LOGO_URL = "https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png"
const ACCESS_CODE = "LOBV-2026"
// Deep links — both pre-load the access code so Toby never has to type it.
// `from=browser` and `from=install` let the app tailor onboarding to the chosen path.
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
    <Html lang="en" dir="ltr" style={html}>
      <Head>
        <meta name="color-scheme" content="dark only" />
        <meta name="supported-color-schemes" content="dark only" />
      </Head>
      <Preview>{`Your code: ${ACCESS_CODE} — pick your path. Browser or Home Screen.`}</Preview>
      <Body style={main} bgcolor={BG}>
        {/* Hard-inline wrapper — survives Gmail iOS Dark Mode CSS stripping */}
        <div style={hardWrap}>
        <Section style={viewportBg}>
          <Container style={container}>

          {/* Header logo */}
          <Section style={logoHeader}>
            <Img
              src={LOGO_URL}
              alt="ZenSolar — Creating Currency From Energy"
              width="180"
              height="44"
              style={logoHeaderImg}
            />
          </Section>

          {/* Badge */}
          <Section style={badgeWrap}>
            <Text style={badge}>● iPHONE · iOS · INNER CIRCLE</Text>
          </Section>

          {/* Hero */}
          <Heading style={hero}>
            17 months in.<br />
            <span style={heroAccent}>One tap on your iPhone.</span>
          </Heading>

          {/* Greeting */}
          <Text style={greeting}>Hi {name},</Text>

          {/* Origin story — verbatim from approved version */}
          <Text style={paragraph}>
            On <strong style={emphasis}>November 3, 2024</strong>, I started researching what would
            become ZenSolar's patented technology. Twenty days later —{' '}
            <strong style={emphasis}>November 23, 2024</strong> — I worked up the balls to start
            copying and pasting code Grok was feeding me into a separate terminal, line by line,
            not really understanding half of it.
          </Text>

          <Text style={paragraph}>
            That was <strong style={emphasis}>17 months ago</strong>. Heads down. Almost every
            single day. Today it's a real product with patent-pending technology, and I want you
            to be one of the first people in my <strong style={emphasis}>inner circle</strong> to
            actually feel it — tuned specifically for your iPhone.
          </Text>

          {/* "One small ask" warning box */}
          <Section style={readFirstBox}>
            <Text style={readFirstText}>
              <strong style={readFirstStrong}>One small ask before you tap anything:</strong>{' '}
              read this whole email down to my signature first. The order matters. Your two
              ways in are waiting at the bottom.
            </Text>
          </Section>

          {/* Access code */}
          <Section style={codeBlock}>
            <Text style={codeLabel}>YOUR PERSONAL ACCESS CODE</Text>
            <Text style={codeValue}>{ACCESS_CODE}</Text>
            <Text style={codeHint}>Unlocks a VIP welcome + ★ badge inside the app.</Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* Behind the scenes */}
          <Text style={sectionLabel}>WHAT'S HAPPENING BEHIND THE SCENES</Text>

          <Text style={paragraph}>
            Right now I'm heads-down with <strong style={emphasis}>Michael Tschida</strong> — my
            best friend, co-founder, and CFO/CRO — finishing the investor presentation and the
            Founders Pack. We're opening a{' '}
            <strong style={emphasis}>$5M seed round for Founding Investors</strong>: a small,
            hand-picked group getting in at the earliest, friendliest terms before we go wider.
          </Text>

          <Text style={paragraph}>
            That's why getting your eyes on this <em>now</em> matters. You're seeing it before
            the rooms that decide what comes next — trademarked language, patent-pending tech,
            and a user experience that feels less like crypto and more like Apple.
          </Text>

          <Section style={pullQuote}>
            <Text style={pullQuoteText}>
              One iPhone. One tap. Then it lives on your Home Screen. Tell me what you feel.
            </Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* IP + protection */}
          <Text style={sectionLabel}>PROTECTED & PATENT-PENDING</Text>

          <Text style={paragraph}>
            Core tech is <strong style={emphasis}>U.S. Patent Pending — App. No. 19/634,402</strong>{' '}
            (Tap-to-Mint™ verification engine). Trademarked: ZenSolar™, Tap-to-Mint™,
            Creating Currency From Energy™.
          </Text>

          <Hr style={sectionDivider} />

          {/* ── TWO WAYS IN — path of least resistance UX ── */}
          <Text style={sectionLabel}>PICK YOUR PATH · TWO WAYS IN</Text>

          <Text style={pickIntro}>
            Both open the exact same app with your code pre-loaded. Start with the recommended
            iPhone experience first, or skip straight to the quickest browser path.
          </Text>

          {/* PATH A — RECOMMENDED: PWA install (the real iOS feel) */}
          <Section style={pathFullCard}>
            <Text style={pathBadgeFull}>★ RECOMMENDED · 30 SECONDS</Text>
            <Text style={pathTitle}>Install it like a real app</Text>
            <Text style={pathDesc}>
              Adds a <strong style={emphasis}>$ZSOLAR icon</strong> to your Home Screen. Launches
              full-screen — no browser bar, no tabs, real native feel. This is how I want you to
              experience it.
            </Text>

            <Section style={miniSteps}>
              <Text style={miniStep}>
                <span style={miniStepNum}>1.</span> Tap the green button
                below. It opens ZenSolar in <strong>Safari</strong> (required — Chrome can't
                install to Home Screen on iOS).
              </Text>
              <Text style={miniStep}>
                <span style={miniStepNum}>2.</span> In Safari, tap the{' '}
                <strong>Share</strong> icon (the square with the up-arrow at the{' '}
                <strong>bottom-center</strong> of the screen).
              </Text>
              <Text style={miniStep}>
                <span style={miniStepNum}>3.</span> Scroll down in the
                share sheet and tap <strong>"Add to Home Screen"</strong>, then tap{' '}
                <strong>"Add"</strong> in the top-right corner.
              </Text>
              <Text style={miniStepLast}>
                <span style={miniStepNum}>4.</span> Close Safari and open{' '}
                <strong>ZenSolar from your Home Screen</strong> (the new green icon). Your code{' '}
                <strong style={codeInline}>{ACCESS_CODE}</strong> is already loaded — just tap
                the glowing tile.
              </Text>
            </Section>

            <Link href={t('cta_install', DEMO_URL_INSTALL)} style={ctaButtonFull}>
              Install to Home Screen  →
            </Link>
            <Text style={pathFootnote}>
              Same URL. Same code. This is the best version of the experience.
            </Text>
          </Section>

          {/* OR divider */}
          <Section style={orWrap}>
            <Text style={orText}>— or, if you want the quickest way in —</Text>
          </Section>

          {/* PATH B — FAST: Browser (zero friction fallback) */}
          <Section style={pathFastCard}>
            <Text style={pathBadgeFast}>⚡ FASTEST · 5 SECONDS</Text>
            <Text style={pathTitle}>Just open it in your browser</Text>
            <Text style={pathDesc}>
              Tap the button and ZenSolar opens immediately in Safari or Chrome. No install,
              no setup — just the fastest possible path into the app.
            </Text>
            <Link href={t('cta_browser', DEMO_URL_BROWSER)} style={ctaButtonFast}>
              Open in browser  →
            </Link>
            <Text style={pathFootnote}>
              Opens inside Mail?{' '}
              <Link href={t('safari_force', SAFARI_DEEP_LINK)} style={inlineLink}>
                Force-open in Safari
              </Link>
            </Text>
          </Section>

          {/* Either way, do this */}
          <Section style={feedbackCard}>
            <Text style={feedbackLabel}>📣 EITHER WAY</Text>
            <Text style={feedbackText}>
              Tap the floating <strong style={emphasis}>feedback bubble</strong> and tell me
              what you think — the good, the bad, the confusing. Your honest take is the whole
              reason you're getting this email today.
            </Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* Signature */}
          <Text style={signoff}>Muchas gracias,</Text>

          <Section style={sigSection}>
            <Text style={sigName}>Joe Maushart</Text>
            <Text style={sigTitle}>Founder, {SITE_NAME}</Text>
            <Text style={sigContactLine}>
              <Link href="mailto:joe@zen.solar" style={sigLink}>joe@zen.solar</Link>
            </Text>
            <Text style={sigContactLine}>
              <Link href="tel:+17202246233" style={sigLink}>720.224.6233</Link>
              <span style={sigDot}>  ·  </span>
              <Link href="sms:+17202246233" style={sigLink}>text</Link>
            </Text>
            <Text style={sigContactLineLast}>
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

          <Hr style={footerDivider} />
          <Text style={footer}>
            © {new Date().getFullYear()} ZenSolar, LLC<br />
            ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™<br />
            U.S. Patent Pending — Application No. 19/634,402
          </Text>
          </Container>
        </Section>
        </div>
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
const FAST_ACCENT = '#60a5fa'
const FAST_BG = '#0a1628'

const html = { backgroundColor: BG, margin: '0', padding: '0' }
const hardWrap = {
  backgroundColor: BG,
  color: TEXT,
  margin: '0',
  padding: '0',
  width: '100%',
}
const main = {
  backgroundColor: BG,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  WebkitFontSmoothing: 'antialiased' as const,
  color: TEXT,
  margin: '0',
  padding: '0',
  width: '100%',
}
const viewportBg = {
  backgroundColor: BG,
  width: '100%',
  margin: '0',
  padding: '0 0 24px',
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
const readFirstText = { fontSize: '14px', color: WARN_TEXT, lineHeight: '1.55', margin: '0' }

// Access code block
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

// Pull quote
const pullQuote = {
  borderLeft: '4px solid ' + ACCENT,
  padding: '4px 0 4px 16px',
  margin: '20px 0',
}
const pullQuoteText = {
  fontSize: '16px', lineHeight: '1.55', color: TEXT,
  fontStyle: 'italic' as const, fontWeight: 500 as const, margin: '0', letterSpacing: '-0.005em',
}

// ── TWO PATHS — Browser (fast) vs Install (full) ──
const pickIntro = {
  fontSize: '14px', color: TEXT, lineHeight: '1.6',
  margin: '0 0 20px', textAlign: 'center' as const, fontStyle: 'italic' as const,
}

// Path A — FAST (Browser) — blue accent, hero feel
const pathFastCard = {
  margin: '0 0 14px',
  padding: '22px 20px',
  backgroundColor: FAST_BG,
  border: '2px solid ' + FAST_ACCENT,
  borderRadius: '16px',
  textAlign: 'center' as const,
}
const pathBadgeFast = {
  display: 'inline-block',
  fontSize: '10px', fontWeight: 800 as const, letterSpacing: '1.8px',
  color: FAST_ACCENT,
  backgroundColor: 'rgba(96, 165, 250, 0.12)',
  border: '1px solid ' + FAST_ACCENT,
  padding: '5px 12px',
  borderRadius: '999px',
  margin: '0 0 12px',
}

// Path B — FULL (Install) — green accent, recommended
const pathFullCard = {
  margin: '0 0 18px',
  padding: '22px 20px',
  backgroundColor: SURFACE_2,
  border: '2px solid ' + ACCENT,
  borderRadius: '16px',
  textAlign: 'center' as const,
  boxShadow: '0 8px 24px -12px rgba(16, 185, 129, 0.4)',
}
const pathBadgeFull = {
  display: 'inline-block',
  fontSize: '10px', fontWeight: 800 as const, letterSpacing: '1.8px',
  color: ACCENT_SOFT,
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  border: '1px solid ' + ACCENT,
  padding: '5px 12px',
  borderRadius: '999px',
  margin: '0 0 12px',
}

const pathTitle = {
  fontSize: '20px', fontWeight: 800 as const, color: TEXT,
  letterSpacing: '-0.01em', margin: '0 0 10px',
}
const pathDesc = {
  fontSize: '14px', color: TEXT, lineHeight: '1.6',
  margin: '0 0 18px', textAlign: 'left' as const,
}
const pathFootnote = {
  fontSize: '12px', color: TEXT_DIM, margin: '12px 0 0', fontStyle: 'italic' as const,
}

const ctaButtonFast = {
  display: 'inline-block',
  backgroundColor: FAST_ACCENT,
  color: '#04122a',
  padding: '15px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: 800 as const,
  fontSize: '16px',
  letterSpacing: '0.01em',
  border: '1px solid ' + FAST_ACCENT,
  boxShadow: '0 8px 24px -8px rgba(96, 165, 250, 0.5)',
}
const ctaButtonFull = {
  display: 'inline-block',
  backgroundColor: ACCENT,
  color: '#04140d',
  padding: '15px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: 800 as const,
  fontSize: '16px',
  letterSpacing: '0.01em',
  border: '1px solid ' + ACCENT_SOFT,
  boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.55)',
}

// OR divider between paths
const orWrap = { textAlign: 'center' as const, margin: '4px 0 14px' }
const orText = {
  fontSize: '12px', color: TEXT_DIM, margin: '0',
  letterSpacing: '0.5px', fontStyle: 'italic' as const,
}

// Mini 3-step install inside Path B
const miniSteps = {
  margin: '0 0 18px',
  padding: '14px 16px',
  backgroundColor: SURFACE,
  border: '1px solid ' + BORDER,
  borderRadius: '10px',
  textAlign: 'left' as const,
}
const miniStep = { fontSize: '13px', color: TEXT, lineHeight: '1.55', margin: '0 0 8px' }
const miniStepLast = { fontSize: '13px', color: TEXT, lineHeight: '1.55', margin: '0' }
const miniStepNum = {
  display: 'inline-block', minWidth: '18px',
  fontSize: '13px', fontWeight: 800 as const,
  color: ACCENT_SOFT, marginRight: '4px',
}

// Feedback card (either way)
const feedbackCard = {
  margin: '4px 0 4px',
  padding: '16px 18px',
  backgroundColor: SURFACE_2,
  border: '1px solid rgba(16, 185, 129, 0.35)',
  borderRadius: '12px',
}
const feedbackLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '1.5px',
  color: ACCENT_SOFT, margin: '0 0 8px',
}
const feedbackText = { fontSize: '14px', color: TEXT, lineHeight: '1.6', margin: '0' }

const inlineLink = { color: ACCENT_SOFT, textDecoration: 'underline', fontWeight: 600 as const }

// Signature
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

// Header logo (top of email)
const logoHeader = { textAlign: 'center' as const, margin: '0 0 18px' }
const logoHeaderImg = { display: 'block' as const, margin: '0 auto', width: '180px', height: 'auto', maxWidth: '60%' }
