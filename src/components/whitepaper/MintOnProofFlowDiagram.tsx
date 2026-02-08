import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  CloudCog, RefreshCw, Shield, Cpu, Coins, ChevronRight, Zap, Sparkles, Award 
} from "lucide-react";

const layers = [
  {
    id: 1,
    icon: CloudCog,
    title: "API Aggregation",
    description: "Secure OAuth to Tesla, Enphase, SolarEdge, Wallbox clouds",
    color: "from-blue-500 to-cyan-500",
    delay: 0,
  },
  {
    id: 2,
    icon: RefreshCw,
    title: "Data Normalization",
    description: "Unified Impact Score from disparate metrics",
    color: "from-violet-500 to-purple-500",
    delay: 0.15,
  },
  {
    id: 3,
    icon: Shield,
    title: "Verification Engine",
    description: "Proof-of-Delta™: SHA-256 hash chains bind each reading to a tamper-evident audit trail",
    color: "from-emerald-500 to-green-500",
    delay: 0.3,
  },
  {
    id: 4,
    icon: Cpu,
    title: "Smart Contract Bridge",
    description: "Proof-of-Origin™: On-chain Device Watermark Registry + one-tap minting of $ZSOLAR & NFTs",
    color: "from-amber-500 to-orange-500",
    delay: 0.45,
  },
];

export function MintOnProofFlowDiagram() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-cyan-500/5 border-primary/20 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-cyan-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            The Mint-on-Proof™ Architecture
          </CardTitle>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-600 dark:text-cyan-400 text-xs">
            Software-Enabled Gateway Interface
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          Our hardware-agnostic, software-only architecture converts verified energy activity into blockchain rewards—
          <strong className="text-foreground">minted directly from the app to your wallet</strong>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Animated Flow Diagram */}
        <div className="relative">
          {/* Connection Line - animated */}
          <motion.div 
            className="absolute left-7 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 via-emerald-500 to-orange-500 hidden sm:block"
            initial={{ scaleY: 0, originY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          <div className="space-y-3 relative">
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: layer.delay, duration: 0.4, ease: "easeOut" }}
                className="flex items-start gap-4"
              >
                {/* Layer Number Circle */}
                <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${layer.color} shadow-lg flex items-center justify-center`}>
                  <layer.icon className="h-6 w-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">LAYER {layer.id}</span>
                  </div>
                  <h4 className="font-semibold text-foreground">{layer.title}</h4>
                  <p className="text-sm text-muted-foreground">{layer.description}</p>
                </div>
                
                {/* Animated data flow indicator */}
                {index < layers.length - 1 && (
                  <motion.div
                    className="absolute left-7 hidden sm:block"
                    style={{ top: `${(index + 1) * 88 - 12}px` }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: layer.delay + 0.3 }}
                  >
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: layer.delay }}
                      className="w-3 h-3 rounded-full bg-primary/60"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* The Coolest Part - In-App Minting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="p-4 rounded-xl bg-gradient-to-r from-primary/15 via-emerald-500/15 to-amber-500/15 border border-primary/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">The Coolest Part</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg ring-2 ring-background">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg ring-2 ring-background">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Mint $ZSOLAR + NFTs right from the app! 🚀</p>
              <p className="text-sm text-muted-foreground">Tap a button, and Mint-on-Proof sends tokens & achievement NFTs directly to your connected wallet.</p>
            </div>
          </div>
        </motion.div>

        {/* Learn More Link */}
        <div className="flex justify-end">
          <Link 
            to="/technology" 
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Explore full technology breakdown <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}