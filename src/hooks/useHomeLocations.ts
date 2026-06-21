/**
 * useHomeLocations — read + write the user's saved home (and "known away")
 * locations. Backs both the Profile multi-home UI and the future
 * "Is this your new home?" prompt (Phase B).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface HomeLocation {
  id: string;
  user_id: string;
  label: string;
  lat: number;
  lon: number;
  radius_m: number;
  is_primary: boolean;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

const QK = (uid: string | null | undefined) => ['user-home-locations', uid] as const;

export function useHomeLocations() {
  const viewAsUserId = useViewAsUserId();

  return useQuery({
    queryKey: QK(viewAsUserId),
    queryFn: async (): Promise<HomeLocation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_home_locations')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as HomeLocation[];
    },
  });
}

interface AddHomeInput {
  label: string;
  lat: number;
  lon: number;
  radius_m?: number;
  setPrimary?: boolean;
}

export function useAddHomeLocation() {
  const qc = useQueryClient();
  const viewAsUserId = useViewAsUserId();

  return useMutation({
    mutationFn: async (input: AddHomeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error('Not authenticated');

      // If setPrimary, demote any existing primary first.
      if (input.setPrimary) {
        await supabase
          .from('user_home_locations')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('user_home_locations')
        .insert({
          user_id: userId,
          label: input.label,
          lat: input.lat,
          lon: input.lon,
          radius_m: input.radius_m ?? 150,
          is_primary: !!input.setPrimary,
          is_active: true,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as HomeLocation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(viewAsUserId) });
    },
  });
}

export function useSetPrimaryHomeLocation() {
  const qc = useQueryClient();
  const viewAsUserId = useViewAsUserId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error('Not authenticated');

      await supabase
        .from('user_home_locations')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true);

      const { error } = await supabase
        .from('user_home_locations')
        .update({ is_primary: true, is_active: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(viewAsUserId) }),
  });
}

export function useArchiveHomeLocation() {
  const qc = useQueryClient();
  const viewAsUserId = useViewAsUserId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_home_locations')
        .update({
          is_active: false,
          is_primary: false,
          archived_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(viewAsUserId) }),
  });
}
