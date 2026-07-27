import { Button } from '@/components/ui/button';

const CONSEQUENCE: Record<string, string> = {
  vehicle_device_data: "Without this we can't read your miles or FSD miles.",
  vehicle_location: "Without this we can't tell home charging apart from Supercharging.",
  vehicle_charging_cmds: "Without this we can't count your charging sessions or kWh added.",
  energy_device_data: "Without this we can't read your solar production or Powerwall.",
  offline_access: "Without this you'll be silently disconnected in a few hours.",
  openid: "Without this we can't finish signing in your Tesla account.",
};

const LABEL: Record<string, string> = {
  vehicle_device_data: 'Vehicle Information',
  vehicle_location: 'Vehicle Location',
  vehicle_charging_cmds: 'Vehicle Charging Management',
  energy_device_data: 'Energy Product Information',
  offline_access: 'Offline access (refresh)',
  openid: 'Sign-in identity',
};

interface Props {
  missingScopes: string[];
  blockingScopes: string[];
  onReauthorize: () => void;
  onContinueDegraded?: () => void;
  /** When false, suppresses the energy_device_data consequence for users with no solar/battery. */
  hasEnergy?: boolean;
  /** Number of times Tesla returned no refresh_token. After 2+, expose an escape route. */
  noRefreshTokenAttempts?: number;
  /** Fired when the user takes the escape route after repeated failures. */
  onSkip?: () => void;
}

export function TeslaScopeRecovery({
  missingScopes,
  blockingScopes,
  onReauthorize,
  onContinueDegraded,
  hasEnergy = true,
  noRefreshTokenAttempts = 0,
  onSkip,
}: Props) {
  const visibleScopes = hasEnergy
    ? missingScopes
    : missingScopes.filter((s) => s !== 'energy_device_data');
  const isBlocking = blockingScopes.length > 0;
  const showEscape = noRefreshTokenAttempts >= 2 && !!onSkip;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">
        {isBlocking ? "We can't continue without this permission" : "You'll be missing some data"}
      </h1>
      <p className="text-[15px] text-muted-foreground mb-5 leading-relaxed">
        {isBlocking
          ? 'Tesla didn\'t grant a required permission. Re-authorize and leave every box checked so ZenSolar can reward you correctly.'
          : "Tesla didn't grant every permission we asked for. You can add the missing ones now or continue with limited data."}
      </p>

      <ul className="space-y-2 mb-6">
        {visibleScopes.map((scope) => (
          <li
            key={scope}
            className={`rounded-2xl border px-4 py-3 ${
              blockingScopes.includes(scope)
                ? 'border-red-400/30 bg-red-500/10'
                : 'border-amber-400/30 bg-amber-500/10'
            }`}
          >
            <p className="text-[13px] font-semibold uppercase tracking-wide mb-1">
              {LABEL[scope] ?? scope}
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {CONSEQUENCE[scope] ?? `Missing permission: ${scope}`}
            </p>
          </li>
        ))}
      </ul>

      {showEscape && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 mb-4 text-[13px] text-amber-100/85 leading-relaxed">
          Tesla keeps sending us back without a persistent connection. You can skip Tesla for now
          and add it later from your account settings.
        </div>
      )}

      <Button size="lg" className="w-full mb-3" onClick={onReauthorize}>
        {showEscape ? 'Try Tesla one more time' : 'Add this permission on Tesla'}
      </Button>
      {!isBlocking && onContinueDegraded && (
        <button
          type="button"
          className="text-sm text-muted-foreground underline w-full text-center"
          onClick={onContinueDegraded}
        >
          Continue without it
        </button>
      )}
      {showEscape && onSkip && (
        <button
          type="button"
          className="text-sm text-muted-foreground underline w-full text-center mt-2"
          onClick={onSkip}
        >
          Skip Tesla for now
        </button>
      )}
    </div>
  );
}
