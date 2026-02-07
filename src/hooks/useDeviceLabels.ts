import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import type { ActivityType } from '@/hooks/useEnergyLog';

interface DeviceLabels {
  solar?: string;
  powerwall?: string;
  vehicle?: string;
  homeCharger?: string;
}

/**
 * Fetches device names from connected_devices to label Energy Log tabs.
 * Maps device_type to a friendly label per activity type.
 */
export function useDeviceLabels() {
  const viewAsUserId = useViewAsUserId();

  const { data: labels = {} } = useQuery<DeviceLabels>({
    queryKey: ['device-labels', viewAsUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return {};

      const { data: devices } = await supabase
        .from('connected_devices')
        .select('device_name, device_type, provider')
        .eq('user_id', userId);

      if (!devices || devices.length === 0) return {};

      const result: DeviceLabels = {};

      // Solar: prefer enphase/solaredge name, fallback to tesla powerwall name
      const solarDevice = devices.find(d => d.device_type === 'solar_system') 
        || devices.find(d => d.device_type === 'powerwall');
      if (solarDevice?.device_name) result.solar = solarDevice.device_name;

      // Battery: powerwall name
      const batteryDevice = devices.find(d => d.device_type === 'powerwall');
      if (batteryDevice?.device_name) result.powerwall = batteryDevice.device_name;

      // Vehicle: first vehicle
      const vehicleDevice = devices.find(d => d.device_type === 'vehicle');
      if (vehicleDevice?.device_name) result.vehicle = vehicleDevice.device_name;

      // Home charger
      const chargerDevice = devices.find(d => d.device_type === 'home_charger')
        || devices.find(d => d.device_type === 'wall_connector');
      if (chargerDevice?.device_name) result.homeCharger = chargerDevice.device_name;

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  return labels;
}

/** Get the device-specific header for an Energy Log tab */
export function getEnergyLogTitle(activityType: ActivityType, labels: DeviceLabels): string {
  switch (activityType) {
    case 'solar':
      return labels.solar ? `${labels.solar} Solar Log` : 'Solar Energy Log';
    case 'battery':
      return labels.powerwall ? `${labels.powerwall} Battery Log` : 'Battery Storage Log';
    case 'ev-charging':
      return labels.vehicle ? `${labels.vehicle} EV Charging Log` : 'EV Charging Log';
    case 'ev-miles':
      return labels.vehicle ? `${labels.vehicle} EV Miles Log` : 'EV Miles Log';
  }
}
