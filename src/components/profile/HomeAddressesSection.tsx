/**
 * HomeAddressesSection — Profile UI for multiple home locations.
 *
 * Supports a clean "move day" flow: add a new home (drop pin or use current
 * GPS), mark it primary, archive the old one. Backed by `user_home_locations`.
 *
 * Calm by default — no audio, minimal animation.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Plus, Star, Archive, Loader2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import {
  useHomeLocations,
  useAddHomeLocation,
  useSetPrimaryHomeLocation,
  useArchiveHomeLocation,
} from '@/hooks/useHomeLocations';

export function HomeAddressesSection() {
  const { data: locations = [], isLoading } = useHomeLocations();
  const addMut = useAddHomeLocation();
  const setPrimaryMut = useSetPrimaryHomeLocation();
  const archiveMut = useArchiveHomeLocation();

  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not available on this device');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        toast.error(`Location error: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleAdd = async () => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!label.trim() || Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      toast.error('Label and valid lat/lon required');
      return;
    }
    try {
      const hasPrimary = locations.some((l) => l.is_primary && l.is_active);
      await addMut.mutateAsync({
        label: label.trim(),
        lat: latNum,
        lon: lonNum,
        setPrimary: !hasPrimary, // first home auto-primary
      });
      toast.success('Home added');
      setLabel('');
      setLat('');
      setLon('');
      setShowAdd(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.27 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Home Addresses</CardTitle>
              <CardDescription>
                Add multiple homes (e.g. old + new during a move). Charging at any saved home is
                tagged as Home; everywhere else is AC away — kWh still counts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : locations.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No homes saved yet. Add your first home so charging sessions can be tagged.
            </p>
          ) : (
            <ul className="space-y-2">
              {locations.map((loc) => (
                <li
                  key={loc.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    loc.is_active ? 'border-border bg-card/50' : 'border-border/30 bg-muted/20 opacity-60'
                  }`}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{loc.label}</span>
                      {loc.is_primary && loc.is_active && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Star className="h-3 w-3" /> Primary
                        </Badge>
                      )}
                      {!loc.is_active && (
                        <Badge variant="outline" className="text-[10px]">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)} · {loc.radius_m}m
                    </div>
                  </div>
                  {loc.is_active && !loc.is_primary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPrimaryMut.mutate(loc.id)}
                      disabled={setPrimaryMut.isPending}
                      className="h-7 px-2 text-xs"
                    >
                      Make primary
                    </Button>
                  )}
                  {loc.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveMut.mutate(loc.id)}
                      disabled={archiveMut.isPending}
                      className="h-7 w-7 p-0"
                      aria-label="Archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!showAdd ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(true)}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" /> Add home
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-card/30">
              <Input
                placeholder="Label (e.g. New House, Lake Cabin)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputMode="decimal"
                />
                <Input
                  placeholder="Longitude"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useCurrentLocation}
                  disabled={gpsLoading}
                  className="flex-1 gap-2"
                >
                  {gpsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  Use current location
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={addMut.isPending}
                  className="flex-1"
                >
                  {addMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save home'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAdd(false);
                    setLabel('');
                    setLat('');
                    setLon('');
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: use the location of the wall outlet, not the street address. We match within
                a 150 m radius.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
