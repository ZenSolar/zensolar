import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"

interface DemoFollowupProps {
  firstName?: string
}

const DemoFollowupEmail = ({ firstName }: DemoFollowupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Tap a tile. Mint a $ZSOLAR. Tell me what you think.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={greeting}>Hi {firstName || 'there'},</Text>

        <Text style={paragraph}>
          Thanks again for signing the NDA — it means a lot that you'd take time to look at what I've been building.
        </Text>

        <Text style={paragraph}>
          In case you didn't get a chance to walk through it, I saved your spot. The demo stays live for 24 hours after login. After that, just reply and I'll issue you a fresh access code — same goes if you've misplaced the original, or if you'd like to refer someone in your network.
        </Text>

        <Section style={ctaSection}>
          <Link href="https://beta.zen.solar/demo" style={ctaButton}>
            Open the demo →
          </Link>
        </Section>

        <Text style={paragraph}>
          A few things I really want you to try:
        </Text>

        <Text style={bullet}>
          <strong>Tap the glowing energy tiles</strong> in the Clean Energy Center — Solar kWh Produced, Battery kWh Exported, EV Miles, Tesla Supercharging kWh, and Home Charging kWh. Each one tokenizes that energy and mints real $ZSOLAR into your demo wallet. That's the Tap-to-Mint™ moment. It should feel almost too easy.
        </Text>

        <Text style={bullet}>
          <strong>Open the sidebar menu</strong> (top-left corner). Poke around. Click everything. Break things. That's the point.
        </Text>

        <Text style={bullet}>
          <strong>Tap the floating feedback bubble</strong> and tell me what you think — the good, the bad, the confusing, the "wait, how does this actually work?" I read every submission personally, and I value the brutally honest takes far more than the polite ones.
        </Text>

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

        <Text style={paragraph}>
          I'll be transparent — I'm actively in conversations with investors right now, which is exactly why your honest reaction matters so much. You're seeing this before the world does. What you tell me shapes what they see next.
        </Text>

        <Text style={paragraph}>Muchas gracias,</Text>

        <Section style={signatureSection}>
          <Img
            src="https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png"
            alt="ZenSolar"
            width="180"
            height="auto"
            style={logoImg}
          />
          <Text style={sigName}>Joe Maushart</Text>
          <Text style={sigLine}>Founder, ZenSolar</Text>
          <Text style={sigLine}>
            <Link href="mailto:joe@zen.solar" style={inlineLink}>joe@zen.solar</Link>
            {' · '}720.224.6233
          </Text>
          <Text style={sigLine}>
            <Link href="https://joemaushart.com" style={inlineLink}>joemaushart.com</Link>
          </Text>
        </Section>

        <Hr style={divider} />
        <Text style={footer}>
          © {new Date().getFullYear()} ZenSolar, LLC. Patent Pending — U.S. Application No. 19/634,402
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DemoFollowupEmail,
  subject: "Your ZenSolar demo is still waiting — and there's something I want you to try",
  displayName: 'Demo follow-up (v4)',
  previewData: {
    firstName: 'Joe',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }
const greeting = { fontSize: '16px', color: '#1a1a1a', margin: '0 0 16px', fontWeight: 'bold' as const }
const paragraph = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const bullet = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 14px', paddingLeft: '12px', borderLeft: '3px solid #10b981' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = { display: 'inline-block', backgroundColor: '#10b981', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '15px' }
const inlineLink = { color: '#10b981', textDecoration: 'underline' }
const signatureSection = { marginTop: '20px' }
const logoImg = { margin: '0 0 12px', display: 'block' as const }
const sigName = { fontSize: '15px', color: '#1a1a1a', fontWeight: 'bold' as const, margin: '0 0 2px' }
const sigLine = { fontSize: '13px', color: '#555555', margin: '0 0 2px', lineHeight: '1.5' }
const divider = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { fontSize: '11px', color: '#999999', margin: '0', textAlign: 'center' as const }
