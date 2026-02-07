import { useWeather, getWeatherEmoji, getWeatherDescription } from '@/hooks/useWeather';
import { MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WeatherWidget() {
  const { weather, isLoading, error } = useWeather();

  if (error || (!isLoading && !weather)) return null;

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Loading weather...</span>
        </motion.div>
      ) : weather ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 px-3 py-1.5"
        >
          <span className="text-base leading-none">
            {getWeatherEmoji(weather.weatherCode, weather.isDay)}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {weather.temperature}°F
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {getWeatherDescription(weather.weatherCode)}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
            <MapPin className="h-2.5 w-2.5" />
            <span className="max-w-[80px] truncate">{weather.cityName}</span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
