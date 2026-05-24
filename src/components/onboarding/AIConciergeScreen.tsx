import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, ArrowLeft, Check, Edit3, Sun, Battery, Car, Zap, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerLightTap, triggerSuccess } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export type ConciergeBrand = 'tesla' | 'enphase' | 'solaredge' | 'wallbox' | null;

export interface SetupProfile {
  solar: { present: boolean; brand: 'tesla' | 'enphase' | 'solaredge' | 'other' | 'unknown'; notes?: string };
  battery: { present: boolean; brand: 'tesla' | 'enphase' | 'solaredge' | 'other' | 'unknown'; notes?: string };
  vehicle: { present: boolean; brand: 'tesla' | 'other' | 'unknown'; model?: string };
  home_charger: {
    present: boolean;
    brand: 'tesla_wall_connector' | 'wallbox' | 'enphase' | 'solaredge' | 'chargepoint' | 'other' | 'vehicle_telemetry' | 'none' | 'unknown';
    custom_label?: string;
  };
  living_situation: 'house' | 'apartment_private' | 'apartment_shared' | 'other' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

interface AIConciergeScreenProps {
  /** Called with the ordered list of providers the user wants to connect. */
  onPlanConfirmed: (plan: { providers: ConciergeBrand[]; profile: SetupProfile }) => void;
  /** User skipped AI flow → drop them at the manual provider picker. */
  onSkipToManual: () => void;
  onBack?: () => void;
}

const SAMPLES = [
  'I have Enphase solar with an IQ Battery and a Tesla Model Y. I just plug into a regular garage outlet.',
  'Tesla solar + Powerwall, no EV yet.',
  'SolarEdge inverter with their Home Battery, and a Wallbox Pulsar Plus for my Model 3.',
  'Apartment dweller — Tesla Model Y, I use a shared L2 charger in the parking garage.',
];

function brandsFromProfile(p: SetupProfile): ConciergeBrand[] {
  const set = new Set<ConciergeBrand>();
  if (p.solar.present && ['tesla', 'enphase', 'solaredge'].includes(p.solar.brand)) set.add(p.solar.brand as ConciergeBrand);
  if (p.battery.present && ['tesla', 'enphase', 'solaredge'].includes(p.battery.brand)) set.add(p.battery.brand as ConciergeBrand);
  if (p.vehicle.present && p.vehicle.brand === 'tesla') set.add('tesla');
  if (p.home_charger.present) {
    if (p.home_charger.brand === 'tesla_wall_connector') set.add('tesla');
    else if (p.home_charger.brand === 'wallbox') set.add('wallbox');
    else if (p.home_charger.brand === 'enphase') set.add('enphase');
    else if (p.home_charger.brand === 'solaredge') set.add('solaredge');
  }
  return Array.from(set);
}

export function AIConciergeScreen({ onPlanConfirmed, onSkipToManual, onBack }: AIConciergeScreenProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SetupProfile | null>(null);

  const extract = async () => {
    if (description.trim().length < 3) {
      toast.error('Tell me a bit more about your setup.');
      return;
    }
    await triggerLightTap();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('onboarding-concierge', {
        body: { description: description.trim() },
      });
      if (error || !data?.profile) {
        const status = (error as any)?.context?.status;
        if (status === 429) toast.error('Too many requests — give it a sec and try again.');
        else if (status === 402) toast.error('AI is temporarily unavailable. Use manual setup instead.');
        else toast.error('Couldn\'t parse that. Try rewording or use manual setup.');
        return;
      }
      await triggerSuccess();
      setProfile(data.profile as SetupProfile);
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong. You can set things up manually instead.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!profile) return;
    await triggerLightTap();
    const providers = brandsFromProfile(profile);
    onPlanConfirmed({ providers, profile });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {onBack && !loading && (
        <div className="absolute top-6 left-4 z-20">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/12 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src={zenLogo}
          alt="ZenSolar"
          className="h-8 w-auto mx-auto mb-6 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        />

        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25"
              >
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </motion.div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Tell me about your setup
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Just describe your solar, battery, EV, or home charger in your own words.
                  I'll figure out what to connect.
                </p>
              </div>

              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I have Enphase solar with an IQ Battery and a Tesla Model Y in my garage..."
                disabled={loading}
                rows={4}
                className="mb-3 resize-none bg-card/80 backdrop-blur-sm border-border/60"
                maxLength={2000}
              />

              <div className="flex flex-wrap gap-1.5 mb-5">
                {SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDescription(s)}
                    disabled={loading}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {s.length > 38 ? s.slice(0, 38) + '…' : s}
                  </button>
                ))}
              </div>

