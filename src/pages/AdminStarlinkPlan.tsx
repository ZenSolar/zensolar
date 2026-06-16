import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/sonner";
import { useCallback, useState } from "react";
import { 
  Satellite, 
  Home, 
  Server, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Fingerprint, 
  Zap, 
  Copy, 
  Check,
  ArrowRight,
  AlertTriangle,
  Lock,
  Globe,
  Activity
} from "lucide-react";

interface PathCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "active" | "deferred" | "fallback" | "blocked";
  userFriction: "low" | "medium" | "high";
  proofQuality: "cryptographic" | "self-attested" | "hybrid";
  description: string;
  howItWorks: string[];
  pros: string[];
  cons: string[];
  technicalDetails: string;
  estimatedEffort: string;
  blockedBy?: string;
}

const paths: PathCard[] = [
  {
    id: "home-assistant",
    title: "Path 1: Home Assistant Integration",
    subtitle: "For existing HA users (~500K+ households)",
    icon: Home,
    status: "deferred",
    userFriction: "low",
    proofQuality: "cryptographic",
    description: "Users who already run Home Assistant add the Starlink integration + a one-line REST automation to POST telemetry to ZenSolar's ingest endpoint.",
    howItWorks: [
      "User installs Starlink integration in Home Assistant (one-click from HA UI)",
      "HA polls dish gRPC at 192.168.100.1:9200 every 30s",
      "User adds a 5-line YAML automation: 'when Starlink data changes → POST to zensolar ingest'",
      "ZenSolar edge function validates token, writes attestation, calculates delta",
      "GB delta appears in CEC tile → tap to mint $ZSOLAR"
    ],
    pros: [
      "Zero new code for ZenSolar to maintain (HA handles gRPC)",
      "Real telemetry: bytes_downloaded (lifetime counter), dish serial, latency",
      "Cryptographic device binding via dish hardware serial",
      "User friction is minimal for the HA crowd"
    ],
    cons: [
      "Only reaches ~500K households that already run HA",
      "Requires user to write YAML (or paste a template)",
      "HA must be on same LAN as dish (always true for HA users)"
    ],
    technicalDetails: "Ingest endpoint: POST /functions/v1/starlink-ingest with body {dish_serial, bytes_downloaded, bytes_uploaded, timestamp, signature}. Edge function validates JWT, checks watermark, writes to starlink_attestations table with source='ha_grpc'. Delta = current − previous reading (200 GB cap on first reading).",
    estimatedEffort: "2–3 days (edge function + YAML template + docs)",
    blockedBy: "Deferred until post-launch. No HA-specific code needed now — just document the YAML template."
  },
  {
    id: "standalone-agent",
    title: "Path 2: Standalone Agent",
    subtitle: "Universal: Docker container or Python script",
    icon: Server,
    status: "deferred",
    userFriction: "medium",
    proofQuality: "cryptographic",
    description: "ZenSolar builds a tiny 'zensolar-starlink-agent' (~40 lines Python + Docker image). User runs one command on any always-on home network device. Agent auto-discovers dish, polls every 5 min, POSTs signed telemetry.",
    howItWorks: [
      "User runs: docker run -d -e ZS_TOKEN=xxx ghcr.io/zensolar/starlink-agent",
      "Agent discovers dish at 192.168.100.1:9200 via gRPC",
      "Polls every 5 min: bytes_downloaded, bytes_uploaded, uptime, dish_serial",
      "Signs payload with agent's Ed25519 key (device-bound)",
      "POSTs to /functions/v1/starlink-ingest with signature",
      "ZenSolar verifies signature, checks watermark, writes attestation"
    ],
    pros: [
      "Works for ANY user with a Starlink dish — no HA required",
      "Real lifetime byte counters (not snapshots)",
      "Dish hardware serial → cryptographic device binding (claim parity with Tesla/Enphase)",
      "Strongest patent reduction-to-practice for ZEN-002",
      "Agent can be extended to other local devices later"
    ],
    cons: [
      "User must run something on their network (Docker or Python script)",
      "Requires always-on device (Raspberry Pi, NAS, old PC, always-on Mac)",
      "More friction than screenshot — but less than HA for non-HA users"
    ],
    technicalDetails: "Agent built on starlink-grpc-tools (sparky8512). Ed25519 signing key generated on first run, pub-key registered with ZenSolar. Edge function: verify signature → check watermark → write attestation. Delta logic identical to HA path. Same starlink_attestations table, source='grpc_agent'.",
    estimatedEffort: "1 week (agent image + edge function + CI/CD + docs)",
    blockedBy: "Deferred until post-launch. No production-blocker. Build when we have 50+ Starlink users requesting it."
  },
  {
    id: "screenshot",
    title: "Path 3: Screenshot Upload + OCR",
    subtitle: "Universal fallback — zero setup",
    icon: Camera,
    status: "fallback",
    userFriction: "low",
    proofQuality: "self-attested",
    description: "User logs into starlink.com, takes screenshot of data usage screen, uploads it. OCR extracts GB totals. Manual each time — no code, no server, no HA.",
    howItWorks: [
      "User opens starlink.com/account in browser",
      "Navigates to Usage / Data section",
      "Takes screenshot showing Download / Upload totals",
      "Uploads screenshot in ZenSolar app (or camera capture on mobile)",
      "OCR (Tesseract or cloud) extracts numeric values",
      "ZenSolar validates ≥ previous reading, calculates delta, records attestation"
    ],
    pros: [
      "Zero setup — works for every user immediately",
      "No LAN requirements, no devices, no Docker",
      "Available TODAY in the Starlink Mint page",
      "Mobile-friendly: screenshot from phone → upload from phone"
    ],
    cons: [
      "Self-attested — 'honor system' footnote in app",
      "Manual each time — no auto-sync",
      "OCR can fail on unusual screenshots (requires manual entry fallback)",
      "No device binding — weaker patent claim than gRPC paths",
      "User must remember to do it (no push notifications for new data)"
    ],
    technicalDetails: "Client-side image upload to Supabase Storage. Edge function downloads image, runs Tesseract OCR (or calls cloud vision API). Extracts Download GB, Upload GB. Validates against previous reading in starlink_attestations. Writes row with source='ocr'. Manual entry fallback always available. 200 GB cap on first reading.",
    estimatedEffort: "Already built. Live at /starlink.",
    blockedBy: "None — this is the active path."
  }
];

