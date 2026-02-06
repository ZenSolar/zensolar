import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackfillResult {
  success: boolean;
  total_days_imported: number;
  total_records_inserted: number;
  systems: Array<{
    system_id: string;
    name: string;
    days_imported: number;
    start_date: string;
    end_date: string;
  }>;
}

export function useEnphaseBackfill() {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);

  const runBackfill = async () => {
    setIsBackfilling(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('enphase-historical', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Backfill error:', response.error);
        toast.error('Failed to import historical data');
        return false;
      }

      const data = response.data as BackfillResult;
      setResult(data);

      if (data.success && data.total_days_imported > 0) {
        const system = data.systems[0];
        toast.success(
          `Imported ${data.total_days_imported} days of data from ${system?.start_date || 'activation'}!`
        );
      } else if (data.total_days_imported === 0) {
        toast.info('No new historical data to import');
      }

      return true;
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Failed to import historical data. Try again later.');
      return false;
    } finally {
      setIsBackfilling(false);
    }
  };

  return { runBackfill, isBackfilling, result };
}
