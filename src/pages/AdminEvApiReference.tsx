import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, ShieldX, Car, CheckCircle2, XCircle, AlertCircle, ExternalLink, Zap, BatteryCharging } from 'lucide-react';
import zenLogo from '@/assets/zen-logo.png';

interface EvApiInfo {
  manufacturer: string;
  models: string;
  apiType: string;
  odometer: 'yes' | 'no' | 'limited';
  kwhHistory: 'yes' | 'no' | 'limited';
  notes: string;
  link?: string;
}

interface ChargingNetworkInfo {
  network: string;
  chargerTypes: string;
  stationsUs: string;
  apiAccess: 'public' | 'partner' | 'none' | 'unofficial';
  sessionData: 'yes' | 'no' | 'limited';
  kwhHistory: 'yes' | 'no' | 'limited';
  notes: string;
  link?: string;
}

const evApis: EvApiInfo[] = [
  {
    manufacturer: 'Tesla',
    models: 'Model S, 3, X, Y, Cybertruck',
    apiType: 'Official Fleet API',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Already integrated - full data access including Supercharger history',
    link: 'https://developer.tesla.com/',
  },
  {
    manufacturer: 'Hyundai',
    models: 'Ioniq 5, Ioniq 6, Kona EV',
    apiType: 'Unofficial (BlueLink)',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Detailed daily stats: consumption kWh, regen kWh, engine/climate breakdown. Via hyundai_kia_connect_api',
    link: 'https://github.com/Hyundai-Kia-Connect/hyundai_kia_connect_api',
  },
  {
    manufacturer: 'Kia',
    models: 'EV6, EV9, Niro EV',
    apiType: 'Unofficial (UVO/Connect)',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Same API as Hyundai - very detailed energy data with daily breakdown',
    link: 'https://github.com/Hyundai-Kia-Connect/hyundai_kia_connect_api',
  },
  {
    manufacturer: 'Ford',
    models: 'Mustang Mach-E, F-150 Lightning',
    apiType: 'Unofficial (FordPass)',
    odometer: 'yes',
    kwhHistory: 'limited',
    notes: 'Battery %, charge status available. Less detailed charging history than others',
    link: 'https://github.com/mlaanderson/fordpass-api-doc',
  },
  {
    manufacturer: 'GM/Chevrolet',
    models: 'Bolt EV/EUV, Equinox EV, Blazer EV',
    apiType: 'OnStar API (Fleet B2B)',
    odometer: 'yes',
    kwhHistory: 'limited',
    notes: 'Primarily for fleet customers, complex approval process required',
    link: 'https://www.gmenvolve.com/software/onstar/api-services',
  },
  {
    manufacturer: 'Volkswagen',
    models: 'ID.4, ID.Buzz',
    apiType: 'Unofficial (WeConnect)',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Battery %, charging sessions, consumption data via WeConnect-python',
    link: 'https://github.com/tillsteinbach/WeConnect-python',
  },
  {
    manufacturer: 'Rivian',
    models: 'R1T, R1S',
    apiType: 'Unofficial (GraphQL)',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Charging history visible in app, API provides session data with kWh',
    link: 'https://rivian-api.kaedenb.org/',
  },
  {
    manufacturer: 'BMW/Mini',
    models: 'iX, i4, i5, i7, Mini Cooper SE',
    apiType: 'Smartcar',
    odometer: 'yes',
    kwhHistory: 'yes',
    notes: 'Charge Records endpoint returns energy in kWh per session (Smartcar exclusive)',
    link: 'https://smartcar.com/docs/api-reference/bmw/get-charge-records',
  },
  {
    manufacturer: 'Mercedes',
    models: 'EQS, EQE, EQB',
    apiType: 'Smartcar',
    odometer: 'yes',
    kwhHistory: 'no',
    notes: 'Real-time battery % and charge status, no historical kWh data',
    link: 'https://smartcar.com/brand/mercedes',
  },
  {
    manufacturer: 'Audi',
    models: 'e-tron, Q4 e-tron, Q8 e-tron',
    apiType: 'Smartcar',
    odometer: 'yes',
    kwhHistory: 'no',
    notes: 'Real-time data only, no charging history endpoint',
    link: 'https://smartcar.com/brand/audi',
  },
  {
    manufacturer: 'Porsche',
    models: 'Taycan',
    apiType: 'Smartcar',
    odometer: 'yes',
    kwhHistory: 'no',
    notes: 'Real-time battery and charging status',
    link: 'https://smartcar.com/brand/porsche',
  },
];

