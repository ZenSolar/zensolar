import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

// Custom event for profile updates - allows cross-component communication
export const PROFILE_UPDATED_EVENT = 'zensolar:profile-updated';

// Helper to dispatch profile update event
export function dispatchProfileUpdated() {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  facebook_connected: boolean;
  facebook_handle: string | null;
  instagram_connected: boolean;
  instagram_handle: string | null;
  tiktok_connected: boolean;
  tiktok_handle: string | null;
  twitter_connected: boolean;
  twitter_handle: string | null;
  linkedin_connected: boolean;
  linkedin_handle: string | null;
}

/**
 * Hook to access a user's profile. 
 * - By default, fetches the authenticated user's profile
 * - If an overrideUserId is provided, fetches that user's profile instead (for admin "view as" mode)
 * - Also respects the ViewAsUserIdContext for global "view as" mode
 */
export function useProfile(overrideUserId?: string | null) {
  const { user } = useAuth();
  // Check if we're in a "view as user" context
  const contextUserId = useViewAsUserId();
  // Priority: explicit override > context > authenticated user
  const targetUserId = overrideUserId ?? contextUserId ?? user?.id;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Use maybeSingle() instead of single() to gracefully handle missing profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
    } else if (targetUserId === user?.id) {
      // Profile doesn't exist yet - only create if fetching our OWN profile
      console.log('Profile not found for user, creating one...');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: targetUserId })
        .select()
        .single();
      
      if (insertError) {
        // Could be a unique constraint violation if trigger ran concurrently - try fetching again
        console.log('Insert failed, fetching again:', insertError.message);
        const { data: retryData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        setProfile(retryData as Profile | null);
      } else {
        setProfile(newProfile as Profile);
      }
    } else {
      // Viewing someone else's profile that doesn't exist
      setProfile(null);
    }
    setIsLoading(false);
  }, [targetUserId, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for profile update events from other components
  useEffect(() => {
    const handleProfileUpdated = () => {
      console.log('Profile update event received, refetching...');
      fetchProfile();
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update profile');
      return { error };
    }

    await fetchProfile();
    // Dispatch event so other components can react
    dispatchProfileUpdated();
    return { error: null };
  }, [user, fetchProfile]);

  const connectSocialAccount = useCallback(async (
    platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin',
    handle: string
  ) => {
    const updates: Partial<Profile> = {
      [`${platform}_connected`]: true,
      [`${platform}_handle`]: handle,
    };
    
    const { error } = await updateProfile(updates as Partial<Profile>);
    if (!error) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected!`);
    }
    return { error };
  }, [updateProfile]);

  const disconnectSocialAccount = useCallback(async (
    platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'
  ) => {
    const updates: Partial<Profile> = {
      [`${platform}_connected`]: false,
      [`${platform}_handle`]: null,
    };
    
    const { error } = await updateProfile(updates as Partial<Profile>);
    if (!error) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
    }
    return { error };
  }, [updateProfile]);

  const connectEnergyAccount = useCallback(async (
    service: 'tesla' | 'enphase' | 'solaredge'
  ) => {
    const updates: Partial<Profile> = {
      [`${service}_connected`]: true,
    };
    
    const { error } = await updateProfile(updates as Partial<Profile>);
    if (!error) {
      toast.success(`${service.charAt(0).toUpperCase() + service.slice(1)} connected!`);
    }
    return { error };
  }, [updateProfile]);

  const disconnectWallet = useCallback(async () => {
    const { error } = await updateProfile({ wallet_address: null });
    return { error };
  }, [updateProfile]);

  return {
    profile,
    isLoading,
    updateProfile,
    connectSocialAccount,
    disconnectSocialAccount,
    connectEnergyAccount,
    disconnectWallet,
    refetch: fetchProfile,
  };
}
