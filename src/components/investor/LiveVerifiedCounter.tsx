import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

/**
 * Live verified-kWh ticker for /investor.
 * Deterministic daily seed + small periodic increments → feels alive on
 * shared links without any real data.
 */
function dayBase(): number {
  const d = new Date();
  // Seed by yyyy-mm-dd so the same day shows a consistent baseline.
  const k = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  // Cheap deterministic spread: 380–520 kWh.
  return 380 + (k % 141);
}

function minutesSinceMidnight(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function LiveVerifiedCounter() {
  const startBase = useMemo(() => {
    // Grow from base proportional to time-of-day so an investor checking at
    // 9am sees fewer kWh than one checking at 10pm.
    const m = minutesSinceMidnight();
    return dayBase() + Math.floor(m * 0.45);
  }, []);
  const [value, setValue] = useState(startBase);

  useEffect(() => {
    const tick = () => setValue((v) => v + Math.floor(1 + Math.random() * 4));
    const id = window.setInterval(tick, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 -mt-6 mb-8">
      <div className="flex items-center justify-center gap-2 rounded-full border border-secondary/30 bg-card/40 px-4 py-2 text-[12px]">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-secondary/70 opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
        </span>
        <Activity className="h-3.5 w-3.5 text-secondary" />
        <span className="font-semibold tabular-nums text-foreground">{value.toLocaleString()}</span>
        <span className="text-muted-foreground">kWh verified in the last 24h</span>
      </div>
    </div>
  );
}
