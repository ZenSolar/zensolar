import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PatentPageNavigation } from '@/components/admin/patent/PatentPageNavigation';
import { 
  FileText, 
  Scale, 
  Layers, 
  Sparkles, 
  Hash, 
  Fingerprint, 
  BookOpen, 
  Image as ImageIcon,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const TITLE = "System and Method for Tokenizing and Gamifying Verified Real-World Activity Using Blockchain Technology";

const CROSS_REFERENCE = `This application claims the benefit of U.S. Provisional Application No. 63/XXXXXX, filed [FILING DATE], entitled "Gamifying and Tokenizing Sustainable Behaviors," the entire disclosure of which is incorporated herein by reference.`;

const FIELD = `The present invention relates generally to blockchain-based reward systems, and more particularly to a software-enabled gateway interface (SEGI) architecture for converting verified real-world activity data—obtained from third-party application programming interfaces (APIs) without proprietary hardware—into cryptographically-verified blockchain tokens and non-fungible tokens (NFTs), using novel verification methods that prevent double-tokenization and ensure provenance integrity.`;

const BACKGROUND = [
  `Existing blockchain reward systems suffer from several critical deficiencies. First, many systems rely on pre-minted token pools, where tokens exist prior to the verified activity they purport to represent, creating inflationary pressure and severing the provenance link between real-world action and digital asset.`,
  `Second, existing systems lack cryptographic mechanisms to prevent the same unit of real-world activity (e.g., one kilowatt-hour of solar energy production) from being tokenized multiple times—either within the same platform or across competing platforms claiming to reward the same physical activity.`,
  `Third, conventional systems require proprietary hardware sensors or Internet-of-Things (IoT) devices for data collection, creating barriers to adoption and vendor lock-in.`,
  `Fourth, no existing system provides a device-bound, cross-platform watermark registry that persists across user account ownership changes, ensuring that the cumulative tokenized activity for a specific physical device (identified by manufacturer-assigned identifiers such as VIN or Site ID) is publicly auditable and cannot be retroactively manipulated.`,
  `What is needed is a hardware-agnostic, software-only system that cryptographically verifies real-world activity through existing third-party APIs, mints tokens exclusively upon successful verification, tracks incremental activity through tamper-evident hash chains, and maintains a device-bound watermark registry to prevent cross-platform double-tokenization.`,
];

const SUMMARY = [
  `The present invention provides a system and method for tokenizing verified real-world activity using a four-layer Software-Enabled Gateway Interface (SEGI) architecture comprising: (1) an API aggregation layer establishing authenticated connections to a plurality of third-party data sources via OAuth 2.0 protocols; (2) a data normalization layer converting heterogeneous activity metrics into a unified impact score; (3) a verification engine generating cryptographic proofs using SHA-256 hash chains; and (4) a smart contract bridge for conditional blockchain token issuance.`,
  `The system implements three novel verification methods operating in concert:`,
  `Mint-on-Proof™: A method wherein blockchain tokens are minted exclusively at the moment of cryptographic verification, with no tokens existing prior to the verification event. This eliminates pre-minted reward pools and ensures every token has a 1:1 provenance link to verified physical activity.`,
  `Proof-of-Delta™: A method for preventing double-tokenization comprising maintaining a device-bound watermark representing cumulative tokenized activity, computing a delta between the current activity reading and the stored watermark, issuing tokens exclusively for positive delta values, and atomically updating the watermark upon successful token issuance—all linked through a SHA-256 hash chain of the form SHA-256(device_id | timestamp | value | prevHash).`,
  `Proof-of-Origin™: A device-bound anti-fraud system comprising generating a deterministic cryptographic hash from manufacturer-assigned identifiers using keccak256(manufacturer_id | device_id), associating said hash with a physical device regardless of user account ownership, persisting activity watermarks against the device hash rather than user accounts, and publishing periodic Merkle root snapshots on-chain for public cross-platform auditability.`,
  `The invention is domain-agnostic and applicable to any measurable real-world activity verifiable through third-party API or sensor data, including but not limited to: energy production, transportation metrics, physical exercise, educational achievement, gaming progress, environmental action, and charitable contribution.`,
];

const DRAWINGS_BRIEF = [
  { fig: 'FIG. 1', desc: 'is a system-level block diagram illustrating the four-layer SEGI architecture and its interaction with third-party data sources, the verification engine, and blockchain network.' },
  { fig: 'FIG. 2', desc: 'is a flowchart illustrating the Mint-on-Proof™ token issuance method, showing the verification-gated minting process from API data ingestion through cryptographic proof generation to atomic token creation.' },
  { fig: 'FIG. 3', desc: 'is a data flow diagram illustrating the Proof-of-Delta™ incremental verification method, showing the SHA-256 hash chain construction, watermark comparison, delta computation, and atomic watermark update.' },
  { fig: 'FIG. 4', desc: 'is a block diagram illustrating the Proof-of-Origin™ Device Watermark Registry architecture, showing device hash generation via keccak256, on-chain watermark storage, and Merkle root snapshot publication.' },
  { fig: 'FIG. 5', desc: 'is a flowchart illustrating the end-to-end process from user device connection through API authentication, data retrieval, normalization, verification, and conditional token minting.' },
  { fig: 'FIG. 6', desc: 'is a diagram illustrating the milestone NFT issuance system, showing cumulative activity threshold monitoring and achievement-based non-fungible token generation.' },
  { fig: 'FIG. 7', desc: 'is a system diagram illustrating the multi-provider API aggregation layer, showing authenticated connections to a plurality of energy providers (Tesla, Enphase, SolarEdge, Wallbox) and transportation data sources.' },
  { fig: 'FIG. 8', desc: 'is a diagram illustrating the cross-platform double-mint prevention mechanism, showing how the Device Watermark Registry prevents the same physical energy unit from being tokenized across competing platforms.' },
];

const DETAILED_DESCRIPTION = {
  segiArchitecture: {
    title: 'I. SEGI Architecture (Four-Layer System)',
    paragraphs: [
      `Referring now to FIG. 1, the present invention implements a Software-Enabled Gateway Interface (SEGI) comprising four distinct processing layers operating in sequence to convert verified real-world activity data into blockchain-based digital assets.`,
      `Layer 1 — API Aggregation Layer: The first layer establishes authenticated connections to a plurality of third-party API endpoints using industry-standard OAuth 2.0 authentication protocols. In a preferred embodiment, the system connects to energy production APIs (Tesla Energy, Enphase Enlighten, SolarEdge Monitoring), electric vehicle APIs (Tesla Fleet API, Wallbox API), and battery storage APIs. Each connection is established without requiring installation of additional measurement devices or proprietary hardware, making the system entirely hardware-agnostic. The API aggregation layer retrieves raw activity data including, but not limited to: kilowatt-hours (kWh) produced, kilowatt-hours exported, miles driven, and charging session energy delivered.`,
      `Layer 2 — Data Normalization Layer: The second layer receives heterogeneous activity metrics from the API aggregation layer and applies domain-specific conversion factors to output a normalized impact score. For example, 1 kWh of solar production, 1 kWh of battery export, and 1 mile of EV driving may each be assigned different weighting factors to produce a unified score enabling consistent token issuance across disparate activity types. This normalization enables the system to be domain-agnostic—the same architecture can tokenize fitness data, educational achievements, gaming milestones, or any other measurable activity by simply substituting the appropriate conversion factors.`,
      `Layer 3 — Verification Engine: The third layer generates cryptographic proofs for each activity data point. As described in detail below under Proof-of-Delta™, the verification engine constructs a SHA-256 hash chain of the form SHA-256(device_id | timestamp | value | prevHash) for every reading, creating a tamper-evident, linked provenance trail. The verification engine also performs delta computation to ensure only incremental, never-before-tokenized activity proceeds to the minting stage.`,
      `Layer 4 — Smart Contract Bridge: The fourth layer interfaces with a blockchain network (in a preferred embodiment, the Base Layer 2 network on Ethereum) to execute conditional token minting. This layer receives verified activity data from the verification engine and executes the following atomic operations: (a) validates the cryptographic proof; (b) queries the Device Watermark Registry for the device's current cumulative watermark; (c) confirms the delta is positive; (d) mints the calculated token quantity; (e) updates the device watermark; and (f) optionally triggers milestone NFT issuance if cumulative thresholds are crossed.`,
    ],
  },
  mintOnProof: {
    title: 'II. Mint-on-Proof™ (Verification-Gated Token Issuance)',
    paragraphs: [
      `Referring now to FIG. 2, the Mint-on-Proof™ method ensures that no blockchain tokens representing real-world activity exist prior to the verification event. This is distinguished from conventional reward token systems that pre-mint a fixed supply and distribute from a pool.`,
      `The method comprises the following steps: (a) receiving activity data from an authenticated third-party API endpoint; (b) validating data authenticity through provider-signed API responses and OAuth 2.0 session verification; (c) generating a cryptographic proof comprising a SHA-256 hash binding the activity data to the specific device, timestamp, and previous proof in the chain; (d) computing the token quantity based on the verified activity delta and applicable conversion rate; (e) submitting the verified proof and token quantity to the smart contract for atomic minting; (f) wherein the smart contract rejects any minting request that does not include a valid cryptographic proof.`,
      `A critical aspect of this method is that the token supply is inherently demand-driven. Tokens come into existence only when real-world activity is verified, creating an intrinsic supply constraint that reflects actual physical activity rather than speculative issuance.`,
    ],
  },
  proofOfDelta: {
    title: 'III. Proof-of-Delta™ (Incremental Cryptographic Verification)',
    paragraphs: [
      `Referring now to FIG. 3, the Proof-of-Delta™ method prevents double-tokenization by maintaining a per-device watermark and issuing tokens exclusively for positive incremental activity.`,
      `The method comprises: (a) maintaining a device-bound watermark W representing the cumulative activity that has been previously tokenized for a specific physical device; (b) upon receiving a new activity reading R from the API, computing the delta D = R − W; (c) if D > 0, generating a cryptographic proof P = SHA-256(device_id | timestamp | D | P_prev), where P_prev is the hash of the immediately preceding proof for this device; (d) issuing tokens exclusively for the positive delta value D; (e) atomically updating the watermark W ← R upon successful token issuance, ensuring no gap or overlap in credited activity.`,
      `If D ≤ 0 (indicating the current reading is equal to or less than the previously tokenized amount), no tokens are issued and no proof is generated. This handles edge cases including meter resets, data corrections, and API reporting delays.`,
      `The linked hash chain creates a tamper-evident audit trail. Any modification to a historical reading would invalidate all subsequent proofs in the chain, making retroactive manipulation detectable and provable.`,
      `Historical energy production data (readings that predate the device's registration on the platform) is explicitly excluded from minting eligibility. Only activity occurring after device registration and generating a verified positive delta is eligible for tokenization.`,
    ],
  },
  proofOfOrigin: {
    title: 'IV. Proof-of-Origin™ (Device Watermark Registry)',
    paragraphs: [
      `Referring now to FIG. 4, the Proof-of-Origin™ system implements a Device Watermark Registry that binds tokenization records to physical hardware rather than user accounts.`,
      `The system comprises: (a) generating a unique deterministic device hash H = keccak256(manufacturer_id | device_id) from manufacturer-assigned identifiers, such as a Tesla VIN, Enphase Site ID, or SolarEdge serial number; (b) associating said hash H with the physical device regardless of which user account currently controls it; (c) maintaining a monotonically increasing watermark W against device hash H, representing the cumulative verified activity that has been tokenized for this specific physical device; (d) persisting the watermark against the device hash rather than the user account, such that if device ownership transfers (e.g., home sale), the new owner cannot re-tokenize previously credited activity.`,
      `The Device Watermark Registry additionally implements a Merkle snapshot mechanism: at configurable intervals, the system computes a Merkle root of all device watermarks and publishes this root on-chain. This enables any third party to independently verify that a specific device's cumulative tokenized activity has not been retroactively modified, providing cross-platform auditability.`,
      `Referring to FIG. 8, the cross-platform double-mint prevention operates as follows: if a competing platform attempts to tokenize activity for the same physical device, the publicly available Merkle snapshots enable verification that the claimed activity range has already been tokenized, making the duplicate claim provably fraudulent.`,
    ],
  },
  milestoneNFT: {
    title: 'V. Milestone NFT Issuance',
    paragraphs: [
      `Referring to FIG. 6, the system monitors cumulative verified activity for each user against configurable threshold values. Upon crossing a threshold (e.g., 1,000 kWh produced, 10,000 EV miles driven), the system triggers a non-fungible token (NFT) minting transaction encoding achievement metadata including: activity type, threshold value, verification timestamp, cumulative activity at time of achievement, and the hash of the most recent Proof-of-Delta™ proof at the time of threshold crossing.`,
    ],
  },
};

const CLAIMS = [
  {
    number: 1,
    type: 'independent' as const,
    text: `A computer-implemented system for tokenizing verified real-world activity using blockchain technology, the system comprising:
    
(a) an API aggregation layer configured to establish authenticated connections to a plurality of third-party data source endpoints using OAuth 2.0 authentication protocols, said layer retrieving activity data without requiring installation of proprietary measurement hardware;

(b) a data normalization layer configured to receive heterogeneous activity metrics from said plurality of data sources and apply domain-specific conversion factors to produce a normalized impact score;

(c) a verification engine configured to:
    (i) maintain a device-bound watermark representing cumulative tokenized activity for each physical device identified by a deterministic cryptographic hash;
    (ii) compute a delta between a current activity reading and the stored watermark;
    (iii) generate a cryptographic proof linking said delta to a tamper-evident hash chain; and
    (iv) output a verified activity record exclusively when said delta is positive; and

(d) a smart contract bridge configured to execute atomic token minting on a blockchain network exclusively upon receipt of said verified activity record from said verification engine, wherein no tokens representing said activity exist prior to said verification event.`,
  },
  {
    number: 2,
    type: 'dependent' as const,
    text: `The system of claim 1, wherein said verification engine implements a Mint-on-Proof method comprising:
receiving said activity data from an authenticated third-party API endpoint;
validating data authenticity through provider-signed API responses;
generating said cryptographic proof comprising a SHA-256 hash binding said activity data to a specific device identifier, timestamp, and a hash of the immediately preceding proof in a linked chain; and
wherein said smart contract bridge rejects any minting request not accompanied by a valid cryptographic proof.`,
  },
  {
    number: 3,
    type: 'dependent' as const,
    text: `The system of claim 1, wherein said verification engine implements a Proof-of-Delta method for preventing double-tokenization, comprising:
maintaining said device-bound watermark W representing cumulative tokenized activity for a specific physical device;
upon receiving a new activity reading R, computing delta D = R − W;
generating a cryptographic proof P = SHA-256(device_id | timestamp | D | P_prev) exclusively when D > 0;
issuing tokens corresponding exclusively to said positive delta value D; and
atomically updating said watermark W ← R upon successful token issuance.`,
  },
  {
    number: 4,
    type: 'dependent' as const,
    text: `The system of claim 1, wherein said deterministic cryptographic hash for each physical device is computed as keccak256(manufacturer_id | device_id), wherein manufacturer_id comprises a manufacturer-assigned identifier and device_id comprises a unique device serial number, VIN, or site identifier, and wherein said watermark persists against said device hash independently of user account ownership.`,
  },
  {
    number: 5,
    type: 'dependent' as const,
    text: `The system of claim 4, further comprising a Device Watermark Registry implemented as a smart contract maintaining a mapping of device hashes to cumulative tokenized activity amounts, said registry further configured to:
enforce monotonically increasing watermark values;
publish periodic Merkle root snapshots of all device watermarks on-chain; and
enable third-party verification that any claimed activity range for a specific device has not been previously tokenized.`,
  },
  {
    number: 6,
    type: 'dependent' as const,
    text: `The system of claim 1, wherein said activity data comprises one or more of: energy production measured in kilowatt-hours, electric vehicle miles driven, battery storage energy exported, electric vehicle charging session energy delivered, physical exercise metrics, educational achievement data, gaming progress data, environmental action metrics, or any other measurable activity verifiable through a third-party API or sensor data source.`,
  },
  {
    number: 7,
    type: 'dependent' as const,
    text: `The system of claim 1, further comprising a milestone monitoring subsystem configured to:
monitor cumulative verified activity for each user against configurable threshold values;
trigger a non-fungible token (NFT) minting transaction upon a threshold crossing; and
encode within said NFT achievement metadata including activity type, threshold value, verification timestamp, and the hash of the most recent cryptographic proof at the time of threshold crossing.`,
  },
  {
    number: 8,
    type: 'dependent' as const,
    text: `A computer-implemented method for tokenizing verified real-world activity, the method comprising:
establishing authenticated connections to a plurality of third-party API endpoints;
retrieving activity data from said endpoints without requiring proprietary measurement hardware;
normalizing said activity data into a unified impact score;
for each physical device, computing a deterministic device hash from manufacturer-assigned identifiers;
maintaining a watermark for each device hash representing cumulative tokenized activity;
computing an incremental delta between a current reading and said watermark;
generating a SHA-256 hash chain proof linking said delta to a tamper-evident provenance trail;
minting blockchain tokens exclusively for positive delta values upon successful cryptographic verification; and
atomically updating said watermark upon successful minting.`,
  },
];

const ABSTRACT = `A computer-implemented system and method for tokenizing verified real-world activity using a four-layer Software-Enabled Gateway Interface (SEGI) architecture. The system comprises an API aggregation layer connecting to third-party data sources via OAuth 2.0 without proprietary hardware, a data normalization layer producing unified impact scores, a verification engine implementing SHA-256 hash chain proofs with device-bound watermarks, and a smart contract bridge for conditional blockchain token minting. The system employs three novel verification methods: Mint-on-Proof (verification-gated issuance preventing pre-minted pools), Proof-of-Delta (incremental cryptographic verification preventing double-tokenization), and Proof-of-Origin (a Device Watermark Registry using keccak256 hardware hashes with Merkle root snapshots for cross-platform auditability). The invention is domain-agnostic and applicable to any measurable real-world activity verifiable through third-party APIs.`;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { toast } = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: label || 'Section copied to clipboard' });
      }}
    >
      <Copy className="h-3 w-3" />
      Copy
    </Button>
  );
}