const chargingNetworks: ChargingNetworkInfo[] = [
  {
    network: 'ChargePoint',
    chargerTypes: 'L2 + DCFC',
    stationsUs: '~70,000+',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'SOAP API for partners. Web Services API provides energy kWh, session times, station status. Analytics reports available via dashboard.',
    link: 'https://www.chargepoint.com/',
  },
  {
    network: 'Electrify America',
    chargerTypes: 'DCFC (150-350kW)',
    stationsUs: '~900+ sites',
    apiAccess: 'none',
    sessionData: 'no',
    kwhHistory: 'no',
    notes: 'No public API. Data accessible only via mobile app. Potential future OCPI compliance.',
    link: 'https://www.electrifyamerica.com/',
  },
  {
    network: 'EVgo',
    chargerTypes: 'DCFC (50-350kW)',
    stationsUs: '~1,000+ sites',
    apiAccess: 'none',
    sessionData: 'no',
    kwhHistory: 'no',
    notes: 'No public developer API. App shows session history with kWh pricing. May offer fleet API via partnership.',
    link: 'https://www.evgo.com/',
  },
  {
    network: 'Tesla Supercharger',
    chargerTypes: 'DCFC (250kW)',
    stationsUs: '~2,000+ sites',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Integrated via Tesla Fleet API. Full charging history with kWh for Tesla vehicles. Non-Tesla access limited.',
    link: 'https://developer.tesla.com/docs/fleet-api/endpoints/charging-endpoints',
  },
  {
    network: 'Blink Charging',
    chargerTypes: 'L2 + DCFC',
    stationsUs: '~3,000+',
    apiAccess: 'none',
    sessionData: 'limited',
    kwhHistory: 'limited',
    notes: 'Owner portal for hosts shows consumption data. No public developer API for EV drivers.',
    link: 'https://blinkcharging.com/',
  },
  {
    network: 'Shell Recharge (Greenlots)',
    chargerTypes: 'L2 + DCFC',
    stationsUs: '~4,000+',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Shell Developer Portal has EV Public Charge Sessions API. Requires partner onboarding. Full session data with kWh.',
    link: 'https://developer.shell.com/api-catalog/ev-public-charge-sessions',
  },
  {
    network: 'FLO',
    chargerTypes: 'L2 + DCFC',
    stationsUs: '~5,000+ (US+Canada)',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Owner portal provides charging reports with kWh. Fleet/CPO API may be available via partnership.',
    link: 'https://www.flo.com/',
  },
  {
    network: 'SemaConnect',
    chargerTypes: 'L2 + DCFC',
    stationsUs: '~2,300+',
    apiAccess: 'none',
    sessionData: 'limited',
    kwhHistory: 'limited',
    notes: 'Network portal for hosts. Real-time charging status. No public driver API.',
    link: 'https://semaconnect.com/',
  },
  {
    network: 'ChargeLab',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'CPO Platform',
    apiAccess: 'public',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Public REST API for CPOs/developers. Session data, kWh, charging status. Developer program available.',
    link: 'https://chargelab.co/developer-program',
  },
  {
    network: 'NREL AFDC',
    chargerTypes: 'All Types',
    stationsUs: 'Database (~70k+)',
    apiAccess: 'public',
    sessionData: 'no',
    kwhHistory: 'no',
    notes: 'Free public API for station locations, not charging sessions. Good for station discovery/mapping.',
    link: 'https://developer.nrel.gov/docs/transportation/alt-fuel-stations-v1/',
  },
  {
    network: 'Open Charge Map',
    chargerTypes: 'All Types',
    stationsUs: 'Global Database',
    apiAccess: 'public',
    sessionData: 'no',
    kwhHistory: 'no',
    notes: 'Crowdsourced station database. Free API for locations. No session/usage data.',
    link: 'https://openchargemap.org/site/develop/api',
  },
  {
    network: 'Chargetrip',
    chargerTypes: 'All Types',
    stationsUs: 'Aggregator',
    apiAccess: 'public',
    sessionData: 'limited',
    kwhHistory: 'no',
    notes: 'GraphQL API for EV routing, station mapping. Real-time availability from some networks. No session history.',
    link: 'https://www.chargetrip.com/api',
  },
];

interface SmartcarFeature {
  feature: string;
  allBrands: boolean;
  bmwMiniOnly: boolean;
  notes: string;
}

