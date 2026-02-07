import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InverterData {
  serial_number: string;
  model: string;
  status: string;
  last_report_date: string | null;
  last_report_watts: number;
  energy_wh: number;
}

export interface ArrayData {
  envoy_serial: string;
  system_id: string;
  system_name: string;
  panel_count: number;
  total_energy_wh: number;
  avg_energy_wh: number;
  best_serial: string | null;
  worst_serial: string | null;
  last_report_date: string | null;
  inverters: InverterData[];
}

export interface SystemSummary {
  total_panels: number;
  total_energy_wh: number;
  system_size_w: number;
  array_count: number;
  last_report_date: string | null;
}

interface InverterResponse {
  system: SystemSummary;
  arrays: ArrayData[];
}

export function useEnphaseInverters(enabled: boolean, viewAsUserId?: string | null) {
  return useQuery<InverterResponse>({
    queryKey: ['enphase-inverters', viewAsUserId || 'self'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Build URL with optional target_user_id for admin view-as
      const params = viewAsUserId ? `?target_user_id=${viewAsUserId}` : '';
      
      const { data, error } = await supabase.functions.invoke(`enphase-inverters${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data as InverterResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
