import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldX, Car, CheckCircle2, XCircle, AlertCircle, ExternalLink, Zap, BatteryCharging, Sun, BatteryFull, ArrowLeft } from 'lucide-react';
import { ApiReferenceSkeleton } from '@/components/ui/loading-skeleton';

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
    network: 'Kempower',
    chargerTypes: 'DCFC (50-400kW)',
    stationsUs: 'Growing (EU-focused)',
    apiAccess: 'public',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'ChargEye REST API with full developer docs. Transactions API provides session data with kWh. OCPP 2.0.1 certified.',
    link: 'https://docs.kempower.io/',
  },
  {
    network: 'Autel Energy',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'Growing',
    apiAccess: 'partner',
    sessionData: 'limited',
    kwhHistory: 'limited',
    notes: 'OCPP 2.0.1 certified CSMS. Integrates with third-party platforms like AMPECO. No direct public API for drivers.',
    link: 'https://autelenergy.com/',
  },
  {
    network: 'EV Connect',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'CPO Platform',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'White-label API platform for CPOs. Full session data access for platform integrators. Partner onboarding required.',
    link: 'https://www.evconnect.com/api-platform',
  },
  {
    network: 'PowerFlex',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'Enterprise/Fleet',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Enterprise API integration available. Adaptive charging networks. Full session analytics for fleet customers.',
    link: 'https://www.powerflex.com/',
  },
  {
    network: 'Enel X / JuiceBox',
    chargerTypes: 'L2 (Home/Commercial)',
    stationsUs: 'Home Chargers',
    apiAccess: 'unofficial',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Unofficial JuiceNet API available via community libraries. Provides device status, session data, kWh consumption.',
    link: 'https://github.com/ketsugi/node-juicenet',
  },
  {
    network: 'Siemens DepotFinity',
    chargerTypes: 'DCFC (Fleet/Depot)',
    stationsUs: 'Fleet Depots',
    apiAccess: 'public',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Developer portal with Charger Status and Control APIs. Focused on fleet/depot charging. Full session data available.',
    link: 'https://developer.siemens.com/depotfinity/overview.html',
  },
  {
    network: 'ABB Terra',
    chargerTypes: 'DCFC (50-350kW)',
    stationsUs: 'Commercial/Fleet',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'OCPP compliant. Integrates with third-party CSMS platforms. Data access via CPO management systems.',
    link: 'https://new.abb.com/ev-charging',
  },
  {
    network: 'Schneider Electric EVlink',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'Commercial/Fleet',
    apiAccess: 'partner',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'EcoStruxure EV Charging Expert for load management. OCPP 1.6/2.0 compliant. External API via Schneider Exchange platform. Data access through CPO systems.',
    link: 'https://www.se.com/ww/en/work/solutions/for-business/automotive-and-emobility/emobility.jsp',
  },
  {
    network: 'Powerly',
    chargerTypes: 'L2 + DCFC',
    stationsUs: 'Platform/Aggregator',
    apiAccess: 'public',
    sessionData: 'yes',
    kwhHistory: 'yes',
    notes: 'Open EV Charging API platform. REST API for sessions, kWh data. Developer portal with documentation.',
    link: 'https://powerly.app/developers',
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

interface SolarBatteryApiInfo {
  company: string;
  products: string;
  category: 'inverter' | 'battery' | 'both' | 'installer';
  apiType: string;
  apiAccess: 'public' | 'partner' | 'none' | 'unofficial';
  productionData: 'yes' | 'no' | 'limited' | 'n/a';
  batteryData: 'yes' | 'no' | 'limited' | 'n/a';
  notes: string;
  link?: string;
}

const solarBatteryApis: SolarBatteryApiInfo[] = [
  // Already Integrated
  {
    company: 'Enphase',
    products: 'IQ Microinverters, IQ Batteries',
    category: 'both',
    apiType: 'Official (Enlighten API v4)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Already integrated. Device-level data for microinverters and batteries. Production, consumption, storage kWh.',
    link: 'https://developer-v4.enphase.com/',
  },
  {
    company: 'SolarEdge',
    products: 'Inverters, StorEdge Batteries',
    category: 'both',
    apiType: 'Official (Monitoring API)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Already integrated. Site energy data, power flow, battery state. Modbus for local access.',
    link: 'https://developers.solaredge.com/',
  },
  {
    company: 'Tesla',
    products: 'Powerwall, Solar Roof',
    category: 'both',
    apiType: 'Official (Fleet API)',
    apiAccess: 'partner',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Already integrated. Energy endpoints for Powerwall data. Local API also available via pypowerwall.',
    link: 'https://developer.tesla.com/docs/fleet-api/endpoints/energy',
  },
  // Inverter Manufacturers
  {
    company: 'SMA',
    products: 'Sunny Boy, Sunny Tripower, Core1',
    category: 'inverter',
    apiType: 'Official (Sunny Portal API)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'limited',
    notes: 'Developer portal with REST APIs. Rate limits apply from July 2025. On-site integration docs available.',
    link: 'https://developer.sma.de/sma-apis',
  },
  {
    company: 'Fronius',
    products: 'Primo, Symo, Gen24',
    category: 'inverter',
    apiType: 'Official (Solar API JSON)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Local API on inverters + Solar.web cloud API. Real-time and historical data. Well documented.',
    link: 'https://www.fronius.com/en/solar-energy/installers-partners/products/all-products/system-monitoring/open-interfaces/fronius-solar-api-json-',
  },
  {
    company: 'Huawei',
    products: 'SUN2000 Inverters, LUNA Batteries',
    category: 'both',
    apiType: 'Official (FusionSolar API)',
    apiAccess: 'partner',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'iSolarCloud Northbound Interface. Requires partner account. Full production and storage data.',
    link: 'https://github.com/guillaumeblanc/pyhfs',
  },
  {
    company: 'GoodWe',
    products: 'ES, EM, ET Series Inverters',
    category: 'both',
    apiType: 'Official (SEMS Portal API)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Public API documented by GoodWe. Regional servers available (CN, US, Global). Full monitoring data.',
    link: 'https://community.goodwe.com/static/images/2024-08-20597794.pdf',
  },
  {
    company: 'Growatt',
    products: 'MIN, MIC, MOD Inverters',
    category: 'both',
    apiType: 'Official (OpenAPI)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Documented public API with regional endpoints. Plant management, metrics, settings access.',
    link: 'https://openapi.growatt.com/',
  },
  {
    company: 'Sungrow',
    products: 'SG Inverters, SBR Batteries',
    category: 'both',
    apiType: 'Official (iSolarCloud API)',
    apiAccess: 'partner',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'iSolarCloud API platform. Partner registration required. Full plant and device data.',
    link: 'https://github.com/jsanchezdelvillar/Sungrow-API',
  },
  {
    company: 'Sol-Ark',
    products: '12K, 15K Hybrid Inverters',
    category: 'both',
    apiType: 'Unofficial (Modbus/SunSynk)',
    apiAccess: 'unofficial',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Local Modbus access or via SunSynk cloud API. Community libraries available. Full system data.',
    link: 'https://github.com/judasgutenberg/solarkmonitor',
  },
  // Battery Manufacturers
  {
    company: 'EcoFlow',
    products: 'DELTA Pro, PowerStream, PowerOcean',
    category: 'battery',
    apiType: 'Official (IoT API)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Developer platform with full documentation. REST API for all products including PowerStream micro-inverter.',
    link: 'https://developer.ecoflow.com/us/document/introduction',
  },
  {
    company: 'Anker SOLIX',
    products: 'Solarbank, F3800, SOLIX C800',
    category: 'battery',
    apiType: 'Unofficial (Cloud API)',
    apiAccess: 'unofficial',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Community Python library available. Device status, schedules, power data. No official API.',
    link: 'https://github.com/thomluther/anker-solix-api',
  },
  {
    company: 'FranklinWH',
    products: 'aPower, aGate Controller',
    category: 'battery',
    apiType: 'Unofficial (Cloud API)',
    apiAccess: 'unofficial',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Community Go/Python libraries. Full system telemetry. Official integration via Texture HQ in development.',
    link: 'https://github.com/tinkerator/benwh',
  },
  {
    company: 'Sonnen',
    products: 'sonnenBatterie, ecoLinx',
    category: 'battery',
    apiType: 'Official (Local API v2)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Local REST API with auth token. Full battery status, power flow, control capabilities.',
    link: 'https://jlunz.github.io/homeassistant/',
  },
  {
    company: 'Generac',
    products: 'PWRcell, PWRcell 2',
    category: 'battery',
    apiType: 'Unofficial (PWRview/SunSpec)',
    apiAccess: 'unofficial',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Local SunSpec Modbus access. PWRview cloud via reverse-engineering. No official public API.',
    link: 'https://github.com/edalquist/pwrcell_sunspec',
  },
  {
    company: 'Bluetti',
    products: 'AC200, EP500, EP600',
    category: 'battery',
    apiType: 'Official (Bluetooth) + Unofficial',
    apiAccess: 'unofficial',
    productionData: 'limited',
    batteryData: 'yes',
    notes: 'Official Bluetooth library. MQTT interface for local monitoring. Home Assistant integration available.',
    link: 'https://github.com/bluetti-official/bluetti-home-assistant',
  },
  {
    company: 'Panasonic',
    products: 'EverVolt Battery System',
    category: 'battery',
    apiType: 'None',
    apiAccess: 'none',
    productionData: 'no',
    batteryData: 'no',
    notes: 'App-only monitoring. No known public or unofficial API. Data locked in EverVolt app.',
    link: 'https://na.panasonic.com/us/energy-solutions/battery-storage/evervolt-battery-storage-system',
  },
  {
    company: 'LG Energy (RESU)',
    products: 'RESU 10H, RESU 16H Prime',
    category: 'battery',
    apiType: 'None (via inverter)',
    apiAccess: 'none',
    productionData: 'n/a',
    batteryData: 'limited',
    notes: 'No direct API. Battery data accessed via connected inverter (SolarEdge, SMA, etc.).',
    link: 'https://www.lgessbattery.com/',
  },
  // Solar Installers
  {
    company: 'Sunrun',
    products: 'Brightbox, Solar Systems',
    category: 'installer',
    apiType: 'Official (Customer OnDemand)',
    apiAccess: 'partner',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Customer API for telemetry data. Requires API key onboarding. OpenAPI spec available.',
    link: 'https://docs.customer-api.sunrun.com/',
  },
  {
    company: 'SunPower (Maxeon)',
    products: 'Equinox, SunVault',
    category: 'installer',
    apiType: 'Official (ONE API)',
    apiAccess: 'partner',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'SunPower ONE API released 2024. Requires partner agreement. PVS local access also available.',
    link: 'https://github.com/smcneece/ha-esunpower',
  },
  {
    company: 'Palmetto',
    products: 'Solar + Storage Systems',
    category: 'installer',
    apiType: 'Official (Energy Intelligence API)',
    apiAccess: 'public',
    productionData: 'yes',
    batteryData: 'yes',
    notes: 'Open developer API. Full energy profiles, production estimates, consumption data. Sandbox available.',
    link: 'https://ei.docs.palmetto.com/',
  },
  {
    company: 'Vivint Solar (now Sunrun)',
    products: 'Solar Systems',
    category: 'installer',
    apiType: 'Unofficial',
    apiAccess: 'unofficial',
    productionData: 'limited',
    batteryData: 'n/a',
    notes: 'Legacy systems. Community extraction tools. Being migrated to Sunrun platform.',
    link: 'https://github.com/abjordan/SolarMon',
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
    return <ApiReferenceSkeleton />;
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
      <div className="container mx-auto px-4 pt-4 pb-2">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary">
            <Zap className="h-3 w-3 mr-1" />
            API Reference
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Energy & EV API Reference
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive guide for solar, battery, EV, and charging network integrations
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <Tabs defaultValue="solar" className="w-full">
          <TabsList className="h-auto flex-wrap gap-1 p-1 bg-muted/50 max-w-full">
            <TabsTrigger value="solar" className="flex items-center gap-1.5 px-3 py-2 data-[state=active]:bg-background">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Solar & Battery</span>
              <span className="sm:hidden">Solar</span>
            </TabsTrigger>
            <TabsTrigger value="manufacturers" className="flex items-center gap-1.5 px-3 py-2 data-[state=active]:bg-background">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">EV Manufacturers</span>
              <span className="sm:hidden">EVs</span>
            </TabsTrigger>
            <TabsTrigger value="networks" className="flex items-center gap-1.5 px-3 py-2 data-[state=active]:bg-background">
              <BatteryCharging className="h-4 w-4" />
              <span className="hidden sm:inline">Charging Networks</span>
              <span className="sm:hidden">Charging</span>
            </TabsTrigger>
          </TabsList>

          {/* Solar & Battery Tab */}
          <TabsContent value="solar" className="space-y-8 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Solar Inverter & Battery API Comparison
                </CardTitle>
                <CardDescription>
                  Reference guide for integrating with solar inverters, home batteries, and solar installer platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>API Access</TableHead>
                        <TableHead className="text-center">Production</TableHead>
                        <TableHead className="text-center">Battery</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solarBatteryApis.map((api) => (
                        <TableRow key={api.company}>
                          <TableCell className="font-medium">{api.company}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px]">{api.products}</TableCell>
                          <TableCell>
                            <Badge variant={
                              api.category === 'both' ? 'default' : 
                              api.category === 'inverter' ? 'secondary' : 
                              api.category === 'battery' ? 'outline' : 'destructive'
                            }>
                              {api.category === 'both' ? 'Inverter + Battery' : 
                               api.category === 'inverter' ? 'Inverter' : 
                               api.category === 'battery' ? 'Battery' : 'Installer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ApiAccessBadge access={api.apiAccess} />
                          </TableCell>
                          <TableCell className="text-center">
                            {api.productionData === 'n/a' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <StatusIcon status={api.productionData} />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {api.batteryData === 'n/a' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <StatusIcon status={api.batteryData} />
                            )}
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

            {/* Solar/Battery Recommendations */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Good Fit for ZenSolar App
                </CardTitle>
                <CardDescription>
                  APIs recommended for integration based on market share, data quality, and ease of access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-background">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">✅ Highly Recommended</h4>
                    <ul className="text-sm space-y-2">
                      <li><strong>SMA</strong> - Official developer portal, public REST APIs, huge installed base. Well documented.</li>
                      <li><strong>Fronius</strong> - Excellent local + cloud APIs. Strong in residential/commercial. Great docs.</li>
                      <li><strong>EcoFlow</strong> - Official IoT developer platform. Growing rapidly in portable/home storage.</li>
                      <li><strong>GoodWe</strong> - Public API with good documentation. Popular in Europe and growing in US.</li>
                      <li><strong>Growatt</strong> - Documented public OpenAPI. Regional servers. Budget-friendly installs.</li>
                      <li><strong>Palmetto</strong> - Open developer API with sandbox. Great for installer integration.</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border bg-background">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Worth Exploring</h4>
                    <ul className="text-sm space-y-2">
                      <li><strong>Huawei FusionSolar</strong> - Partner API. Huge global market share but requires onboarding.</li>
                      <li><strong>Sungrow</strong> - iSolarCloud API. Major manufacturer, partner access required.</li>
                      <li><strong>Sonnen</strong> - Local API v2 is well documented. Premium battery market.</li>
                      <li><strong>Anker SOLIX</strong> - Unofficial but stable community API. Growing balcony solar market.</li>
                      <li><strong>FranklinWH</strong> - Community libraries available. Growing premium battery market.</li>
                      <li><strong>Sunrun</strong> - Customer OnDemand API. Largest US residential installer.</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">❌ Not Recommended (Currently)</h4>
                  <ul className="text-sm space-y-2">
                    <li><strong>Panasonic EverVolt</strong> - No API. Data locked in proprietary app.</li>
                    <li><strong>LG RESU</strong> - No direct API. Must access via connected inverter.</li>
                    <li><strong>Generac PWRcell</strong> - No official API. Reverse-engineering required.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-2">📋 Strategic Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Priority 1:</strong> Add <strong>SMA</strong> and <strong>Fronius</strong> - they cover a significant portion of the residential solar market and have excellent public APIs.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Priority 2:</strong> Add <strong>EcoFlow</strong> for the growing portable/home battery market, and <strong>GoodWe/Growatt</strong> for budget-conscious installations.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Priority 3:</strong> Pursue partner agreements with <strong>Huawei</strong> and <strong>Sungrow</strong> for international expansion, and <strong>Sunrun</strong> for US market coverage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                        <li>• <strong>Kempower ChargEye</strong> - Public REST API with full developer docs and Transactions API</li>
                        <li>• <strong>Powerly</strong> - Open API platform with session data and kWh history</li>
                        <li>• <strong>ChargeLab</strong> - Open developer program with REST API</li>
                        <li>• <strong>Siemens DepotFinity</strong> - Developer portal for fleet/depot charging</li>
                        <li>• <strong>Shell Recharge</strong> - Public developer portal with EV Charge Sessions API</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Badge className="bg-blue-500 mt-0.5">Partner APIs</Badge>
                    <div>
                      <p className="font-medium">Requires Partnership/Integration Agreement</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>ChargePoint</strong> - Partner API with full analytics (largest US network)</li>
                        <li>• <strong>EV Connect</strong> - White-label API platform for CPOs</li>
                        <li>• <strong>PowerFlex</strong> - Enterprise API for fleet/adaptive charging</li>
                        <li>• <strong>FLO</strong> - Fleet/CPO API via partnership agreement</li>
                        <li>• <strong>ABB Terra</strong> - OCPP compliant, data via CPO management systems</li>
                        <li>• <strong>Autel Energy</strong> - OCPP 2.0.1 CSMS, integrates with third-party platforms</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Badge className="bg-purple-500 mt-0.5">Unofficial</Badge>
                    <div>
                      <p className="font-medium">Community/Reverse-Engineered APIs</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• <strong>Enel X / JuiceBox</strong> - Unofficial JuiceNet API for home chargers with kWh data</li>
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

            {/* ZenSolar Fit Recommendations */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Good Fit for ZenSolar App
                </CardTitle>
                <CardDescription>
                  APIs recommended for integration based on data availability, ease of access, and user value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-background">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">✅ Highly Recommended</h4>
                    <ul className="text-sm space-y-2">
                      <li><strong>Kempower ChargEye</strong> - Public API, well-documented, full session data with kWh. OCPP 2.0.1 certified. Growing presence.</li>
                      <li><strong>Powerly</strong> - Open API platform with developer portal. Good documentation and session data access.</li>
                      <li><strong>ChargeLab</strong> - Public developer program. REST API for session/kWh data. Good for CPO integration.</li>
                      <li><strong>Enel X JuiceBox</strong> - Unofficial but stable API. Great for home charging data which complements solar production.</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border bg-background">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Worth Exploring</h4>
                    <ul className="text-sm space-y-2">
                      <li><strong>Shell Recharge</strong> - Good API but requires partner onboarding. Worth pursuing if user demand exists.</li>
                      <li><strong>EV Connect</strong> - White-label platform. Could enable integration with multiple CPOs at once.</li>
                      <li><strong>Siemens DepotFinity</strong> - Great for fleet users. Public API with good docs.</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">❌ Not Recommended (Currently)</h4>
                  <ul className="text-sm space-y-2">
                    <li><strong>Electrify America, EVgo, Blink</strong> - No public APIs. Cannot integrate without major partnership agreements.</li>
                    <li><strong>ChargePoint</strong> - Partner-only API with complex onboarding. Large network but high barrier to entry.</li>
                    <li><strong>Autel, ABB</strong> - Hardware manufacturers without direct driver APIs. Data flows through CPO platforms.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-2">📋 Strategic Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Primary approach:</strong> Focus on pulling EV charging data from <strong>vehicle APIs</strong> (Tesla already done, add Hyundai/Kia next) 
                    rather than charging networks. Vehicle APIs capture ALL charging sessions regardless of network used.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Secondary approach:</strong> Add <strong>home charger integrations</strong> (JuiceBox, Wallbox already started) since these directly 
                    complement solar production data and show self-consumption patterns.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Future consideration:</strong> Monitor <strong>Kempower</strong> and <strong>Powerly</strong> adoption in US market. If they gain traction, 
                    their open APIs would be valuable additions.
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