import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InverterData {
  serial_number: string;
  model: string;
  status: string;
  last_report_date: string | null;
  last_report_watts: number;
  energy_wh: number;
  energy_units: string;
  system_id: string;
  system_name: string;
}

export interface InverterSummary {
  total_panels: number;
  total_energy_wh: number;
  avg_energy_wh: number;
  best_serial: string | null;
  worst_serial: string | null;
}

interface InverterResponse {
  inverters: InverterData[];
  summary: InverterSummary;
}

export function useEnphaseInverters(enabled: boolean) {
  return useQuery<InverterResponse>({
    queryKey: ['enphase-inverters'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('enphase-inverters', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data as InverterResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}
