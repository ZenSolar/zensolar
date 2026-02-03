import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Binary,
  Fingerprint,
  TrendingUp
} from 'lucide-react';

const proofOfDeltaProcess = [
  {
    step: 1,
    title: 'Device Registration',
    description: 'When a user connects a device via OAuth, SEGI creates a unique device fingerprint (hash of provider + device_id).',
    technical: 'deviceFingerprint = keccak256(provider, device_id)',
    icon: Fingerprint,
  },
  {
    step: 2,
    title: 'Watermark Initialization',
    description: 'The device\'s current cumulative metrics are recorded as the baseline watermark at time of first connection.',
    technical: 'watermark[deviceFingerprint] = currentCumulativeValue',
    icon: Database,
  },
  {
    step: 3,
    title: 'Delta Calculation',
    description: 'At mint time, SEGI calculates the difference between current readings and the stored watermark.',
    technical: 'delta = currentValue - watermark[deviceFingerprint]',
    icon: TrendingUp,
  },
  {
    step: 4,
    title: 'Token Minting',
    description: 'Only the delta amount is eligible for token minting. The watermark is updated to the new cumulative value.',
    technical: 'mint(delta); watermark[deviceFingerprint] = currentValue',
    icon: Binary,
  },
  {
    step: 5,
    title: 'On-Chain Recording',
    description: 'The new watermark is recorded on-chain, creating an immutable audit trail.',
    technical: 'emit WatermarkUpdated(deviceFingerprint, newValue, blockNumber)',
    icon: Lock,
  },
];

const attackVectorsMitigated = [
  {
    attack: 'Double-Minting',
    description: 'User attempts to mint tokens for the same energy twice.',
    mitigation: 'Device watermark tracks cumulative value; only delta since last mint is eligible.',
  },
  {
    attack: 'Account Transfer Abuse',
    description: 'User transfers device ownership to re-mint historical energy.',
    mitigation: 'Watermark is device-bound, not user-bound. History follows the device.',
  },
  {
    attack: 'Multi-Account Gaming',
    description: 'User creates multiple accounts to claim the same device.',
    mitigation: 'Device can only be claimed once; first-claim-wins with owner verification.',
  },
  {
    attack: 'Data Manipulation',
    description: 'User attempts to spoof energy data.',
    mitigation: 'Data pulled directly from manufacturer APIs with cryptographic signatures.',
  },
  {
    attack: 'Replay Attacks',
    description: 'User replays old API responses to inflate metrics.',
    mitigation: 'Timestamps validated against block time; stale data rejected.',
  },
];

const implementationOptions = [
  {
    name: 'On-Chain Mapping',
    description: 'Store watermarks directly in smart contract storage.',
    pros: ['Fully trustless', 'Publicly verifiable', 'Immutable'],
    cons: ['~20k gas per update', 'Higher operational costs'],
    recommended: false,
  },
  {
    name: 'Hybrid (Recommended)',
    description: 'Database for real-time checks + periodic on-chain Merkle roots.',
    pros: ['Fast operations', 'Low gas costs', 'Cryptographically auditable'],
    cons: ['Slightly delayed finality', 'More complex implementation'],
    recommended: true,
  },
  {
    name: 'Database-Only',
    description: 'Store all watermarks in centralized database.',
    pros: ['Zero gas costs', 'Instant updates', 'Simple implementation'],
    cons: ['Requires trust in ZenSolar', 'Not externally auditable'],
    recommended: false,
  },
];

export default function AdminPatentProofOfDelta() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
            <ShieldCheck className="h-3.5 w-3.5 mr-2" />
            Token Integrity
          </Badge>
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
            Core Innovation
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Proof-of-Delta™ Specification</h1>
        <p className="text-muted-foreground">
          Technical specification for the device watermark system that ensures token integrity and prevents double-minting.
        </p>
      </motion.div>

      {/* Core Concept */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5 border-amber-500/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">What is Proof-of-Delta?</h2>
                <p className="text-muted-foreground">
                  Proof-of-Delta is a verification mechanism that ensures tokens are only minted for <strong className="text-foreground">incremental, never-before-tokenized</strong> energy activity. 
                  It tracks a "high-water mark" per physical device—the cumulative amount of energy that has already been converted to tokens.
                </p>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/60 font-mono text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">mintableAmount</span> = 
                  <span className="text-blue-600 dark:text-blue-400"> currentReading</span> - 
                  <span className="text-amber-600 dark:text-amber-400"> deviceWatermark</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Process Flow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Binary className="h-5 w-5 text-primary" />
              Process Flow
            </CardTitle>
            <CardDescription>
              Step-by-step breakdown of how Proof-of-Delta operates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proofOfDeltaProcess.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-md">
                    <step.icon className="h-5 w-5 text-white" />
                  </div>
                  {index < proofOfDeltaProcess.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent mt-2 min-h-[16px]" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">STEP {step.step}</span>
                  </div>
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-primary">{step.technical}</code>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Attack Vectors Mitigated */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Attack Vectors Mitigated
            </CardTitle>
            <CardDescription>
              Security threats addressed by the Proof-of-Delta system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attackVectorsMitigated.map((item, index) => (
                <motion.div
                  key={item.attack}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                  className="p-3 rounded-lg bg-muted/50 border border-border/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-red-500/10 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.attack}</p>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{item.mitigation}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Implementation Options */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Implementation Options
            </CardTitle>
            <CardDescription>
              Technical approaches for storing and verifying device watermarks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {implementationOptions.map((option, index) => (
                <motion.div
                  key={option.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.1 }}
                  className={`p-4 rounded-xl border ${option.recommended ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/20' : 'border-border/60 bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {option.name}
                        {option.recommended && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Pros</p>
                      <ul className="space-y-1">
                        {option.pros.map(pro => (
                          <li key={pro} className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Cons</p>
                      <ul className="space-y-1">
                        {option.cons.map(con => (
                          <li key={con} className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solidity Snippet */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Smart Contract Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted/80 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofOfDelta {
    // Device fingerprint => cumulative tokenized value
    mapping(bytes32 => uint256) public deviceWatermarks;
    
    event WatermarkUpdated(
        bytes32 indexed deviceFingerprint,
        uint256 previousValue,
        uint256 newValue,
        uint256 deltaMinted
    );
    
    function mintWithDelta(
        bytes32 deviceFingerprint,
        uint256 currentCumulativeValue,
        bytes calldata segiSignature // Signed by SEGI verification engine
    ) external {
        // Verify SEGI signature
        require(_verifySEGISignature(deviceFingerprint, currentCumulativeValue, segiSignature), "Invalid signature");
        
        uint256 previousWatermark = deviceWatermarks[deviceFingerprint];
        require(currentCumulativeValue > previousWatermark, "No new activity");
        
        uint256 delta = currentCumulativeValue - previousWatermark;
        
        // Update watermark
        deviceWatermarks[deviceFingerprint] = currentCumulativeValue;
        
        // Mint tokens for delta amount
        _mintTokens(msg.sender, delta);
        
        emit WatermarkUpdated(deviceFingerprint, previousWatermark, currentCumulativeValue, delta);
    }
}`}
            </pre>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
