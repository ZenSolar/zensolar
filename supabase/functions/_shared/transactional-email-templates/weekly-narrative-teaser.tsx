/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ZenSolar'
const LOGO_URL = 'https://fcptrpgqkjffgeddajwl.supabase.co/storage/v1/object/public/email-assets/zen-logo-horizontal-v3.png'
const APP_URL = 'https://beta.zen.solar'

export interface WeeklyNarrativeTeaserProps {
  firstName?: string
  weekLabel?: string
  teaser?: string
  narrativeUrl?: string
  trackUrl?: (key: string, destination: string) => string
}

const identityTrack = (_k: string, d: string) => d

const COLORS = {
  page: '#000000',
  background: '#0a0a0a',
  surface: '#141414',
  border: '#1f1f1f',
  text: '#f5f5f5',
  textDim: '#cfcfcf',
  muted: '#7a7a7a',
  accent: '#f97316',
  accentDark: '#fb923c',
}

const fontFamily = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

const Component = ({
  firstName,
  weekLabel,
  teaser,
  narrativeUrl,
  trackUrl,
}: WeeklyNarrativeTeaserProps) => {
  const t = trackUrl || identityTrack
  const name = firstName || 'there'
  const week = weekLabel || 'this past week'
  const ctaUrl = narrativeUrl || `${APP_URL}/energy-insights`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your week, decoded — ${name}'s ZenSolar story is ready`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="200" height="59" style={logo} />
          </Section>

          <Text style={eyebrow}>Your week, decoded · {week}</Text>
          <Heading style={heroTitle}>A story from your panels, {name}.</Heading>

          {teaser ? (
            <Text style={teaserText}>{teaser}…</Text>
          ) : (
            <Text style={teaserText}>
              Your weekly energy story is ready — written by Deason from your actual sun, charge, and drive data.
            </Text>
          )}

          <Section style={ctaWrap}>
            <Link href={t('read_full_story', ctaUrl)} style={buttonPrimary}>
              Read the full story
            </Link>
          </Section>

          <Text style={subtle}>
            Takes about 90 seconds. Pairs well with coffee.
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            You're getting this because you opted into ZenSolar weekly stories.{' '}
            <Link href={t('manage_preferences', `${APP_URL}/account/notifications`)} style={footerLink}>
              Manage preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: Component,
  subject: (d: Record<string, any>) =>
    d?.firstName ? `${d.firstName}, your week decoded` : 'Your week, decoded',
  displayName: 'Weekly Narrative Teaser',
  previewData: {
    firstName: 'Michael',
    weekLabel: 'Mar 17 – Mar 23, 2026',
    teaser: "Tuesday was the day, Michael. Your panels hit their stride at 1:14 PM — 8.2 kW straight off the roof — and your Powerwall sat back and watched it happen.",
    narrativeUrl: `${APP_URL}/energy-insights/week/sample`,
  },
}

const main = { margin: '0', padding: '20px 8px', backgroundColor: COLORS.page, color: COLORS.text, fontFamily }
const container = { width: '100%', maxWidth: '600px', margin: '0 auto', padding: '32px 24px', backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: '16px', boxSizing: 'border-box' as const }
const logoWrap = { textAlign: 'center' as const, padding: '0 0 18px' }
const logo = { display: 'block' as const, margin: '0 auto', border: '0' }
const eyebrow = { margin: '0 0 12px', textAlign: 'center' as const, fontSize: '10px', lineHeight: '14px', fontWeight: 700, letterSpacing: '2.4px', textTransform: 'uppercase' as const, color: COLORS.accentDark }
const heroTitle = { margin: '0 0 22px', textAlign: 'center' as const, fontSize: '32px', lineHeight: '1.15', fontWeight: 800, letterSpacing: '-0.6px', color: COLORS.text }
const teaserText = { margin: '0 0 30px', fontSize: '17px', lineHeight: '27px', color: COLORS.textDim, textAlign: 'left' as const, fontStyle: 'italic' as const }
const ctaWrap = { textAlign: 'center' as const, margin: '0 0 12px' }
const buttonPrimary = { display: 'inline-block', padding: '15px 30px', backgroundColor: COLORS.accent, color: '#0a0a0a', textDecoration: 'none', fontSize: '14px', lineHeight: '20px', fontWeight: 800, letterSpacing: '0.4px', borderRadius: '10px' }
const subtle = { margin: '0', textAlign: 'center' as const, fontSize: '12px', lineHeight: '18px', color: COLORS.muted, fontStyle: 'italic' as const }
const divider = { margin: '32px 0 18px', border: '0', borderTop: `1px solid ${COLORS.border}` }
const footer = { margin: '0', fontSize: '11px', lineHeight: '18px', color: COLORS.muted, textAlign: 'center' as const }
const footerLink = { color: COLORS.muted, textDecoration: 'underline' }
