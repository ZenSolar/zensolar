import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, RefreshCw, Zap, Bell, Award, Coins, ChevronDown, ChevronUp, Sun, Battery, Car, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSkeleton } from '@/components/ui/loading-skeleton';
import zenIconOnly from '@/assets/zen-icon-only.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProfileWithEmail {
  id: string;
  user_id: string;
  display_name: string | null;
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
    solar_wh?: number;
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

interface UserPushStatus {
  user_id: string;
  has_push: boolean;
}

// NFT milestone thresholds (simplified version)
const SOLAR_THRESHOLDS = [
  { name: 'SunSpark', threshold: 100 },
  { name: 'Photonic', threshold: 500 },
  { name: 'RayForge', threshold: 1000 },
  { name: 'Solaris', threshold: 2500 },
  { name: 'Helios', threshold: 5000 },
  { name: 'SunForge', threshold: 10000 },
  { name: 'GigaSun', threshold: 25000 },
  { name: 'StarForge', threshold: 50000 },
];

const EV_MILES_THRESHOLDS = [
  { name: 'Ignitor', threshold: 100 },
  { name: 'Velocity', threshold: 500 },
  { name: 'Autobahn', threshold: 1000 },
  { name: 'HyperDrive', threshold: 2500 },
  { name: 'Electra', threshold: 5000 },
  { name: 'Velocity Pro', threshold: 10000 },
  { name: 'Mach One', threshold: 25000 },
  { name: 'Centaurion', threshold: 50000 },
  { name: 'Voyager', threshold: 100000 },
  { name: 'Odyssey', threshold: 250000 },
];

const BATTERY_THRESHOLDS = [
  { name: 'VoltBank', threshold: 100 },
  { name: 'GridPulse', threshold: 500 },
  { name: 'MegaCell', threshold: 1000 },
  { name: 'ReserveX', threshold: 2500 },
  { name: 'DynaMax', threshold: 5000 },
  { name: 'UltraCell', threshold: 10000 },
  { name: 'GigaVolt', threshold: 25000 },
];

const CHARGING_THRESHOLDS = [
  { name: 'Ignite', threshold: 100 },
  { name: 'VoltCharge', threshold: 500 },
  { name: 'KiloVolt', threshold: 1000 },
  { name: 'AmpForge', threshold: 2500 },
  { name: 'ChargeOn', threshold: 5000 },
  { name: 'GigaCharge', threshold: 10000 },
  { name: 'MegaCharge', threshold: 25000 },
  { name: 'TeraCharge', threshold: 50000 },
];

interface EnergyData {
  productionKwh: number;
  evMiles: number;
  chargingKwh: number;
  batteryDischargedKwh: number;
}

function calculateEarnedNFTs(data: EnergyData): string[] {
  const earned: string[] = ['Welcome'];
  
  // Solar NFTs
  SOLAR_THRESHOLDS.forEach(t => {
    if (data.productionKwh >= t.threshold) {
      earned.push(`Solar: ${t.name}`);
    }
  });
  
  // EV Miles NFTs
  EV_MILES_THRESHOLDS.forEach(t => {
    if (data.evMiles >= t.threshold) {
      earned.push(`EV: ${t.name}`);
    }
  });
  
  // Charging NFTs
  CHARGING_THRESHOLDS.forEach(t => {
    if (data.chargingKwh >= t.threshold) {
      earned.push(`Charging: ${t.name}`);
    }
  });
  
  // Battery NFTs
  BATTERY_THRESHOLDS.forEach(t => {
    if (data.batteryDischargedKwh >= t.threshold) {
      earned.push(`Battery: ${t.name}`);
    }
  });
  
  return earned;
}

