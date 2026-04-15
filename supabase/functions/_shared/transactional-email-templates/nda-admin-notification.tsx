import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"

interface NdaAdminNotificationProps {
  signerName?: string
  signerEmail?: string
  signedAt?: string
  ndaVersion?: string
  accessCode?: string
}

const NdaAdminNotificationEmail = ({ signerName, signerEmail, signedAt, ndaVersion, accessCode }: NdaAdminNotificationProps) => {
  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })
    : 'N/A'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New NDA signed by {signerName || 'a user'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src="https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png" alt="ZenSolar" width="160" height="auto" style={logoImg} />
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>New NDA Signature</Heading>
          <Text style={text}>
            A new user has signed the Confidentiality Agreement for the {SITE_NAME} demo.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsText}>
              <strong>Name:</strong> {signerName || 'N/A'}<br />
              <strong>Email:</strong> {signerEmail || 'N/A'}<br />
              <strong>Signed at:</strong> {formattedDate}<br />
              <strong>NDA Version:</strong> {ndaVersion || '1.0'}<br />
              <strong>Access Code:</strong> {accessCode || 'N/A'}
            </Text>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            This is an automated notification from {SITE_NAME}.
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} ZenSolar, LLC. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NdaAdminNotificationEmail,
  subject: (data: Record<string, any>) => `New NDA signed by ${data.signerName || 'a user'}`,
  to: 'joe@zen.solar',
  displayName: 'NDA admin notification',
  previewData: {
    signerName: 'Jane Doe',
    signerEmail: 'jane@example.com',
    signedAt: '2026-04-15T12:00:00Z',
    ndaVersion: '1.0',
    accessCode: 'DEMO2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', display: 'block' as const }
const divider = { borderColor: '#e2e8f0', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(215, 16%, 42%)', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }
const detailsText = { fontSize: '13px', color: '#333333', margin: '0', lineHeight: '1.8' }
const footer = { fontSize: '11px', color: '#999999', margin: '0 0 8px', textAlign: 'center' as const }
