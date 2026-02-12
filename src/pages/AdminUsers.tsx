import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { usePresence } from '@/hooks/usePresence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Users, RefreshCw, Zap, Bell, Award, Coins, ChevronDown, ChevronUp,
  Sun, Battery, Car, Plug, Trash2, Search, Circle, Clock, LogIn, Eye, ArrowUpDown,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AdminSkeleton } from '@/components/ui/loading-skeleton';
import zenIconOnly from '@/assets/zen-icon-only.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OnboardingFunnelCard } from '@/components/admin/OnboardingFunnelCard';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileWithEmail {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  wallet_address: string | null;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
  facebook_connected: boolean;
  instagram_connected: boolean;
  tiktok_connected: boolean;
  twitter_connected: boolean;
  linkedin_connected: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  last_login_at: string | null;
  login_count: number;
}

interface AuthUserInfo {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

interface UserDevice {
  id: string;
  device_type: string;
  device_name: string | null;
  provider: string;
  baseline_data: {
    odometer?: number;
    total_charge_energy_added_kwh?: number;
    total_energy_discharged_wh?: number;
    total_solar_produced_wh?: number;
  } | null;
  lifetime_totals: {
    odometer?: number;
    charging_kwh?: number;
    lifetime_charging_kwh?: number;
    solar_wh?: number;
    lifetime_solar_wh?: number;
    battery_discharge_wh?: number;
    wall_connector_wh?: number;
    updated_at?: string;
  } | null;
}

interface MintRecord {
  id: string;
  reward_type: string;
  tokens_earned: number;
  energy_wh_basis: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

interface UserKPIs {
  user_id: string;
  device_count: number;
  devices: UserDevice[];
  total_production_kwh: number;
  total_consumption_kwh: number;
  total_ev_miles: number;
  total_charging_kwh: number;
  total_battery_discharged_kwh: number;
  total_tokens_earned: number;
  total_tokens_claimed: number;
  total_tokens_pending: number;
  mint_records: MintRecord[];
  nfts_earned: string[];
}

// ─── NFT Thresholds ─────────────────────────────────────────────────────────

const SOLAR_THRESHOLDS = [
  { name: 'SunSpark', threshold: 100 }, { name: 'Photonic', threshold: 500 },
  { name: 'RayForge', threshold: 1000 }, { name: 'Solaris', threshold: 2500 },
  { name: 'Helios', threshold: 5000 }, { name: 'SunForge', threshold: 10000 },
  { name: 'GigaSun', threshold: 25000 }, { name: 'StarForge', threshold: 50000 },
];
const EV_MILES_THRESHOLDS = [
  { name: 'Ignitor', threshold: 100 }, { name: 'Velocity', threshold: 500 },
  { name: 'Autobahn', threshold: 1000 }, { name: 'HyperDrive', threshold: 2500 },
  { name: 'Electra', threshold: 5000 }, { name: 'Velocity Pro', threshold: 10000 },
  { name: 'Mach One', threshold: 25000 }, { name: 'Centaurion', threshold: 50000 },
  { name: 'Voyager', threshold: 100000 }, { name: 'Odyssey', threshold: 250000 },
];
const BATTERY_THRESHOLDS = [
  { name: 'VoltBank', threshold: 100 }, { name: 'GridPulse', threshold: 500 },
  { name: 'MegaCell', threshold: 1000 }, { name: 'ReserveX', threshold: 2500 },
  { name: 'DynaMax', threshold: 5000 }, { name: 'UltraCell', threshold: 10000 },
  { name: 'GigaVolt', threshold: 25000 },
];
const CHARGING_THRESHOLDS = [
  { name: 'Ignite', threshold: 100 }, { name: 'VoltCharge', threshold: 500 },
  { name: 'KiloVolt', threshold: 1000 }, { name: 'AmpForge', threshold: 2500 },
  { name: 'ChargeOn', threshold: 5000 }, { name: 'GigaCharge', threshold: 10000 },
  { name: 'MegaCharge', threshold: 25000 }, { name: 'TeraCharge', threshold: 50000 },
];

interface EnergyData {
  productionKwh: number;
  evMiles: number;
  chargingKwh: number;
  batteryDischargedKwh: number;
}

function calculateEarnedNFTs(data: EnergyData): string[] {
  const earned: string[] = ['Welcome'];
  SOLAR_THRESHOLDS.forEach(t => { if (data.productionKwh >= t.threshold) earned.push(`Solar: ${t.name}`); });
  EV_MILES_THRESHOLDS.forEach(t => { if (data.evMiles >= t.threshold) earned.push(`EV: ${t.name}`); });
  CHARGING_THRESHOLDS.forEach(t => { if (data.chargingKwh >= t.threshold) earned.push(`Charging: ${t.name}`); });
  BATTERY_THRESHOLDS.forEach(t => { if (data.batteryDischargedKwh >= t.threshold) earned.push(`Battery: ${t.name}`); });
  return earned;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatAddress(address: string | null): string {
  if (!address) return '—';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function getRewardTypeIcon(type: string) {
  switch (type) {
    case 'solar': case 'production': return <Sun className="h-3 w-3" />;
    case 'battery': return <Battery className="h-3 w-3" />;
    case 'ev_miles': return <Car className="h-3 w-3" />;
    case 'charging': return <Plug className="h-3 w-3" />;
    default: return <Coins className="h-3 w-3" />;
  }
}

function getRewardTypeLabel(type: string) {
  switch (type) {
    case 'solar': case 'production': return 'Solar';
    case 'battery': return 'Battery';
    case 'ev_miles': return 'EV Miles';
    case 'charging': return 'Charging';
    case 'referral': return 'Referral';
    default: return type;
  }
}

// ─── Presence Indicator ─────────────────────────────────────────────────────

function PresenceIndicator({ isOnline, lastSeenAt }: { isOnline: boolean; lastSeenAt: string | null }) {
  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Online</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Circle className="h-2.5 w-2.5 fill-muted-foreground/40 text-muted-foreground/40" />
      <span className="text-xs text-muted-foreground">{timeAgo(lastSeenAt)}</span>
    </div>
  );
}

// ─── User Row Props ─────────────────────────────────────────────────────────

interface UserRowProps {
  profile: ProfileWithEmail;
  kpi: UserKPIs | undefined;
  hasPush: boolean;
  isOnline: boolean;
  onDelete: (userId: string, displayName: string | null) => void;
  isDeleting: boolean;
  onViewAs: (userId: string) => void;
}

// ─── Mobile User Card ───────────────────────────────────────────────────────

function UserCard({ profile, kpi, hasPush, isOnline, onDelete, isDeleting, onViewAs }: UserRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const connectedProviders = [
    profile.tesla_connected && 'Tesla',
    profile.enphase_connected && 'Enphase',
    profile.solaredge_connected && 'SolarEdge',
    profile.wallbox_connected && 'Wallbox',
  ].filter(Boolean);

  return (
    <Card className="mb-3">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{profile.display_name || profile.email || 'Anonymous'}</span>
                  </div>
                  {profile.email && <div className="text-xs text-muted-foreground truncate">{profile.email}</div>}
                  <PresenceIndicator isOnline={isOnline} lastSeenAt={profile.last_seen_at} />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {kpi && kpi.nfts_earned.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    {kpi.nfts_earned.length}
                  </Badge>
                )}
                {hasPush ? (
                  <Badge variant="default" className="bg-green-600 text-xs px-1.5"><Bell className="h-3 w-3" /></Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-1.5">Off</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {connectedProviders.map((provider) => (
                <Badge key={provider as string} variant="outline" className="text-xs">{provider}</Badge>
              ))}
              {connectedProviders.length === 0 && <span className="text-xs text-muted-foreground">No energy accounts</span>}
              <span className="text-muted-foreground mx-1">•</span>
              <span className="text-xs text-muted-foreground">{kpi?.device_count || 0} device{(kpi?.device_count || 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <UserExpandedContent profile={profile} kpi={kpi} onDelete={onDelete} isDeleting={isDeleting} onViewAs={onViewAs} />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── Desktop User Row ───────────────────────────────────────────────────────

function UserRow({ profile, kpi, hasPush, isOnline, onDelete, isDeleting, onViewAs }: UserRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell className="w-10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2.5">
            <Circle className={`h-2.5 w-2.5 shrink-0 ${isOnline ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-muted-foreground/30 text-muted-foreground/30'}`} />
            <div>
              <div className="truncate max-w-[180px]">{profile.display_name || profile.email || 'Anonymous'}</div>
              {profile.email && <div className="text-xs text-muted-foreground truncate max-w-[180px]">{profile.email}</div>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-xs text-muted-foreground">{timeAgo(profile.last_seen_at)}</div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1 flex-wrap max-w-[150px]">
            {profile.tesla_connected && <Badge variant="outline" className="text-xs">Tesla</Badge>}
            {profile.enphase_connected && <Badge variant="outline" className="text-xs">Enphase</Badge>}
            {profile.solaredge_connected && <Badge variant="outline" className="text-xs">SolarEdge</Badge>}
            {profile.wallbox_connected && <Badge variant="outline" className="text-xs">Wallbox</Badge>}
            {!profile.tesla_connected && !profile.enphase_connected && !profile.solaredge_connected && !profile.wallbox_connected && (
              <span className="text-muted-foreground text-xs">None</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={kpi?.device_count ? 'default' : 'secondary'} className="min-w-[32px]">
            {kpi?.device_count || 0}
          </Badge>
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">
          {kpi && kpi.total_production_kwh > 0 ? (
            <span className="font-medium text-primary">{formatNumber(kpi.total_production_kwh)} kWh</span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          {kpi && kpi.total_tokens_earned > 0 ? (
            <span className="font-medium text-amber-500">{formatNumber(kpi.total_tokens_earned)}</span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {kpi && kpi.nfts_earned.length > 0 ? (
            <Badge variant="secondary" className="gap-1"><Award className="h-3 w-3" />{kpi.nfts_earned.length}</Badge>
          ) : (
            <Badge variant="secondary">0</Badge>
          )}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-0.5">
            {hasPush ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700"><Bell className="h-3 w-3" /></Badge>
            ) : (
              <Badge variant="secondary">Off</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(profile.created_at)}</div>
          {profile.login_count > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <LogIn className="h-3 w-3" />
              {profile.login_count} logins
            </div>
          )}
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={10} className="p-0">
            <UserExpandedContent profile={profile} kpi={kpi} onDelete={onDelete} isDeleting={isDeleting} onViewAs={onViewAs} />
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Shared Expanded Content ────────────────────────────────────────────────

function UserExpandedContent({
  profile, kpi, onDelete, isDeleting, onViewAs,
}: {
  profile: ProfileWithEmail;
  kpi: UserKPIs | undefined;
  onDelete: (userId: string, displayName: string | null) => void;
  isDeleting: boolean;
  onViewAs: (userId: string) => void;
}) {
  return (
    <div className="p-4 space-y-4 border-t">
      {/* Engagement Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Clock className="h-3 w-3" />
            Last Seen
          </div>
          <div className="text-sm font-medium">{timeAgo(profile.last_seen_at)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <LogIn className="h-3 w-3" />
            Last Login
          </div>
          <div className="text-sm font-medium">{timeAgo(profile.last_login_at)}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <LogIn className="h-3 w-3" />
            Total Logins
          </div>
          <div className="text-sm font-medium">{profile.login_count}</div>
        </div>
      </div>

      {/* Energy Activity Summary */}
      {kpi && (kpi.total_ev_miles > 0 || kpi.total_charging_kwh > 0 || kpi.total_production_kwh > 0 || kpi.total_battery_discharged_kwh > 0) && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Energy Activity
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpi.total_production_kwh > 0 && (
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Sun className="h-3 w-3" />Solar</div>
                <div className="font-semibold text-primary">{formatNumber(kpi.total_production_kwh)} kWh</div>
              </div>
            )}
            {kpi.total_ev_miles > 0 && (
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Car className="h-3 w-3" />EV Miles</div>
                <div className="font-semibold text-secondary">{formatNumber(kpi.total_ev_miles)} mi</div>
              </div>
            )}
            {kpi.total_charging_kwh > 0 && (
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Plug className="h-3 w-3" />Charging</div>
                <div className="font-semibold">{formatNumber(kpi.total_charging_kwh)} kWh</div>
              </div>
            )}
            {kpi.total_battery_discharged_kwh > 0 && (
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Battery className="h-3 w-3" />Battery</div>
                <div className="font-semibold text-amber-500">{formatNumber(kpi.total_battery_discharged_kwh)} kWh</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Devices */}
      {kpi && kpi.devices.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />Connected Devices ({kpi.devices.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {kpi.devices.map((device) => {
              const odometer = device.lifetime_totals?.odometer ?? device.baseline_data?.odometer;
              return (
                <Badge key={device.id} variant="outline" className="text-xs">
                  {device.provider}: {device.device_name || device.device_type}
                  {odometer && ` (${formatNumber(odometer)} mi)`}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* NFTs Earned */}
      {kpi && kpi.nfts_earned.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />NFTs Earned ({kpi.nfts_earned.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {kpi.nfts_earned.map((nft, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">{nft}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mint History */}
      {kpi && kpi.mint_records.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />Token History ({kpi.mint_records.length})
          </h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Tokens</TableHead>
                  <TableHead className="text-xs text-right">Energy (kWh)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpi.mint_records.slice(0, 10).map((record) => (
                  <TableRow key={record.id} className="text-xs">
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">{getRewardTypeIcon(record.reward_type)}{getRewardTypeLabel(record.reward_type)}</div>
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium text-amber-500">+{formatNumber(record.tokens_earned)}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground">
                      {record.energy_wh_basis > 0 ? `${(record.energy_wh_basis / 1000).toFixed(1)}` : '—'}
                    </TableCell>
                    <TableCell className="py-2">
                      {record.claimed ? (
                        <Badge variant="default" className="text-xs bg-green-600">Claimed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{formatDate(record.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {kpi.mint_records.length > 10 && (
              <p className="text-xs text-muted-foreground mt-2">Showing 10 of {kpi.mint_records.length} records</p>
            )}
          </div>
        </div>
      )}

      {/* Wallet & Tokens */}
      <div className="flex items-center justify-between text-sm pt-2 border-t">
        <div>
          <span className="text-muted-foreground">Wallet: </span>
          <span className="font-mono text-xs">{formatAddress(profile.wallet_address)}</span>
        </div>
        {kpi && kpi.total_tokens_earned > 0 && (
          <div className="text-amber-500 font-medium">{formatNumber(kpi.total_tokens_earned)} tokens</div>
        )}
      </div>

      {(!kpi || (kpi.devices.length === 0 && kpi.nfts_earned.length === 0 && kpi.mint_records.length === 0)) && (
        <p className="text-sm text-muted-foreground">No activity data available for this user.</p>
      )}

      {/* Actions */}
      <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => onViewAs(profile.user_id)}>
          <Eye className="h-4 w-4" />
          View as User
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2" disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />Delete User
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{profile.display_name || profile.email || 'this user'}</strong>?
                This will permanently remove their account, all connected devices, energy data, tokens, and NFT records.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(profile.user_id, profile.display_name || profile.email)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const { onlineUsers } = usePresence();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [userKPIs, setUserKPIs] = useState<Map<string, UserKPIs>>(new Map());
  const [pushStatuses, setPushStatuses] = useState<Map<string, boolean>>(new Map());
  const [aggregateKPIs, setAggregateKPIs] = useState({
    totalUsers: 0, usersWithEnergy: 0, totalDevices: 0,
    totalProductionKwh: 0, totalTokensEarned: 0, totalNFTs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<string>('joined_desc');

  // Build online user set for O(1) lookup
  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.map(u => u.user_id)),
    [onlineUsers]
  );

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let result = profiles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.display_name?.toLowerCase().includes(q)) ||
        (p.email?.toLowerCase().includes(q)) ||
        (p.wallet_address?.toLowerCase().includes(q)) ||
        p.user_id.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'last_seen_desc':
        sorted.sort((a, b) => {
          if (!a.last_seen_at && !b.last_seen_at) return 0;
          if (!a.last_seen_at) return 1;
          if (!b.last_seen_at) return -1;
          return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
        });
        break;
      case 'last_seen_asc':
        sorted.sort((a, b) => {
          if (!a.last_seen_at && !b.last_seen_at) return 0;
          if (!a.last_seen_at) return 1;
          if (!b.last_seen_at) return -1;
          return new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime();
        });
        break;
      case 'logins_desc':
        sorted.sort((a, b) => b.login_count - a.login_count);
        break;
      case 'logins_asc':
        sorted.sort((a, b) => a.login_count - b.login_count);
        break;
      case 'joined_asc':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'joined_desc':
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return sorted;
  }, [profiles, searchQuery, sortBy]);

  const onlineCount = onlineUsers.length;

  const handleViewAs = (userId: string) => {
    navigate(`/admin/view-as-user?userId=${userId}`);
  };

  const handleDeleteUser = async (userId: string, displayName: string | null) => {
    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });
      if (error) { toast.error('Failed to delete user'); return; }
      if (data?.success) {
        toast.success(`Successfully deleted ${displayName || 'user'}`);
        setProfiles(prev => prev.filter(p => p.user_id !== userId));
        setUserKPIs(prev => { const m = new Map(prev); m.delete(userId); return m; });
        setPushStatuses(prev => { const m = new Map(prev); m.delete(userId); return m; });
        setAggregateKPIs(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } else {
        toast.error(data?.error || 'Failed to delete user');
      }
    } catch { toast.error('An error occurred while deleting the user'); }
    finally { setIsDeletingUser(false); }
  };

  const fetchProfiles = async () => {
    const [profilesResult, authUsersResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.functions.invoke<{ success: boolean; users: AuthUserInfo[] }>('admin-users'),
    ]);

    if (profilesResult.error) { toast.error('Failed to fetch user profiles'); return; }

    const emailMap = new Map<string, { email: string; authDisplayName: string | null }>();
    if (!authUsersResult.error && authUsersResult.data?.users) {
      authUsersResult.data.users.forEach(u => {
        emailMap.set(u.id, { email: u.email, authDisplayName: u.display_name });
      });
    }

    const profilesWithEmails: ProfileWithEmail[] = (profilesResult.data || []).map(p => ({
      ...p,
      email: emailMap.get(p.user_id)?.email || null,
      display_name: p.display_name || emailMap.get(p.user_id)?.authDisplayName || null,
      last_seen_at: (p as any).last_seen_at ?? null,
      last_login_at: (p as any).last_login_at ?? null,
      login_count: (p as any).login_count ?? 0,
    }));

    setProfiles(profilesWithEmails);

    // Fetch KPI data in parallel
    const [pushResult, devicesResult, productionResult, rewardsResult] = await Promise.all([
      supabase.from('push_subscriptions').select('user_id'),
      supabase.from('connected_devices').select('id, user_id, provider, device_type, device_name, baseline_data, lifetime_totals'),
      supabase.from('energy_production').select('user_id, production_wh, consumption_wh'),
      supabase.from('user_rewards').select('id, user_id, reward_type, tokens_earned, energy_wh_basis, claimed, claimed_at, created_at').order('created_at', { ascending: false }),
    ]);

    if (!pushResult.error && pushResult.data) {
      const statusMap = new Map<string, boolean>();
      pushResult.data.forEach(sub => statusMap.set(sub.user_id, true));
      setPushStatuses(statusMap);
    }

    const kpiMap = new Map<string, UserKPIs>();
    profilesWithEmails.forEach(profile => {
      kpiMap.set(profile.user_id, {
        user_id: profile.user_id, device_count: 0, devices: [],
        total_production_kwh: 0, total_consumption_kwh: 0, total_ev_miles: 0,
        total_charging_kwh: 0, total_battery_discharged_kwh: 0,
        total_tokens_earned: 0, total_tokens_claimed: 0, total_tokens_pending: 0,
        mint_records: [], nfts_earned: [],
      });
    });

    if (!devicesResult.error && devicesResult.data) {
      devicesResult.data.forEach(device => {
        const existing = kpiMap.get(device.user_id);
        if (!existing) return;
        existing.device_count++;

        const baselineData = device.baseline_data as any;
        const lifetimeTotals = device.lifetime_totals as any;

        existing.devices.push({
          id: device.id, device_type: device.device_type, device_name: device.device_name,
          provider: device.provider, baseline_data: baselineData, lifetime_totals: lifetimeTotals,
        });

        if (device.device_type === 'vehicle') {
          existing.total_ev_miles += lifetimeTotals?.odometer ?? baselineData?.odometer ?? 0;
          existing.total_charging_kwh += lifetimeTotals?.charging_kwh ?? baselineData?.total_charge_energy_added_kwh ?? 0;
        }
        if (device.device_type === 'powerwall' || device.device_type === 'battery') {
          existing.total_battery_discharged_kwh += (lifetimeTotals?.battery_discharge_wh ?? baselineData?.total_energy_discharged_wh ?? 0) / 1000;
          if (lifetimeTotals?.solar_wh) existing.total_production_kwh += lifetimeTotals.solar_wh / 1000;
        }
        if (device.device_type === 'solar' || device.device_type === 'solar_system') {
          existing.total_production_kwh += (lifetimeTotals?.solar_wh ?? lifetimeTotals?.lifetime_solar_wh ?? baselineData?.total_solar_produced_wh ?? 0) / 1000;
        }
        if (device.device_type === 'home_charger' || device.device_type === 'wall_connector' || device.device_type === 'charger') {
          existing.total_charging_kwh += lifetimeTotals?.charging_kwh ?? lifetimeTotals?.lifetime_charging_kwh ?? 0;
        }
      });
    }

    if (!productionResult.error && productionResult.data) {
      productionResult.data.forEach(prod => {
        const existing = kpiMap.get(prod.user_id);
        if (existing) {
          existing.total_production_kwh += (Number(prod.production_wh) || 0) / 1000;
          existing.total_consumption_kwh += (Number(prod.consumption_wh) || 0) / 1000;
        }
      });
    }

    if (!rewardsResult.error && rewardsResult.data) {
      rewardsResult.data.forEach(reward => {
        const existing = kpiMap.get(reward.user_id);
        if (!existing) return;
        const tokens = Number(reward.tokens_earned) || 0;
        existing.total_tokens_earned += tokens;
        if (reward.claimed) existing.total_tokens_claimed += tokens;
        else existing.total_tokens_pending += tokens;
        existing.mint_records.push({
          id: reward.id, reward_type: reward.reward_type, tokens_earned: tokens,
          energy_wh_basis: Number(reward.energy_wh_basis) || 0, claimed: reward.claimed,
          claimed_at: reward.claimed_at, created_at: reward.created_at,
        });
      });
    }

    kpiMap.forEach((kpi) => {
      kpi.nfts_earned = calculateEarnedNFTs({
        productionKwh: kpi.total_production_kwh, evMiles: kpi.total_ev_miles,
        chargingKwh: kpi.total_charging_kwh, batteryDischargedKwh: kpi.total_battery_discharged_kwh,
      });
    });

    setUserKPIs(kpiMap);

    let totalDevices = 0, totalProductionKwh = 0, totalTokensEarned = 0, totalNFTs = 0, usersWithEnergy = 0;
    kpiMap.forEach((kpi) => {
      totalDevices += kpi.device_count;
      totalProductionKwh += kpi.total_production_kwh;
      totalTokensEarned += kpi.total_tokens_earned;
      totalNFTs += kpi.nfts_earned.length;
      if (kpi.device_count > 0 || kpi.total_production_kwh > 0) usersWithEnergy++;
    });

    setAggregateKPIs({
      totalUsers: profilesWithEmails.length, usersWithEnergy,
      totalDevices, totalProductionKwh, totalTokensEarned, totalNFTs,
    });
  };

  useEffect(() => {
    if (!authLoading && !adminChecking) {
      if (!user) { navigate('/auth'); return; }
      if (!isAdmin) { setIsLoading(false); return; }
      setIsLoading(true);
      fetchProfiles().finally(() => setIsLoading(false));
    }
  }, [user, authLoading, adminChecking, isAdmin, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfiles();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  if (authLoading || adminChecking || isLoading) return <AdminSkeleton />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={zenIconOnly} alt="ZenSolar" className="h-12 w-12 rounded-lg" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Users</h1>
              <p className="text-muted-foreground">
                {aggregateKPIs.totalUsers} registered
                <span className="mx-2">•</span>
                <span className="text-green-500 font-medium">{onlineCount} online now</span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" />Total Users</div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Circle className="h-3.5 w-3.5 fill-green-500 text-green-500" />Online Now
            </div>
            <div className="text-2xl font-bold text-green-500">{onlineCount}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Zap className="h-3.5 w-3.5" />Devices</div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalDevices}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Sun className="h-3.5 w-3.5" />Production</div>
            <div className="text-2xl font-bold text-primary">{formatNumber(aggregateKPIs.totalProductionKwh)} kWh</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Coins className="h-3.5 w-3.5" />Tokens</div>
            <div className="text-2xl font-bold text-amber-500">{formatNumber(aggregateKPIs.totalTokensEarned)}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Award className="h-3.5 w-3.5" />NFTs</div>
            <div className="text-2xl font-bold text-primary">{aggregateKPIs.totalNFTs}</div>
          </Card>
        </div>

        {/* Onboarding Funnel */}
        <OnboardingFunnelCard profiles={profiles} />

        {/* Search + User List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Profiles
                </CardTitle>
                <CardDescription className="text-sm">Tap a user to see details, NFTs, and token history</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] shrink-0">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joined_desc">Newest first</SelectItem>
                    <SelectItem value="joined_asc">Oldest first</SelectItem>
                    <SelectItem value="last_seen_desc">Recently active</SelectItem>
                    <SelectItem value="last_seen_asc">Least active</SelectItem>
                    <SelectItem value="logins_desc">Most logins</SelectItem>
                    <SelectItem value="logins_asc">Fewest logins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Mobile: Card layout */}
            <div className="block lg:hidden">
              {filteredProfiles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No users match your search' : 'No users registered yet'}
                </div>
              ) : (
                filteredProfiles.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    kpi={userKPIs.get(profile.user_id)}
                    hasPush={pushStatuses.get(profile.user_id) || false}
                    isOnline={onlineUserIds.has(profile.user_id)}
                    onDelete={handleDeleteUser}
                    isDeleting={isDeletingUser}
                    onViewAs={handleViewAs}
                  />
                ))
              )}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="min-w-[160px]">User</TableHead>
                    <TableHead className="min-w-[100px]">Last Seen</TableHead>
                    <TableHead className="min-w-[120px]">Energy Accounts</TableHead>
                    <TableHead className="text-center min-w-[70px]">Devices</TableHead>
                    <TableHead className="text-right min-w-[100px]">Production</TableHead>
                    <TableHead className="text-right min-w-[80px]">Tokens</TableHead>
                    <TableHead className="text-center min-w-[70px]">NFTs</TableHead>
                    <TableHead className="text-center min-w-[50px]">Push</TableHead>
                    <TableHead className="min-w-[100px]">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No users match your search' : 'No users registered yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <UserRow
                        key={profile.id}
                        profile={profile}
                        kpi={userKPIs.get(profile.user_id)}
                        hasPush={pushStatuses.get(profile.user_id) || false}
                        isOnline={onlineUserIds.has(profile.user_id)}
                        onDelete={handleDeleteUser}
                        isDeleting={isDeletingUser}
                        onViewAs={handleViewAs}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
