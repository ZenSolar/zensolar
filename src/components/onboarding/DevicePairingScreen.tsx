import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import teslaLogo from '@/assets/logos/tesla-t-icon.png';
import enphaseLogo from '@/assets/logos/enphase-brand.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';
import type { EnergyProvider } from './EnergyConnectionScreen';

/**
 * DevicePairingScreen — The "Deason" pairing step.
 *
 * After the user multi-selects OEMs on Connect What Earns, they land here.
 * Deason asks: "which devices do you actually have from each brand?"
 * The user checks the boxes (Solar / Battery / EV) for each selected OEM.
 * The result is persisted to localStorage so the OAuth phase can use it.
 *
 * Tesla is the only supported EV OEM — there is no "Other EV" path.
 */

export type DeviceCapability = 'solar' | 'battery' | 'ev' | 'charger';

export type DevicePairing = Record<EnergyProvider, DeviceCapability[]>;

interface OEMConfig {
  id: EnergyProvider;
  name: string;
  logo: string;
  blurb: string;
  // Capabilities the OEM can connect — only these checkboxes render.
  available: DeviceCapability[];
  // Pre-checked by default (what users with this OEM most commonly own).
  defaults: DeviceCapability[];
  // OEM-specific product names per capability (e.g. Tesla battery → "Powerwall").
  productNames: Partial<Record<DeviceCapability, string>>;
}

const OEMS: Record<EnergyProvider, OEMConfig> = {
  tesla: {
    id: 'tesla',
    name: 'Tesla',
    logo: teslaLogo,
    blurb: 'Powerwall, Solar Roof, Vehicles & Wall Connector',
    available: ['ev', 'solar', 'battery', 'charger'],
    defaults: ['ev', 'battery'],
    productNames: {
      solar: 'Solar Roof / Solar Panels',
      battery: 'Powerwall',
      ev: 'Electric Vehicle',
      charger: 'Wall Connector',
    },
  },
  enphase: {
    id: 'enphase',
    name: 'Enphase',
    logo: enphaseLogo,
    blurb: 'IQ Microinverters, IQ Battery & IQ EV Charger',
    available: ['solar', 'battery', 'charger'],
    defaults: ['solar'],
    productNames: {
      solar: 'IQ Microinverters',
      battery: 'IQ Battery',
      charger: 'IQ EV Charger',
    },
  },
  solaredge: {
    id: 'solaredge',
    name: 'SolarEdge',
    logo: solaredgeLogo,
    blurb: 'Home Hub Inverter, Home Battery & Home EV Charger',
    available: ['solar', 'battery', 'charger'],
    defaults: ['solar'],
    productNames: {
      solar: 'Home Hub Inverter',
      battery: 'Home Battery',
      charger: 'Home EV Charger',
    },
  },
  wallbox: {
    id: 'wallbox',
    name: 'Wallbox',
    logo: wallboxLogo,
    blurb: 'Pulsar Plus home EV charger',
    available: ['charger'],
    defaults: ['charger'],
    productNames: {
      charger: 'Pulsar Plus',
    },
  },
};

