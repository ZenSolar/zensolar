import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { classifyDevices, type AuthorityDevice, type DeviceClass } from '@/lib/deviceAuthority';

/**
 * Device class for every claimed device on the current account, derived at
 * read time from the live authority rules. Never a stored flag: a device's
 * class is a consequence of what else is connected, so caching it would drift.
 */
export function useDeviceClasses() {
  const [devices, setDevices] = useState<AuthorityDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) { if (!cancelled) setLoading(false); return; }
      const { data } = await supabase
        .from('connected_devices')
        .select('device_id, device_type, provider, device_name')
        .eq('user_id', uid);
      if (cancelled) return;
      setDevices((data ?? []) as AuthorityDevice[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const classes = classifyDevices(devices);
  return {
    loading,
    devices,
    classes,
    classFor: (deviceId: string): DeviceClass => classes[deviceId]?.deviceClass ?? 'metered',
  };
}
