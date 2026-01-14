import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileCode2, 
  Coins, 
  Award, 
  Zap, 
  Battery, 
  Car, 
  PlugZap,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Flame,
  PiggyBank,
  Users,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SOLAR_MILESTONES, 
  BATTERY_MILESTONES, 
  EV_CHARGING_MILESTONES, 
  EV_MILES_MILESTONES,
  COMBO_MILESTONES 
} from '@/lib/nftMilestones';

// Contract addresses (placeholder - update when deployed)
const CONTRACTS = {
  ZSOLAR: {
    name: 'ZSOLAR Token',
    symbol: 'ZSOLAR',
    type: 'ERC-20',
    address: '0x...TBD', // Update after deployment
    network: 'Base Sepolia',
    chainId: 84532,
  },
  ZenSolarNFT: {
    name: 'ZenSolarNFT',
    symbol: 'ZSNFT',
    type: 'ERC-721',
    address: '0x...TBD', // Update after deployment
    network: 'Base Sepolia',
    chainId: 84532,
  },
  ZenSolar: {
    name: 'ZenSolar Controller',
    symbol: 'Controller',
    type: 'Controller',
    address: '0x...TBD', // Update after deployment
    network: 'Base Sepolia',
    chainId: 84532,
  },
};

// Smart contract milestone arrays (matching app definitions)
// NOTE: Update ZenSolar.sol to use these arrays
const CONTRACT_SOLAR_MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]; // 8 tiers
const CONTRACT_BATTERY_MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000]; // 7 tiers
const CONTRACT_CHARGING_MILESTONES = [100, 500, 1000, 1500, 2500, 5000, 10000, 25000]; // 8 tiers
const CONTRACT_EV_MILES_MILESTONES = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 150000, 200000]; // 10 tiers

// Tokenomics from contracts
const TOKENOMICS = {
  maxSupply: '50,000,000,000',
  founderAllocation: '1,250,000,000',
  initialOwnerAllocation: '3,750,000,000',
  tokensPerUnit: '1 ZSOLAR per kWh/mile',
  mintDistribution: {
    user: 93,
    burn: 5,
    lp: 1,
    treasury: 1,
  },
  transferTax: {
    burn: 3.5,
    treasury: 3.5,
    total: 7,
  },
  redemptionBurnFee: 2,
};

