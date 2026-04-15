import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const SITE_NAME = 'ZenSolar'
const SENDER_DOMAIN = 'notify.zen.solar'
const FROM_DOMAIN = 'zen.solar'
const ADMIN_EMAIL = 'joe@zen.solar'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BodySchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(255),
  signedAt: z.string(),
  ndaVersion: z.string(),
})

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type TransactionalTemplateName = 'nda-signed-copy' | 'nda-admin-notification'

async function resolveUnsubscribeToken(
  supabase: ReturnType<typeof createClient>,
  email: string,
  templateName: string,
  messageId: string
): Promise<{ token: string | null; blocked: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase()

  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed', { suppressionError, normalizedEmail, templateName })
    return { token: null, blocked: false, error: 'Failed to verify suppression status' }
  }

  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: email,
      status: 'suppressed',
    })
    return { token: null, blocked: true }
  }

  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error('Token lookup failed', { tokenLookupError, normalizedEmail, templateName })
    return { token: null, blocked: false, error: 'Failed to look up unsubscribe token' }
  }

  if (existingToken && !existingToken.used_at) {
    return { token: existingToken.token, blocked: false }
  }

  if (existingToken?.used_at) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: email,
      status: 'suppressed',
      error_message: 'Unsubscribe token already used',
    })
    return { token: null, blocked: true }
  }

  const unsubscribeToken = generateToken()
  const { error: tokenError } = await supabase
    .from('email_unsubscribe_tokens')
    .upsert(
      { token: unsubscribeToken, email: normalizedEmail },
      { onConflict: 'email', ignoreDuplicates: true }
    )

  if (tokenError) {
    console.error('Failed to create unsubscribe token', { tokenError, normalizedEmail, templateName })
    return { token: null, blocked: false, error: 'Failed to create unsubscribe token' }
  }

  const { data: storedToken, error: reReadError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (reReadError || !storedToken) {
    console.error('Failed to read back unsubscribe token', {
      reReadError,
      normalizedEmail,
      templateName,
    })
    return { token: null, blocked: false, error: 'Failed to confirm unsubscribe token storage' }
  }

  return { token: storedToken.token, blocked: false }
}

async function queueTemplateEmail(
  supabase: ReturnType<typeof createClient>,
  {
    templateName,
    recipientEmail,
    idempotencyKey,
    templateData,
  }: {
    templateName: TransactionalTemplateName
    recipientEmail: string
    idempotencyKey: string
    templateData: Record<string, unknown>
  }
): Promise<{ queued: boolean; recipientEmail: string; error?: string; status?: string }> {
  const template = TEMPLATES[templateName]

  if (!template) {
    console.error('Template not found in registry', { templateName })
    return { queued: false, recipientEmail, error: 'Template not found' }
  }

  const effectiveRecipient = template.to || recipientEmail
  const messageId = crypto.randomUUID()

  const tokenResult = await resolveUnsubscribeToken(
    supabase,
    effectiveRecipient,
    templateName,
    messageId
  )

  if (tokenResult.blocked) {
    return { queued: false, recipientEmail: effectiveRecipient, status: 'suppressed' }
  }

  if (tokenResult.error || !tokenResult.token) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: tokenResult.error ?? 'Missing unsubscribe token',
    })
    return {
      queued: false,
      recipientEmail: effectiveRecipient,
      error: tokenResult.error ?? 'Missing unsubscribe token',
      status: 'failed',
    }
  }

  const html = await renderAsync(React.createElement(template.component, templateData))
  const text = await renderAsync(React.createElement(template.component, templateData), {
    plainText: true,
  })

  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData as Record<string, any>)
      : template.subject

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: tokenResult.token,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue email', {
      enqueueError,
      templateName,
      effectiveRecipient,
    })

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })

    return {
      queued: false,
      recipientEmail: effectiveRecipient,
      error: 'Failed to enqueue email',
      status: 'failed',
    }
  }

  return { queued: true, recipientEmail: effectiveRecipient, status: 'pending' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { recipientEmail, recipientName, signedAt, ndaVersion } = parsed.data

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const [signerResult, adminResult] = await Promise.all([
      queueTemplateEmail(supabase, {
        templateName: 'nda-signed-copy',
        recipientEmail,
        idempotencyKey: `nda-copy-${recipientEmail}-${signedAt}`,
        templateData: {
          recipientName,
          recipientEmail,
          signedAt,
          ndaVersion,
        },
      }),
      queueTemplateEmail(supabase, {
        templateName: 'nda-admin-notification',
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `nda-admin-${recipientEmail}-${signedAt}`,
        templateData: {
          signerName: recipientName,
          signerEmail: recipientEmail,
          signedAt,
          ndaVersion,
        },
      }),
    ])

    console.log('NDA email queue results', {
      signerResult,
      adminResult,
      recipientEmail,
      recipientName,
      signedAt,
    })

    return new Response(
      JSON.stringify({
        success: signerResult.queued || adminResult.queued,
        signerCopyQueued: signerResult.queued,
        adminNotificationQueued: adminResult.queued,
        signerStatus: signerResult.status,
        adminStatus: adminResult.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('send-nda-copy error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})