              <Button
                onClick={extract}
                disabled={loading || description.trim().length < 3}
                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reading your setup…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Build my plan
                  </>
                )}
              </Button>

              <div className="text-center mt-4">
                <Button variant="ghost" size="sm" onClick={onSkipToManual} disabled={loading} className="text-muted-foreground text-xs">
                  Or pick providers manually
                </Button>
              </div>
            </motion.div>
          ) : (
            <PlanReview
              profile={profile}
              onConfirm={confirm}
              onEdit={() => setProfile(null)}
              onSkipToManual={onSkipToManual}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function PlanRow({ icon: Icon, label, detail }: { icon: any; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      <Check className="w-4 h-4 text-primary mt-2 flex-shrink-0" />
    </div>
  );
}

function PlanReview({
  profile, onConfirm, onEdit, onSkipToManual,
}: {
  profile: SetupProfile;
  onConfirm: () => void;
  onEdit: () => void;
  onSkipToManual: () => void;
}) {
  const providers = brandsFromProfile(profile);
  const brandLabel = (b: string) => ({ tesla: 'Tesla', enphase: 'Enphase', solaredge: 'SolarEdge', wallbox: 'Wallbox' } as any)[b] || b;

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
    >
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25"
      >
        <Check className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Here's your plan</h2>
        <p className="text-sm text-muted-foreground italic">{profile.summary}</p>
        {profile.confidence === 'low' && (
          <p className="text-xs text-amber-500 mt-2">Low confidence — please double-check before continuing.</p>
        )}
      </div>

      <div className="space-y-2 mb-5">
        {profile.solar.present && (
          <PlanRow icon={Sun} label="Solar" detail={`${brandLabel(profile.solar.brand)}${profile.solar.notes ? ' · ' + profile.solar.notes : ''}`} />
        )}
        {profile.battery.present && (
          <PlanRow icon={Battery} label="Battery" detail={`${brandLabel(profile.battery.brand)}${profile.battery.notes ? ' · ' + profile.battery.notes : ''}`} />
        )}
        {profile.vehicle.present && (
          <PlanRow icon={Car} label="Vehicle" detail={`${brandLabel(profile.vehicle.brand)}${profile.vehicle.model ? ' ' + profile.vehicle.model : ''}`} />
        )}
        {profile.home_charger.present && (
          <PlanRow
            icon={Zap}
            label="Home charging"
            detail={
              profile.home_charger.custom_label
              || (profile.home_charger.brand === 'vehicle_telemetry' ? 'Tracked via vehicle telemetry' : brandLabel(profile.home_charger.brand))
            }
          />
        )}
        {profile.living_situation !== 'unknown' && (
          <PlanRow
            icon={Home}
            label="Living situation"
            detail={profile.living_situation.replace('_', ' ')}
          />
        )}
      </div>

      {providers.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">I'll connect, in order:</p>
          <p className="text-sm font-medium text-foreground">
            {providers.map((p) => brandLabel(p!)).join(' → ')}
          </p>
        </div>
      )}

      <Button
        onClick={onConfirm}
        disabled={providers.length === 0}
        className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 mb-2"
      >
        {providers.length === 0 ? 'Nothing to connect' : 'Looks right — connect everything'}
        <ArrowRight className="w-4 h-4" />
      </Button>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground gap-1">
          <Edit3 className="w-3 h-3" /> Edit description
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkipToManual} className="text-muted-foreground">
          Pick manually
        </Button>
      </div>
    </motion.div>
  );
}
