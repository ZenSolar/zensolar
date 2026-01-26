import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Fingerprint, 
  Eye, 
  Server, 
  Database, 
  Globe,
  Smartphone,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Activity
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { HexagateMonitoringPanel } from "@/components/admin/HexagateMonitoringPanel";

type SecurityStatus = 'implemented' | 'partial' | 'planned' | 'not_started';

interface SecurityLayer {
  id: string;
  name: string;
  description: string;
  status: SecurityStatus;
  icon: React.ElementType;
  details: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const securityLayers: SecurityLayer[] = [
  {
    id: 'auth',
    name: 'User Authentication',
    description: 'Supabase Auth with JWT validation and session management',
    status: 'implemented',
    icon: Lock,
    priority: 'critical',
    details: [
      'Email/password authentication with secure hashing',
      'JWT tokens with automatic refresh',
      'Session persistence in localStorage',
      'Password reset flow with email verification',
      'Auth state listener for real-time updates'
    ]
  },
  {
    id: 'rls',
    name: 'Row-Level Security (RLS)',
    description: 'Database-level access control on all tables',
    status: 'implemented',
    icon: Database,
    priority: 'critical',
    details: [
      'All tables have RLS enabled',
      'Users can only access their own data',
      'Admin role verification via security definer functions',
      'No direct table access without policy check',
      'Separate user_roles table to prevent privilege escalation'
    ]
  },
  {
    id: 'bot',
    name: 'Bot Detection',
    description: 'Client-side fingerprinting and automation detection',
    status: 'implemented',
    icon: Fingerprint,
    priority: 'high',
    details: [
      'User agent pattern matching for known bots',
      'Webdriver/Selenium/Puppeteer detection',
      'Headless browser detection',
      'Screen dimension validation',
      'Touch capability verification',
      'Plugin presence checks'
    ]
  },
  {
    id: 'wallet',
    name: 'Wallet Security',
    description: 'Secure Web3 wallet connection via AppKit/WalletConnect',
    status: 'implemented',
    icon: Wallet,
    priority: 'high',
    details: [
      'WalletConnect v2 protocol for secure connections',
      'No private key storage in application',
      'Transaction signing happens in user wallet',
      'MetaMask and Base Wallet featured for security',
      'Project ID fetched from backend for PWA compatibility'
    ]
  },
  {
    id: 'device',
    name: 'Device Uniqueness',
    description: 'One energy account per ZenSolar user enforcement',
    status: 'partial',
    icon: Smartphone,
    priority: 'high',
    details: [
      'is_device_claimed() function checks device ownership',
      'Devices linked to single user via connected_devices table',
      'Cross-account device detection in place',
      'TODO: Enhanced hardware fingerprinting'
    ]
  },
  {
    id: 'turnstile',
    name: 'CAPTCHA Protection',
    description: 'Cloudflare Turnstile invisible CAPTCHA for signup/minting',
    status: 'implemented',
    icon: ShieldCheck,
    priority: 'high',
    details: [
      'Invisible CAPTCHA on signup form',
      'Invisible CAPTCHA on login form',
      'Server-side token verification via Edge Function',
      'Zero friction for legitimate users',
      'Blocks automated account creation'
    ]
  },
  {
    id: 'api',
    name: 'API Security',
    description: 'Edge Functions with JWT validation and rate limiting',
    status: 'implemented',
    icon: Server,
    priority: 'critical',
    details: [
      'All Edge Functions validate Authorization header',
      'getClaims() verification before data access',
      'CORS headers configured for origin protection',
      'Service role key only used server-side',
      'No raw SQL execution from client'
    ]
  },
  {
    id: 'input',
    name: 'Input Validation',
    description: 'Zod schema validation on all user inputs',
    status: 'implemented',
    icon: Eye,
    priority: 'high',
    details: [
      'Email format validation',
      'Password strength requirements',
      'Display name length limits',
      'XSS prevention via React auto-escaping',
      'No dangerouslySetInnerHTML usage'
    ]
  },
  {
    id: 'onchain',
    name: 'On-Chain Monitoring',
    description: 'Real-time monitoring of smart contract activity',
    status: 'planned',
    icon: Globe,
    priority: 'medium',
    details: [
      'Hexagate integration for Base L2 monitoring (free for builders)',
      'Large transfer alerts',
      'Unusual minting volume detection',
      'Contract pause capability for emergencies',
      'TODO: Configure Hexagate dashboard'
    ]
  },
  {
    id: 'rate',
    name: 'Rate Limiting',
    description: 'Throttling on sensitive operations',
    status: 'planned',
    icon: Clock,
    priority: 'medium',
    details: [
      'Max mints per user per day',
      'Progressive unlocking for new accounts',
      'API request throttling',
      'TODO: Implement mint-rate-limit Edge Function'
    ]
  },
  {
    id: 'contract',
    name: 'Smart Contract Security',
    description: 'OpenZeppelin-based contracts with access control',
    status: 'implemented',
    icon: Key,
    priority: 'critical',
    details: [
      'OpenZeppelin AccessControl for role management',
      'MINTER_ROLE restricted to backend only',
      'ReentrancyGuard on all public functions',
      'Pausable functionality for emergencies',
      'Events emitted for all state changes'
    ]
  }
];

const getStatusBadge = (status: SecurityStatus) => {
  switch (status) {
    case 'implemented':
      return <Badge className="bg-primary/20 text-primary border-primary/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Implemented</Badge>;
    case 'partial':
      return <Badge className="bg-secondary/20 text-secondary border-secondary/30"><AlertTriangle className="h-3 w-3 mr-1" /> Partial</Badge>;
    case 'planned':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="h-3 w-3 mr-1" /> Planned</Badge>;
    default:
      return <Badge variant="outline">Not Started</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'high':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">High</Badge>;
    case 'medium':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Medium</Badge>;
    default:
      return <Badge variant="outline">Low</Badge>;
  }
};

export default function AdminSecurityArchitecture() {
  const implementedCount = securityLayers.filter(l => l.status === 'implemented').length;
  const partialCount = securityLayers.filter(l => l.status === 'partial').length;
  const plannedCount = securityLayers.filter(l => l.status === 'planned').length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Security Architecture</h1>
            <p className="text-muted-foreground">Comprehensive security posture documentation</p>
          </div>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.round(((implementedCount + partialCount * 0.5) / securityLayers.length) * 100)}%
                </p>
              </div>
              <ShieldCheck className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Implemented</p>
                <p className="text-3xl font-bold text-primary">{implementedCount}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partial</p>
                <p className="text-3xl font-bold text-secondary">{partialCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-secondary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planned</p>
                <p className="text-3xl font-bold text-blue-400">{plannedCount}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EVearn Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Competitive Security Comparison
          </CardTitle>
          <CardDescription>
            ZenSolar vs EVearn.io security posture analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Security Feature</TableHead>
                <TableHead className="text-center">ZenSolar</TableHead>
                <TableHead className="text-center">EVearn.io</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Blockchain Platform</TableCell>
                <TableCell className="text-center"><Badge>Base L2</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">VeChain</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Base offers Ethereum-grade security + Coinbase backing</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Wallet Integration</TableCell>
                <TableCell className="text-center"><Badge className="bg-primary/20 text-primary">WalletConnect v2</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">VeWorld</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">WalletConnect supports 300+ wallets vs single ecosystem</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bot Protection</TableCell>
                <TableCell className="text-center"><Badge className="bg-primary/20 text-primary">Turnstile + Custom</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">Guardian Platform</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Both use multi-layered detection</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Device Verification</TableCell>
                <TableCell className="text-center"><Badge className="bg-secondary/20 text-secondary">Partial</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">VePassport</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Enhancement opportunity for ZenSolar</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Smart Contract Audit</TableCell>
                <TableCell className="text-center"><Badge className="bg-blue-500/20 text-blue-400">Planned</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">Unknown</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Pre-mainnet audit recommended</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Enterprise Support</TableCell>
                <TableCell className="text-center"><Badge className="bg-primary/20 text-primary">Coinbase Security</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline">VeChain Foundation</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Base offers free security reviews for builders</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Layers Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Layers
          </CardTitle>
          <CardDescription>
            Complete breakdown of all security implementations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {securityLayers.map((layer) => (
            <div key={layer.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-card border rounded-lg">
                    <layer.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{layer.name}</h3>
                    <p className="text-sm text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(layer.priority)}
                  {getStatusBadge(layer.status)}
                </div>
              </div>
              <div className="ml-12 pl-3 border-l-2 border-muted">
                <ul className="space-y-1">
                  {layer.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className={detail.startsWith('TODO:') ? 'text-amber-400' : ''}>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Pre-Launch (Critical)</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Implement Cloudflare Turnstile on auth forms
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Add mint rate limiting Edge Function
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Configure Hexagate monitoring dashboard
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Pre-Mainnet (High)</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Smart contract audit via Coinbase Security
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Enhanced device fingerprinting
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Bug bounty program setup
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Security Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <a 
              href="https://docs.base.org/base-chain/security/security-council" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Base Security Council</span>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            <a 
              href="https://www.hexagate.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Hexagate Monitoring</span>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            <a 
              href="https://developers.cloudflare.com/turnstile/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Cloudflare Turnstile</span>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Hexagate Monitoring Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            On-Chain Security Monitoring
          </CardTitle>
          <CardDescription>
            Real-time contract activity monitoring via Hexagate (free for Base builders)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HexagateMonitoringPanel />
        </CardContent>
      </Card>
    </div>
  );
}
