import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  RefreshCw, 
  Fingerprint, 
  Binary, 
  Link2, 
  ShieldCheck, 
  Database,
  ArrowDown,
  Sparkles,
  Lock
} from 'lucide-react';

const layers = [
  {
    id: 1,
    icon: Cloud,
    title: 'API Aggregation',
    subtitle: 'Connect',
    description: 'Secure OAuth to Tesla, Enphase, SolarEdge, Wallbox',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  {
    id: 2,
    icon: RefreshCw,
    title: 'Data Normalization',
    subtitle: 'Unify',
    description: 'Convert diverse metrics into unified Impact Score',
    gradient: 'from-violet-500 to-purple-500',
    shadow: 'shadow-violet-500/30',
    bg: 'bg-violet-500/10',
  },
  {
    id: 3,
    icon: Fingerprint,
    title: 'Verification Engine',
    subtitle: 'Prove',
    description: 'Cryptographic timestamps + device authentication',
    gradient: 'from-emerald-500 to-green-500',
    shadow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 4,
    icon: Binary,
    title: 'Smart Contract Bridge',
    subtitle: 'Mint + Record',
    description: 'Proof-of-Delta + Device Watermark Registry: On-chain verification, anti-double-mint standard',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
    bg: 'bg-amber-500/10',
    isHighlighted: true,
  },
];

const proofOfDeltaSteps = [
  {
    icon: Database,
    label: 'Device Watermark Registry',
    description: 'Public on-chain record of cumulative tokenized value per physical device (VIN, Site ID)',
  },
  {
    icon: ShieldCheck,
    label: 'Delta Calculation',
    description: 'New activity = Current reading - Last watermark. Cross-platform double-mint prevention.',
  },
  {
    icon: Lock,
    label: 'On-Chain Record + Merkle Snapshots',
    description: 'Real-time per-mint updates plus periodic Merkle root snapshots for bulk auditability',
  },
];

export function SEGIProofOfDeltaDiagram() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-amber-500/5 border-primary/20 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-3 text-xl">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-primary to-amber-500"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(var(--primary), 0.3)',
                  '0 0 40px rgba(var(--primary), 0.5)',
                  '0 0 20px rgba(var(--primary), 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Link2 className="h-5 w-5 text-white" />
            </motion.div>
            SEGI + Proof-of-Delta Architecture
          </CardTitle>
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs">
            On-Chain Verified
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          The patent-pending 4-layer architecture with <strong className="text-foreground">immutable on-chain verification</strong> at Layer 4.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main 4-Layer Flow */}
        <div className="relative">
          {/* Vertical Connection Line */}
          <motion.div 
            className="absolute left-7 top-8 bottom-8 w-0.5 hidden sm:block overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-full w-full bg-gradient-to-b from-blue-500 via-violet-500 via-emerald-500 to-amber-500"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ originY: 0 }}
            />
          </motion.div>
          
          {/* Animated Data Pulse */}
          <motion.div
            className="absolute left-6 w-3 h-3 rounded-full bg-primary hidden sm:block z-10"
            animate={{ 
              top: ['8%', '92%'],
              opacity: [1, 1, 0],
              scale: [1, 1.2, 0.8]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              repeatDelay: 1
            }}
          />

          <div className="space-y-4 relative">
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                {/* Layer Icon */}
                <motion.div 
                  className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${layer.gradient} shadow-lg ${layer.shadow} flex items-center justify-center`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <layer.icon className="h-6 w-6 text-white" />
                  {layer.isHighlighted && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-amber-400"
                      animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [1, 0, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                {/* Content */}
                <div className={`flex-1 p-4 rounded-xl ${layer.bg} border border-border/50 ${layer.isHighlighted ? 'ring-2 ring-amber-500/30' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">LAYER {layer.id}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{layer.subtitle}</Badge>
                    {layer.isHighlighted && (
                      <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Key Innovation
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground">{layer.title}</h4>
                  <p className="text-sm text-muted-foreground">{layer.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Proof-of-Delta Deep Dive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <ShieldCheck className="h-5 w-5 text-amber-500" />
            </motion.div>
            <h4 className="font-bold text-foreground">Proof-of-Delta: On-Chain Verification</h4>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Layer 4 implements <strong className="text-foreground">Proof-of-Delta</strong> powered by the <strong className="text-foreground">Device Watermark Registry</strong>—a standalone on-chain contract that maps each physical device (via <code className="text-xs bg-muted px-1 py-0.5 rounded">keccak256(manufacturer | deviceId)</code>) to its total tokenized energy. This creates the industry's first <strong className="text-foreground">cross-platform anti-double-mint standard</strong>, making conflicting claims by any platform provably fraudulent.
          </p>

          <div className="grid sm:grid-cols-3 gap-3">
            {proofOfDeltaSteps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-background/80 border border-border/60"
              >
                <div className="p-1.5 rounded-md bg-amber-500/20">
                  <step.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Flow Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-2 flex-wrap text-sm text-muted-foreground"
        >
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Connect</span>
          <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium">Normalize</span>
          <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Verify</span>
          <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Mint + Record On-Chain</span>
        </motion.div>
      </CardContent>
    </Card>
  );
}
