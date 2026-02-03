import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is admin
    const { data: isAdminResult, error: adminCheckError } = await supabase
      .rpc('is_admin', { _user_id: user.id });
    
    if (adminCheckError || !isAdminResult) {
      console.error('Admin check failed:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the user ID to delete from the request body
    const { user_id: userIdToDelete } = await req.json();
    
    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prevent admin from deleting themselves
    if (userIdToDelete === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Admin ${user.email} is deleting user ${userIdToDelete}`);
    
    // Delete related data first (in order of dependencies)
    // 1. Delete connected_devices
    await supabase
      .from('connected_devices')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 2. Delete energy_production
    await supabase
      .from('energy_production')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 3. Delete energy_tokens
    await supabase
      .from('energy_tokens')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 4. Delete user_rewards
    await supabase
      .from('user_rewards')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 5. Delete mint_transactions
    await supabase
      .from('mint_transactions')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 6. Delete feedback
    await supabase
      .from('feedback')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 7. Delete support_requests
    await supabase
      .from('support_requests')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 8. Delete push_subscriptions
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 9. Delete notification_logs
    await supabase
      .from('notification_logs')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 10. Delete user_roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userIdToDelete);
    
    // 11. Handle referrals - need to handle both referrer and referred
    await supabase
      .from('referrals')
      .delete()
      .eq('referrer_id', userIdToDelete);
    
    await supabase
      .from('referrals')
      .delete()
      .eq('referred_id', userIdToDelete);
    
    // 12. Clear referred_by in profiles that reference this user
    await supabase
      .from('profiles')
      .update({ referred_by: null })
      .eq('referred_by', userIdToDelete);
    
    // 13. Delete the profile
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userIdToDelete);
    
    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      // Continue anyway, as the auth user deletion is more important
    }
    
    // 14. Finally, delete the auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from auth' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Successfully deleted user ${userIdToDelete}`);
    
    return new Response(
      JSON.stringify({ success: true, deleted_user_id: userIdToDelete }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in admin-delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
