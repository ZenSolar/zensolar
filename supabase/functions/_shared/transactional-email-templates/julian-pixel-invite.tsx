import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"
const LOGO_URL = "https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png"

interface JulianPixelInviteProps {
  firstName?: string
}

const JulianPixelInviteEmail = ({ firstName }: JulianPixelInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Optimized for your Pixel — this is what I've been building for the last four months.</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={badgeWrap}>
          <Text style={badge}>● PIXEL · ANDROID · INVITE ONLY</Text>
        </Section>

        <Heading style={hero}>
          Four months of work,<br />
          <span style={heroAccent}>built for your Pixel.</span>
        </Heading>

        <Text style={greeting}>Hi {firstName || 'Julian'},</Text>

        <Text style={paragraph}>
          This is what I've been working on, head down, just about every single day for the last four months. I wanted you to be one of the first people outside the inner circle to actually feel it — and I tuned this invite specifically for your Google Pixel and Android, so the demo should open clean, fast, and full-screen the moment you tap the button.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://beta.zen.solar/demo" style={ctaButton}>
            Open the demo on your Pixel  →
          </Link>
          <Text style={ctaCaption}>Tap from your Pixel for the best experience · ~90 seconds to feel it.</Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>HOW TO RUN IT ON ANDROID</Text>

        <Section style={card}>
          <Text style={cardNum}>01</Text>
          <Text style={cardTitle}>Open this email on your Pixel</Text>
          <Text style={cardBody}>
            Tap the green button above directly from your phone. It's been laid out for your screen — full-bleed tiles, no pinch-zooming, smooth scroll on Android Chrome.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={cardNum}>02</Text>
          <Text style={cardTitle}>Add to Home screen (optional but cool)</Text>
          <Text style={cardBody}>
            In Chrome on your Pixel, tap the <strong>⋮</strong> menu → <strong>Add to Home screen</strong>. It installs as an app icon — no Play Store, no download. Opens like a native app.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={cardNum}>03</Text>
          <Text style={cardTitle}>Tap the glowing energy tiles</Text>
          <Text style={cardBody}>
            Solar produced, battery exported, EV miles, Supercharging, home charging — each tile tokenizes that energy and mints real $ZSOLAR into your demo wallet. That's the <strong>Tap-to-Mint™</strong> moment. It should feel almost too easy.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={cardNum}>04</Text>
          <Text style={cardTitle}>Tap the floating feedback bubble</Text>
          <Text style={cardBody}>
            Tell me what you think — good, bad, confusing, beautiful, broken. Your honest take from a Pixel user is gold to me right now.
          </Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>WHAT'S HAPPENING BEHIND THE SCENES</Text>

        <Text style={paragraph}>
          Right now I'm heads-down with <strong>Michael Cheetah</strong> finishing the investor presentation and the Founders Pack. We have a meeting in the next couple of weeks with <strong>Lyndon Rive</strong> — Elon Musk's cousin, the co-founder of SolarCity — and we're going to ask him to lead our seed round at <strong>$5 million</strong>.
        </Text>

        <Text style={paragraph}>
          That's why getting your eyes on this <em>now</em> matters so much. You're seeing it before the room that decides what comes next.
        </Text>

        <Section style={pullQuote}>
          <Text style={pullQuoteText}>
            Four months of building, one Pixel, one tap. Tell me what you feel — the good, the weird, the "wait, how does this actually work?" That's exactly what I want to hear.
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

        <Hr style={footerDivider} />
        <Text style={footer}>
          © {new Date().getFullYear()} ZenSolar, LLC<br />
          Patent Pending — U.S. Application No. 19/634,402
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JulianPixelInviteEmail,
  subject: "Built for your Pixel — four months of work, one tap away",
  displayName: 'Julian Pixel invite',
  previewData: {
    firstName: 'Julian',
  },
} satisfies TemplateEntry

// ── Styles (mirrored from demo-followup for brand consistency) ──
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
const ctaSection = { textAlign: 'center' as const, margin: '32px 0 28px' }
const ctaButton = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  backgroundColor: '#10b981', color: '#ffffff', padding: '16px 36px',
  borderRadius: '12px', textDecoration: 'none', fontWeight: 700 as const,
  fontSize: '16px', letterSpacing: '0.01em',
  boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.5)',
}
const ctaCaption = { fontSize: '13px', color: '#9ca3af', margin: '12px 0 0', fontStyle: 'italic' as const }
const sectionDivider = { borderColor: '#f3f4f6', borderWidth: '1px 0 0', margin: '32px 0 24px' }
const sectionLabel = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '2px',
  color: '#9ca3af', margin: '0 0 16px', textAlign: 'center' as const,
}
const card = {
  backgroundColor: '#fafafa', borderRadius: '14px', padding: '20px 22px',
  margin: '0 0 12px', borderLeft: '3px solid #10b981',
}
const cardNum = { fontSize: '12px', fontWeight: 800 as const, color: '#10b981', letterSpacing: '1px', margin: '0 0 6px' }
const cardTitle = { fontSize: '17px', fontWeight: 700 as const, color: '#0a0a0a', margin: '0 0 8px', letterSpacing: '-0.01em' }
const cardBody = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0' }
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
