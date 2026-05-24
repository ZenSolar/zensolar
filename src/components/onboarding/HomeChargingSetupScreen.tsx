import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MapPin, Zap, ArrowRight, ArrowLeft, Check, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerLightTap, triggerSuccess } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export type HomeChargingSource = 'tesla_wall_connector' | 'wallbox' | 'vehicle_telemetry' | 'none';
export type HomeSetupType = 'house' | 'apartment_private' | 'apartment_shared' | 'other';

interface ChargerOption {
  id: HomeChargingSource;
  brand: string;
  label: string;
  description: string;
  hasApi: boolean;
}

const CHARGER_OPTIONS: ChargerOption[] = [
  { id: 'tesla_wall_connector', brand: 'Tesla Wall Connector', label: 'Tesla Wall Connector', description: 'Smart charger with API — meter-grade accuracy', hasApi: true },
  { id: 'wallbox', brand: 'Wallbox Pulsar Plus', label: 'Wallbox', description: 'Pulsar Plus, Quasar — connected via Wallbox API', hasApi: true },
  { id: 'vehicle_telemetry', brand: 'ChargePoint Home Flex', label: 'ChargePoint Home Flex', description: 'No API — we read kWh from your vehicle', hasApi: false },
  { id: 'vehicle_telemetry', brand: 'Other Level 2 Charger', label: 'Other Level 2 (no app)', description: 'Any dumb L2 charger — we read from your vehicle', hasApi: false },
  { id: 'vehicle_telemetry', brand: '120V Outlet / NEMA 14-50', label: 'Standard outlet', description: 'Plain wall outlet — we read from your vehicle', hasApi: false },
  { id: 'none', brand: '', label: "I don't charge at home", description: 'Only supercharging — skip home setup', hasApi: false },
];

const SETUP_OPTIONS: { id: HomeSetupType; label: string; icon: typeof Home; description: string }[] = [
  { id: 'house', label: 'Single-family home', icon: Home, description: 'My own house or townhouse' },
  { id: 'apartment_private', label: 'Apartment — own charger', icon: Building2, description: 'My own dedicated parking + charger' },
  { id: 'apartment_shared', label: 'Apartment — shared L2', icon: Building2, description: 'Public/shared Level 2 at my building' },
  { id: 'other', label: 'Other', icon: MapPin, description: 'Street parking, dorm, etc.' },
];

interface HomeChargingSetupScreenProps {
  vehicleDeviceId: string; // VIN
  vehicleName?: string;
  onComplete: () => void;
  onSkip: () => void;
}

type SubStep = 'source' | 'location' | 'setup';

