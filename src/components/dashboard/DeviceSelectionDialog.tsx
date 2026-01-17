import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Car, Battery, Sun, AlertTriangle, Mail, Moon, Wifi, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Device {
  device_id: string;
  device_type: string;
  device_name: string;
  metadata?: Record<string, any>;
  is_claimed: boolean;
  claimed_by_current_user: boolean;
}

interface DeviceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: 'tesla' | 'enphase';
  onComplete: () => void;
}

const deviceIcons: Record<string, React.ReactNode> = {
  vehicle: <Car className="h-5 w-5" />,
  powerwall: <Battery className="h-5 w-5" />,
  solar: <Sun className="h-5 w-5" />,
  solar_system: <Sun className="h-5 w-5" />,
};

export function DeviceSelectionDialog({ 
  open, 
  onOpenChange, 
  provider, 
  onComplete 
}: DeviceSelectionDialogProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [wakingDevices, setWakingDevices] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchDevices();
    }
  }, [open, provider]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in first');
        return;
      }

      const functionName = provider === 'tesla' ? 'tesla-devices' : 'enphase-devices';
      const response = await supabase.functions.invoke(functionName, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch devices');
      }

      const { devices: fetchedDevices } = response.data;
      setDevices(fetchedDevices || []);
      
      // Pre-select devices already claimed by current user
      const alreadyClaimed = (fetchedDevices || [])
        .filter((d: Device) => d.claimed_by_current_user)
        .map((d: Device) => d.device_id);
      setSelectedDevices(new Set(alreadyClaimed));
      
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDevice = (deviceId: string, device: Device) => {
    // Can't toggle if claimed by another user
    if (device.is_claimed && !device.claimed_by_current_user) return;
    
    setSelectedDevices(prev => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const handleWakeVehicle = async (deviceId: string) => {
    setWakingDevices(prev => new Set(prev).add(deviceId));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      // Call a dedicated wake endpoint or re-fetch devices (which will attempt wake)
      toast.info('Waking vehicle... This may take a few moments.');
      
      // Re-fetch devices which will attempt to wake the vehicle
      await fetchDevices();
      
      // Check if the device is now online with odometer
      const updatedDevice = devices.find(d => d.device_id === deviceId);
      if (updatedDevice?.metadata?.odometer) {
        toast.success('Vehicle awake! Odometer data retrieved.');
      } else if (updatedDevice?.metadata?.state === 'online') {
        toast.success('Vehicle is waking up. Please try again in a moment.');
      } else {
        toast.warning('Vehicle is still asleep. Please ensure the vehicle has cellular connectivity and try again.');
      }
    } catch (err) {
      console.error('Failed to wake vehicle:', err);
      toast.error('Failed to wake vehicle');
    } finally {
      setWakingDevices(prev => {
        const next = new Set(prev);
        next.delete(deviceId);
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    const devicesToClaim = devices.filter(
      d => selectedDevices.has(d.device_id) && !d.claimed_by_current_user
    );

    if (devicesToClaim.length === 0 && selectedDevices.size > 0) {
      // All selected devices are already claimed by this user
      toast.success('Devices already connected');
      onComplete();
      onOpenChange(false);
      return;
    }

    if (devicesToClaim.length === 0) {
      toast.error('Please select at least one device');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const response = await supabase.functions.invoke('claim-devices', {
        body: {
          provider,
          devices: devicesToClaim.map(d => ({
            device_id: d.device_id,
            device_type: d.device_type,
            device_name: d.device_name,
            metadata: d.metadata,
          })),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to claim devices');
      }

      const { results } = response.data;
      
      if (results.claimed.length > 0) {
        toast.success(`${results.claimed.length} device(s) connected successfully`);
      }
      
      if (results.already_claimed.length > 0) {
        toast.warning(`${results.already_claimed.length} device(s) already claimed by other users`);
      }

      onComplete();
      onOpenChange(false);
      
    } catch (err) {
      console.error('Failed to claim devices:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to connect devices');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@zensolar.io?subject=Device Ownership Dispute';
  };

  const availableDevices = devices.filter(d => !d.is_claimed || d.claimed_by_current_user);
  const claimedByOthers = devices.filter(d => d.is_claimed && !d.claimed_by_current_user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
              {provider === 'tesla' ? <Car className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            </span>
            <span>Select Your {provider === 'tesla' ? 'Tesla' : 'Enphase'} Devices</span>
          </DialogTitle>
          <DialogDescription className="pt-1">
            Choose which devices to connect to your ZenSolar account. 
            Each device can only be connected to one account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Loading devices...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                {provider === 'tesla' ? <Car className="h-8 w-8 text-muted-foreground" /> : <Sun className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="text-muted-foreground">
                No devices found on your {provider === 'tesla' ? 'Tesla' : 'Enphase'} account.
              </p>
            </div>
          ) : (
            <>
              {/* Available devices */}
              {availableDevices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Available Devices</h4>
                  {availableDevices.map(device => {
                    const isVehicle = device.device_type === 'vehicle';
                    const vehicleState = device.metadata?.state;
                    const isAsleepOrOffline = vehicleState === 'asleep' || vehicleState === 'offline';
                    const apiOdometer = device.metadata?.odometer;
                    const needsWake = isVehicle && isAsleepOrOffline && !apiOdometer && !device.claimed_by_current_user;
                    const isWaking = wakingDevices.has(device.device_id);
                    const isSelected = selectedDevices.has(device.device_id);
                    
                    return (
                      <div
                        key={device.device_id}
                        className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-card border-border/50 hover:border-border'}`}
                      >
                        <div 
                          className="flex items-center space-x-3 cursor-pointer -m-3 p-3 rounded-xl transition-colors"
                          onClick={() => handleToggleDevice(device.device_id, device)}
                        >
                          <Checkbox
                            id={device.device_id}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleDevice(device.device_id, device)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-muted/50'} transition-colors`}>
                            {deviceIcons[device.device_type] || <Sun className="h-5 w-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={device.device_id} className="font-medium cursor-pointer text-base">
                              {device.device_name}
                            </Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              <span className="capitalize">{device.device_type.replace('_', ' ')}</span>
                              {isVehicle && vehicleState && (
                                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  vehicleState === 'online' 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {vehicleState === 'online' ? <Wifi className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                                  {vehicleState}
                                </span>
                              )}
                              {apiOdometer && (
                                <span className="text-xs font-mono">({apiOdometer.toLocaleString()} mi)</span>
                              )}
                            </div>
                          </div>
                          {device.claimed_by_current_user && (
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                              Connected
                            </span>
                          )}
                        </div>
                        
                        {/* Wake vehicle button for sleeping vehicles without odometer */}
                        {needsWake && isSelected && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <Alert className="mb-3 bg-amber-500/5 border-amber-500/20">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <AlertDescription className="text-sm">
                                Vehicle is {vehicleState}. Tap "Wake Vehicle" to retrieve odometer data before connecting.
                              </AlertDescription>
                            </Alert>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWakeVehicle(device.device_id);
                              }}
                              disabled={isWaking}
                            >
                              {isWaking ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Waking Vehicle...
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4" />
                                  Wake Vehicle
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Devices claimed by others */}
              {claimedByOthers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Unavailable (Already in use)
                  </h4>
                  {claimedByOthers.map(device => (
                    <div
                      key={device.device_id}
                      className="flex items-center space-x-3 p-3 rounded-xl border border-border/30 bg-muted/30 opacity-60"
                    >
                      <div className="w-4" />
                      <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                        {deviceIcons[device.device_type] || <Sun className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {device.device_type.replace('_', ' ')}
                        </p>
                      </div>
                      <span className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full font-medium">
                        In use
                      </span>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={handleContactSupport}
                  >
                    <Mail className="h-4 w-4" />
                    Contact Support for Ownership Dispute
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isSubmitting || selectedDevices.size === 0}
            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              `Connect ${selectedDevices.size} Device${selectedDevices.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
