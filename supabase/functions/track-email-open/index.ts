// Public, unauthenticated endpoint that returns a 1x1 transparent GIF
// and silently logs the email open event. The pixel is invisible to recipients
// and indistinguishable from any other remote image — this is the same standard
// open-tracking technique used by Mailchimp, Gmail, HubSpot, etc.
//
// URL: /functions/v1/track-email-open?mid=<message_id>
//
// Requires verify_jwt = false in supabase/config.toml.

import { createClient } from 'npm:@supabase/supabase-js@2'

// 1x1 transparent GIF (43 bytes) — universally compatible
const TRANSPARENT_GIF = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
])

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(TRANSPARENT_GIF.byteLength),
  // Aggressive no-cache so every open hits us, not the email client cache.
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Origin': '*',
}

function pixelResponse() {
  return new Response(TRANSPARENT_GIF, { status: 200, headers: PIXEL_HEADERS })
}

Deno.serve(async (req) => {
  // Always return the pixel — never let logging failures break the image.
  try {
    const url = new URL(req.url)
    const messageId = url.searchParams.get('mid')

    if (!messageId) {
      return pixelResponse()
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      console.error('track-email-open: missing env vars')
      return pixelResponse()
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Look up recipient + template from email_send_log (best effort)
    const { data: logRow } = await supabase
      .from('email_send_log')
      .select('recipient_email, template_name')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fire-and-forget the insert — but await to ensure it lands in serverless
    const ua = req.headers.get('user-agent') || null
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null

    await supabase.from('email_opens').insert({
      message_id: messageId,
      recipient_email: logRow?.recipient_email ?? null,
      template_name: logRow?.template_name ?? null,
      ip_address: ip,
      user_agent: ua,
    })
  } catch (err) {
    console.error('track-email-open error', err)
  }

  return pixelResponse()
})
