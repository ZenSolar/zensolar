import { format, parseISO } from 'date-fns';
import { Home, Zap, MapPin, DollarSign, ShieldCheck, Plug } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

function CategorySummary({ 
  label, 
  icon, 
  sessions, 
  accentClass, 
  bgClass 
}: { 
  label: string; 
  icon: React.ReactNode; 
  sessions: ChargingSession[]; 
  accentClass: string; 
  bgClass: string;
}) {
  const totalKwh = sessions.reduce((sum, s) => sum + Number(s.energy_kwh || 0), 0);
  const totalCost = sessions.reduce((sum, s) => sum + Number(s.fee_amount || 0), 0);

  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${bgClass}`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${accentClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            {totalCost > 0 && <> · ${totalCost.toFixed(2)}</>}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums text-foreground">{totalKwh.toFixed(1)}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">kWh</p>
      </div>
    </div>
  );
}

function SessionRow({ session, category }: { session: ChargingSession; category: SessionCategory }) {
  const isVerified = (session.session_metadata as any)?.source === 'charge_monitor';

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{session.location || (category === 'home' ? 'Home' : 'Unknown')}</span>
          {isVerified && (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {Number(session.energy_kwh).toFixed(1)} kWh
          </span>
          {session.fee_amount != null && session.fee_amount > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {session.fee_currency === 'USD' ? '$' : ''}{Number(session.fee_amount).toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground ml-3">
        {Number(session.energy_kwh).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
      </span>
    </div>
  );
}

function CategorySection({ 
  label, 
  icon, 
  sessions, 
  accentClass, 
  bgClass,
  borderClass,
}: { 
  label: string; 
  icon: React.ReactNode; 
  sessions: ChargingSession[]; 
  accentClass: string; 
  bgClass: string;
  borderClass: string;
}) {
  if (sessions.length === 0) return null;

  const category = categorize(sessions[0]);

  // Group by date
  const grouped = new Map<string, ChargingSession[]>();
  for (const s of sessions) {
    const key = s.session_date;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div className="space-y-2">
      <CategorySummary 
        label={label} 
        icon={icon} 
        sessions={sessions} 
        accentClass={accentClass} 
        bgClass={bgClass} 
      />
      <Card className={`bg-card border ${borderClass}`}>
        <CardContent className="px-3 py-1">
          {[...grouped.entries()].map(([dateStr, daySessions], i) => (
            <div key={dateStr}>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider pt-2 pb-0.5 px-0.5">
                {format(parseISO(dateStr), 'EEE, MMM d')}
              </p>
              <div className="divide-y divide-border/40">
                {daySessions.map((session) => (
                  <SessionRow key={session.id} session={session} category={category} />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChargingSessionList({ sessions }: ChargingSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No charging sessions this month.</p>
      </div>
    );
  }

  const homeSessions = sessions.filter(s => categorize(s) === 'home');
  const superchargerSessions = sessions.filter(s => categorize(s) === 'supercharger');
  const destinationSessions = sessions.filter(s => categorize(s) === 'destination');

  return (
    <div className="space-y-4">
      <CategorySection
        label="Home Charging"
        icon={<Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        sessions={homeSessions}
        accentClass="bg-emerald-500/15"
        bgClass="bg-emerald-500/5 dark:bg-emerald-500/10"
        borderClass="border-emerald-500/20"
      />

      <CategorySection
        label="Supercharger"
        icon={<Zap className="h-4 w-4 text-red-500 dark:text-red-400" />}
        sessions={superchargerSessions}
        accentClass="bg-red-500/15"
        bgClass="bg-red-500/5 dark:bg-red-500/10"
        borderClass="border-red-500/20"
      />

      <CategorySection
        label="Destination Charging"
        icon={<Plug className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
        sessions={destinationSessions}
        accentClass="bg-blue-500/15"
        bgClass="bg-blue-500/5 dark:bg-blue-500/10"
        borderClass="border-blue-500/20"
      />

      {sessions.length > 0 && (
        <p className="text-[10px] text-center text-muted-foreground pt-1">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {sessions.reduce((s, x) => s + Number(x.energy_kwh || 0), 0).toFixed(1)} kWh total
        </p>
      )}
    </div>
  );
}
