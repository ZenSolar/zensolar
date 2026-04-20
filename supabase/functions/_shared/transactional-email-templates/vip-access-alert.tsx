import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"

interface VipAccessAlertProps {
  accessCode?: string
  signerName?: string
  signerEmail?: string
  signedAt?: string
  city?: string
  region?: string
  country?: string
}

const VipAccessAlertEmail = ({
  accessCode, signerName, signerEmail, signedAt, city, region, country,
}: VipAccessAlertProps) => {
  const when = signedAt
    ? new Date(signedAt).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })
    : 'just now'
  const loc = [city, region, country].filter(Boolean).join(', ') || 'Unknown location'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{signerName || accessCode || 'A VIP'} just opened the demo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎯 VIP just opened the demo</Heading>
          <Text style={text}>
            <strong>{signerName || 'A VIP'}</strong> used access code <strong>{accessCode}</strong> for the first time and signed the NDA. They are now viewing your live mirror dashboard.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Name</Text>
            <Text style={detailValue}>{signerName || '—'}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Email</Text>
            <Text style={detailValue}>{signerEmail || '—'}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Code</Text>
            <Text style={detailValue}>{accessCode}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>When</Text>
            <Text style={detailValue}>{when}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Location</Text>
            <Text style={detailValue}>{loc}</Text>
          </Section>

          <Text style={footer}>This is a one-time alert — you'll only get this the first time {accessCode} is used. — {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: VipAccessAlertEmail,
  subject: (d: Record<string, any>) => `🎯 ${d.signerName || 'A VIP'} just opened the ${d.accessCode || 'VIP'} demo`,
  displayName: 'VIP first-access alert',
  previewData: {
    accessCode: 'TODD-2026',
    signerName: 'Todd Milliron',
    signerEmail: 'todd@zen.solar',
    signedAt: new Date().toISOString(),
    city: 'San Francisco', region: 'CA', country: 'US',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px 20px', border: '1px solid #e2e8f0' }
const detailLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#64748b', margin: '0 0 2px', letterSpacing: '0.05em' }
const detailValue = { fontSize: '14px', color: '#0f172a', margin: '0 0 8px', fontWeight: 500 }
const innerDivider = { borderColor: '#e2e8f0', margin: '6px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
