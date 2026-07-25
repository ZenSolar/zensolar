/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl?: string
  token?: string
}

export const MagicLinkEmail = ({
  token,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your ZenSolar sign-in code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src="https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png" alt="ZenSolar" width="160" height="auto" style={logoImg} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Your sign-in code</Heading>
        <Text style={text}>
          Enter this 6-digit code in the <span style={solarBlue}><strong>ZenSolar</strong></span> app to continue. It expires in 10 minutes.
        </Text>
        <Section style={codeSection}>
          <Text style={codeStyle}>{token ?? '——————'}</Text>
        </Section>
        <Text style={footer}>
          If you didn't request this code, you can safely ignore this email — no action will be taken.
        </Text>
        <Text style={footerBrand}>
          © {new Date().getFullYear()} ZenSolar, LLC · Creating Currency From Energy
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', display: 'block' as const }
const divider = { borderColor: '#e2e8f0', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(215, 16%, 42%)', lineHeight: '1.6', margin: '0 0 20px' }
const codeSection = { textAlign: 'center' as const, margin: '28px 0 32px' }
const codeStyle = {
  display: 'inline-block',
  fontFamily: "'Menlo', 'Consolas', 'Courier New', monospace",
  fontSize: '36px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.35em',
  color: 'hsl(142, 76%, 30%)',
  backgroundColor: '#f1f5f9',
  padding: '18px 24px',
  borderRadius: '12px',
  margin: 0,
}
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '11px', color: '#bbbbbb', margin: '16px 0 0', textAlign: 'center' as const }
const solarBlue = { color: '#2563EB' }
