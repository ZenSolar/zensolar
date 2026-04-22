import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"
const LOGO_URL = "https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png"
const DEMO_URL = "https://beta.zen.solar/demo"
// iOS Safari deep link — forces the link to open in Safari instead of the in-app browser
const SAFARI_DEEP_LINK = "x-safari-https://beta.zen.solar/demo"
const ACCESS_CODE = "LOBV-2026"

interface TobyIphoneInviteProps {
  firstName?: string
}

const TobyIphoneInviteEmail = ({ firstName }: TobyIphoneInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Inner circle access. Tap-to-Mint™ on your iPhone.</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={badgeWrap}>
          <Text style={badge}>● iPHONE · iOS · INNER CIRCLE</Text>
        </Section>

        <Heading style={hero}>
          17 months in.<br />
          <span style={heroAccent}>One tap on your iPhone.</span>
        </Heading>

        <Text style={greeting}>Hi {firstName || 'Toby'},</Text>

        <Text style={paragraph}>
          On <strong>November 3, 2024</strong>, I started researching what would become ZenSolar's patented technology. Twenty days later — <strong>November 23, 2024</strong> — I worked up the balls to start copying and pasting code Grok was feeding me into a separate terminal, line by line, not really understanding half of it.
        </Text>

        <Text style={paragraph}>
          That was <strong>17 months ago</strong>. Heads down. Almost every single day. Today it's a real product with patent-pending technology, and I want you to be one of the first people in my <strong>inner circle</strong> to actually feel it — tuned specifically for your iPhone.
        </Text>

        <Section style={readFirstBox}>
          <Text style={readFirstText}>
            <strong>One small ask before you tap anything:</strong> read this whole email down to my signature first. The order matters. The big green button is waiting for you at the bottom.
          </Text>
        </Section>

        <Section style={codeBlock}>
          <Text style={codeLabel}>YOUR PERSONAL ACCESS CODE</Text>
          <Text style={codeValue}>{ACCESS_CODE}</Text>
          <Text style={codeHint}>Tied to you. Unlocks a VIP welcome + ★ VIP badge inside the app.</Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>HOW TO RUN IT — iPHONE, LINE BY LINE</Text>

        <Section style={stepRow}>
          <Text style={stepNum}>1.</Text>
          <Text style={stepText}>
            Open this email <strong>on your iPhone</strong> (not your laptop) — the whole thing is built for iOS.
          </Text>
        </Section>

        <Section style={stepRow}>
          <Text style={stepNum}>2.</Text>
          <Text style={stepText}>
            Open it in Safari and <strong>install it to your Home Screen</strong> in one flow:
            <br />
            <span style={subStep}>
              <strong>a)</strong> Tap the big green button at the bottom of this email — it opens in Safari. If it pops up inside Mail or another app instead, use the small "force-open in Safari" link right under it.
              <br />
              <strong>b)</strong> Once you're in Safari, tap the <strong>Share</strong> icon at the bottom → scroll down → tap <strong>"Add to Home Screen"</strong> → tap <strong>Add</strong>.
              <br />
              <strong>c)</strong> ZenSolar now lives as a real app icon on your iPhone — full-screen, no Safari bar, no App Store, no download. <strong>This is how I want you experiencing ZenSolar from here on out.</strong> Open it from the Home Screen for everything below.
            </span>
          </Text>
        </Section>

        <Section style={stepRow}>
          <Text style={stepNum}>3.</Text>
          <Text style={stepText}>
            Enter your access code: <strong style={codeInline}>{ACCESS_CODE}</strong>
          </Text>
        </Section>

        <Section style={stepRow}>
          <Text style={stepNum}>4.</Text>
          <Text style={stepText}>
            Open ZenSolar from your <strong>Home Screen</strong> and <strong>tap the glowing energy tiles</strong>. Solar, battery, EV miles, Supercharging, home charging — each tap mints real $ZSOLAR into your demo wallet. That's <strong>Tap-to-Mint™</strong>.
          </Text>
        </Section>

        <Section style={stepRow}>
          <Text style={stepNum}>5.</Text>
          <Text style={stepText}>
            Tap the floating <strong>feedback bubble</strong> and tell me what you think — the good, the bad, the confusing. Your honest take matters more than you know.
          </Text>
        </Section>

        <Section style={homescreenCard}>
          <Text style={homescreenLabel}>📱 ONCE IT'S ON YOUR HOME SCREEN</Text>
          <Text style={homescreenText}>
            From here on out, <strong>always launch ZenSolar from the green $ZSOLAR icon</strong> on your Home Screen — not from Safari or this email. That's the real app experience: full-screen, instant load, no browser bar, works even on spotty signal. Tap the icon any time you want to mint, check your wallet, or send me feedback. <strong>This is how you'll use ZenSolar going forward.</strong>
          </Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>WHAT YOU'RE LOOKING AT — THE IP</Text>

        <Text style={paragraph}>
          ZenSolar isn't a wrapper on someone else's tech. The core is <strong>U.S. Patent Pending — Application No. 19/634,402</strong> covering our <strong>Tap-to-Mint™</strong> verification engine: a cryptographic chain that turns real, metered solar production, battery discharge, EV miles, and home/Supercharging into provable on-chain value — without giving up custody of your data.
        </Text>

        <Text style={paragraph}>
          The brand layer is locked down too — <strong>ZenSolar™</strong>, <strong>Tap-to-Mint™</strong>, and <strong>Creating Currency From Energy™</strong> are our marks. Together they form a defensible moat: patented mechanics, trademarked language, and a user experience that feels less like crypto and more like Apple.
        </Text>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>WHAT'S HAPPENING BEHIND THE SCENES</Text>

        <Text style={paragraph}>
          Right now I'm heads-down with <strong>Michael Tschida</strong> — my best friend, co-founder, and CFO/CRO — finishing the investor presentation and the Founders Pack. We're opening a <strong>$5M seed round for Founding Investors</strong>: a small, hand-picked group getting in at the earliest, friendliest terms before we go wider.
        </Text>

        <Text style={paragraph}>
          That's why getting your eyes on this <em>now</em> matters. You're seeing it before the rooms that decide what comes next.
        </Text>

        <Section style={pullQuote}>
          <Text style={pullQuoteText}>
            17 months. One iPhone. One tap. Then it lives on your Home Screen. Tell me what you feel — the good, the weird, the "wait, how does this actually work?" That's exactly what I want to hear.
          </Text>
        </Section>

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
            <Link href="https://joemaushart.com" style={sigLink}>joemaushart.com</Link>
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

        <Text style={readyLabel}>NOW THAT YOU'VE READ IT ALL — TAP IN</Text>

        <Section style={ctaSection}>
          <Link href={DEMO_URL} style={ctaButton}>
            Open the demo on your iPhone  →
          </Link>
          <Text style={ctaCaption}>Tap from your iPhone · ~90 seconds to feel it</Text>
          <Text style={safariFallback}>
            If it opens inside Mail or another app, <Link href={SAFARI_DEEP_LINK} style={inlineLink}>tap here to force-open in Safari</Link>.
          </Text>
        </Section>

        <Hr style={footerDivider} />
        <Text style={footer}>
          © {new Date().getFullYear()} ZenSolar, LLC<br />
          ZenSolar™ · Tap-to-Mint™ · Creating Currency From Energy™<br />
          U.S. Patent Pending — Application No. 19/634,402
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TobyIphoneInviteEmail,
  subject: "Built for your iPhone — read it all the way down, then one tap",
  displayName: 'Toby iPhone invite',
  previewData: {
    firstName: 'Toby',
  },
} satisfies TemplateEntry