const pogStack = [
  {
    layer: "Proof-of-Origin™",
    icon: Fingerprint,
    description: "Dish hardware serial + agent signing key (Paths 1 & 2). Screenshot path uses self-attestation with OAuth session timestamp.",
    status: "cryptographic" as const
  },
  {
    layer: "Proof-of-Delta™",
    icon: Activity,
    description: "Lifetime bytes_downloaded counter with delta = current − previous. Watermark table prevents double-mint. 200 GB cap on first reading.",
    status: "cryptographic" as const
  },
  {
    layer: "Proof-of-Genesis™",
    icon: Shield,
    description: "Each attestation row hashed into existing Merkle batch alongside Tesla/Enphase rows. Same receipt URL, same share link.",
    status: "cryptographic" as const
  },
  {
    layer: "Proof-of-Permanence™",
    icon: Lock,
    description: "Merkle root anchored to Base L2 (Sepolia now, mainnet at launch). Same anchor as all other energy sources.",
    status: "cryptographic" as const
  }
];

const cecTileSpec = {
  title: "Starlink CEC Tile (Future)",
  fields: [
    { label: "Lifetime Data", value: "12.4 TB ↓ / 3.1 TB ↑", note: "Raw from dish counters" },
    { label: "Today's Delta", value: "+47 GB", note: "Since last sync — mintable now" },
    { label: "Mint Button", value: "Tap to Mint 47 $ZSOLAR", note: "1 GB = 1 $ZSOLAR (user's 50% share, 1:1 framing)" },
    { label: "Verification Badge", value: "Verified Starlink · Agent v1.2", note: "Green checkmark for gRPC paths; yellow 'Self-Attested' for screenshot" },
    { label: "Last Sync", value: "3 min ago", note: "Real-time for agent; manual for screenshot" }
  ]
};

const openQuestions = [
  "What is the exact conversion rate? 1 GB = 1 $ZSOLAR? Or 1 GB = 0.1 $ZSOLAR? kWh has real-world utility value; GB does not. Need pricing signal.",
  "Do we mint on download only, or download + upload? Starlink is symmetric-ish — upload matters for DePIN narrative.",
  "Starlink data usage is monthly-capped (1TB soft cap). Do we reset monthly or use lifetime counters? gRPC gives lifetime; screenshot gives monthly.",
  "How does Starlink mint interact with Energy Oracle / kWh floor? Two independent mechanisms — don't conflate. GB is a separate SKU.",
  "Patent ZEN-002: Is 'tokenizing orbital asset bandwidth' defensible? Need prior-art search on data-usage tokenization."
];

const launchDecision = {
  status: "screenshot-only for now",
  rationale: [
    "Agent is 1 week of build + test + docs. Not a blocker for launch.",
    "Screenshot path works for 100% of users TODAY — no setup, no LAN, no Docker.",
    "Investor conversations need 'working product' not 'working agent'. Screenshot proves the concept.",
    "Post-launch, when we have 50+ Starlink users, we build the agent and email them: 'Upgrade to Verified Starlink for auto-sync'.",
    "Home Assistant path is docs-only (YAML template). No code needed from us."
  ],
  nextMilestone: "After 50 Starlink users OR first investor asks about 'device binding' — prioritize agent build."
};

