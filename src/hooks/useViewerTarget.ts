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

    const fetchAdmin = async () => {
      const { data, error } = await supabase.rpc('get_viewer_target_admin');

      if (!error && data) {
        console.log('[ViewerTarget] Viewer will mirror admin:', data);
        setAdminUserId(data as string);
      }
    };

    fetchAdmin();
  }, [isViewer]);

  return adminUserId;
}
