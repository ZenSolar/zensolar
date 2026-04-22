import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Renders registered transactional email templates as HTML + plain text
// for in-app admin preview. Admin/editor only.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Identify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify admin/editor with service role
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: isAdminEditor } = await admin.rpc('is_admin_or_editor', {
      _user_id: userData.user.id,
    })
    if (isAdminEditor !== true) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optional filter: { templates: ["todd-android-invite", "jo-founder-vip-welcome"] }
    let requestedNames: string[] | null = null
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (Array.isArray(body?.templates)) {
          requestedNames = body.templates.filter(
            (n: unknown) => typeof n === 'string'
          )
        }
      } catch {
        // ignore - render all
      }
    }

    const templateNames = requestedNames ?? Object.keys(TEMPLATES)
    const results: Array<{
      templateName: string
      displayName: string
      subject: string
      html: string
      text: string
      status: 'ready' | 'unknown_template' | 'render_failed'
      errorMessage?: string
    }> = []

    for (const name of templateNames) {
      const entry = TEMPLATES[name]
      if (!entry) {
        results.push({
          templateName: name,
          displayName: name,
          subject: '',
          html: '',
          text: '',
          status: 'unknown_template',
        })
        continue
      }

      const displayName = entry.displayName || name
      const data = entry.previewData || {}

      try {
        const html = await renderAsync(
          React.createElement(entry.component, data)
        )
        const text = await renderAsync(
          React.createElement(entry.component, data),
          { plainText: true }
        )
        const resolvedSubject =
          typeof entry.subject === 'function' ? entry.subject(data) : entry.subject

        results.push({
          templateName: name,
          displayName,
          subject: resolvedSubject,
          html,
          text,
          status: 'ready',
        })
      } catch (err) {
        results.push({
          templateName: name,
          displayName,
          subject: '',
          html: '',
          text: '',
          status: 'render_failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return new Response(JSON.stringify({ templates: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('admin-preview-emails error', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
