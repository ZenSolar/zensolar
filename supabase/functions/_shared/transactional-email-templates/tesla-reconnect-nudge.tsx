import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ZenSolar'
const LOGO_URL = 'https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png'
const RECONNECT_URL = 'https://beta.zen.solar/settings/connections'

interface Props {
  firstName?: string
  vehicleName?: string
  lastSyncedLabel?: string
  newVehicleName?: string
}

const TeslaReconnectEmail = ({ firstName, vehicleName, lastSyncedLabel, newVehicleName }: Props) => {
  const name = firstName || 'there'
  const veh = vehicleName || 'your Tesla'
  const last = lastSyncedLabel || 'a while ago'
  const hasNewCar = !!newVehicleName

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{hasNewCar
        ? `${name} — reconnect Tesla to add ${newVehicleName} to ZenSolar.`
        : `${name} — reconnect ${veh} to keep your ZenSolar miles + charging flowing.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img src={LOGO_URL} alt="ZenSolar" width="220" height="65" style={logo} />
          </Section>

          <Text style={eyebrow}>Action needed · Tesla connection</Text>

          <Heading style={heroTitle}>
            {hasNewCar
              ? `Hey ${name} — let's add ${newVehicleName} to ZenSolar.`
              : `Hey ${name} — your Tesla link expired.`}
          </Heading>

          {hasNewCar ? (
            <Text style={paragraph}>
              Congrats on the new ride! I noticed <strong>{veh}</strong> is no longer on your
              Tesla account, and your ZenSolar link expired back on <strong>{last}</strong>.
              A quick re-sign-in will retire {veh} and pull <strong>{newVehicleName}</strong> in
              automatically — miles, charging, and $ZSOLAR earnings all start flowing.
            </Text>
          ) : (
            <Text style={paragraph}>
              Quick heads up: your ZenSolar connection to <strong>{veh}</strong> stopped syncing on
              {' '}<strong>{last}</strong>. Tesla requires a fresh sign-in every so often, and yours
              has aged out.
            </Text>
          )}

          <Section style={noteCard}>
            <Text style={noteText}>
              <strong>What starts flowing once you reconnect:</strong>
            </Text>
            <Text style={listItem}>• EV miles driven (odometer syncing)</Text>
            <Text style={listItem}>• FSD Supervised miles</Text>
            <Text style={listItem}>• Supercharging + Home &amp; AC charging sessions</Text>
            <Text style={listItem}>• $ZSOLAR earnings from any of the above</Text>
          </Section>

          <Section style={pathCardRecommended}>
            <Text style={pathBadgeRecommended}>Takes 30 seconds</Text>
            <Text style={pathTitle}>{hasNewCar ? `Reconnect Tesla & add ${newVehicleName}` : 'Reconnect Tesla'}</Text>
            <Text style={pathText}>
              Tap the button, sign into your Tesla account, and we'll immediately start
              {hasNewCar ? ' syncing your new car.' : ' back-filling everything you missed.'}
            </Text>
            <Link href={RECONNECT_URL} style={buttonPrimary}>
              {hasNewCar ? `Reconnect & add ${newVehicleName}` : 'Reconnect Tesla'}
            </Link>
          </Section>

          <Hr style={divider} />

          <Section style={signatureWrap}>
            <Text style={signoff}>Thanks,</Text>
            <Text style={signatureName}>Joe Maushart</Text>
            <Text style={signatureMeta}>Founder, {SITE_NAME}</Text>
            <Text style={signatureMeta}>
              <Link href="mailto:joe@zen.solar" style={inlineLink}>joe@zen.solar</Link>
              {' '}·{' '}
              <Link href="sms:+17202246233" style={inlineLink}>text me if anything's off</Link>
            </Text>
          </Section>

          <Hr style={footerDivider} />
          <Section style={footerWrap}>
            <Text style={footer}>
              © {new Date().getFullYear()} ZenSolar, LLC<br />
              ZenSolar™ · Proof of Genesis™ · Creating Currency From Energy™
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TeslaReconnectEmail,
  subject: (data: Record<string, any>) => {
    if (data?.newVehicleName) return `Add ${data.newVehicleName} to your ZenSolar dashboard`
    const veh = data?.vehicleName || 'your Tesla'
    return `Reconnect ${veh} to resume your ZenSolar sync`
  },
  displayName: 'Tesla reconnect nudge',
  previewData: { firstName: 'Juliana', vehicleName: 'Tesy', lastSyncedLabel: 'Jan 26, 2026', newVehicleName: 'TesYto' },
} satisfies TemplateEntry

const COLORS = {
  background: '#ffffff',
  surface: '#f3f4f6',
  surfaceAlt: '#eef6f2',
  border: '#d1d5db',
  borderStrong: '#b7e4cf',
  text: '#111827',
  muted: '#4b5563',
  accent: '#0f9f6e',
  accentDark: '#0b7a55',
}

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

const main = { margin: '0', padding: '16px 8px', backgroundColor: COLORS.background, color: COLORS.text, fontFamily }
const container = { width: '100%', maxWidth: '600px', margin: '0 auto', padding: '24px 16px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' as const }
const logoWrap = { textAlign: 'center' as const, padding: '0 0 12px' }
const logo = { display: 'block' as const, margin: '0 auto', border: '0', outline: 'none', textDecoration: 'none', backgroundColor: 'transparent' }
const eyebrow = { margin: '0 0 20px', textAlign: 'center' as const, fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const heroTitle = { margin: '0 0 24px', textAlign: 'center' as const, fontSize: '28px', lineHeight: '1.2', fontWeight: 800, color: COLORS.text }
const paragraph = { margin: '0 0 16px', fontSize: '16px', lineHeight: '26px', color: COLORS.text }
const noteCard = { margin: '20px 0', padding: '18px 20px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }
const noteText = { margin: '0 0 8px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const listItem = { margin: '0 0 6px', fontSize: '15px', lineHeight: '22px', color: COLORS.text }
const divider = { margin: '28px 0', borderColor: COLORS.border }
const pathCardRecommended = { margin: '0 0 16px', padding: '20px', backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderStrong}`, textAlign: 'center' as const }
const pathBadgeRecommended = { margin: '0 0 10px', fontSize: '12px', lineHeight: '18px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const pathTitle = { margin: '0 0 10px', fontSize: '22px', lineHeight: '28px', fontWeight: 700, color: COLORS.text }
const pathText = { margin: '0 0 16px', fontSize: '15px', lineHeight: '24px', color: COLORS.text }
const buttonPrimary = { display: 'inline-block', padding: '14px 26px', backgroundColor: COLORS.accent, color: '#ffffff', textDecoration: 'none', fontSize: '15px', lineHeight: '20px', fontWeight: 700 }
const signatureWrap = { margin: '20px 0 8px' }
const signoff = { margin: '0 0 8px', fontSize: '16px', lineHeight: '24px', color: COLORS.text }
const signatureName = { margin: '0 0 4px', fontSize: '18px', lineHeight: '24px', fontWeight: 700, color: COLORS.text }
const signatureMeta = { margin: '0 0 4px', fontSize: '14px', lineHeight: '22px', color: COLORS.muted }
const inlineLink = { color: COLORS.accentDark, textDecoration: 'underline' }
const footerDivider = { margin: '20px 0 12px', borderColor: COLORS.border }
const footerWrap = { textAlign: 'center' as const }
const footer = { margin: '0', fontSize: '12px', lineHeight: '18px', color: COLORS.muted }
