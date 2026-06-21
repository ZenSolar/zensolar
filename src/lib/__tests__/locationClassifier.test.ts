import { describe, it, expect } from 'vitest';
import {
  classifyLocation,
  haversineMeters,
  type SavedLocation,
} from '@/lib/locationClassifier';

const HOME = { lat: 30.2672, lon: -97.7431 }; // Austin
const NEW_HOME = { lat: 30.4, lon: -97.85 }; // new house ~16 km away
const FRIEND = { lat: 32.7767, lon: -96.797 }; // Dallas

describe('locationClassifier', () => {
  it('returns away_unverified when session lat/lon missing', () => {
    expect(classifyLocation(null, null, [])).toBe('away_unverified');
    expect(classifyLocation(undefined, 1, [])).toBe('away_unverified');
  });

  it('classifies inside primary home radius as home_primary', () => {
    const saved: SavedLocation[] = [
      { ...HOME, radius_m: 150, is_primary: true, is_active: true },
    ];
    expect(classifyLocation(HOME.lat, HOME.lon, saved)).toBe('home_primary');
  });

  it('classifies inside a non-primary active home as home_secondary', () => {
    const saved: SavedLocation[] = [
      { ...HOME, radius_m: 150, is_primary: true, is_active: true },
      { ...NEW_HOME, radius_m: 200, is_primary: false, is_active: true },
    ];
    expect(classifyLocation(NEW_HOME.lat, NEW_HOME.lon, saved)).toBe('home_secondary');
  });

  it('classifies inside a known away location as away_known', () => {
    const saved: SavedLocation[] = [
      { ...HOME, radius_m: 150, is_primary: true, is_active: true },
      { ...FRIEND, radius_m: 200, is_primary: false, is_active: true, kind: 'away_known' },
    ];
    expect(classifyLocation(FRIEND.lat, FRIEND.lon, saved)).toBe('away_known');
  });

  it('falls back to away_unverified when no saved location matches', () => {
    const saved: SavedLocation[] = [
      { ...HOME, radius_m: 150, is_primary: true, is_active: true },
    ];
    expect(classifyLocation(FRIEND.lat, FRIEND.lon, saved)).toBe('away_unverified');
  });

  it('ignores archived (inactive) homes', () => {
    const saved: SavedLocation[] = [
      { ...HOME, radius_m: 150, is_primary: true, is_active: false },
    ];
    expect(classifyLocation(HOME.lat, HOME.lon, saved)).toBe('away_unverified');
  });

  it('Haversine returns ~0 for identical points', () => {
    expect(haversineMeters(HOME.lat, HOME.lon, HOME.lat, HOME.lon)).toBeLessThan(0.001);
  });
});