// ── Styles ──
const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  WebkitFontSmoothing: 'antialiased' as const,
}
const container = { padding: '40px 28px 32px', maxWidth: '600px', margin: '0 auto' }
const badgeWrap = { textAlign: 'center' as const, margin: '0 0 20px' }
const badge = {
  display: 'inline-block', fontSize: '11px', fontWeight: 700 as const,
  letterSpacing: '1.5px', color: '#10b981', backgroundColor: '#ecfdf5',
  padding: '6px 12px', borderRadius: '999px', margin: '0',
}
const hero = {
  fontSize: '34px', lineHeight: '1.15', fontWeight: 800 as const,
  color: '#0a0a0a', letterSpacing: '-0.02em', textAlign: 'center' as const,
  margin: '0 0 32px',
}
const heroAccent = {
  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
  color: '#10b981',
}
const greeting = { fontSize: '16px', color: '#0a0a0a', margin: '0 0 16px', fontWeight: 600 as const }
const paragraph = { fontSize: '16px', color: '#374151', lineHeight: '1.65', margin: '0 0 18px' }
const readFirstBox = {
  margin: '12px 0 24px', padding: '14px 16px',
  backgroundColor: '#fffbeb', border: '1px solid #fde68a',
  borderRadius: '10px',
}
const readFirstText = { fontSize: '14px', color: '#713f12', lineHeight: '1.55', margin: '0' }
const ctaSection = { textAlign: 'center' as const, margin: '20px 0 24px' }
const ctaButton = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  backgroundColor: '#10b981', color: '#ffffff', padding: '16px 36px',
  borderRadius: '12px', textDecoration: 'none', fontWeight: 700 as const,
  fontSize: '16px', letterSpacing: '0.01em',
  boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.5)',
}
const ctaCaption = { fontSize: '13px', color: '#9ca3af', margin: '12px 0 6px', fontStyle: 'italic' as const }
const safariFallback = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const codeBlock = {
  margin: '8px 0 28px',
  padding: '20px 18px',
  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
  border: '1px dashed #10b981',
  borderRadius: '14px',
  textAlign: 'center' as const,
}
const codeLabel = {
  fontSize: '10px', fontWeight: 700 as const, letterSpacing: '2px',
  color: '#059669', margin: '0 0 8px',
}
const codeValue = {
  fontSize: '28px', fontWeight: 800 as const, color: '#065f46',
  letterSpacing: '0.08em', margin: '0 0 8px',
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
}
const codeHint = { fontSize: '12px', color: '#6b7280', margin: '0', fontStyle: 'italic' as const }
const codeInline = {
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
  background: '#ecfdf5', color: '#065f46', padding: '2px 8px',
  borderRadius: '6px', letterSpacing: '0.05em',
}
const sectionDivider = { borderColor: '#f3f4f6', borderWidth: '1px 0 0', margin: '32px 0 24px' }
const sectionLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '2px',
  color: '#9ca3af', margin: '0 0 16px', textAlign: 'center' as const,
}
const readyLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '2px',
  color: '#059669', margin: '0 0 12px', textAlign: 'center' as const,
}
const stepRow = {
  margin: '0 0 14px', padding: '14px 16px',
  backgroundColor: '#fafafa', borderRadius: '10px',
  borderLeft: '3px solid #10b981',
}
const stepNum = {
  fontSize: '15px', fontWeight: 800 as const, color: '#10b981',
  margin: '0 0 4px', letterSpacing: '0.02em',
}
const stepText = { fontSize: '15px', color: '#1f2937', lineHeight: '1.6', margin: '0' }
const subStep = { fontSize: '13px', color: '#6b7280' }
const inlineLink = { color: '#10b981', textDecoration: 'underline', fontWeight: 600 as const }
const pullQuote = { borderLeft: '4px solid #10b981', padding: '4px 0 4px 18px', margin: '24px 0' }
const pullQuoteText = {
  fontSize: '17px', lineHeight: '1.55', color: '#1f2937',
  fontStyle: 'italic' as const, fontWeight: 500 as const, margin: '0', letterSpacing: '-0.005em',
}
const signoff = { fontSize: '16px', color: '#374151', margin: '24px 0 20px' }
const sigSection = { margin: '0 0 24px' }
const sigName = { fontSize: '16px', color: '#0a0a0a', fontWeight: 700 as const, margin: '0 0 2px', letterSpacing: '-0.01em' }
const sigTitle = { fontSize: '14px', color: '#6b7280', margin: '0 0 10px', fontWeight: 500 as const }
const sigContactLine = { fontSize: '14px', color: '#4b5563', margin: '0 0 4px', lineHeight: '1.5' }
const sigContactLineLast = { fontSize: '14px', color: '#4b5563', margin: '0', lineHeight: '1.5' }
const sigLink = { color: '#10b981', textDecoration: 'underline', fontWeight: 500 as const }
const sigDot = { color: '#d1d5db' }
const sigLogoBottom = { marginTop: '6px', display: 'block' as const, width: '160px', height: 'auto' }
const footerDivider = { borderColor: '#f3f4f6', margin: '8px 0 16px' }
const footer = { fontSize: '11px', color: '#9ca3af', margin: '0', textAlign: 'center' as const, lineHeight: '1.6' }
