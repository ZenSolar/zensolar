import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getNewUserViewMode } from '@/lib/userViewMode';

export type UserRole = 'admin' | 'editor' | 'viewer' | 'user';

export function useAdminCheck() {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [isChecking, setIsChecking] = useState(true);
  const [userViewMode, setUserViewMode] = useState(getNewUserViewMode());

  // Listen for new user view mode changes
  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setUserViewMode(event.detail);
    };

    window.addEventListener('newUserViewModeChange', handleModeChange as EventListener);
    return () => {
      window.removeEventListener('newUserViewModeChange', handleModeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('[AdminCheck] No user, setting isAdmin=false');
        setIsAdmin(false);
        setIsViewer(false);
        setRole('user');
        setIsChecking(false);
        return;
      }

      console.log('[AdminCheck] Checking admin status for user:', user.id, user.email);
      
      try {
        // Check all roles in parallel
        const [adminEditorResult, viewerResult] = await Promise.all([
          supabase.rpc('is_admin_or_editor', { _user_id: user.id }),
          supabase.rpc('is_viewer', { _user_id: user.id }),
        ]);

        console.log('[AdminCheck] RPC results:', { 
          adminEditor: adminEditorResult.data, 
          viewer: viewerResult.data 
        });

        const hasAdminEditor = adminEditorResult.data === true;
        const hasViewer = viewerResult.data === true;

        setIsAdmin(hasAdminEditor);
        setIsViewer(hasViewer);
        
        // Determine highest role
        if (hasAdminEditor) {
          // Check if specifically admin vs editor
          const { data: isAdminOnly } = await supabase.rpc('is_admin', { _user_id: user.id });
          setRole(isAdminOnly ? 'admin' : 'editor');
        } else if (hasViewer) {
          setRole('viewer');
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('[AdminCheck] Exception checking admin status:', error);
        setIsAdmin(false);
        setIsViewer(false);
        setRole('user');
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  return {
    // isAdmin is true for admin/editor (for sidebar toggles visibility)
    isAdmin,
    // isViewer is true only for viewer role (read-only dashboard access)
    isViewer,
    // The user's highest role
    role,
    // isAdminView is false when user view mode is on (for content visibility)
    isAdminView: userViewMode ? false : isAdmin,
    // hasDashboardAccess is true for admin/editor/viewer
    hasDashboardAccess: isAdmin || isViewer,
    isChecking: authLoading || isChecking,
  };
}
