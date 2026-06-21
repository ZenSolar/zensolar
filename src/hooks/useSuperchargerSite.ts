import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuperchargerSite {
  id: string;
  name: string | null;
  city: string | null;
  region: string | null;
  stall_count: number | null;
}

/** Look up a Supercharger site by id. Returns null while loading or unknown. */
export function useSuperchargerSite(siteId: string | null) {
  return useQuery<SuperchargerSite | null>({
    queryKey: ['supercharger-site', siteId],
    enabled: !!siteId,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!siteId) return null;
      const { data } = await supabase
        .from('supercharger_sites' as any)
        .select('id, name, city, region, stall_count')
        .eq('id', siteId)
        .maybeSingle();
      return (data as any) ?? null;
    },
  });
}
