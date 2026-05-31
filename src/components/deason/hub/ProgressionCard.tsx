import { Flame, Trophy, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Progression } from "@/hooks/useDeasonHub";

const POINTS_PER_LEVEL = 500;

export function ProgressionCard({ progression }: { progression: Progression | null }) {
  const level = progression?.level ?? 1;
  const points = progression?.points ?? 0;
  const inLevel = points % POINTS_PER_LEVEL;
  const pct = Math.round((inLevel / POINTS_PER_LEVEL) * 100);
  const months = progression?.months_completed ?? 0;
  const streak = progression?.streak_months ?? 0;
  const totalSaved = Math.round(Number(progression?.total_saved_usd ?? 0));

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-amber-500/80">Clean Energy Level</div>
          <div className="mt-0.5 text-2xl font-bold">Level {level}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
          <Trophy className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-3">
        <Progress value={pct} className="h-2 bg-amber-500/10" />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{inLevel} / {POINTS_PER_LEVEL} pts</span>
          <span>Next: Level {level + 1}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat icon={<DollarSign className="h-3.5 w-3.5" />} label="Saved" value={`$${totalSaved}`} />
        <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={`${streak} mo`} />
        <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Reports" value={String(months)} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/60 px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