export function HomeChargingSetupScreen({ vehicleDeviceId, vehicleName, onComplete, onSkip }: HomeChargingSetupScreenProps) {
  const [subStep, setSubStep] = useState<SubStep>('source');
  const [selectedChargerIdx, setSelectedChargerIdx] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [setupType, setSetupType] = useState<HomeSetupType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [prefilledAddress, setPrefilledAddress] = useState<string | null>(null);

  // Try to prefill address from profile.home_address (existing field)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('home_address')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.home_address) {
        setPrefilledAddress(data.home_address);
        setAddress(data.home_address);
      }
    })();
  }, []);

  const selectedCharger = selectedChargerIdx !== null ? CHARGER_OPTIONS[selectedChargerIdx] : null;

  const handleChargerSelect = async (idx: number) => {
    await triggerLightTap();
    setSelectedChargerIdx(idx);
    const opt = CHARGER_OPTIONS[idx];
    if (opt.id === 'none') {
      // Skip directly — save and exit
      await saveAndComplete({ source: 'none', brand: '', address: '', setupType: 'other' });
      return;
    }
    setSubStep('location');
  };

  const handleLocationContinue = async () => {
    if (!address.trim()) {
      toast.error('Please enter your home address');
      return;
    }
    await triggerLightTap();
    setSubStep('setup');
  };

  const handleSetupSelect = async (type: HomeSetupType) => {
    await triggerLightTap();
    setSetupType(type);
    if (!selectedCharger) return;
    await saveAndComplete({
      source: selectedCharger.id,
      brand: selectedCharger.brand,
      address: address.trim(),
      setupType: type,
    });
  };

  const saveAndComplete = async (vals: { source: HomeChargingSource; brand: string; address: string; setupType: HomeSetupType }) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Save to connected_devices (the vehicle row)
      const homeLocation = vals.address
        ? { address: vals.address, radius_m: 200, source: 'user_entered' as const }
        : null;

      const { error: devErr } = await supabase
        .from('connected_devices')
        .update({
          home_charging_source: vals.source,
          home_charger_brand: vals.brand || null,
          home_setup_type: vals.setupType,
          home_location: homeLocation as any,
        })
        .eq('user_id', user.id)
        .eq('device_id', vehicleDeviceId);

      if (devErr) {
        console.error('[HomeChargingSetup] device update error:', devErr);
      }

      // Mirror address into profile.home_address so existing tesla-charge-monitor geofence works
      if (vals.address) {
        await supabase.from('profiles').update({ home_address: vals.address }).eq('user_id', user.id);
      }

      await triggerSuccess();
      onComplete();
    } catch (err) {
      console.error('[HomeChargingSetup] save error:', err);
      toast.error('Failed to save. You can update this later from Settings.');
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    await triggerLightTap();
    if (subStep === 'location') setSubStep('source');
    else if (subStep === 'setup') setSubStep('location');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/12 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Back button */}
      {subStep !== 'source' && !isSaving && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="absolute top-6 left-4 z-20">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      )}

      <motion.div className="w-full max-w-md relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <motion.img src={zenLogo} alt="ZenSolar" className="h-8 w-auto mx-auto mb-8 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />

        {/* Header icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25"
        >
          {subStep === 'source' && <Zap className="w-10 h-10 text-primary-foreground" />}
          {subStep === 'location' && <MapPin className="w-10 h-10 text-primary-foreground" />}
          {subStep === 'setup' && <Home className="w-10 h-10 text-primary-foreground" />}
        </motion.div>

        {/* Sub-step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['source', 'location', 'setup'] as SubStep[]).map((s, i) => {
            const isActive = s === subStep;
            const isPast = (['source', 'location', 'setup'] as SubStep[]).indexOf(subStep) > i;
            return (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${isActive ? 'w-8 bg-primary' : isPast ? 'w-4 bg-primary/60' : 'w-4 bg-muted'}`}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP A: SOURCE ─────────────────────────────────── */}
          {subStep === 'source' && (
            <motion.div key="source" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">How do you charge at home?</h2>
                <p className="text-muted-foreground text-sm">
                  {vehicleName ? `For your ${vehicleName}` : 'For your Tesla'} — this tells us where your home kWh data should come from
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {CHARGER_OPTIONS.map((opt, idx) => (
                  <motion.button
                    key={`${opt.id}-${opt.brand}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleChargerSelect(idx)}
                    disabled={isSaving}
                    className="w-full p-3.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 hover:border-primary/50 hover:bg-card transition-all flex items-center gap-3 text-left disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.hasApi ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                        {opt.hasApi && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">API</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </div>

              <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground hover:text-foreground">
                Skip for now
              </Button>
            </motion.div>
          )}

          {/* ── STEP B: LOCATION ─────────────────────────────────── */}
          {subStep === 'location' && (
            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Where's home?</h2>
                <p className="text-muted-foreground text-sm">
                  We use this as a geofence so only charging sessions <em>at your home</em> count as home charging. Sessions elsewhere are tagged as destination charging.
                </p>
              </div>

              {prefilledAddress && address === prefilledAddress && (
                <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground">
                    We found a home address on your profile. Confirm it's correct or update below.
                  </p>
                </div>
              )}

              <div className="mb-6">
                <Label htmlFor="home-address" className="text-sm font-medium text-foreground mb-2 block">
                  Home address
                </Label>
                <Input
                  id="home-address"
                  type="text"
                  placeholder="123 Main St, Austin, TX"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-card border-border/60 focus:border-primary"
                  autoComplete="street-address"
                />
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Stored privately. Only used to calculate a 200-meter geofence around your home.
                </p>
              </div>

              <Button
                onClick={handleLocationContinue}
                disabled={!address.trim() || isSaving}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── STEP C: SETUP TYPE ─────────────────────────────────── */}
          {subStep === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Your home setup</h2>
                <p className="text-muted-foreground text-sm">
                  Helps us label your receipts accurately — apartment vs house, private vs shared charger.
                </p>
              </div>

              <div className="space-y-2">
                {SETUP_OPTIONS.map((opt, idx) => {
                  const Icon = opt.icon;
                  const isSelected = setupType === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSetupSelect(opt.id)}
                      disabled={isSaving}
                      className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 text-left disabled:opacity-50 ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 bg-card/80 hover:border-primary/50 hover:bg-card'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                      {isSaving && isSelected ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
