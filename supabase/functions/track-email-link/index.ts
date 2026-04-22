import { createClient } from 'npm:@supabase/supabase-js@2'

// Public redirect endpoint — logs the click then 302s to the destination.
// Called from email links wrapped via send-transactional-email.

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const messageId = url.searchParams.get('mid') || ''
  const linkKey = url.searchParams.get('k') || 'unknown'
  const destination = url.searchParams.get('u') || ''
  const template = url.searchParams.get('t') || null
  const recipient = url.searchParams.get('r') || null

  // Always redirect even if logging fails — never break the user's click.
  const safeRedirect = (() => {
    try {
      const parsed = new URL(destination)
      // allow http(s) and known iOS deep-link scheme
      if (
        parsed.protocol === 'https:' ||
        parsed.protocol === 'http:' ||
        destination.startsWith('x-safari-https://') ||
        destination.startsWith('mailto:') ||
        destination.startsWith('tel:') ||
        destination.startsWith('sms:')
      ) {
        return destination
      }
      return 'https://beta.zen.solar/'
    } catch {
      if (
        destination.startsWith('x-safari-https://') ||
        destination.startsWith('mailto:') ||
        destination.startsWith('tel:') ||
        destination.startsWith('sms:')
      ) {
        return destination
      }
      return 'https://beta.zen.solar/'
    }
  })()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      null
    const ua = req.headers.get('user-agent') || null

    // Fire-and-forget, but await briefly so it lands before the function suspends.
    await supabase.from('email_link_clicks').insert({
      message_id: messageId,
      link_key: linkKey,
      template_name: template,
      recipient_email: recipient,
      destination_url: safeRedirect,
      ip_address: ip,
      user_agent: ua,
    })
  } catch (err) {
    console.error('track-email-link insert failed', err)
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: safeRedirect,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
})
