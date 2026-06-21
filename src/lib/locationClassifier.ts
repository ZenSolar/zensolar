/**
 * Classifier for a charging session's `location_kind`.
 *
 * Given a session lat/lon and the user's saved home locations, returns one of:
 *   - home_primary    — inside the active primary home radius
 *   - home_secondary  — inside a non-primary but active saved home
 *   - away_known      — inside a saved location flagged as "known away" (work,
 *                       friend, temp stay) — modelled here as an active,
 *                       non-primary location with `kind: 'away_known'`.
 *   - away_unverified — anywhere else; still credited as Home & AC Charging.
 *
 * Distance is computed with the Haversine formula and compared against each
 * location's `radius_m`. Pure function — no I/O, easy to unit test.
 */

export type LocationKind =
  | 'home_primary'
  | 'home_secondary'
  | 'away_known'
  | 'away_unverified';

export interface SavedLocation {
  lat: number;
  lon: number;
  radius_m: number;
  is_primary: boolean;
  is_active: boolean;
  /** Optional explicit kind override stored in metadata; used for "Temporary stay" rows. */
  kind?: 'home' | 'away_known';
}

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function classifyLocation(
  sessionLat: number | null | undefined,
  sessionLon: number | null | undefined,
  saved: SavedLocation[],
): LocationKind {
  if (sessionLat == null || sessionLon == null) return 'away_unverified';

  const matches = saved
    .filter((s) => s.is_active)
    .map((s) => ({
      loc: s,
      distance: haversineMeters(sessionLat, sessionLon, s.lat, s.lon),
    }))
    .filter((m) => m.distance <= m.loc.radius_m)
    .sort((a, b) => a.distance - b.distance);

  if (matches.length === 0) return 'away_unverified';

  const primary = matches.find((m) => m.loc.is_primary && m.loc.kind !== 'away_known');
  if (primary) return 'home_primary';

  const home = matches.find((m) => m.loc.kind !== 'away_known');
  if (home) return 'home_secondary';

  return 'away_known';
}

export const LOCATION_KIND_LABEL: Record<LocationKind, string> = {
  home_primary: 'Home',
  home_secondary: 'Home (other)',
  away_known: 'AC away',
  away_unverified: 'AC away',
};
