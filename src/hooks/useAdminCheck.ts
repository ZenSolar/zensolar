import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useAdminCheck() {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('[AdminCheck] No user, setting isAdmin=false');
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      console.log('[AdminCheck] Checking admin status for user:', user.id, user.email);
      
      try {
        // Server-side admin check using the has_role RPC function
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        console.log('[AdminCheck] RPC result:', { data, error });

        if (error) {
          console.error('[AdminCheck] Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          console.log('[AdminCheck] Setting isAdmin to:', data === true);
          setIsAdmin(data === true);
        }
      } catch (error) {
        console.error('[AdminCheck] Exception checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  return {
    isAdmin,
    isChecking: authLoading || isChecking,
  };
}