export default function AdminStarlinkPlan() {
  const [copied, setCopied] = useState(false);

  const handleCopyPlan = useCallback(() => {
    const text = `# Starlink Integration Plan — ZenSolar

## Executive Summary
Starlink token minting is LIVE via screenshot upload (Path 3). 
Paths 1 & 2 (Home Assistant, Standalone Agent) are deferred until post-launch.

## Three Paths

### Path 1: Home Assistant (deferred)
- For existing HA users
- 5-line YAML automation
- Cryptographic device binding
- Effort: 2–3 days

### Path 2: Standalone Agent (deferred)
- Docker container or Python script
- Works for any user with always-on home device
- Strongest patent reduction-to-practice
- Effort: 1 week

### Path 3: Screenshot + OCR (ACTIVE)
- Zero setup
- Self-attested
- Live now at /starlink
- Effort: already built

## PoG Stack
All three paths satisfy Proof-of-Origin, Proof-of-Delta, Proof-of-Genesis, Proof-of-Permanence.
Paths 1 & 2 use cryptographic device binding; Path 3 uses self-attestation.

## Launch Decision
Screenshot-only for launch. Agent builds when 50+ Starlink users request it.
`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied plan summary to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500/10 text-green-500 border-green-500/20" },
    deferred: { label: "Deferred", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    fallback: { label: "Fallback", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    blocked: { label: "Blocked", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  const frictionConfig = {
    low: { label: "Low Friction", color: "bg-green-500/10 text-green-500" },
    medium: { label: "Medium Friction", color: "bg-yellow-500/10 text-yellow-500" },
    high: { label: "High Friction", color: "bg-red-500/10 text-red-500" },
  };

  const proofConfig = {
    cryptographic: { label: "Cryptographic Proof", color: "bg-emerald-500/10 text-emerald-500" },
    "self-attested": { label: "Self-Attested", color: "bg-orange-500/10 text-orange-500" },
    hybrid: { label: "Hybrid", color: "bg-blue-500/10 text-blue-500" },
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Satellite className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Starlink Integration Plan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Three paths to tokenize Starlink data usage — one active, two deferred
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {new Date().toLocaleDateString()}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleCopyPlan} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Plan"}
          </Button>
        </div>
      </div>

      {/* Launch Status Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Launch Status: Screenshot-Only</h3>
              <p className="text-muted-foreground text-sm">
                Starlink Mint is <strong>live now</strong> at <code className="bg-background px-1 rounded">/starlink</code> via 
                screenshot upload + OCR (Path 3). Zero setup for users. Paths 1 & 2 (HA, Agent) are 
                <strong> deferred until post-launch</strong> — no production blocker.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Path 3: Active</Badge>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Path 1: Deferred</Badge>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Path 2: Deferred</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Three Paths */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          The Three Paths
        </h2>

        {paths.map((path) => {
          const Icon = path.icon;
          const status = statusConfig[path.status];
          const friction = frictionConfig[path.userFriction];
          const proof = proofConfig[path.proofQuality];

          return (
            <Card key={path.id} className={path.status === "fallback" ? "border-blue-500/30 bg-blue-500/5" : path.status === "deferred" ? "border-amber-500/30 bg-amber-500/5" : ""}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${path.status === "fallback" ? "bg-blue-500/10" : "bg-primary/10"}`}>
                      <Icon className={`h-5 w-5 ${path.status === "fallback" ? "text-blue-500" : "text-primary"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">{path.title}</CardTitle>
                      <CardDescription>{path.subtitle}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={status.color}>{status.label}</Badge>
                    <Badge className={friction.color}>{friction.label}</Badge>
                    <Badge className={proof.color}>{proof.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{path.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      How It Works
                    </h4>
                    <ol className="space-y-1.5">
                      {path.howItWorks.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground pl-4 relative">
                          <span className="absolute left-0 text-primary">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Pros
                      </h4>
                      <ul className="space-y-1">
                        {path.pros.map((pro, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 relative">
                            <span className="absolute left-0 text-green-500">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1.5">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Cons
                      </h4>
                      <ul className="space-y-1">
                        {path.cons.map((con, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 relative">
                            <span className="absolute left-0 text-red-500">−</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-foreground mb-1">Technical Details</p>
                    <p className="text-xs text-muted-foreground">{path.technicalDetails}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-foreground mb-1">Estimated Effort</p>
                    <p className="text-xs text-muted-foreground">{path.estimatedEffort}</p>
                    {path.blockedBy && (
                      <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {path.blockedBy}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* PoG Stack */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Proof-of-Genesis™ Stack Compatibility
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pogStack.map((layer) => {
            const Icon = layer.icon;
            return (
              <Card key={layer.layer} className="border-border/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">{layer.layer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{layer.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CEC Tile Spec */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            {cecTileSpec.title}
          </CardTitle>
          <CardDescription>
            What the Starlink tile in the Clean Energy Center would look like with agent data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cecTileSpec.fields.map((field, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs font-medium text-foreground">{field.label}</p>
                <p className="text-sm font-semibold mt-0.5">{field.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{field.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Questions */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Open Questions (To Resolve Before Agent Build)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {openQuestions.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-4 relative">
                <span className="absolute left-0 text-amber-500">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Launch Decision */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Launch Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{launchDecision.status}</Badge>
          </div>
          <ul className="space-y-2">
            {launchDecision.rationale.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-4 relative">
                <span className="absolute left-0 text-green-500">✓</span>
                {r}
              </li>
            ))}
          </ul>
          <div className="p-3 rounded-lg bg-background/50 border border-green-500/20">
            <p className="text-sm font-medium text-foreground">Next Milestone</p>
            <p className="text-sm text-muted-foreground mt-1">{launchDecision.nextMilestone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
