import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all users from auth.users
    // Optional filter: only users with at least one connected device
    let withDevices = false;
    try {
      const body = await req.json();
      withDevices = !!body?.withDevices;
    } catch { /* no body ok */ }

    // Fetch all users from auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    // Pull device summary keyed by user_id
    const deviceMap = new Map<string, { count: number; providers: string[]; device_types: string[] }>();
    const { data: devices } = await supabaseAdmin
      .from('connected_devices')
      .select('user_id, provider, device_type');
    for (const d of devices || []) {
      const entry = deviceMap.get(d.user_id) || { count: 0, providers: [], device_types: [] };
      entry.count += 1;
      if (d.provider && !entry.providers.includes(d.provider)) entry.providers.push(d.provider);
      if (d.device_type && !entry.device_types.includes(d.device_type)) entry.device_types.push(d.device_type);
      deviceMap.set(d.user_id, entry);
    }

    let userList = users.map((u) => {
      const dev = deviceMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        device_count: dev?.count || 0,
        providers: dev?.providers || [],
        device_types: dev?.device_types || [],
      };
    });

    if (withDevices) {
      // Previously this filtered out everyone without a connected device, which
      // hid beta users (e.g. Michael Tschida) from the weekly-digest pulldowns.
      // Keep all users with an email, but sort device-connected ones first so
      // the dropdown still surfaces the most-useful targets up top.
      userList = userList
        .filter((u) => !!u.email)
        .sort((a, b) => {
          if ((b.device_count || 0) !== (a.device_count || 0)) {
            return (b.device_count || 0) - (a.device_count || 0);
          }
          return (a.email || '').localeCompare(b.email || '');
        });
    }


    return new Response(
      JSON.stringify({ users: userList }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );


  } catch (error) {
    console.error('Error fetching user emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