const CAPABILITY_META: Record<DeviceCapability, { label: string; emoji: string; tint: string }> = {
  solar: { label: 'Solar', emoji: '☀️', tint: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  battery: { label: 'Battery', emoji: '🔋', tint: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
  ev: { label: 'EV', emoji: '🚗', tint: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
  charger: { label: 'Home Charger', emoji: '🔌', tint: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
};

interface DevicePairingScreenProps {
  selectedOems: EnergyProvider[];
  /**
   * Pre-resolved Solar source-of-truth from SolarInstallerScreen.
   * - 'tesla' → Tesla owns Solar (auto-checked on Tesla, locked off on Enphase/SolarEdge)
   * - 'other' → Enphase or SolarEdge owns Solar (locked off on Tesla)
   * - undefined → no pre-resolution; user picks freely & the conflict resolver
   *   appears if 2+ OEMs both claim Solar.
   */
  solarInstaller?: 'tesla' | 'other';
  onContinue: (pairing: DevicePairing) => void;
  onBack?: () => void;
}

export function DevicePairingScreen({
  selectedOems,
  solarInstaller,
  onContinue,
  onBack,
}: DevicePairingScreenProps) {
  // Seed state from defaults — honoring solarInstaller pre-resolution so Solar
  // capability is already routed to the correct OEM and locked off the others.
  const initial = useMemo<DevicePairing>(() => {
    const m: Partial<DevicePairing> = {};
    selectedOems.forEach((oem) => {
      m[oem] = [...OEMS[oem].defaults];
    });
    if (solarInstaller === 'tesla' && selectedOems.includes('tesla')) {
      selectedOems.forEach((oem) => {
        if (oem === 'tesla') {
          if (!(m[oem] ?? []).includes('solar')) m[oem] = [...(m[oem] ?? []), 'solar'];
        } else {
          m[oem] = (m[oem] ?? []).filter((c) => c !== 'solar');
        }
      });
    } else if (solarInstaller === 'other' && selectedOems.includes('tesla')) {
      m.tesla = (m.tesla ?? []).filter((c) => c !== 'solar');
    }
    return m as DevicePairing;
  }, [selectedOems, solarInstaller]);

  const [pairing, setPairing] = useState<DevicePairing>(initial);

  /**
   * Per-OEM available capabilities, filtered by solarInstaller pre-resolution.
   * If Tesla didn't install the PV system, hide Solar from the Tesla card
   * (user only has Powerwall and/or a Tesla EV). Conversely, if Tesla DID
   * install it, hide Solar from Enphase/SolarEdge. Also reorders Tesla as
   * EV → Battery when Solar is removed so the most relevant device is first.
   */
  const availableFor = (oem: EnergyProvider): DeviceCapability[] => {
    const base = OEMS[oem].available;
    if (solarInstaller === 'other' && oem === 'tesla') {
      return base.filter((c) => c !== 'solar').sort((a, b) => {
        const order: DeviceCapability[] = ['ev', 'battery', 'solar'];
        return order.indexOf(a) - order.indexOf(b);
      });
    }
    if (solarInstaller === 'tesla' && (oem === 'enphase' || oem === 'solaredge')) {
      return base.filter((c) => c !== 'solar');
    }
    return base;
  };

  const toggle = async (oem: EnergyProvider, cap: DeviceCapability) => {
    await triggerLightTap();
    setPairing((prev) => {
      const current = prev[oem] ?? [];
      const next = current.includes(cap)
        ? current.filter((c) => c !== cap)
        : [...current, cap];
      return { ...prev, [oem]: next };
    });
  };

  /**
   * Conflict resolver: only ONE OEM may own each capability (Solar, Battery).
   * Source of truth = whichever app the customer actually opens.
   * EV is Tesla-only so it never conflicts.
   * Resolves by unchecking the capability on every OEM EXCEPT the chosen one.
   */
  const resolveConflict = async (cap: DeviceCapability, keepOem: EnergyProvider) => {
    await triggerLightTap();
    setPairing((prev) => {
      const next = { ...prev };
      selectedOems.forEach((oem) => {
        if (oem === keepOem) {
          // Make sure the kept OEM actually has the cap checked.
          const current = next[oem] ?? [];
          if (!current.includes(cap)) next[oem] = [...current, cap];
        } else {
          next[oem] = (next[oem] ?? []).filter((c) => c !== cap);
        }
      });
      return next;
    });
  };

  // Detect which capabilities are claimed by 2+ OEMs (Solar / Battery only — EV is Tesla-only).
  const conflicts = useMemo<DeviceCapability[]>(() => {
    const out: DeviceCapability[] = [];
    (['solar', 'battery'] as const).forEach((cap) => {
      const owners = selectedOems.filter((oem) => (pairing[oem] ?? []).includes(cap));
      if (owners.length > 1) out.push(cap);
    });
    return out;
  }, [pairing, selectedOems]);

  // Total number of devices the user has mapped across all OEMs.
  const totalDevices = selectedOems.reduce(
    (sum, oem) => sum + (pairing[oem]?.length ?? 0),
    0
  );

  // Must have at least one device AND no unresolved overlaps.
  const canContinue = totalDevices > 0 && conflicts.length === 0;

  // Per-capability ownership map — confirms back to the user which OEM feeds what.
  // Resolves the "Enphase solar + Tesla Powerwall" split-capability case visibly.
  const ownership = useMemo(() => {
    const map: Partial<Record<DeviceCapability, EnergyProvider>> = {};
    (['solar', 'battery', 'ev'] as const).forEach((cap) => {
      const owner = selectedOems.find((oem) => (pairing[oem] ?? []).includes(cap));
      if (owner) map[cap] = owner;
    });
    return map;
  }, [pairing, selectedOems]);

  // Detect Wallbox without Tesla EV — Wallbox pairs with Tesla, useful hint.
  const wallboxNoTesla =
    selectedOems.includes('wallbox') &&
    (!selectedOems.includes('tesla') || !(pairing.tesla ?? []).includes('ev'));

  const handleContinue = async () => {
    if (!canContinue) return;
    await triggerLightTap();
    try {
      localStorage.setItem('onboarding_device_pairing', JSON.stringify(pairing));
      // Keep planned_providers in sync so downstream screens (EnergyConnectionScreen)
      // still get their "Recommended for you" highlights & checklist.
      localStorage.setItem(
        'onboarding_planned_providers',
        JSON.stringify(selectedOems)
      );
    } catch {
      /* ignore quota / privacy mode */
    }
    onContinue(pairing);
  };

  const handleBack = async () => {
    await triggerLightTap();
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[110px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        {onBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 -ml-2 text-muted-foreground hover:text-foreground h-9"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <div className="w-16" />
        )}
        <img
          src={zenLogo}
          alt="ZenSolar"
          className="h-6 w-auto opacity-90 dark:drop-shadow-[0_0_18px_rgba(34,197,94,0.25)]"
        />
        <div className="w-16" />
      </header>

      {/* Deason hero */}
      <section className="relative z-10 flex flex-col items-center pt-4 pb-1 px-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.45)] ring-2 ring-amber-300/40"
        >
          <Sparkles className="w-7 h-7 text-black" strokeWidth={2.25} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-5 text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Deason · pairing
          </p>
          <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
            What do you have from each?
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground max-w-[320px] mx-auto">
            Check every device you own. Mix &amp; match brands — e.g. Enphase for
            solar and Tesla for your Powerwall.
          </p>
        </motion.div>
      </section>

      {/* Live pairing summary — shows which OEM feeds each capability.
          Reinforces split-ownership setups (e.g. solar from one app,
          battery from another) so users see the mapping is correct. */}
      {Object.keys(ownership).length > 0 && conflicts.length === 0 && (
        <section className="relative z-10 px-5 mt-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {(['solar', 'battery', 'ev'] as const).map((cap) => {
              const owner = ownership[cap];
              if (!owner) return null;
              const meta = CAPABILITY_META[cap];
              return (
                <div
                  key={cap}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${meta.tint}`}
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span className="opacity-90">{meta.label}</span>
                  <span className="opacity-50">·</span>
                  <span className="font-semibold">{OEMS[owner].name}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* OEM cards */}
      <section className="relative z-10 flex-1 px-5 pt-5 pb-44 space-y-3 overflow-y-auto">
        {/* Conflict resolver — appears when 2+ OEMs both claim Solar or Battery.
            Source of truth = whichever app the customer actually opens. Prevents
            double-counting kWh (see mem://features/data-source-of-truth.md). */}
        {conflicts.map((cap) => {
          const meta = CAPABILITY_META[cap];
          const claimants = selectedOems.filter((oem) =>
            (pairing[oem] ?? []).includes(cap)
          );
          const verb = cap === 'solar' ? 'see your solar production' : 'view your battery';
          return (
            <motion.div
              key={`conflict-${cap}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/30 shadow-[0_0_22px_rgba(251,191,36,0.15)]"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-amber-100 uppercase tracking-wider">
                    Heads up · pick your {meta.label.toLowerCase()} app
                  </p>
                  <p className="text-[12px] text-amber-100/85 mt-1 leading-relaxed">
                    You picked {claimants.map((c) => OEMS[c].name).join(' and ')} for{' '}
                    {meta.label.toLowerCase()}. To avoid double-counting kWh, which app do
                    you actually open to {verb}?
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {claimants.map((oem) => (
                  <button
                    key={oem}
                    onClick={() => resolveConflict(cap, oem)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-background/40 hover:border-amber-400/60 hover:bg-amber-500/10 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg shrink-0 ring-1 ring-white/10 bg-[#1a1a1a] flex items-center justify-center p-1">
                      <img
                        src={OEMS[oem].logo}
                        alt={`${OEMS[oem].name} logo`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="flex-1 text-[13px] font-semibold text-foreground">
                      I use the {OEMS[oem].name} app
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}


        {selectedOems.map((oemId, idx) => {
          const oem = OEMS[oemId];
          const checked = pairing[oemId] ?? [];
          return (
            <motion.div
              key={oemId}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.07 }}
              className="p-4 rounded-3xl border border-white/8"
              style={{
                background:
                  'linear-gradient(135deg, hsl(var(--card) / 0.7) 0%, hsl(var(--background) / 0.85) 100%)',
              }}
            >
              {/* OEM header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl shrink-0 shadow-md ring-1 ring-white/10 bg-[#1a1a1a] flex items-center justify-center p-1.5">
                  <img
                    src={oem.logo}
                    alt={`${oem.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground truncate">
                    {oem.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {oem.blurb}
                  </p>
                </div>
              </div>

              {/* Capability checkboxes */}
              <div className="mt-3 grid grid-cols-1 gap-2">
                {availableFor(oemId).map((cap) => {
                  const isChecked = checked.includes(cap);
                  const meta = CAPABILITY_META[cap];
                  return (
                    <button
                      key={cap}
                      onClick={() => toggle(oemId, cap)}
                      aria-pressed={isChecked}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.22)]'
                          : 'border-white/8 bg-white/2 hover:border-primary/40'
                      }`}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">
                        {meta.emoji}
                      </span>
                      <span className="flex-1 text-[14px] font-medium text-foreground">
                        {oem.productNames[cap] ?? meta.label}
                        {cap === 'ev' && oemId === 'tesla' && (
                          <span className="ml-2 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                            Tesla EVs only
                          </span>
                        )}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-all ${
                          isChecked
                            ? 'bg-primary border-primary'
                            : 'border-white/25 bg-transparent'
                        }`}
                      >
                        {isChecked && (
                          <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Wallbox-without-Tesla advisory */}
        {wallboxNoTesla && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-amber-500/8 border border-amber-500/25 flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-100/85 leading-relaxed">
              Wallbox pairs best with Tesla today. We'll still connect it — just
              know that Tesla is the only EV brand Deason can verify right now.
            </p>
          </motion.div>
        )}
      </section>

      {/* Sticky bottom CTA */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/0.35)] disabled:opacity-40 disabled:shadow-none"
        >
          {conflicts.length > 0
            ? `Pick your ${conflicts.map((c) => CAPABILITY_META[c].label.toLowerCase()).join(' & ')} app above`
            : canContinue
              ? `Connect ${totalDevices} device${totalDevices === 1 ? '' : 's'}`
              : 'Check at least one device'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