export default function AdminContracts() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !adminChecking) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin) {
        navigate('/');
        return;
      }
    }
  }, [user, authLoading, adminChecking, isAdmin, navigate]);

  const copyAddress = (address: string, name: string) => {
    navigator.clipboard.writeText(address);
    toast.success(`${name} address copied!`);
  };

  // Compare app milestones with contract milestones
  const compareArrays = (appArray: number[], contractArray: number[]) => {
    const appSet = new Set(appArray);
    const contractSet = new Set(contractArray);
    const missing = contractArray.filter(v => !appSet.has(v));
    const extra = appArray.filter(v => !contractSet.has(v));
    return { missing, extra, match: missing.length === 0 && extra.length === 0 };
  };

  const solarComparison = compareArrays(
    SOLAR_MILESTONES.map(m => m.threshold),
    CONTRACT_SOLAR_MILESTONES
  );
  const batteryComparison = compareArrays(
    BATTERY_MILESTONES.map(m => m.threshold),
    CONTRACT_BATTERY_MILESTONES
  );
  const chargingComparison = compareArrays(
    EV_CHARGING_MILESTONES.map(m => m.threshold),
    CONTRACT_CHARGING_MILESTONES
  );
  const evMilesComparison = compareArrays(
    EV_MILES_MILESTONES.map(m => m.threshold),
    CONTRACT_EV_MILES_MILESTONES
  );

  if (authLoading || adminChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Admin access required.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCode2 className="h-6 w-6 text-primary" />
            Smart Contracts Dashboard
          </h1>
          <p className="text-muted-foreground">Contract info, tokenomics, and milestone verification</p>
        </div>
      </div>

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(CONTRACTS).map(([key, contract]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{contract.type}</Badge>
                    <Badge variant="secondary">{contract.network}</Badge>
                  </div>
                  <CardTitle className="text-lg">{contract.name}</CardTitle>
                  <CardDescription>{contract.symbol}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      {contract.address}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyAddress(contract.address, contract.name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contract Architecture</CardTitle>
              <CardDescription>How the three contracts interact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
                <p className="text-muted-foreground">// Contract Relationships:</p>
                <p><span className="text-primary">ZSOLAR</span> ← ERC-20 token, mintable by ZenSolar controller</p>
                <p><span className="text-secondary">ZenSolarNFT</span> ← ERC-721 NFTs, mintable by ZenSolar controller</p>
                <p><span className="text-accent">ZenSolar</span> ← Controller: tracks energy, mints tokens/NFTs</p>
                <p className="text-muted-foreground mt-4">// Flow:</p>
                <p>Backend → ZenSolar.mintRewards() → ZSOLAR.mint() + NFT milestones</p>
                <p>Backend → ZenSolar.registerUser() → Welcome NFT</p>
                <p>Backend → ZenSolar.mintComboNFT() → Combo achievement NFTs</p>
                <p>User → ZenSolar.redeemNFT() → Burns NFT, mints ZSOLAR (2% burn fee)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokenomics Tab */}
        <TabsContent value="tokenomics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Supply</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{TOKENOMICS.maxSupply}</p>
                <p className="text-xs text-muted-foreground">ZSOLAR tokens</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tokens per Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1:1</p>
                <p className="text-xs text-muted-foreground">{TOKENOMICS.tokensPerUnit}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transfer Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{TOKENOMICS.transferTax.total}%</p>
                <p className="text-xs text-muted-foreground">3.5% burn + 3.5% treasury</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Redemption Fee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{TOKENOMICS.redemptionBurnFee}%</p>
                <p className="text-xs text-muted-foreground">Burned on NFT redeem</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-token" />
                Mint Distribution
              </CardTitle>
              <CardDescription>How minted rewards are distributed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> User Rewards
                      </span>
                      <span className="font-bold text-primary">{TOKENOMICS.mintDistribution.user}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${TOKENOMICS.mintDistribution.user}%` }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Flame className="h-5 w-5 text-destructive mx-auto mb-1" />
                    <p className="text-2xl font-bold text-destructive">{TOKENOMICS.mintDistribution.burn}%</p>
                    <p className="text-xs text-muted-foreground">Burned</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                    <TrendingDown className="h-5 w-5 text-secondary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-secondary">{TOKENOMICS.mintDistribution.lp}%</p>
                    <p className="text-xs text-muted-foreground">LP Rewards</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <PiggyBank className="h-5 w-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-accent">{TOKENOMICS.mintDistribution.treasury}%</p>
                    <p className="text-xs text-muted-foreground">Treasury</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Initial Token Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Founder Wallet</TableCell>
                    <TableCell className="text-right font-mono">{TOKENOMICS.founderAllocation}</TableCell>
                    <TableCell className="text-right">2.5%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Initial Owner (Controller)</TableCell>
                    <TableCell className="text-right font-mono">{TOKENOMICS.initialOwnerAllocation}</TableCell>
                    <TableCell className="text-right">7.5%</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Remaining for Minting</TableCell>
                    <TableCell className="text-right font-mono">45,000,000,000</TableCell>
                    <TableCell className="text-right font-medium">90%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-solar" />
                  Solar Milestones
                </CardTitle>
                <CardDescription>8 tiers from 500-100,000 kWh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SOLAR_MILESTONES.map(m => (
                    <Badge key={m.id} variant="outline">{m.threshold.toLocaleString()} kWh</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-energy" />
                  Battery Milestones
                </CardTitle>
                <CardDescription>7 tiers from 500-50,000 kWh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {BATTERY_MILESTONES.map(m => (
                    <Badge key={m.id} variant="outline">{m.threshold.toLocaleString()} kWh</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlugZap className="h-5 w-5 text-warning" />
                  EV Charging Milestones
                </CardTitle>
                <CardDescription>8 tiers from 100-25,000 kWh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EV_CHARGING_MILESTONES.map(m => (
                    <Badge key={m.id} variant="outline">{m.threshold.toLocaleString()} kWh</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-accent" />
                  EV Miles Milestones
                </CardTitle>
                <CardDescription>10 tiers from 100-200,000 miles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EV_MILES_MILESTONES.map(m => (
                    <Badge key={m.id} variant="outline">{m.threshold.toLocaleString()} mi</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Combo Achievements
              </CardTitle>
              <CardDescription>8 combo NFTs for cross-category achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMBO_MILESTONES.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Combo</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App vs Smart Contract Verification</CardTitle>
              <CardDescription>
                Comparing milestone thresholds in the app with smart contract arrays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Solar */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-solar" />
                  <div>
                    <p className="font-medium">Solar Milestones</p>
                    <p className="text-xs text-muted-foreground">App: 8 tiers | Contract: 8 tiers</p>
                  </div>
                </div>
                {solarComparison.match ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Match
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Mismatch
                  </Badge>
                )}
              </div>

              {/* Battery */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-energy" />
                  <div>
                    <p className="font-medium">Battery Milestones</p>
                    <p className="text-xs text-muted-foreground">
                      App: 7 tiers (max 50K) | Contract: 8 tiers (max 100K)
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Missing 100K tier
                </Badge>
              </div>

              {/* Charging */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <PlugZap className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">EV Charging Milestones</p>
                    <p className="text-xs text-muted-foreground">
                      App: Custom [100-25K] | Contract: uses energyMilestones [500-100K]
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Different thresholds
                </Badge>
              </div>

              {/* EV Miles */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">EV Miles Milestones</p>
                    <p className="text-xs text-muted-foreground">App: 10 tiers | Contract: 10 tiers</p>
                  </div>
                </div>
                {evMilesComparison.match ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Match
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Mismatch
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Recommended Fixes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded bg-background border">
                <p className="font-medium">1. Battery Milestones</p>
                <p className="text-sm text-muted-foreground">
                  Add 100,000 kWh tier to match contract's energyMilestones array.
                </p>
              </div>
              <div className="p-3 rounded bg-background border">
                <p className="font-medium">2. EV Charging Milestones</p>
                <p className="text-sm text-muted-foreground">
                  Either update app to use same thresholds as energyMilestones [500-100K], 
                  or update contract to use a separate chargingMilestones array matching app [100-25K].
                </p>
              </div>
              <div className="p-3 rounded bg-background border">
                <p className="font-medium">3. Deploy Contracts</p>
                <p className="text-sm text-muted-foreground">
                  Deploy to Base Sepolia and update addresses in this file.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
