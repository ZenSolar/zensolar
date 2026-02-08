import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Home, Zap, MapPin, ShieldCheck, Plug, Clock, DollarSign, ChevronRight } from 'lucide-react';
import type { ChargingSession } from '@/hooks/useChargingSessions';

interface ChargingSessionListProps {
  sessions: ChargingSession[];
}

type SessionCategory = 'home' | 'supercharger' | 'destination';

function categorize(session: ChargingSession): SessionCategory {
  if (session.charging_type === 'home') return 'home';
  if (session.charging_type === 'other_ac') return 'destination';
  return 'supercharger';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getSessionDuration(session: ChargingSession): string | null {
  const meta = session.session_metadata as Record<string, any> | null;
  const startTime = meta?.start_time || meta?.chargeStartDateTime;
  const endTime = meta?.end_time || meta?.chargeStopDateTime;
  if (!startTime || !endTime) return null;
  try {
    const mins = differenceInMinutes(new Date(endTime), new Date(startTime));
    return mins > 0 ? formatDuration(mins) : null;
  } catch { return null; }
}

function getSessionTime(session: ChargingSession): string | null {
  const meta = session.session_metadata as Record<string, any> | null;
  const startTime = meta?.start_time || meta?.chargeStartDateTime;
  if (!startTime) return null;
  try {
    return format(new Date(startTime), 'h:mm a');
  } catch { return null; }
}

const CATEGORY_CONFIG: Record<SessionCategory, {
  label: string;
  icon: React.ReactNode;
  dotClass: string;
}> = {
  home: {
    label: 'Home Charging',
    icon: <Home className="h-3.5 w-3.5" />,
    dotClass: 'bg-emerald-500',
  },
  supercharger: {
    label: 'Tesla Supercharger',
    icon: <Zap className="h-3.5 w-3.5" />,
    dotClass: 'bg-red-500',
  },
  destination: {
    label: 'Destination',
    icon: <Plug className="h-3.5 w-3.5" />,
    dotClass: 'bg-blue-500',
  },
};

function SessionRow({ session }: { session: ChargingSession }) {
  const isVerified = (session.session_metadata as any)?.source === 'charge_monitor';
  const duration = getSessionDuration(session);
  const time = getSessionTime(session);
  const category = categorize(session);
  const config = CATEGORY_CONFIG[category];
  const kwh = Number(session.energy_kwh).toFixed(1);
  const hasFee = session.fee_amount != null && session.fee_amount > 0;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Dot indicator */}
      <div className="pt-1.5">
        <div className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {session.location || (category === 'home' ? 'Home' : 'Unknown')}
            {isVerified && (
              <ShieldCheck className="inline h-3.5 w-3.5 text-emerald-500 ml-1 -mt-0.5" />
            )}
          </p>
          <span className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
            {kwh} kWh
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {time && <span>{time}</span>}
          {time && duration && <span>·</span>}
          {duration && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
          {(time || duration) && hasFee && <span>·</span>}
          {hasFee && (
            <span className="font-medium text-foreground/70">
              ${Number(session.fee_amount).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryGroup({
  category,
  sessions,
}: {
  category: SessionCategory;
  sessions: ChargingSession[];
}) {
  if (sessions.length === 0) return null;

  const config = CATEGORY_CONFIG[category];
  const totalKwh = sessions.reduce((sum, s) => sum + Number(s.energy_kwh || 0), 0);
  const totalCost = sessions.reduce((sum, s) => sum + Number(s.fee_amount || 0), 0);

  // Group by date
  const grouped = new Map<string, ChargingSession[]>();
  for (const s of sessions) {
    const key = s.session_date;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div className="space-y-1">
      {/* Category header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center h-6 w-6 rounded-md bg-muted/50`}>
            <span className="text-muted-foreground">{config.icon}</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{totalKwh.toFixed(1)} kWh</span>
          {totalCost > 0 && (
            <>
              <span>·</span>
              <span className="tabular-nums">${totalCost.toFixed(2)}</span>
            </>
          )}
        </div>
      </div>

      {/* Sessions grouped by date */}
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
        {[...grouped.entries()].map(([dateStr, daySessions], i) => (
          <div key={dateStr}>
            {i > 0 && <div className="border-t border-border/30 mx-3" />}
            <div className="px-3">
              <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider pt-2.5 pb-0.5">
                {format(parseISO(dateStr), 'EEE, MMM d')}
              </p>
              <div className="divide-y divide-border/20">
                {daySessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChargingSessionList({ sessions }: ChargingSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-6 w-6 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No charging sessions this month.</p>
      </div>
    );
  }

  const homeSessions = sessions.filter(s => categorize(s) === 'home');
  const superchargerSessions = sessions.filter(s => categorize(s) === 'supercharger');
  const destinationSessions = sessions.filter(s => categorize(s) === 'destination');

  const totalKwh = sessions.reduce((s, x) => s + Number(x.energy_kwh || 0), 0);
  const totalCost = sessions.reduce((s, x) => s + Number(x.fee_amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Overall summary bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? 's'  : ''}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground tabular-nums">{totalKwh.toFixed(1)} kWh</span>
          {totalCost > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground tabular-nums">${totalCost.toFixed(2)}</span>
            </>
          )}
        </div>
      </div>

      {/* Category sections */}
      <CategoryGroup category="home" sessions={homeSessions} />
      <CategoryGroup category="supercharger" sessions={superchargerSessions} />
      <CategoryGroup category="destination" sessions={destinationSessions} />
    </div>
  );
}
