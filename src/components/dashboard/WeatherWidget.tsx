import { useWeather, getWeatherDescription } from '@/hooks/useWeather';
import { MapPin, Loader2, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function WeatherIcon({ code, isDay, className }: { code: number; isDay: boolean; className?: string }) {
  if (code === 0) return isDay ? <Sun className={className} /> : <Moon className={className} />;
  if (code <= 2) return isDay ? <CloudSun className={className} /> : <Cloud className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code <= 48) return <CloudFog className={className} />;
  if (code <= 55) return <CloudDrizzle className={className} />;
  if (code <= 65) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code <= 82) return <CloudRain className={className} />;
  if (code <= 86) return <CloudSnow className={className} />;
  return <CloudLightning className={className} />;
}

export function WeatherWidget() {
  const { weather, isLoading, error } = useWeather();

  if (error || (!isLoading && !weather)) return null;

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
        </motion.div>
      ) : weather ? (
        <motion.div
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span className="font-medium text-foreground/80">{weather.temperature}°F</span>
          <span className="hidden sm:flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            <span className="max-w-[60px] truncate">{weather.cityName}</span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
