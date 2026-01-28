import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Rocket, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Circle,
  AlertTriangle,
  Coins,
  Droplets,
  Flame,
  Wallet,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useOnChainMetrics } from "@/hooks/useOnChainMetrics";
import { formatTokenAmount, formatUSD } from "@/lib/tokenomics";

// Contract addresses
const CONTRACTS = {
  zsolar: "0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE",
  controller: "0x54542Ad80FACbedA774465fE9724c281FBaf7437",
  testUsdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  uniswapFactory: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
  positionManager: "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2",
  minterWallet: "0x79ded21cF400F3ce354914D91fb209737d76b16D",
};

// Deployment steps
type StepStatus = "pending" | "active" | "complete";

interface DeploymentStepData {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
}

const DEPLOYMENT_STEPS: DeploymentStepData[] = [
  {
    id: "step0",
    title: "Mint Initial ZSOLAR Supply",
    description: "Mint 10,000 ZSOLAR tokens to the minter wallet",
    status: "pending",
  },
  {
    id: "step1",
    title: "Create Uniswap V3 Pool",
    description: "Create ZSOLAR/USDC pool via Factory contract",
    status: "pending",
  },
  {
    id: "step2",
    title: "Initialize Pool Price",
    description: "Set initial price to $0.10 via sqrtPriceX96",
    status: "pending",
  },
  {
    id: "step3",
    title: "Approve USDC",
    description: "Approve USDC spending for Position Manager",
    status: "pending",
  },
  {
    id: "step4",
    title: "Approve ZSOLAR",
    description: "Approve ZSOLAR spending for Position Manager",
    status: "pending",
  },
  {
    id: "step5",
    title: "Mint Liquidity Position",
    description: "Add 1,000 USDC + 10,000 ZSOLAR to pool",
    status: "pending",
  },
  {
    id: "step6",
    title: "Verify Deployment",
    description: "Confirm pool reserves and price",
    status: "pending",
  },
];

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

