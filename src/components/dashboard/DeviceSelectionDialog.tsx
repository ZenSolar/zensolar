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
import { Loader2, Car, Battery, Sun, AlertTriangle, Mail } from 'lucide-react';
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
          <DialogTitle>
            Select Your {provider === 'tesla' ? 'Tesla' : 'Enphase'} Devices
          </DialogTitle>
          <DialogDescription>
            Choose which devices to connect to your ZenSolar account. 
            Each device can only be connected to one account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading devices...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : devices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No devices found on your {provider === 'tesla' ? 'Tesla' : 'Enphase'} account.
            </p>
          ) : (
            <>
              {/* Available devices */}
              {availableDevices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Available Devices</h4>
                  {availableDevices.map(device => (
                    <div
                      key={device.device_id}
                      className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleToggleDevice(device.device_id, device)}
                    >
                      <Checkbox
                        id={device.device_id}
                        checked={selectedDevices.has(device.device_id)}
                        onCheckedChange={() => handleToggleDevice(device.device_id, device)}
                      />
                      <div className="text-muted-foreground">
                        {deviceIcons[device.device_type] || <Sun className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={device.device_id} className="font-medium cursor-pointer">
                          {device.device_name}
                        </Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {device.device_type.replace('_', ' ')}
                        </p>
                      </div>
                      {device.claimed_by_current_user && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          Connected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Devices claimed by others */}
              {claimedByOthers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Unavailable (Already in use)
                  </h4>
                  {claimedByOthers.map(device => (
                    <div
                      key={device.device_id}
                      className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/50 opacity-60"
                    >
                      <div className="w-4" />
                      <div className="text-muted-foreground">
                        {deviceIcons[device.device_type] || <Sun className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {device.device_type.replace('_', ' ')}
                        </p>
                      </div>
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                        In use by another account
                      </span>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleContactSupport}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support for Ownership Dispute
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isSubmitting || selectedDevices.size === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