function formatAddress(address: string | null): string {
  if (!address) return '—';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

function getRewardTypeIcon(type: string) {
  switch (type) {
    case 'solar':
    case 'production':
      return <Sun className="h-3 w-3" />;
    case 'battery':
      return <Battery className="h-3 w-3" />;
    case 'ev_miles':
      return <Car className="h-3 w-3" />;
    case 'charging':
      return <Plug className="h-3 w-3" />;
    default:
      return <Coins className="h-3 w-3" />;
  }
}

function getRewardTypeLabel(type: string) {
  switch (type) {
    case 'solar':
    case 'production':
      return 'Solar';
    case 'battery':
      return 'Battery';
    case 'ev_miles':
      return 'EV Miles';
    case 'charging':
      return 'Charging';
    case 'referral':
      return 'Referral';
    default:
      return type;
  }
}

interface UserRowProps {
  profile: ProfileWithEmail;
  kpi: UserKPIs | undefined;
  hasPush: boolean;
}

// Mobile-friendly card for each user
function UserCard({ profile, kpi, hasPush }: UserRowProps) {
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
                  <div className="font-medium truncate">{profile.display_name || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(profile.created_at)}</div>
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
                  <Badge variant="default" className="bg-green-600 text-xs px-1.5">
                    <Bell className="h-3 w-3" />
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-1.5">Off</Badge>
                )}
              </div>
            </div>
            
            {/* Quick stats row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {connectedProviders.map((provider) => (
                <Badge key={provider as string} variant="outline" className="text-xs">
                  {provider}
                </Badge>
              ))}
              {connectedProviders.length === 0 && (
                <span className="text-xs text-muted-foreground">No energy accounts</span>
              )}
              
              <span className="text-muted-foreground mx-1">•</span>
              
              {kpi?.device_count ? (
                <span className="text-xs text-muted-foreground">{kpi.device_count} device{kpi.device_count > 1 ? 's' : ''}</span>
              ) : (
                <span className="text-xs text-muted-foreground">0 devices</span>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-4">
            {/* Energy Activity Summary */}
            {kpi && (kpi.total_ev_miles > 0 || kpi.total_charging_kwh > 0 || kpi.total_production_kwh > 0 || kpi.total_battery_discharged_kwh > 0) && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Energy Activity
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {kpi.total_production_kwh > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Sun className="h-3 w-3" />
                        Solar
                      </div>
                      <div className="font-semibold text-sm text-primary">{formatNumber(kpi.total_production_kwh)} kWh</div>
                    </div>
                  )}
                  {kpi.total_ev_miles > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Car className="h-3 w-3" />
                        EV Miles
                      </div>
                      <div className="font-semibold text-sm text-secondary">{formatNumber(kpi.total_ev_miles)} mi</div>
                    </div>
                  )}
                  {kpi.total_charging_kwh > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Plug className="h-3 w-3" />
                        Charging
                      </div>
                      <div className="font-semibold text-sm">{formatNumber(kpi.total_charging_kwh)} kWh</div>
                    </div>
                  )}
                  {kpi.total_battery_discharged_kwh > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Battery className="h-3 w-3" />
                        Battery
                      </div>
                      <div className="font-semibold text-sm text-amber-500">{formatNumber(kpi.total_battery_discharged_kwh)} kWh</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Devices */}
            {kpi && kpi.devices.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Connected Devices ({kpi.devices.length})
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
                  <Award className="h-4 w-4 text-primary" />
                  NFTs Earned ({kpi.nfts_earned.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {kpi.nfts_earned.map((nft, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {nft}
                    </Badge>
                  ))}
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
                <div className="text-amber-500 font-medium">
                  {formatNumber(kpi.total_tokens_earned)} tokens
                </div>
              )}
            </div>
            
            {(!kpi || (kpi.devices.length === 0 && kpi.nfts_earned.length === 0)) && (
              <p className="text-sm text-muted-foreground">No activity data available.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Desktop table row
function UserRow({ profile, kpi, hasPush }: UserRowProps) {
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
        <TableCell className="font-medium whitespace-nowrap">
          {profile.display_name || 'Anonymous'}
        </TableCell>
        <TableCell className="font-mono text-xs whitespace-nowrap">
          {formatAddress(profile.wallet_address)}
        </TableCell>
        <TableCell>
          <div className="flex gap-1 flex-wrap max-w-[150px]">
            {profile.tesla_connected && (
              <Badge variant="outline" className="text-xs">Tesla</Badge>
            )}
            {profile.enphase_connected && (
              <Badge variant="outline" className="text-xs">Enphase</Badge>
            )}
            {profile.solaredge_connected && (
              <Badge variant="outline" className="text-xs">SolarEdge</Badge>
            )}
            {profile.wallbox_connected && (
              <Badge variant="outline" className="text-xs">Wallbox</Badge>
            )}
            {!profile.tesla_connected && !profile.enphase_connected && 
             !profile.solaredge_connected && !profile.wallbox_connected && (
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
            <span className="font-medium text-primary">
              {formatNumber(kpi.total_production_kwh)} kWh
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          {kpi && kpi.total_tokens_earned > 0 ? (
            <span className="font-medium text-amber-500">
              {formatNumber(kpi.total_tokens_earned)}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {kpi && kpi.nfts_earned.length > 0 ? (
            <Badge variant="secondary" className="gap-1">
              <Award className="h-3 w-3" />
              {kpi.nfts_earned.length}
            </Badge>
          ) : (
            <Badge variant="secondary">0</Badge>
          )}
        </TableCell>
        <TableCell className="text-center">
          {hasPush ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <Bell className="h-3 w-3" />
            </Badge>
          ) : (
            <Badge variant="secondary">Off</Badge>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDate(profile.created_at)}
        </TableCell>
      </TableRow>
      
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={10} className="p-0">
            <div className="p-4 space-y-4">
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
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                          <Sun className="h-3 w-3" />
                          Solar Production
                        </div>
                        <div className="font-semibold text-primary">{formatNumber(kpi.total_production_kwh)} kWh</div>
                      </div>
                    )}
                    {kpi.total_ev_miles > 0 && (
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                          <Car className="h-3 w-3" />
                          EV Miles Driven
                        </div>
                        <div className="font-semibold text-secondary">{formatNumber(kpi.total_ev_miles)} mi</div>
                      </div>
                    )}
                    {kpi.total_charging_kwh > 0 && (
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                          <Plug className="h-3 w-3" />
                          Charging Energy
                        </div>
                        <div className="font-semibold">{formatNumber(kpi.total_charging_kwh)} kWh</div>
                      </div>
                    )}
                    {kpi.total_battery_discharged_kwh > 0 && (
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                          <Battery className="h-3 w-3" />
                          Battery Discharged
                        </div>
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
                    <Zap className="h-4 w-4 text-primary" />
                    Connected Devices ({kpi.devices.length})
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
                    <Award className="h-4 w-4 text-primary" />
                    NFTs Earned ({kpi.nfts_earned.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {kpi.nfts_earned.map((nft, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {nft}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mint History */}
              {kpi && kpi.mint_records.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Token Minting History ({kpi.mint_records.length} records)
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
                              <div className="flex items-center gap-1.5">
                                {getRewardTypeIcon(record.reward_type)}
                                {getRewardTypeLabel(record.reward_type)}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-right font-medium text-amber-500">
                              +{formatNumber(record.tokens_earned)}
                            </TableCell>
                            <TableCell className="py-2 text-right text-muted-foreground">
                              {record.energy_wh_basis > 0 
                                ? `${(record.energy_wh_basis / 1000).toFixed(1)}`
                                : '—'}
                            </TableCell>
                            <TableCell className="py-2">
                              {record.claimed ? (
                                <Badge variant="default" className="text-xs bg-green-600">Claimed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground">
                              {formatDate(record.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {kpi.mint_records.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing 10 of {kpi.mint_records.length} records
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {(!kpi || (kpi.devices.length === 0 && kpi.nfts_earned.length === 0 && kpi.mint_records.length === 0)) && (
                <p className="text-sm text-muted-foreground">No activity data available for this user.</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [userKPIs, setUserKPIs] = useState<Map<string, UserKPIs>>(new Map());
  const [pushStatuses, setPushStatuses] = useState<Map<string, boolean>>(new Map());
  const [aggregateKPIs, setAggregateKPIs] = useState({
    totalUsers: 0,
    usersWithEnergy: 0,
    totalDevices: 0,
    totalProductionKwh: 0,
    totalTokensEarned: 0,
    totalNFTs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfiles = async () => {
    // Fetch profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to fetch user profiles');
      return;
    }

    setProfiles(data || []);

    // Fetch push subscription status, devices, production, and rewards in parallel
    const [pushResult, devicesResult, productionResult, rewardsResult] = await Promise.all([
      supabase.from('push_subscriptions').select('user_id'),
      supabase.from('connected_devices').select('id, user_id, provider, device_type, device_name, baseline_data, lifetime_totals'),
      supabase.from('energy_production').select('user_id, production_wh, consumption_wh'),
      supabase.from('user_rewards').select('id, user_id, reward_type, tokens_earned, energy_wh_basis, claimed, claimed_at, created_at').order('created_at', { ascending: false }),
    ]);

    // Process push statuses
    if (!pushResult.error && pushResult.data) {
      const statusMap = new Map<string, boolean>();
      pushResult.data.forEach(sub => {
        statusMap.set(sub.user_id, true);
      });
      setPushStatuses(statusMap);
    }

    // Aggregate KPIs per user
    const kpiMap = new Map<string, UserKPIs>();
    
    // Initialize for all users
    (data || []).forEach(profile => {
      kpiMap.set(profile.user_id, {
        user_id: profile.user_id,
        device_count: 0,
        devices: [],
        total_production_kwh: 0,
        total_consumption_kwh: 0,
        total_ev_miles: 0,
        total_charging_kwh: 0,
        total_battery_discharged_kwh: 0,
        total_tokens_earned: 0,
        total_tokens_claimed: 0,
        total_tokens_pending: 0,
        mint_records: [],
        nfts_earned: [],
      });
    });

    // Process devices per user - use lifetime_totals for accurate data, fall back to baseline
    if (!devicesResult.error && devicesResult.data) {
      devicesResult.data.forEach(device => {
        const existing = kpiMap.get(device.user_id);
        if (existing) {
          existing.device_count++;
          
          // Parse baseline_data and lifetime_totals
          const baselineData = device.baseline_data as { 
            odometer?: number; 
            total_charge_energy_added_kwh?: number;
            total_energy_discharged_wh?: number;
            total_solar_produced_wh?: number;
          } | null;
          
          const lifetimeTotals = device.lifetime_totals as {
            odometer?: number;
            charging_kwh?: number;
            solar_wh?: number;
            battery_discharge_wh?: number;
            wall_connector_wh?: number;
            updated_at?: string;
          } | null;
          
          existing.devices.push({
            id: device.id,
            device_type: device.device_type,
            device_name: device.device_name,
            provider: device.provider,
            baseline_data: baselineData,
            lifetime_totals: lifetimeTotals,
          });
          
          // Aggregate EV data from vehicle devices - prefer lifetime_totals over baseline
          if (device.device_type === 'vehicle') {
            const odometer = lifetimeTotals?.odometer ?? baselineData?.odometer ?? 0;
            const chargingKwh = lifetimeTotals?.charging_kwh ?? baselineData?.total_charge_energy_added_kwh ?? 0;
            existing.total_ev_miles += odometer;
            existing.total_charging_kwh += chargingKwh;
          }
          
          // Aggregate battery data from powerwall devices - prefer lifetime_totals over baseline
          if (device.device_type === 'powerwall') {
            const batteryDischargeWh = lifetimeTotals?.battery_discharge_wh ?? baselineData?.total_energy_discharged_wh ?? 0;
            existing.total_battery_discharged_kwh += batteryDischargeWh / 1000;
            
            // Also add solar from lifetime_totals if available (Tesla solar)
            if (lifetimeTotals?.solar_wh) {
              existing.total_production_kwh += lifetimeTotals.solar_wh / 1000;
            }
          }
        }
      });
    }

    // Sum production per user
    if (!productionResult.error && productionResult.data) {
      productionResult.data.forEach(prod => {
        const existing = kpiMap.get(prod.user_id);
        if (existing) {
          existing.total_production_kwh += (Number(prod.production_wh) || 0) / 1000;
          existing.total_consumption_kwh += (Number(prod.consumption_wh) || 0) / 1000;
        }
      });
    }

    // Process rewards per user
    if (!rewardsResult.error && rewardsResult.data) {
      rewardsResult.data.forEach(reward => {
        const existing = kpiMap.get(reward.user_id);
        if (existing) {
          const tokens = Number(reward.tokens_earned) || 0;
          existing.total_tokens_earned += tokens;
          if (reward.claimed) {
            existing.total_tokens_claimed += tokens;
          } else {
            existing.total_tokens_pending += tokens;
          }
          existing.mint_records.push({
            id: reward.id,
            reward_type: reward.reward_type,
            tokens_earned: tokens,
            energy_wh_basis: Number(reward.energy_wh_basis) || 0,
            claimed: reward.claimed,
            claimed_at: reward.claimed_at,
            created_at: reward.created_at,
          });
        }
      });
    }

    // Calculate NFTs earned based on all energy data
    kpiMap.forEach((kpi) => {
      kpi.nfts_earned = calculateEarnedNFTs({
        productionKwh: kpi.total_production_kwh,
        evMiles: kpi.total_ev_miles,
        chargingKwh: kpi.total_charging_kwh,
        batteryDischargedKwh: kpi.total_battery_discharged_kwh,
      });
    });

    setUserKPIs(kpiMap);

    // Calculate aggregate KPIs
    let totalDevices = 0;
    let totalProductionKwh = 0;
    let totalTokensEarned = 0;
    let totalNFTs = 0;
    let usersWithEnergy = 0;

    kpiMap.forEach((kpi) => {
      totalDevices += kpi.device_count;
      totalProductionKwh += kpi.total_production_kwh;
      totalTokensEarned += kpi.total_tokens_earned;
      totalNFTs += kpi.nfts_earned.length;
      if (kpi.device_count > 0 || kpi.total_production_kwh > 0) {
        usersWithEnergy++;
      }
    });

    setAggregateKPIs({
      totalUsers: data?.length || 0,
      usersWithEnergy,
      totalDevices,
      totalProductionKwh,
      totalTokensEarned,
      totalNFTs,
    });
  };

  useEffect(() => {
    if (!authLoading && !adminChecking) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }
      
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

  if (authLoading || adminChecking || isLoading) {
    return <AdminSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
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
        <div className="flex items-center gap-4">
          <img src={zenIconOnly} alt="ZenSolar" className="h-12 w-12 rounded-lg" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registered Users</h1>
            <p className="text-muted-foreground">Complete user data with energy metrics, tokens, and NFT rewards</p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Total Users
            </div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              With Energy
            </div>
            <div className="text-2xl font-bold text-secondary">{aggregateKPIs.usersWithEnergy}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Devices
            </div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalDevices}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Sun className="h-3.5 w-3.5" />
              Production
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatNumber(aggregateKPIs.totalProductionKwh)} kWh
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="h-3.5 w-3.5" />
              Tokens Earned
            </div>
            <div className="text-2xl font-bold text-amber-500">
              {formatNumber(aggregateKPIs.totalTokensEarned)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Award className="h-3.5 w-3.5" />
              NFTs Earned
            </div>
            <div className="text-2xl font-bold text-primary">
              {aggregateKPIs.totalNFTs}
            </div>
          </Card>
        </div>

        {/* Users - Responsive: Cards on mobile, Table on desktop */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Profiles
                </CardTitle>
                <CardDescription className="text-sm">
                  Tap a user to see details, NFTs, and token history
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Mobile: Card layout */}
            <div className="block lg:hidden">
              {profiles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No users registered yet
                </div>
              ) : (
                profiles.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    kpi={userKPIs.get(profile.user_id)}
                    hasPush={pushStatuses.get(profile.user_id) || false}
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
                    <TableHead className="min-w-[120px]">Display Name</TableHead>
                    <TableHead className="min-w-[100px]">Wallet</TableHead>
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
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No users registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <UserRow
                        key={profile.id}
                        profile={profile}
                        kpi={userKPIs.get(profile.user_id)}
                        hasPush={pushStatuses.get(profile.user_id) || false}
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
