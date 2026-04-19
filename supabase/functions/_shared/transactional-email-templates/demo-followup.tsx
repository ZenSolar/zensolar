import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"
const LOGO_URL = "https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png"

interface DemoFollowupProps {
  firstName?: string
}

const DemoFollowupEmail = ({ firstName }: DemoFollowupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're seeing this before the world does. Tap a tile. Mint a $ZSOLAR.</Preview>
    <Body style={main}>
      <Container style={container}>

        {/* Hero badge — sets the "you're early" tone immediately */}
        <Section style={badgeWrap}>
          <Text style={badge}>● EARLY ACCESS · INVITE ONLY</Text>
        </Section>

        <Heading style={hero}>
          You're seeing this<br />
          <span style={heroAccent}>before the world does.</span>
        </Heading>

        <Text style={greeting}>Hi {firstName || 'there'},</Text>

        <Text style={paragraph}>
          Thanks again for signing the NDA — it means a lot that you'd take time to look at what I've been building.
        </Text>

        <Text style={paragraph}>
          In case you didn't get a chance to walk through it, I saved your spot. The demo stays live for 24 hours after login. After that, just reply and I'll issue you a fresh access code — same goes if you've misplaced the original, or if you'd like to refer someone in your network.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://beta.zen.solar/demo" style={ctaButton}>
            Open the demo  →
          </Link>
          <Text style={ctaCaption}>Takes about 90 seconds to feel it.</Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={sectionLabel}>WHAT TO TRY</Text>

        <Section style={card}>
          <Text style={cardNum}>01</Text>
          <Text style={cardTitle}>Tap the glowing energy tiles</Text>
          <Text style={cardBody}>
            In the Clean Energy Center — Solar kWh Produced, Battery kWh Exported, EV Miles, Tesla Supercharging kWh, and Home Charging kWh. Each one tokenizes that energy and mints real $ZSOLAR into your demo wallet. That's the <strong>Tap-to-Mint™</strong> moment. It should feel almost too easy.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={cardNum}>02</Text>
          <Text style={cardTitle}>Open the sidebar menu</Text>
          <Text style={cardBody}>
            Top-left corner. Poke around. Click everything. Break things. That's the point.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={cardNum}>03</Text>
          <Text style={cardTitle}>Tap the floating feedback bubble</Text>
          <Text style={cardBody}>
            Tell me what you think — the good, the bad, the confusing, the "wait, how does this actually work?" I read every submission personally, and I value the brutally honest takes far more than the polite ones.
          </Text>
        </Section>

        <Hr style={sectionDivider} />

        <Text style={paragraph}>
          If you want to go deeper, your access code also unlocks{' '}
          <Link href="https://zensolar.com" style={inlineLink}>zensolar.com</Link>{' '}
          and{' '}
          <Link href="https://beta.zen.solar" style={inlineLink}>beta.zen.solar</Link>
          {' '}— different content, same code, no NDA needed beyond what you've already signed.
        </Text>

        <Text style={paragraph}>
          One thing I'll get ahead of: you're probably going to wonder, "okay… but how are these tokens actually worth USD?" Great question. It's also the entire point of the patent and the technology. I'd rather you feel the experience first and ask me directly. Reply anytime. I'll answer.
        </Text>

        <Section style={pullQuote}>
          <Text style={pullQuoteText}>
            I'm actively in conversations with investors right now — which is exactly why your honest reaction matters so much. What you tell me shapes what they see next.
          </Text>
        </Section>

        <Text style={signoff}>Muchas gracias,</Text>

        {/* Signature — name/title/contact, then logo at bottom */}
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
          <Text style={sigContactLine}>
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
  component: DemoFollowupEmail,
  subject: "You're seeing this before the world does — your ZenSolar demo is waiting",
  displayName: 'Demo follow-up (v5)',
  previewData: {
    firstName: 'Joe',
  },
} satisfies TemplateEntry

// ──────────────────────────────────────────
// Styles — 2026 modern editorial aesthetic
// ──────────────────────────────────────────
const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  WebkitFontSmoothing: 'antialiased' as const,
}
const container = {
  padding: '40px 28px 32px',
  maxWidth: '600px',
  margin: '0 auto',
}

