import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  cityName: string;
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Light Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Hail Thunderstorm',
  99: 'Heavy Hail Thunderstorm',
};

export function getWeatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 2) return isDay ? '⛅' : '☁️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] || 'Unknown';
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        // Get user's location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 600000, // cache for 10 min
          });
        });

        const { latitude, longitude } = position.coords;

        // Fetch weather and reverse geocode in parallel
        const [weatherRes, geoRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`
          ),
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          ),
        ]);

        const weatherData = await weatherRes.json();
        const geoData = await geoRes.json();

        if (cancelled) return;

        const cityName =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.village ||
          geoData?.address?.county ||
          'Your Area';

        setWeather({
          temperature: Math.round(weatherData.current.temperature_2m),
          weatherCode: weatherData.current.weather_code,
          isDay: weatherData.current.is_day === 1,
          cityName,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof GeolocationPositionError ? 'Location access denied' : 'Weather unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if ('geolocation' in navigator) {
      fetchWeather();
    } else {
      setError('Geolocation not supported');
      setIsLoading(false);
    }

    return () => { cancelled = true; };
  }, []);

  return { weather, isLoading, error };
}
