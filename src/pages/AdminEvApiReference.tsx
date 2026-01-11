import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldX, Car, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
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
            <h1 className="text-xl font-bold text-foreground">EV API Reference</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-8">
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

        {/* Research Date */}
        <p className="text-xs text-muted-foreground text-center">
          Research compiled: January 2026
        </p>
      </main>
    </div>
  );
}
