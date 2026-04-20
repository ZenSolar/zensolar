import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface MintAccessRequestProps {
  requesterName?: string
  requesterEmail?: string
  accessCode?: string
  requestedAt?: string
  source?: string
}

const MintAccessRequestEmail = ({
  requesterName, requesterEmail, accessCode, requestedAt, source,
}: MintAccessRequestProps) => {
  const when = requestedAt ? new Date(requestedAt).toLocaleString() : 'just now'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{requesterName || 'A VIP'} wants to mint $ZSOLAR</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚡ Mint access requested</Heading>
          <Text style={text}>
            Someone in your live mirror demo just tapped the <strong>"Want to mint? Text Joe"</strong> button.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Name</Text>
            <Text style={detailValue}>{requesterName || '—'}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Email</Text>
            <Text style={detailValue}>{requesterEmail || '—'}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Access code</Text>
            <Text style={detailValue}>{accessCode || '—'}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>When</Text>
            <Text style={detailValue}>{when}</Text>
            <Hr style={innerDivider} />
            <Text style={detailLabel}>Source</Text>
            <Text style={detailValue}>{source || 'live_mirror_fab'}</Text>
          </Section>

          <Text style={footer}>Reach out and flip them to editor role so they can mint.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MintAccessRequestEmail,
  subject: (d: Record<string, any>) => `⚡ ${d.requesterName || 'A VIP'} wants to mint $ZSOLAR`,
  displayName: 'Mint access request',
  previewData: {
    requesterName: 'Todd Milliron',
    requesterEmail: 'todd@zen.solar',
    accessCode: 'TODD-2026',
    requestedAt: new Date().toISOString(),
    source: 'live_mirror_fab',
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
