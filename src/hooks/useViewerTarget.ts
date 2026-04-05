import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';

/**
 * For viewer-role users, automatically resolves the admin user_id 
 * so the dashboard mirrors the admin's live data.
 * Returns null for non-viewer users.
 */
export function useViewerTarget(): string | null {
  const { isViewer } = useAdminCheck();
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isViewer) {
      setAdminUserId(null);
      return;
    }

    // Find the first admin user to mirror
    const fetchAdmin = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!error && data) {
        console.log('[ViewerTarget] Viewer will mirror admin:', data.user_id);
        setAdminUserId(data.user_id);
      }
    };

    fetchAdmin();
  }, [isViewer]);

  return adminUserId;
}
