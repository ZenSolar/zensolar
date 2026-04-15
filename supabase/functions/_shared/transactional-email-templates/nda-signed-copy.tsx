import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ZenSolar"

const NDA_TEXT = `CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into as of the date of electronic signature below, between ZenSolar, LLC, a Texas limited liability company ("ZenSolar"), and the undersigned recipient ("Recipient").

1. Purpose. ZenSolar is granting Recipient access to a confidential demonstration of its clean energy technology platform, including patent-pending systems and methods (collectively, the "Demo"), solely for evaluation purposes (the "Purpose").

2. Confidential Information. "Confidential Information" means all non-public information disclosed through or relating to the Demo, including but not limited to: software interfaces, system architecture, tokenization mechanisms, patent-pending technology (U.S. Patent Application No. 19/634,402), blockchain integrations, business strategies, and any materials marked or reasonably understood to be confidential. Confidential Information does not include information that: (a) becomes publicly available through no fault of Recipient; (b) was already known to Recipient prior to disclosure; or (c) is independently developed by Recipient without use of Confidential Information.

3. Obligations. Recipient shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to any third party without ZenSolar's prior written consent; and (c) protect Confidential Information with at least the same degree of care used for its own confidential information, but no less than reasonable care.

4. No Reverse Engineering. Recipient shall not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, data structures, or underlying ideas of any software, technology, or systems demonstrated in or accessible through the Demo. Recipient shall not attempt to replicate, recreate, or build competing products or services based on the Confidential Information or the Demo.

5. Intellectual Property. No disclosure hereunder grants Recipient any license, right, or interest in ZenSolar's intellectual property, including its patent-pending technology, trademarks (Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™), or trade secrets.

6. Term & Governing Law. This Agreement remains in effect for five (5) years from the date of signature. This Agreement is governed by the laws of the State of Texas, with exclusive jurisdiction in Travis County, Texas.

7. Remedies. Recipient acknowledges that breach of this Agreement may cause irreparable harm, and ZenSolar shall be entitled to equitable relief in addition to any other remedies available at law.`

interface NdaSignedCopyProps {
  recipientName?: string
  recipientEmail?: string
  signedAt?: string
  ndaVersion?: string
}

const NdaSignedCopyEmail = ({ recipientName, recipientEmail, signedAt, ndaVersion }: NdaSignedCopyProps) => {
  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })
    : 'N/A'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your signed Confidentiality Agreement with {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src="https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal.png" alt="ZenSolar" width="160" height="auto" style={logoImg} />
          </Section>
          <Text style={subtitle}>Confidentiality Agreement — Signed Copy</Text>

          <Section style={signatureBox}>
            <Text style={signatureText}>
              <strong>Signed by:</strong> {recipientName || 'N/A'}<br />
              <strong>Email:</strong> {recipientEmail || 'N/A'}<br />
              <strong>Date:</strong> {formattedDate}<br />
              <strong>NDA Version:</strong> {ndaVersion || '1.0'}
            </Text>
          </Section>

          <Section style={ndaBox}>
            <Text style={ndaContent}>{NDA_TEXT}</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This is an automated copy of the confidentiality agreement you signed electronically.
            Please retain this email for your records.
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} {SITE_NAME}, LLC. All rights reserved.
            <br />Patent Pending — U.S. Application No. 19/634,402
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NdaSignedCopyEmail,
  subject: 'Your Signed Confidentiality Agreement — ZenSolar',
  displayName: 'NDA signed copy',
  previewData: {
    recipientName: 'Jane Doe',
    recipientEmail: 'jane@example.com',
    signedAt: '2026-04-15T12:00:00Z',
    ndaVersion: '1.0',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', display: 'block' as const }
const subtitle = { fontSize: '13px', color: '#666666', margin: '0 0 24px', textAlign: 'center' as const }
const signatureBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }
const signatureText = { fontSize: '13px', color: '#333333', margin: '0', lineHeight: '1.6' }
const ndaBox = { backgroundColor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }
const ndaContent = { fontSize: '12px', color: '#333333', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const divider = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '0 0 8px', textAlign: 'center' as const }
