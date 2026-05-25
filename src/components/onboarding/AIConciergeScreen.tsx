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

// One-tap intake chips. Tapping composes a natural-language description Deason can parse.
type ChipId = 'solar' | 'battery' | 'ev' | 'charger' | 'house' | 'apartment';
const CHIPS: { id: ChipId; emoji: string; label: string; phrase: string; group: 'gear' | 'home' }[] = [
  { id: 'solar',     emoji: '☀️', label: 'Solar',        phrase: 'rooftop solar',                  group: 'gear' },
  { id: 'battery',   emoji: '🔋', label: 'Battery',      phrase: 'a home battery',                 group: 'gear' },
  { id: 'ev',        emoji: '🚗', label: 'EV',           phrase: 'an electric vehicle',            group: 'gear' },
  { id: 'charger',   emoji: '⚡', label: 'Home charger', phrase: 'a home EV charger',              group: 'gear' },
  { id: 'house',     emoji: '🏠', label: 'House',        phrase: 'I live in a single-family home', group: 'home' },
  { id: 'apartment', emoji: '🏢', label: 'Apartment',    phrase: 'I live in an apartment',         group: 'home' },
];

// Per-category OEM drill-down. After the user taps a gear chip, we surface the
// small set of brands we actually support so Deason gets a much better signal
// than "I have solar." Each option carries an ID + a natural-language phrase
// the prompt composer slots in.
type BrandOption = { id: string; label: string; phrase: string };
const BRAND_OPTIONS: Record<'solar' | 'battery' | 'ev' | 'charger', BrandOption[]> = {
  solar: [
    { id: 'tesla',     label: 'Tesla',     phrase: 'Tesla solar' },
    { id: 'enphase',   label: 'Enphase',   phrase: 'Enphase solar' },
    { id: 'solaredge', label: 'SolarEdge', phrase: 'SolarEdge solar' },
    { id: 'other',     label: 'Other',     phrase: 'rooftop solar (other brand)' },
    { id: 'unknown',   label: 'Not sure',  phrase: "rooftop solar (I'm not sure of the brand)" },
  ],
  battery: [
    { id: 'tesla',     label: 'Tesla Powerwall',     phrase: 'a Tesla Powerwall' },
    { id: 'enphase',   label: 'Enphase IQ Battery',  phrase: 'an Enphase IQ Battery' },
    { id: 'solaredge', label: 'SolarEdge Battery',   phrase: 'a SolarEdge Home Battery' },
    { id: 'other',     label: 'Other',               phrase: 'a home battery (other brand)' },
    { id: 'unknown',   label: 'Not sure',            phrase: "a home battery (I'm not sure of the brand)" },
  ],
  ev: [
    { id: 'tesla',   label: 'Tesla',    phrase: 'a Tesla' },
    { id: 'other',   label: 'Other EV', phrase: 'a non-Tesla EV' },
    { id: 'unknown', label: 'Not sure', phrase: 'an EV' },
  ],
  charger: [
    { id: 'tesla_wall_connector', label: 'Tesla Wall Connector', phrase: 'a Tesla Wall Connector' },
    { id: 'wallbox',              label: 'Wallbox',              phrase: 'a Wallbox charger' },
    { id: 'enphase',              label: 'Enphase',              phrase: 'an Enphase home charger' },
    { id: 'solaredge',            label: 'SolarEdge',            phrase: 'a SolarEdge home charger' },
    { id: 'chargepoint',          label: 'ChargePoint',          phrase: 'a ChargePoint charger' },
    { id: 'other',                label: 'Other L2',             phrase: 'another L2 home charger' },
    { id: 'vehicle_telemetry',    label: 'Standard outlet',      phrase: 'a standard garage outlet' },
  ],
};

function composeFromChips(selected: Set<ChipId>, brands: Partial<Record<ChipId, string>>): string {
  const gearOrder: ChipId[] = ['solar', 'battery', 'ev', 'charger'];
  const gear = gearOrder
    .filter((id) => selected.has(id))
    .map((id) => {
      const brandId = brands[id];
      const brand = brandId ? BRAND_OPTIONS[id as 'solar' | 'battery' | 'ev' | 'charger'].find((b) => b.id === brandId) : undefined;
      return brand?.phrase ?? CHIPS.find((c) => c.id === id)!.phrase;
    });
  const home = CHIPS.filter((c) => c.group === 'home' && selected.has(c.id)).map((c) => c.phrase);
  const parts: string[] = [];
  if (gear.length) {
    const joined = gear.length === 1
      ? gear[0]
      : gear.slice(0, -1).join(', ') + ' and ' + gear[gear.length - 1];
    parts.push(`I have ${joined}.`);
  }
  if (home.length) parts.push(home[0] + '.');
  return parts.join(' ');
}

