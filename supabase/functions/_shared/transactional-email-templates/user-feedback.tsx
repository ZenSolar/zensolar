import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"

interface UserFeedbackProps {
  message?: string
}

const UserFeedbackEmail = ({ message }: UserFeedbackProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New user feedback received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src="https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png" alt="ZenSolar" width="160" height="auto" style={logoImg} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>New User Feedback</Heading>
        <Text style={text}>
          A user submitted feedback from the {SITE_NAME} app:
        </Text>

        <Section style={feedbackBox}>
          <Text style={feedbackText}>
            {message || 'No message provided.'}
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

export const template = {
  component: UserFeedbackEmail,
  subject: 'New user feedback received',
  to: 'joe@zen.solar',
  displayName: 'User feedback notification',
  previewData: { message: 'I love this app! Would be great to have dark mode on the NFT cards.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', display: 'block' as const }
const divider = { borderColor: '#e2e8f0', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(215, 16%, 42%)', lineHeight: '1.6', margin: '0 0 20px' }
const feedbackBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }
const feedbackText = { fontSize: '14px', color: '#333333', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '11px', color: '#999999', margin: '0 0 8px', textAlign: 'center' as const }