const smartcarFeatures: SmartcarFeature[] = [
  { feature: 'Odometer', allBrands: true, bmwMiniOnly: false, notes: 'Available for all 39+ supported brands' },
  { feature: 'State of Charge (%)', allBrands: true, bmwMiniOnly: false, notes: 'Current battery percentage' },
  { feature: 'Charge Status', allBrands: true, bmwMiniOnly: false, notes: 'Charging/not charging/complete' },
  { feature: 'Charge Control', allBrands: true, bmwMiniOnly: false, notes: 'Start/stop charging remotely' },
  { feature: 'Location', allBrands: true, bmwMiniOnly: false, notes: 'GPS coordinates of vehicle' },
  { feature: 'Charge Records (kWh)', allBrands: false, bmwMiniOnly: true, notes: 'Historical charging sessions with energy data' },
  { feature: 'Lock/Unlock', allBrands: true, bmwMiniOnly: false, notes: 'Remote lock control' },
];

const StatusIcon = ({ status }: { status: 'yes' | 'no' | 'limited' }) => {
  if (status === 'yes') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'limited') return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
};

const ApiAccessBadge = ({ access }: { access: 'public' | 'partner' | 'none' | 'unofficial' }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    public: 'default',
    partner: 'secondary',
    unofficial: 'outline',
    none: 'destructive',
  };
  const labels: Record<string, string> = {
    public: 'Public API',
    partner: 'Partner Only',
    unofficial: 'Unofficial',
    none: 'No API',
  };
  return <Badge variant={variants[access]}>{labels[access]}</Badge>;
};