function ContractAddressCard({ label, address, basescanPath }: { label: string; address: string; basescanPath?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <code className="text-xs text-muted-foreground font-mono">{address}</code>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(address, label)}>
          <Copy className="h-4 w-4" />
        </Button>
        {basescanPath && (
          <Button variant="ghost" size="icon" asChild>
            <a href={`https://sepolia.basescan.org/address/${address}${basescanPath}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function DeploymentStep({ step, index, isActive }: { step: DeploymentStepData; index: number; isActive: boolean }) {
  const getStatusIcon = () => {
    switch (step.status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "active":
        return <RefreshCw className="h-5 w-5 text-solar animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${isActive ? 'border-solar bg-solar/5' : 'border-border'}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Step {index}</Badge>
          <h4 className="font-medium">{step.title}</h4>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
      </div>
    </div>
  );
}

export default function AdminBetaDeployment() {
  const { metrics, refresh } = useOnChainMetrics();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8 text-solar" />
            Beta Deployment Guide
          </h1>
          <p className="text-muted-foreground mt-1">
            Deploy ZSOLAR/USDC liquidity pool on Base Sepolia testnet
          </p>
        </div>
        <Badge variant="outline" className="text-solar border-solar">
          Base Sepolia Testnet
        </Badge>
      </div>

      {/* Live Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-sm">Total Minted</span>
            </div>
            <p className="text-2xl font-bold">{formatTokenAmount(metrics.totalMinted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Total Burned</span>
            </div>
            <p className="text-2xl font-bold">{formatTokenAmount(metrics.totalBurned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm">LP Depth</span>
            </div>
            <p className="text-2xl font-bold">{formatUSD(metrics.lpUsdcBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4 text-green-500" />
              <span className="text-sm">Est. Price</span>
            </div>
            <p className="text-2xl font-bold">{formatUSD(metrics.estimatedPrice)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="guide" className="space-y-6">
        <TabsList>
          <TabsTrigger value="guide">Deployment Guide</TabsTrigger>
          <TabsTrigger value="contracts">Contract Addresses</TabsTrigger>
          <TabsTrigger value="parameters">Pre-Calculated Values</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-6">
          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Why BaseScan?</AlertTitle>
            <AlertDescription>
              The Uniswap V3 web interface doesn't support Base Sepolia testnet. We interact with the 
              smart contracts directly via BaseScan's "Write Contract" feature. The pool will work identically 
              to mainnet once deployed.
            </AlertDescription>
          </Alert>

          {/* Deployment Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Steps</CardTitle>
              <CardDescription>
                Follow these steps in order to deploy the ZSOLAR/USDC liquidity pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEPLOYMENT_STEPS.map((step, index) => (
                <DeploymentStep 
                  key={step.id} 
                  step={step} 
                  index={index} 
                  isActive={index === activeStep}
                />
              ))}
            </CardContent>
          </Card>

          {/* Step 0: Mint ZSOLAR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 0</Badge>
                Mint Initial ZSOLAR Supply
              </CardTitle>
              <CardDescription>
                Before creating the LP, mint 10,000 ZSOLAR tokens to the minter wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Option A: Via ZenSolar Controller</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    Go to <a href={`https://sepolia.basescan.org/address/${CONTRACTS.controller}#writeContract`} target="_blank" rel="noopener noreferrer" className="text-solar hover:underline inline-flex items-center gap-1">
                      ZenSolar Controller <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Click "Connect to Web3" with the contract owner wallet</li>
                  <li>Find the <code className="bg-muted px-1 rounded">mintRewards</code> function</li>
                  <li>Enter parameters:
                    <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                      <p>to: <code>{CONTRACTS.minterWallet}</code></p>
                      <p>tokenAmount: <code>10000000000000000000000</code> (10,000 × 10^18)</p>
                      <p>nftIds: <code>[]</code></p>
                    </div>
                  </li>
                  <li>Click "Write" → Confirm in MetaMask</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Verify Balance</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to ZSOLAR Token → <strong>Read Contract</strong> → <code className="bg-muted px-1 rounded">balanceOf</code></li>
                  <li>Enter: <code className="bg-muted px-1 rounded">{CONTRACTS.minterWallet}</code></li>
                  <li>Should show: <code className="bg-muted px-1 rounded">10000000000000000000000</code></li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Create Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 1</Badge>
                Create the Pool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to <a href={`https://sepolia.basescan.org/address/${CONTRACTS.uniswapFactory}#writeContract`} target="_blank" rel="noopener noreferrer" className="text-solar hover:underline inline-flex items-center gap-1">
                    Uniswap V3 Factory <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Click "Connect to Web3" and connect your minter wallet</li>
                <li>Find the <code className="bg-muted px-1 rounded">createPool</code> function</li>
                <li>Enter parameters:
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                    <p>tokenA: <code>{CONTRACTS.testUsdc}</code></p>
                    <p>tokenB: <code>{CONTRACTS.zsolar}</code></p>
                    <p>fee: <code>10000</code></p>
                  </div>
                </li>
                <li>Click "Write" → Confirm in MetaMask</li>
                <li><strong>Save the pool address</strong> from the transaction receipt</li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 2: Initialize Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 2</Badge>
                Initialize Pool Price
              </CardTitle>
              <CardDescription>
                Set the initial price to $0.10 USDC per ZSOLAR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to the newly created pool address on BaseScan</li>
                <li>Find the <code className="bg-muted px-1 rounded">initialize</code> function</li>
                <li>Enter parameter:
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs">
                    <p>sqrtPriceX96: <code>250541448375047931186413801569</code></p>
                  </div>
                </li>
                <li>Click "Write" → Confirm in MetaMask</li>
              </ol>
              <Alert>
                <AlertDescription>
                  This sqrtPriceX96 value sets the price to exactly $0.10 USDC per ZSOLAR token.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: Approve USDC */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 3</Badge>
                Approve USDC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to <a href={`https://sepolia.basescan.org/address/${CONTRACTS.testUsdc}#writeContract`} target="_blank" rel="noopener noreferrer" className="text-solar hover:underline inline-flex items-center gap-1">
                    Test USDC <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Find the <code className="bg-muted px-1 rounded">approve</code> function</li>
                <li>Enter parameters:
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                    <p>spender: <code>{CONTRACTS.positionManager}</code></p>
                    <p>amount: <code>1000000000</code> (1,000 USDC = 1000 × 10^6)</p>
                  </div>
                </li>
                <li>Click "Write" → Confirm in MetaMask</li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 4: Approve ZSOLAR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 4</Badge>
                Approve ZSOLAR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to <a href={`https://sepolia.basescan.org/address/${CONTRACTS.zsolar}#writeContract`} target="_blank" rel="noopener noreferrer" className="text-solar hover:underline inline-flex items-center gap-1">
                    ZSOLAR Token <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Find the <code className="bg-muted px-1 rounded">approve</code> function</li>
                <li>Enter parameters:
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                    <p>spender: <code>{CONTRACTS.positionManager}</code></p>
                    <p>amount: <code>10000000000000000000000</code> (10,000 ZSOLAR)</p>
                  </div>
                </li>
                <li>Click "Write" → Confirm in MetaMask</li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 5: Mint Liquidity Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Step 5</Badge>
                Mint Liquidity Position
              </CardTitle>
              <CardDescription>
                Add 1,000 USDC + 10,000 ZSOLAR to the pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to <a href={`https://sepolia.basescan.org/address/${CONTRACTS.positionManager}#writeContract`} target="_blank" rel="noopener noreferrer" className="text-solar hover:underline inline-flex items-center gap-1">
                    NonfungiblePositionManager <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Find the <code className="bg-muted px-1 rounded">mint</code> function</li>
                <li>Enter the MintParams tuple:
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                    <p>token0: <code>{CONTRACTS.testUsdc}</code></p>
                    <p>token1: <code>{CONTRACTS.zsolar}</code></p>
                    <p>fee: <code>10000</code></p>
                    <p>tickLower: <code>-887200</code></p>
                    <p>tickUpper: <code>887200</code></p>
                    <p>amount0Desired: <code>1000000000</code> (1,000 USDC)</p>
                    <p>amount1Desired: <code>10000000000000000000000</code> (10,000 ZSOLAR)</p>
                    <p>amount0Min: <code>0</code></p>
                    <p>amount1Min: <code>0</code></p>
                    <p>recipient: <code>{CONTRACTS.minterWallet}</code></p>
                    <p>deadline: <code>1800000000</code></p>
                  </div>
                </li>
                <li>Click "Write" → Confirm in MetaMask</li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 6: Verify */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Step 6</Badge>
                Verify Success
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Check your wallet on BaseScan for the NFT position</li>
                <li>Go to the pool address and verify reserves in <strong>Read Contract</strong> → <code className="bg-muted px-1 rounded">slot0</code></li>
                <li>Enable Live Beta mode in ZenSolar admin panel</li>
              </ol>
              <Button onClick={refresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh On-Chain Metrics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Addresses (Base Sepolia)</CardTitle>
              <CardDescription>
                Click to copy or open in BaseScan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContractAddressCard 
                label="ZSOLAR Token" 
                address={CONTRACTS.zsolar} 
                basescanPath="#writeContract"
              />
              <ContractAddressCard 
                label="ZenSolar Controller" 
                address={CONTRACTS.controller} 
                basescanPath="#writeContract"
              />
              <ContractAddressCard 
                label="Test USDC" 
                address={CONTRACTS.testUsdc} 
                basescanPath="#writeContract"
              />
              <ContractAddressCard 
                label="Uniswap V3 Factory" 
                address={CONTRACTS.uniswapFactory} 
                basescanPath="#writeContract"
              />
              <ContractAddressCard 
                label="NonfungiblePositionManager" 
                address={CONTRACTS.positionManager} 
                basescanPath="#writeContract"
              />
              <ContractAddressCard 
                label="Minter Wallet" 
                address={CONTRACTS.minterWallet} 
                basescanPath=""
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Calculated Values</CardTitle>
              <CardDescription>
                These values are pre-calculated for the $0.10 price floor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Parameter</th>
                      <th className="text-left p-3 font-medium">Value</th>
                      <th className="text-left p-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Fee Tier</td>
                      <td className="p-3 font-mono">10000</td>
                      <td className="p-3 text-muted-foreground">1% fee (for low-volume testnet)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">sqrtPriceX96</td>
                      <td className="p-3 font-mono text-xs break-all">250541448375047931186413801569</td>
                      <td className="p-3 text-muted-foreground">Sets $0.10 price</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">tickLower</td>
                      <td className="p-3 font-mono">-887200</td>
                      <td className="p-3 text-muted-foreground">Full range lower bound</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">tickUpper</td>
                      <td className="p-3 font-mono">887200</td>
                      <td className="p-3 text-muted-foreground">Full range upper bound</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert className="mt-6">
                <AlertDescription>
                  <strong>Token Order:</strong> USDC (<code>0x036...</code>) {"<"} ZSOLAR (<code>0xAb1...</code>), 
                  so USDC is token0, ZSOLAR is token1.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scaling Reference</CardTitle>
              <CardDescription>
                All amounts maintain the $0.10 price ratio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">USDC Amount</th>
                      <th className="text-left p-3 font-medium">ZSOLAR Amount</th>
                      <th className="text-left p-3 font-medium">Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">10</td>
                      <td className="p-3">100</td>
                      <td className="p-3 text-muted-foreground">Minimal test</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">100</td>
                      <td className="p-3">1,000</td>
                      <td className="p-3 text-muted-foreground">Basic testing</td>
                    </tr>
                    <tr className="border-b bg-solar/10">
                      <td className="p-3 font-medium">1,000</td>
                      <td className="p-3 font-medium">10,000</td>
                      <td className="p-3 text-solar font-medium">Recommended Beta Launch</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">5,000</td>
                      <td className="p-3">50,000</td>
                      <td className="p-3 text-muted-foreground">Extended Beta</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