export default function AdminUtilityPatentDraft() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      <PatentPageNavigation />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
            <ScrollText className="h-3.5 w-3.5 mr-2" />
            Utility Patent Draft
          </Badge>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
            USPTO Non-Provisional Application
          </Badge>
          <Badge variant="outline" className="text-destructive border-destructive/40">
            <AlertTriangle className="h-3 w-3 mr-1" />
            DRAFT — Not Yet Filed
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Utility Patent Application Draft</h1>
        <p className="text-muted-foreground">
          Complete non-provisional utility patent application based on provisional filing + current system architecture. 
          All sections formatted per USPTO requirements (DOCX format required for filing).
        </p>
      </motion.div>

      {/* Filing Checklist */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              USPTO Filing Requirements Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { item: 'Title of Invention', done: true },
                { item: 'Cross-Reference to Related Applications', done: true },
                { item: 'Field of the Invention', done: true },
                { item: 'Background of the Invention', done: true },
                { item: 'Brief Summary', done: true },
                { item: 'Brief Description of Drawings', done: true },
                { item: 'Detailed Description', done: true },
                { item: 'Claims (Independent + Dependent)', done: true },
                { item: 'Abstract of the Disclosure', done: true },
                { item: 'Formal Drawings (8 Figures)', done: false },
                { item: 'Oath/Declaration', done: false },
                { item: 'Filing Fees (USPTO)', done: false },
              ].map(({ item, done }) => (
                <div key={item} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Application Content */}
      <Accordion type="multiple" defaultValue={['title', 'claims', 'abstract']} className="space-y-4">
        
        {/* Title */}
        <AccordionItem value="title" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold">Title of the Invention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold">{TITLE}</p>
                <CopyButton text={TITLE} label="Title copied" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Cross-Reference */}
        <AccordionItem value="cross-ref" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold">Cross-Reference to Related Applications</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm">{CROSS_REFERENCE}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Replace placeholder with actual provisional application number and filing date before submission.
                  </p>
                </div>
                <CopyButton text={CROSS_REFERENCE} label="Cross-reference copied" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Field */}
        <AccordionItem value="field" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold">Field of the Invention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{FIELD}</p>
                <CopyButton text={FIELD} label="Field section copied" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Background */}
        <AccordionItem value="background" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold">Background of the Invention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3">
              <div className="flex justify-end">
                <CopyButton text={BACKGROUND.join('\n\n')} label="Background copied" />
              </div>
              {BACKGROUND.map((p, i) => (
                <p key={i} className="text-sm">{p}</p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Summary */}
        <AccordionItem value="summary" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-semibold">Brief Summary of the Invention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3">
              <div className="flex justify-end">
                <CopyButton text={SUMMARY.join('\n\n')} label="Summary copied" />
              </div>
              {SUMMARY.map((p, i) => (
                <p key={i} className="text-sm">{p}</p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brief Description of Drawings */}
        <AccordionItem value="drawings" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="font-semibold">Brief Description of the Drawings</span>
              <Badge variant="outline" className="text-xs">8 Figures</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-2">
              <div className="flex justify-end">
                <CopyButton 
                  text={DRAWINGS_BRIEF.map(d => `${d.fig} ${d.desc}`).join('\n\n')} 
                  label="Drawings description copied" 
                />
              </div>
              {DRAWINGS_BRIEF.map((d) => (
                <div key={d.fig} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Badge variant="outline" className="font-mono text-xs whitespace-nowrap h-fit mt-0.5">{d.fig}</Badge>
                  <p className="text-sm">{d.desc}</p>
                </div>
              ))}
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Formal drawings must comply with 37 CFR 1.84 (black ink on white, specific margins, reference numerals). 
                  These should be prepared by a patent illustrator before filing.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Detailed Description */}
        <AccordionItem value="detailed" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold">Detailed Description of the Invention</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            {Object.values(DETAILED_DESCRIPTION).map((section) => (
              <div key={section.title} className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{section.title}</h4>
                  <CopyButton text={`${section.title}\n\n${section.paragraphs.join('\n\n')}`} label="Section copied" />
                </div>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed">{p}</p>
                ))}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Claims */}
        <AccordionItem value="claims" className="border-2 border-primary/30 rounded-xl px-4 bg-primary/5">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span className="font-semibold">Claims</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                {CLAIMS.length} Claims
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex justify-end">
              <CopyButton 
                text={CLAIMS.map(c => `${c.number}. ${c.text}`).join('\n\n')} 
                label="All claims copied" 
              />
            </div>
            {CLAIMS.map((claim) => (
              <div 
                key={claim.number} 
                className={`p-4 rounded-lg border space-y-2 ${
                  claim.type === 'independent' 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-background border-border/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Claim {claim.number}
                  </Badge>
                  <Badge className={`text-xs ${
                    claim.type === 'independent' 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {claim.type === 'independent' ? 'Independent' : 'Dependent'}
                  </Badge>
                  {claim.number === 2 && <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">Mint-on-Proof™</Badge>}
                  {claim.number === 3 && <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">Proof-of-Delta™</Badge>}
                  {(claim.number === 4 || claim.number === 5) && <Badge className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30 text-xs">Proof-of-Origin™</Badge>}
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed">{claim.text}</p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Abstract */}
        <AccordionItem value="abstract" className="border rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              <span className="font-semibold">Abstract of the Disclosure</span>
              <Badge variant="outline" className="text-xs">{ABSTRACT.split(' ').length} words</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed">{ABSTRACT}</p>
                <CopyButton text={ABSTRACT} label="Abstract copied" />
              </div>
              {ABSTRACT.split(' ').length > 150 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  USPTO recommends abstracts under 150 words. Current: {ABSTRACT.split(' ').length} words. Consider trimming.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Next Steps */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Before Filing: Required Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Replace provisional application number and filing date in Cross-Reference section',
              'Commission formal patent drawings (FIG. 1–8) compliant with 37 CFR 1.84',
              'Have a registered patent attorney review all claims for proper claim construction and antecedent basis',
              'Execute Oath/Declaration (USPTO Form PTO/AIA/01)',
              'Pay filing fees ($320 micro entity / $640 small entity / $1,600 large entity for utility filing)',
              'File in DOCX format via USPTO Patent Center (required for applications filed after Jan 17, 2024)',
              'Consider PCT filing within 12 months if international protection is desired',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 p-2">
                <div className="h-5 w-5 rounded-full border-2 border-amber-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{i + 1}</span>
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
