import { Cloud, Sun } from "lucide-react";
import type { WeatherState } from "@/hooks/useDeasonHub";

export function WeatherOutlookCard({ weather }: { weather: WeatherState }) {
  if (weather.status === "placeholder") {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cloud className="h-4 w-4 text-amber-500" />
          Weather forecast coming soon
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {weather.message ?? "Soon Deason will use your local 3-day forecast to recommend the best days for EV charging, battery cycling, and pre-cooling."}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sun className="h-4 w-4 text-amber-500" /> Weather outlook
      </div>
      {weather.today && (
        <div className="mt-2 text-lg font-bold">
          {Math.round(weather.today.temp)}°F · {weather.today.condition}
        </div>
      )}
      {weather.threeDay && weather.threeDay.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {weather.threeDay.map((d) => (
            <div key={d.date} className="rounded-lg bg-background px-2 py-2">
              <div className="text-[10px] uppercase text-muted-foreground">
                {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="mt-0.5 text-xs font-semibold">{Math.round(d.tempMax)}°</div>
              <div className="text-[10px] text-muted-foreground">{Math.round(d.tempMin)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