export function AIConciergeScreen({ onPlanConfirmed, onSkipToManual, onBack }: AIConciergeScreenProps) {
  const [description, setDescription] = useState('');
  const [chips, setChips] = useState<Set<ChipId>>(new Set());
  const [brands, setBrands] = useState<Partial<Record<ChipId, string>>>({});
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SetupProfile | null>(null);

  const toggleChip = async (id: ChipId) => {
    await triggerLightTap();
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setBrands((b) => {
          const nb = { ...b };
          delete nb[id];
          return nb;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const pickBrand = async (id: ChipId, brandId: string) => {
    await triggerLightTap();
    setBrands((b) => ({ ...b, [id]: b[id] === brandId ? undefined : brandId }));
  };

  // Typed description wins; otherwise compose from chips + per-category brand picks.
  const effectivePrompt = description.trim() || composeFromChips(chips, brands);
  const canSubmit = effectivePrompt.length >= 3;

  const extract = async () => {
    if (!canSubmit) {
      toast.error('Tap what you have, or describe your setup in a sentence.');
      return;
    }
    await triggerLightTap();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('onboarding-concierge', {
        body: { description: effectivePrompt },
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
              {/* Amber Sparkles — identical to the floating Deason bubble on the dashboard
                  so users recognize the same assistant after onboarding. */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 ring-2 ring-amber-300/40"
              >
                <Sparkles className="w-10 h-10 text-black" />
              </motion.div>

              <div className="text-center mb-5">
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-[0.18em] mb-2">
                  Deason · AI Setup
                </p>
                <h2 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
                  What do you have?
                </h2>
                <p className="text-muted-foreground text-[14px]">
                  Tap all that apply.
                </p>
              </div>

              {/* One-tap intake chips */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  What energy gear do you have?
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {CHIPS.filter((c) => c.group === 'gear').map((c) => {
                    const active = chips.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChip(c.id)}
                        disabled={loading}
                        className={`text-[13px] px-3 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-primary/15 border-primary/50 text-foreground shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
                            : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30'
                        }`}
                      >
                        <span aria-hidden>{c.emoji}</span>
                        <span className="font-medium">{c.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {/* OEM drill-down: appears once a gear category is selected so
                    Deason can target the right OAuth provider. */}
                <AnimatePresence initial={false}>
                  {(['solar', 'battery', 'ev', 'charger'] as const)
                    .filter((id) => chips.has(id))
                    .map((id) => {
                      const cat = CHIPS.find((c) => c.id === id)!;
                      const options = BRAND_OPTIONS[id];
                      const selected = brands[id];
                      return (
                        <motion.div
                          key={`brand-${id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mb-3 overflow-hidden"
                        >
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1 flex items-center gap-1.5">
                            <span aria-hidden>{cat.emoji}</span>
                            Which {cat.label.toLowerCase()}?
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((opt) => {
                              const isOn = selected === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => pickBrand(id, opt.id)}
                                  disabled={loading}
                                  className={`text-[12px] px-2.5 py-1.5 rounded-full border transition-all ${
                                    isOn
                                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                                      : 'bg-card/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>

                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Where do you live?
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHIPS.filter((c) => c.group === 'home').map((c) => {
                    const active = chips.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChip(c.id)}
                        disabled={loading}
                        className={`text-[13px] px-3 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-primary/15 border-primary/50 text-foreground shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
                            : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30'
                        }`}
                      >
                        <span aria-hidden>{c.emoji}</span>
                        <span className="font-medium">{c.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                    const active = chips.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChip(c.id)}
                        disabled={loading}
                        className={`text-[13px] px-3 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-primary/15 border-primary/50 text-foreground shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
                            : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30'
                        }`}
                      >
                        <span aria-hidden>{c.emoji}</span>
                        <span className="font-medium">{c.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional power-user textarea */}
              <details className="mb-4 group">
                <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-1">
                  <Edit3 className="w-3 h-3" />
                  Or add details (brand, model, notes)
                </summary>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Enphase solar with IQ Battery and a Tesla Model Y…"
                  disabled={loading}
                  rows={3}
                  className="mt-2 resize-none bg-card/80 backdrop-blur-sm border-border/60 text-[14px]"
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SAMPLES.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(s)}
                      disabled={loading}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {s.length > 34 ? s.slice(0, 34) + '…' : s}
                    </button>
                  ))}
                </div>
              </details>

              <Button
                onClick={extract}
                disabled={loading || !canSubmit}
                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deason is building your plan…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {chips.size === 0 && description.trim().length === 0
                      ? 'Tap what you have to continue'
                      : 'Build my plan'}
                    {canSubmit && <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </Button>

              <div className="text-center mt-4">
                <Button variant="ghost" size="sm" onClick={onSkipToManual} disabled={loading} className="text-muted-foreground text-xs">
                  I'm not sure yet — show me my options
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
        className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 ring-2 ring-amber-300/40"
      >
        <Check className="w-10 h-10 text-black" />
      </motion.div>

      <div className="text-center mb-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-500 tracking-wide uppercase">
          <Sparkles className="w-3 h-3" />
          Deason built this
        </span>
      </div>

      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Here's your plan</h2>
        <p className="text-sm text-muted-foreground italic">{profile.summary}</p>
        {profile.confidence === 'low' && (
          <p className="text-xs text-amber-500 mt-2">Deason isn't sure about this — please double-check before continuing.</p>
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
        <div className="mb-5 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Your plan</p>
            <span className="text-[11px] font-medium text-muted-foreground">
              ~{Math.max(1, providers.length)} min · {providers.length} {providers.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">
            We'll connect: {providers.map((p) => brandLabel(p!)).join(' → ')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            You can always add more devices later from your Clean Energy Center.
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