export default function AdminEvApiReference() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();

  if (authLoading || adminChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldX className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={zenLogo} alt="ZenSolar" className="h-7 w-7" />
            <h1 className="text-xl font-bold text-foreground">EV & Charging API Reference</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Tabs defaultValue="manufacturers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="manufacturers" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              EV Manufacturers
            </TabsTrigger>
            <TabsTrigger value="networks" className="flex items-center gap-2">
              <BatteryCharging className="h-4 w-4" />
              Charging Networks
            </TabsTrigger>
          </TabsList>

          {/* EV Manufacturers Tab */}
          <TabsContent value="manufacturers" className="space-y-8 mt-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  EV Manufacturer API Comparison
                </CardTitle>
                <CardDescription>
                  Reference guide for integrating with various EV manufacturer APIs to pull odometer and kWh charging history data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Models</TableHead>
                        <TableHead>API Type</TableHead>
                        <TableHead className="text-center">Odometer</TableHead>
                        <TableHead className="text-center">kWh History</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evApis.map((api) => (
                        <TableRow key={api.manufacturer}>
                          <TableCell className="font-medium">{api.manufacturer}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{api.models}</TableCell>
                          <TableCell>
                            <Badge variant={api.apiType.includes('Official') ? 'default' : 'secondary'}>
                              {api.apiType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusIcon status={api.odometer} />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusIcon status={api.kwhHistory} />
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">{api.notes}</TableCell>
                          <TableCell>
                            {api.link && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={api.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Smartcar Details */}
            <Card>
              <CardHeader>
                <CardTitle>Smartcar API Details</CardTitle>
                <CardDescription>
                  Smartcar is a unified API that wraps OEM data. It supports 39+ brands but kWh charging history is limited.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-center">All Brands</TableHead>
                        <TableHead className="text-center">BMW/Mini Only</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smartcarFeatures.map((feature) => (
                        <TableRow key={feature.feature}>
                          <TableCell className="font-medium">{feature.feature}</TableCell>
                          <TableCell className="text-center">
                            {feature.allBrands ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {feature.bmwMiniOnly ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{feature.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <a href="https://smartcar.com/docs" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Smartcar Documentation
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Recommendations</CardTitle>
                <CardDescription>
                  Best options for odometer + kWh charging history data like Tesla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Badge className="bg-green-500 mt-0.5">Tier 1</Badge>
                    <div>
                      <p className="font-medium">Full kWh History Available</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>Hyundai/Kia</strong> - Daily consumption breakdown, regen energy, climate usage</li>
                        <li>• <strong>Volkswagen ID.</strong> - Charging sessions with kWh, trip statistics</li>
                        <li>• <strong>Rivian</strong> - Charging session history with energy consumed</li>
                        <li>• <strong>BMW/Mini</strong> - Via Smartcar Charge Records endpoint</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Badge className="bg-yellow-500 mt-0.5">Tier 2</Badge>
                    <div>
                      <p className="font-medium">Limited or Real-Time Only</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>Ford</strong> - Battery % and charge status, less detailed historical data</li>
                        <li>• <strong>Mercedes/Audi/Porsche</strong> - Real-time only via Smartcar</li>
                        <li>• <strong>GM</strong> - Requires fleet partnership, complex onboarding</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Priority recommendation:</strong> Start with Hyundai/Kia integration as it has the richest energy data 
                    comparable to Tesla and covers a large EV user base (Ioniq 5/6, EV6, EV9).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charging Networks Tab */}
          <TabsContent value="networks" className="space-y-8 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  US EV Charging Network API Comparison
                </CardTitle>
                <CardDescription>
                  Public charging networks with Level 2 and DC Fast Chargers (Level 3) in the United States. 
                  API access for pulling user charging session data with kWh history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network</TableHead>
                        <TableHead>Charger Types</TableHead>
                        <TableHead>US Stations</TableHead>
                        <TableHead>API Access</TableHead>
                        <TableHead className="text-center">Session Data</TableHead>
                        <TableHead className="text-center">kWh History</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargingNetworks.map((network) => (
                        <TableRow key={network.network}>
                          <TableCell className="font-medium">{network.network}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{network.chargerTypes}</TableCell>
                          <TableCell className="text-sm">{network.stationsUs}</TableCell>
                          <TableCell>
                            <ApiAccessBadge access={network.apiAccess} />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusIcon status={network.sessionData} />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusIcon status={network.kwhHistory} />
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">{network.notes}</TableCell>
                          <TableCell>
                            {network.link && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={network.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Charging Network Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Charging Network Integration Recommendations</CardTitle>
                <CardDescription>
                  Best options for accessing user charging session data with kWh consumption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Badge className="bg-green-500 mt-0.5">Best Options</Badge>
                    <div>
                      <p className="font-medium">Full Session + kWh Data Available</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>Tesla Supercharger</strong> - Already integrated via Fleet API for Tesla vehicles</li>
                        <li>• <strong>Shell Recharge</strong> - Public developer portal with EV Charge Sessions API</li>
                        <li>• <strong>ChargeLab</strong> - Open developer program with REST API</li>
                        <li>• <strong>ChargePoint</strong> - Partner API with full analytics (requires partnership)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Badge className="bg-yellow-500 mt-0.5">Aggregators</Badge>
                    <div>
                      <p className="font-medium">Station Discovery (No Session Data)</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>NREL AFDC API</strong> - Free public API for finding all US charging stations</li>
                        <li>• <strong>Open Charge Map</strong> - Global crowdsourced station database</li>
                        <li>• <strong>Chargetrip</strong> - EV routing API with some real-time availability</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Badge className="bg-red-500 mt-0.5">No API</Badge>
                    <div>
                      <p className="font-medium">Major Networks Without Public API Access</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>Electrify America</strong> - Largest DCFC network, no public API (data only in app)</li>
                        <li>• <strong>EVgo</strong> - Major DCFC network, no developer access</li>
                        <li>• <strong>Blink</strong> - Host/owner portal only, no driver API</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Key insight:</strong> Most major networks (Electrify America, EVgo) don't offer public APIs for driver session data. 
                    The best approach is to pull charging data from the <strong>vehicle's API</strong> (Tesla, Hyundai/Kia, etc.) rather than the charging network.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Future opportunity:</strong> As OCPI (Open Charge Point Interface) becomes more adopted, 
                    more networks may offer standardized data access.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* OCPI Info */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Standards: OCPI & OCPP</CardTitle>
                <CardDescription>
                  Open protocols that may enable future integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">OCPI (Open Charge Point Interface)</h4>
                    <p className="text-sm text-muted-foreground">
                      Protocol for data exchange between charging networks and eMobility service providers. 
                      Enables roaming and session data sharing. Adoption growing in US.
                    </p>
                    <Button variant="link" className="px-0 mt-2" asChild>
                      <a href="https://evroaming.org/ocpi-background/" target="_blank" rel="noopener noreferrer">
                        Learn about OCPI <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">OCPP (Open Charge Point Protocol)</h4>
                    <p className="text-sm text-muted-foreground">
                      Protocol for communication between chargers and management systems (CPO backend). 
                      Most chargers support OCPP. Not directly accessible to third-party apps.
                    </p>
                    <Button variant="link" className="px-0 mt-2" asChild>
                      <a href="https://openchargealliance.org/" target="_blank" rel="noopener noreferrer">
                        Open Charge Alliance <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Research Date */}
        <p className="text-xs text-muted-foreground text-center">
          Research compiled: January 2026
        </p>
      </main>
    </div>
  );
}