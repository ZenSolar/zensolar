import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Attendee {
  name?: string
  email?: string
  accessCode?: string
  city?: string
  country?: string
  accessedAt?: string
}

interface DemoAttendeesReportProps {
  attendees?: Attendee[]
  generatedAt?: string
}

const DemoAttendeesReportEmail = ({ attendees = [], generatedAt }: DemoAttendeesReportProps) => {
  const when = generatedAt
    ? new Date(generatedAt).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : new Date().toLocaleString()

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{attendees.length} people have completed the ZenSolar demo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Demo Attendees Report</Heading>
          <Text style={text}>
            <strong>{attendees.length}</strong> {attendees.length === 1 ? 'person has' : 'people have'} signed the NDA and reached the full ZenSolar demo dashboard.
          </Text>
          <Text style={muted}>Generated {when}</Text>

          <Hr style={divider} />

          {attendees.length === 0 ? (
            <Text style={text}>No attendees yet.</Text>
          ) : (
            <Section>
              {attendees.map((a, i) => (
                <Row key={i} style={rowStyle}>
                  <Column>
                    <Text style={attendeeName}>{a.name || '—'}</Text>
                    <Text style={attendeeMeta}>
                      {a.email || 'no email'} · {a.accessCode || '—'}
                      {a.city || a.country ? ` · ${[a.city, a.country].filter(Boolean).join(', ')}` : ''}
                    </Text>
                    <Text style={attendeeDate}>
                      {a.accessedAt ? new Date(a.accessedAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : ''}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          <Hr style={divider} />
          <Text style={footer}>ZenSolar · Investor Demo Tracker</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DemoAttendeesReportEmail,
  subject: (d: Record<string, any>) => `ZenSolar Demo Report: ${(d.attendees || []).length} attendees so far`,
  displayName: 'Demo attendees report',
  previewData: {
    attendees: [
      { name: 'Todd Milliron', email: 'todd@zen.solar', accessCode: 'TODD-2026', city: 'Denver', country: 'US', accessedAt: new Date().toISOString() },
    ],
    generatedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 8px' }
const muted = { fontSize: '12px', color: '#94a3b8', margin: '0 0 12px' }
const divider = { borderColor: '#e2e8f0', margin: '16px 0' }
const rowStyle = { borderBottom: '1px solid #f1f5f9', padding: '10px 0' }
const attendeeName = { fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }
const attendeeMeta = { fontSize: '12px', color: '#475569', margin: '0 0 2px' }
const attendeeDate = { fontSize: '11px', color: '#94a3b8', margin: '0' }
const footer = { fontSize: '11px', color: '#94a3b8', margin: '20px 0 0', textAlign: 'center' as const }