// Hero
const badgeWrap = { textAlign: 'center' as const, margin: '0 0 20px' }
const badge = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700 as const,
  letterSpacing: '1.5px',
  color: '#10b981',
  backgroundColor: '#ecfdf5',
  padding: '6px 12px',
  borderRadius: '999px',
  margin: '0',
}
const hero = {
  fontSize: '34px',
  lineHeight: '1.15',
  fontWeight: 800 as const,
  color: '#0a0a0a',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  margin: '0 0 32px',
}
const heroAccent = {
  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
  color: '#10b981', // fallback for clients that strip gradient
}

// Body text
const greeting = {
  fontSize: '16px',
  color: '#0a0a0a',
  margin: '0 0 16px',
  fontWeight: 600 as const,
}
const paragraph = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.65',
  margin: '0 0 18px',
}

// CTA
const ctaSection = { textAlign: 'center' as const, margin: '32px 0 28px' }
const ctaButton = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  backgroundColor: '#10b981',
  color: '#ffffff',
  padding: '16px 36px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: 700 as const,
  fontSize: '16px',
  letterSpacing: '0.01em',
  boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.5)',
}
const ctaCaption = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '12px 0 0',
  fontStyle: 'italic' as const,
}

// Section dividers + labels
const sectionDivider = {
  borderColor: '#f3f4f6',
  borderWidth: '1px 0 0',
  margin: '32px 0 24px',
}
const sectionLabel = {
  fontSize: '11px',
  fontWeight: 700 as const,
  letterSpacing: '2px',
  color: '#9ca3af',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

// Numbered cards
const card = {
  backgroundColor: '#fafafa',
  borderRadius: '14px',
  padding: '20px 22px',
  margin: '0 0 12px',
  borderLeft: '3px solid #10b981',
}
const cardNum = {
  fontSize: '12px',
  fontWeight: 800 as const,
  color: '#10b981',
  letterSpacing: '1px',
  margin: '0 0 6px',
}
const cardTitle = {
  fontSize: '17px',
  fontWeight: 700 as const,
  color: '#0a0a0a',
  margin: '0 0 8px',
  letterSpacing: '-0.01em',
}
const cardBody = {
  fontSize: '15px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0',
}

// Pull quote
const pullQuote = {
  borderLeft: '4px solid #10b981',
  padding: '4px 0 4px 18px',
  margin: '24px 0',
}
const pullQuoteText = {
  fontSize: '17px',
  lineHeight: '1.55',
  color: '#1f2937',
  fontStyle: 'italic' as const,
  fontWeight: 500 as const,
  margin: '0',
  letterSpacing: '-0.005em',
}

// Sign-off
const signoff = {
  fontSize: '16px',
  color: '#374151',
  margin: '24px 0 20px',
}

// Signature card
const sigCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
const sigLogoCol = {
  width: '72px',
  verticalAlign: 'top' as const,
  paddingRight: '14px',
}
const sigLogoImg = {
  width: '56px',
  height: '56px',
  display: 'block' as const,
  objectFit: 'contain' as const,
}
const sigTextCol = {
  verticalAlign: 'top' as const,
}
const sigName = {
  fontSize: '16px',
  color: '#0a0a0a',
  fontWeight: 700 as const,
  margin: '0 0 2px',
  letterSpacing: '-0.01em',
}
const sigTitle = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 8px',
  fontWeight: 500 as const,
}
const sigContact = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '0 0 2px',
  lineHeight: '1.5',
}
const sigLink = {
  color: '#10b981',
  textDecoration: 'none',
  fontWeight: 500 as const,
}
const sigDot = {
  color: '#d1d5db',
}
const inlineLink = {
  color: '#10b981',
  textDecoration: 'underline',
  fontWeight: 500 as const,
}

// Footer
const footerDivider = {
  borderColor: '#f3f4f6',
  margin: '8px 0 16px',
}
const footerGracias = {
  fontSize: '14px',
  color: '#10b981',
  fontWeight: 600 as const,
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  letterSpacing: '0.01em',
  margin: '0 0 12px',
}
const footer = {
  fontSize: '11px',
  color: '#9ca3af',
  margin: '0',
  textAlign: 'center' as const,
  lineHeight: '1.6',
}
