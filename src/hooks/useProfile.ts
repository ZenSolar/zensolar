import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data as Profile);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
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
