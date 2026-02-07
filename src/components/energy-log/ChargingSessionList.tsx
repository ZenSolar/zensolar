import { format, parseISO } from 'date-fns';
import { MapPin, Zap, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ChargingSession } from '@/hooks/useChargingSessions';

interface ChargingSessionListProps {
  sessions: ChargingSession[];
}

export function ChargingSessionList({ sessions }: ChargingSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No charging sessions this month.</p>
      </div>
    );
  }

  // Group sessions by date
  const grouped = new Map<string, ChargingSession[]>();
  for (const s of sessions) {
    const key = s.session_date;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
        Charging Sessions · {sessions.length} total
      </p>
      {[...grouped.entries()].map(([dateStr, daySessions]) => (
        <div key={dateStr}>
          <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">
            {format(parseISO(dateStr), 'EEE, MMM d')}
          </p>
          <Card className="bg-card border-border/50">
            <CardContent className="px-3 py-1 divide-y divide-border/40">
              {daySessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {session.location && (
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {session.energy_kwh.toFixed(1)} kWh
                      </span>
                      {session.fee_amount != null && session.fee_amount > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {session.fee_currency === 'USD' ? '$' : ''}{session.fee_amount.toFixed(2)}
                        </span>
                      )}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {session.charging_type === 'home' ? '🏠 Home' : '⚡ Supercharger'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground ml-3">
                    {session.energy_kwh.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
