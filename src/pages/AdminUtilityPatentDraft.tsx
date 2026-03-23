import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PatentPageNavigation } from '@/components/admin/patent/PatentPageNavigation';
import { PatentDocxExport } from '@/components/admin/patent/PatentDocxExport';
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

const TITLE = "System and Method for Tokenizing and Gamifying Verified Clean Energy and Real-World Activity Using Blockchain Technology";

const CROSS_REFERENCE = `This application claims the benefit of U.S. Provisional Application No. 63/XXXXXX, filed [FILING DATE], entitled "Gamifying and Tokenizing Sustainable Behaviors," the entire disclosure of which is incorporated herein by reference.`;

const FIELD = `The present invention relates generally to blockchain-based reward systems that create a new financial incentive layer for consumers and businesses utilizing clean energy technologies, and more particularly to a software-enabled gateway interface (SEGI) architecture for converting verified real-world activity data—obtained from third-party application programming interfaces (APIs) without proprietary hardware—into cryptographically-verified blockchain tokens and non-fungible tokens (NFTs), using novel verification methods that prevent double-tokenization and ensure provenance integrity. The system provides ongoing, market-driven rewards independent of government incentive programs and is applicable to both residential and commercial deployments across multiple activity domains.`;

const BACKGROUND = [
  `The adoption and sustained use of clean energy technologies—including residential and commercial solar systems, battery storage, electric vehicle fleets, and autonomous driving platforms—has historically depended on government financial incentives such as the federal Solar Investment Tax Credit (ITC), state net-metering programs, and electric vehicle purchase credits. These incentives are inherently temporary and subject to legislative repeal, reduction, or expiration. Once initial purchase incentives are exhausted, consumers and businesses lack ongoing financial motivation to maximize the utilization of their clean energy assets, leading to suboptimal energy production, reduced grid export participation, and diminished environmental impact over the operational lifetime of these devices.`,
  `Existing blockchain reward systems that attempt to address ongoing incentivization suffer from several critical deficiencies. First, many systems rely on pre-minted token pools, where tokens exist prior to the verified activity they purport to represent, creating inflationary pressure and severing the provenance link between real-world action and digital asset.`,
  `Second, existing systems lack cryptographic mechanisms to prevent the same unit of real-world activity (e.g., one kilowatt-hour of solar energy production) from being tokenized multiple times—either within the same platform or across competing platforms claiming to reward the same physical activity.`,
  `Third, conventional systems require proprietary hardware sensors or Internet-of-Things (IoT) devices for data collection, creating barriers to adoption and vendor lock-in.`,
  `Fourth, no existing system provides a device-bound, cross-platform watermark registry that persists across user account or entity ownership changes, ensuring that the cumulative tokenized activity for a specific physical device (identified by manufacturer-assigned identifiers such as VIN or Site ID) is publicly auditable and cannot be retroactively manipulated. This limitation applies equally to residential installations that change hands during home sales and commercial installations that transfer during business acquisitions.`,
  `What is needed is a hardware-agnostic, software-only system that provides ongoing, market-driven financial incentives for clean energy utilization by both consumers and businesses independent of government programs, while cryptographically verifying real-world activity through existing third-party APIs, minting tokens exclusively upon successful verification, tracking incremental activity through tamper-evident hash chains, and maintaining a device-bound watermark registry to prevent cross-platform double-tokenization.`,
];

const SUMMARY = [
  `The present invention provides a system and method that creates a new financial incentive layer for consumers and businesses using solar, battery storage, electric vehicle, and autonomous driving technologies—one that operates independently of government tax credits, rebates, or utility programs. The system tokenizes verified real-world activity using a four-layer Software-Enabled Gateway Interface (SEGI) architecture comprising: (1) an API aggregation layer establishing authenticated connections to a plurality of third-party data sources via OAuth 2.0 protocols; (2) a data normalization layer converting heterogeneous activity metrics into a unified impact score; (3) a verification engine generating cryptographic proofs using SHA-256 hash chains; and (4) a smart contract bridge for conditional blockchain token issuance.`,
  `The system implements three novel verification methods operating in concert:`,
  `Mint-on-Proof™: A method wherein blockchain tokens are minted exclusively at the moment of cryptographic verification, with no tokens existing prior to the verification event. This eliminates pre-minted reward pools and ensures every token has a 1:1 provenance link to verified physical activity.`,
  `Proof-of-Delta™: A method for preventing double-tokenization comprising maintaining a device-bound watermark representing cumulative tokenized activity, computing a delta between the current activity reading and the stored watermark, issuing tokens exclusively for positive delta values, and atomically updating the watermark upon successful token issuance—all linked through a SHA-256 hash chain of the form SHA-256(device_id | timestamp | value | prevHash).`,
  `Proof-of-Origin™: A device-bound anti-fraud system comprising generating a deterministic cryptographic hash from manufacturer-assigned identifiers using keccak256(manufacturer_id | device_id), associating said hash with a physical device regardless of user account or business entity ownership, persisting activity watermarks against the device hash rather than user or entity accounts, and publishing periodic Merkle root snapshots on-chain for public cross-platform auditability.`,
  `The invention is domain-agnostic and applicable to any measurable real-world activity verifiable through third-party API or sensor data, including but not limited to: residential and commercial energy production, transportation metrics, fleet vehicle telemetry, physical exercise, educational achievement, gaming progress, environmental action, and charitable contribution. The system scales from individual residential users to large commercial and industrial installations without architectural modification.`,
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
  { fig: 'FIG. 9', desc: 'is a flowchart illustrating the dual-mode autonomous driving telemetry verification system, showing separate watermark tracking and delta computation for FSD Supervised and FSD Unsupervised driving miles obtained via manufacturer API endpoints.' },
  { fig: 'FIG. 10', desc: 'is a system diagram illustrating the alternative hardware embodiment, showing IoT sensors, smart meters, and dedicated measurement devices providing activity data to the verification engine as an alternative or supplement to API-based data collection.' },
  { fig: 'FIG. 11', desc: 'is a system diagram illustrating the token exchange integration architecture, showing the flow of verified tokens from user wallets through exchange APIs to decentralized and centralized trading platforms for liquidity and monetization.' },
  { fig: 'FIG. 12', desc: 'is a system diagram illustrating the NFT marketplace integration, showing how milestone NFTs with embedded provenance metadata are listed, transferred, and traded on compatible marketplace platforms.' },
];

const DETAILED_DESCRIPTION = {
  segiArchitecture: {
    title: 'I. SEGI Architecture (Four-Layer System)',
    paragraphs: [
      `Referring now to FIG. 1, the present invention implements a Software-Enabled Gateway Interface (SEGI) comprising four distinct processing layers operating in sequence to convert verified real-world activity data into blockchain-based digital assets.`,
      `Layer 1 — API Aggregation Layer: The first layer establishes authenticated connections to a plurality of third-party API endpoints using industry-standard OAuth 2.0 authentication protocols. In a preferred embodiment, the system connects to energy production APIs (Tesla Energy, Enphase Enlighten, SolarEdge Monitoring), electric vehicle APIs (Tesla Fleet API, Wallbox API), and battery storage APIs. The system supports both individual residential accounts and commercial multi-site or fleet-level API credentials. Each connection is established without requiring installation of additional measurement devices or proprietary hardware, making the system entirely hardware-agnostic. The API aggregation layer retrieves raw activity data including, but not limited to: kilowatt-hours (kWh) produced, kilowatt-hours exported, miles driven, and charging session energy delivered.`,
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
      `The system comprises: (a) generating a unique deterministic device hash H = keccak256(manufacturer_id | device_id) from manufacturer-assigned identifiers, such as a Tesla VIN, Enphase Site ID, or SolarEdge serial number; (b) associating said hash H with the physical device regardless of which user account or business entity currently controls it; (c) maintaining a monotonically increasing watermark W against device hash H, representing the cumulative verified activity that has been tokenized for this specific physical device; (d) persisting the watermark against the device hash rather than the user or entity account, such that if device ownership transfers (e.g., home sale, business acquisition, or fleet reassignment), the new owner cannot re-tokenize previously credited activity.`,
      `The Device Watermark Registry additionally implements a Merkle snapshot mechanism: at configurable intervals, the system computes a Merkle root of all device watermarks and publishes this root on-chain. This enables any third party to independently verify that a specific device's cumulative tokenized activity has not been retroactively modified, providing cross-platform auditability.`,
      `Referring to FIG. 8, the cross-platform double-mint prevention operates as follows: if a competing platform attempts to tokenize activity for the same physical device, the publicly available Merkle snapshots enable verification that the claimed activity range has already been tokenized, making the duplicate claim provably fraudulent.`,
    ],
  },
  milestoneNFT: {
    title: 'V. Milestone NFT Issuance',
    paragraphs: [
      `Referring to FIG. 6, the system monitors cumulative verified activity for each user or entity against configurable threshold values. Upon crossing a threshold (e.g., 1,000 kWh produced for a residential user, 100,000 kWh for a commercial installation, 10,000 EV miles driven for an individual or fleet vehicle), the system triggers a non-fungible token (NFT) minting transaction encoding achievement metadata including: activity type, threshold value, verification timestamp, cumulative activity at time of achievement, and the hash of the most recent Proof-of-Delta™ proof at the time of threshold crossing.`,
    ],
  },
  autonomousDriving: {
    title: 'VI. Autonomous Driving Telemetry Verification',
    paragraphs: [
      `Referring now to FIG. 9, the present invention further provides methods for tokenizing verified autonomous driving miles obtained from manufacturer API telemetry endpoints. The system distinguishes between two distinct autonomous driving operational modes, each constituting a separately verifiable and tokenizable activity type.`,
      `FSD Supervised Mode: In the supervised autonomous driving mode, the vehicle operates with autonomous steering, acceleration, and braking capabilities while requiring a human driver to maintain attentiveness and readiness to intervene. The system retrieves supervised driving telemetry from the vehicle manufacturer's API endpoint, said telemetry comprising: miles driven in supervised autonomous mode, engagement timestamps, disengagement events, and route metadata. The verification engine applies the Proof-of-Delta™ method to supervised miles independently, maintaining a separate device-bound watermark W_supervised for each vehicle identified by its manufacturer-assigned VIN via the Proof-of-Origin™ device hash.`,
      `FSD Unsupervised Mode: In the unsupervised autonomous driving mode, the vehicle operates with full autonomous capability without requiring human driver attention or intervention readiness. The system retrieves unsupervised driving telemetry through a distinct API endpoint or data field classification provided by the vehicle manufacturer. A separate device-bound watermark W_unsupervised is maintained for each vehicle, enabling independent delta computation and token issuance for unsupervised miles. This separation ensures that supervised and unsupervised miles are never conflated and each driving mode maintains its own tamper-evident SHA-256 hash chain.`,
      `The dual-mode architecture additionally supports future robotaxi fleet telemetry, wherein vehicles operating in commercial autonomous ride-hailing service generate tokenizable miles classified under the unsupervised mode with additional fleet operator metadata. The system's hardware-agnostic design requires no aftermarket sensors—all telemetry is obtained through the vehicle manufacturer's authenticated API endpoints using the same OAuth 2.0 protocols employed by the SEGI API aggregation layer.`,
    ],
  },
  hardwareFallback: {
    title: 'VII. Alternative Hardware Embodiment',
    paragraphs: [
      `Referring now to FIG. 10, in an alternative embodiment, the system's API aggregation layer is supplemented or replaced by direct hardware-based data collection. In this embodiment, one or more measurement devices—including but not limited to IoT sensors, smart meters, dedicated energy monitors, or manufacturer-installed telemetry units—are installed in or connected to the physical energy system, electric vehicle, battery storage unit, or EV charging station to directly measure activity data.`,
      `The measurement device transmits activity readings to the SEGI data normalization layer via a local network connection (e.g., Wi-Fi, Bluetooth, Zigbee, or wired Ethernet), a cellular data connection, or a manufacturer-provided cloud relay. The data normalization layer processes hardware-sourced readings using the same conversion factors and normalization logic applied to API-sourced data, producing an equivalent normalized impact score.`,
      `Critically, the verification engine applies identical Proof-of-Delta™ and Proof-of-Origin™ methods to hardware-sourced data as to API-sourced data. The device-bound watermark, SHA-256 hash chain, and Device Watermark Registry operate identically regardless of the data source. This ensures that a device may transition between API-based and hardware-based data collection (e.g., if a manufacturer discontinues API access) without disrupting the cryptographic proof chain or requiring re-registration of the device.`,
      `In a hybrid embodiment, the system receives data from both API endpoints and hardware sensors for the same device, applying a configurable conflict resolution policy (e.g., preferring manufacturer API data when available, falling back to hardware sensor data during API outages) to maintain continuous verification coverage.`,
    ],
  },
  tokenExchange: {
    title: 'VIII. Token Exchange Integration',
    paragraphs: [
      `Referring now to FIG. 11, the system provides integration pathways enabling users and entities to monetize, trade, or redeem their verified tokens through external exchange platforms. The smart contract bridge (Layer 4) implements standard token interfaces (e.g., ERC-20 for fungible tokens) ensuring compatibility with decentralized exchanges (DEXs) and centralized cryptocurrency exchanges.`,
      `The system includes an embedded wallet interface providing users with secure custody of earned tokens without requiring external browser extensions, seed phrase management, or third-party wallet software. When a user or entity elects to monetize their tokens, the wallet interface facilitates transfer to connected exchange platforms where tokens may be traded against other digital assets or fiat currency through supported on-ramp/off-ramp providers.`,
      `For decentralized exchange integration, the system supports automated market maker (AMM) liquidity pools wherein token holders may provide liquidity and earn additional yield. The token's verification-backed scarcity—arising from the Mint-on-Proof™ method's demand-driven supply—creates an inherent value proposition distinct from speculatively-issued tokens.`,
    ],
  },
  nftMarketplace: {
    title: 'IX. NFT Marketplace Integration',
    paragraphs: [
      `Referring now to FIG. 12, milestone NFTs minted by the system (as described in Section V) are implemented using standard non-fungible token interfaces (e.g., ERC-721 or ERC-1155) ensuring compatibility with existing NFT marketplace platforms. Each milestone NFT contains embedded metadata comprising: the activity type, cumulative threshold value, verification timestamp, the hash of the Proof-of-Delta™ proof at the time of achievement, and the Proof-of-Origin™ device hash linking the achievement to a specific physical device.`,
      `This embedded provenance metadata distinguishes milestone NFTs from conventional digital collectibles by providing cryptographically verifiable proof that the NFT represents a real-world achievement backed by verified physical activity. Users and entities may list, transfer, sell, or auction their milestone NFTs on compatible marketplace platforms, with the embedded metadata serving as immutable proof of authenticity and provenance.`,
      `The system further supports organizational and fleet-level NFT achievements, wherein a commercial entity operating multiple devices across multiple sites may earn aggregate milestone NFTs representing collective verified activity across their entire portfolio of clean energy assets.`,
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
    text: `The system of claim 1, wherein said deterministic cryptographic hash for each physical device is computed as keccak256(manufacturer_id | device_id), wherein manufacturer_id comprises a manufacturer-assigned identifier and device_id comprises a unique device serial number, VIN, or site identifier, and wherein said watermark persists against said device hash independently of user account or business entity ownership.`,
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
    text: `The system of claim 1, wherein said activity data comprises one or more of: residential or commercial energy production measured in kilowatt-hours, electric vehicle miles driven, fleet vehicle telemetry, battery storage energy exported, electric vehicle charging session energy delivered, autonomous driving miles in supervised mode, autonomous driving miles in unsupervised mode, physical exercise metrics, educational achievement data, gaming progress data, environmental action metrics, or any other measurable activity verifiable through a third-party API or sensor data source.`,
  },
  {
    number: 7,
    type: 'dependent' as const,
    text: `The system of claim 1, further comprising a milestone monitoring subsystem configured to:
monitor cumulative verified activity for each user or entity against configurable threshold values;
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
  {
    number: 9,
    type: 'dependent' as const,
    text: `The system of claim 1, further comprising a supervised autonomous driving verification subsystem configured to:
retrieve driving telemetry data classified as supervised autonomous mode from a vehicle manufacturer's API endpoint, wherein said supervised mode requires a human driver to maintain attentiveness and intervention readiness;
identify the vehicle by computing a deterministic device hash from the manufacturer-assigned Vehicle Identification Number (VIN) using keccak256;
maintain a dedicated supervised-mode watermark W_supervised for each vehicle device hash, said watermark representing cumulative supervised autonomous miles previously tokenized;
compute a supervised delta D_supervised = R_supervised − W_supervised, where R_supervised is the current cumulative supervised autonomous miles reported by the manufacturer API;
generate a cryptographic proof P_supervised = SHA-256(device_hash | timestamp | D_supervised | P_prev_supervised) exclusively when D_supervised > 0, maintaining a hash chain independent from other activity types for the same device; and
atomically update W_supervised upon successful token issuance.`,
  },
  {
    number: 10,
    type: 'dependent' as const,
    text: `The system of claim 1, further comprising an unsupervised autonomous driving verification subsystem configured to:
retrieve driving telemetry data classified as unsupervised autonomous mode from a vehicle manufacturer's API endpoint, wherein said unsupervised mode operates with full autonomous capability without requiring human driver attention;
identify the vehicle by computing a deterministic device hash from the manufacturer-assigned Vehicle Identification Number (VIN) using keccak256;
maintain a dedicated unsupervised-mode watermark W_unsupervised for each vehicle device hash, said watermark being independent of any supervised-mode watermark maintained for the same device;
compute an unsupervised delta D_unsupervised = R_unsupervised − W_unsupervised, where R_unsupervised is the current cumulative unsupervised autonomous miles reported by the manufacturer API;
generate a cryptographic proof P_unsupervised = SHA-256(device_hash | timestamp | D_unsupervised | P_prev_unsupervised) exclusively when D_unsupervised > 0, maintaining a hash chain independent from supervised-mode proofs and other activity types; and
atomically update W_unsupervised upon successful token issuance;
wherein said system further supports classification of commercial robotaxi fleet miles under the unsupervised mode with additional fleet operator metadata encoded in the cryptographic proof.`,
  },
  {
    number: 11,
    type: 'dependent' as const,
    text: `The system of claim 1, wherein said API aggregation layer is alternatively or additionally configured to receive activity data from one or more hardware measurement devices comprising IoT sensors, smart meters, or dedicated energy monitors connected to the physical device, said hardware measurement devices transmitting activity readings via local network, cellular, or manufacturer cloud relay connections;
wherein said verification engine applies identical Proof-of-Delta and Proof-of-Origin methods to hardware-sourced activity data as to API-sourced data;
wherein said device-bound watermark and SHA-256 hash chain operate identically regardless of data source; and
wherein a device may transition between API-based and hardware-based data collection without disrupting said cryptographic proof chain.`,
  },
  {
    number: 12,
    type: 'dependent' as const,
    text: `The system of claim 1, further comprising an exchange integration subsystem configured to:
enable transfer of minted tokens from an embedded user wallet to external decentralized or centralized exchange platforms via standard token interfaces;
facilitate monetization of verified tokens through supported trading pairs and fiat on-ramp/off-ramp providers; and
support automated market maker (AMM) liquidity pool participation wherein token holders may provide liquidity.`,
  },
  {
    number: 13,
    type: 'dependent' as const,
    text: `The system of claim 7, further comprising an NFT marketplace integration subsystem configured to:
implement milestone NFTs using standard non-fungible token interfaces compatible with existing marketplace platforms;
embed within each milestone NFT provenance metadata comprising activity type, cumulative threshold value, verification timestamp, the hash of the most recent Proof-of-Delta cryptographic proof, and the Proof-of-Origin device hash;
enable listing, transfer, sale, or auction of milestone NFTs on compatible marketplace platforms; and
support organizational and fleet-level aggregate milestone NFTs representing collective verified activity across a plurality of devices operated by a single entity.`,
  },
];

const ABSTRACT = `A computer-implemented system and method that creates a new financial incentive layer for consumers and businesses utilizing solar, battery storage, electric vehicle, and autonomous driving technologies, independent of government tax credits or utility programs. The system tokenizes verified real-world activity using a four-layer Software-Enabled Gateway Interface (SEGI) architecture comprising an API aggregation layer connecting to third-party data sources via OAuth 2.0 without proprietary hardware, a data normalization layer producing unified impact scores, a verification engine implementing SHA-256 hash chain proofs with device-bound watermarks, and a smart contract bridge for conditional blockchain token minting. The system employs three novel verification methods: Mint-on-Proof (verification-gated issuance preventing pre-minted pools), Proof-of-Delta (incremental cryptographic verification preventing double-tokenization), and Proof-of-Origin (a Device Watermark Registry using keccak256 hardware hashes with Merkle root snapshots for cross-platform auditability). The invention is domain-agnostic and applicable to both residential and commercial deployments, supporting any measurable real-world activity verifiable through third-party APIs.`;

const USPTO_FORM_RESPONSES = {
  problem: `Consumers and businesses that adopt clean energy technologies—solar panels, battery storage, electric vehicle fleets, and autonomous driving platforms—have no ongoing financial incentive to maximize their use after initial government incentives (Solar Investment Tax Credit, EV tax credits, net-metering programs) expire or are repealed. This applies equally to residential homeowners with rooftop solar and commercial operators with large-scale installations or vehicle fleets. Additionally, existing blockchain-based reward systems use pre-minted token pools disconnected from real activity, lack cryptographic mechanisms to prevent the same energy unit from being tokenized twice, require proprietary hardware sensors for data collection, and provide no device-bound audit trail that persists across ownership changes—whether from home sales or business acquisitions.`,
  solution: `The invention creates a new financial incentive layer for solar, battery storage, and EV users that does not currently exist in the marketplace, operating entirely independent of government programs. It provides a hardware-agnostic software gateway (SEGI) that connects to existing manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox) without proprietary hardware, generating ongoing market-driven token rewards for both residential consumers and commercial operators. It mints blockchain tokens only upon cryptographic verification of real activity (Mint-on-Proof™), prevents double-tokenization through incremental device-bound watermarks with SHA-256 hash chains (Proof-of-Delta™), and binds all tokenization records to physical hardware identifiers rather than user or entity accounts using a publicly auditable Device Watermark Registry with on-chain Merkle root snapshots (Proof-of-Origin™). The system scales from individual residential users to large commercial and industrial deployments without architectural modification, supporting multiple activity types including solar production, battery export, EV miles, fleet vehicle telemetry, supervised and unsupervised autonomous driving miles, and charging sessions.`,
  howDifferent: `Unlike any existing system, our invention creates an entirely new financial incentive layer for consumers and businesses who use solar, battery storage, and electric vehicles—one that does not currently exist in the marketplace. After government incentives like the Solar ITC and EV tax credits expire or are repealed, there is no ongoing financial reward for maximizing clean energy use. Our system fills this gap by cryptographically binding every token to a verified physical activity event at the moment of minting (Mint-on-Proof™), with no pre-minted token pools. It is the only system that prevents cross-platform double-tokenization through device-bound watermarks tracked against hardware identifiers rather than user accounts (Proof-of-Origin™), and it achieves this entirely through existing manufacturer APIs without requiring proprietary hardware—supporting both residential and commercial deployments across solar, battery, EV, and autonomous driving activity types.`,
  existingProblems: `No existing system provides ongoing, market-driven financial rewards for the sustained use of clean energy assets after initial purchase incentives expire. Existing blockchain reward and carbon credit systems (e.g., SunContract, Power Ledger, Toucan, Flowcarbon) rely on pre-minted token pools disconnected from real-time activity, use trusted-oracle models without cryptographic verification, require proprietary IoT hardware creating vendor lock-in and adoption barriers, and provide no mechanism to prevent the same kilowatt-hour or mile from being tokenized multiple times across competing platforms. Conventional loyalty and rewards programs (e.g., ChargePoint, EVgo) use centralized points systems that are non-transferable and have no provenance trail.`,
  whyDontWork: `These systems fail because no financial incentive layer exists to reward consumers and businesses for ongoing clean energy utilization once government programs end. Pre-minted tokens sever the provenance link between real activity and digital assets, enabling inflation and speculation. Trusted-oracle verification models are susceptible to data manipulation without cryptographic proof chains. Proprietary hardware requirements create cost barriers and limit adoption to specific device ecosystems. Without device-bound watermark registries, the same physical energy production can be claimed by multiple platforms simultaneously, undermining the integrity of the entire tokenized energy market.`,
  howImproves: `Our invention improves on existing systems by: (1) creating an entirely new, ongoing financial incentive layer for clean energy users that is independent of government tax credits or utility programs; (2) minting tokens exclusively upon cryptographic verification with SHA-256 hash chain proofs, ensuring every token has a 1:1 provenance link to verified activity; (3) preventing double-tokenization through Proof-of-Delta™ incremental watermarks that track cumulative tokenized activity per physical device; (4) binding all records to hardware identifiers via Proof-of-Origin™ device hashes that persist across ownership changes; (5) operating entirely through existing manufacturer APIs without proprietary hardware; and (6) publishing periodic Merkle root snapshots on-chain enabling any third party to independently verify that claimed activity has not been previously tokenized.`,
  componentList: [
    { number: 1, name: 'API Communication Module', description: 'OAuth 2.0 authenticated connection handler for third-party manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox)' },
    { number: 2, name: 'Application Software (SEGI Platform)', description: 'Software-Enabled Gateway Interface application coordinating all system layers' },
    { number: 3, name: 'Blockchain Network', description: 'Base Layer 2 network on Ethereum for token and NFT transactions' },
    { number: 4, name: 'Blockchain Smart Contract (Token Minting Contract)', description: 'Smart contract executing conditional, verification-gated token issuance (Mint-on-Proof™)' },
    { number: 5, name: 'Activity Data Storage Unit', description: 'Database storing raw and normalized activity readings, proof chains, and watermark states' },
    { number: 6, name: 'Milestone Tracking Algorithm', description: 'Cumulative threshold monitor triggering NFT minting at configurable achievement levels' },
    { number: 7, name: 'NFT Minting Step', description: 'Process for creating non-fungible tokens encoding achievement metadata and proof hashes' },
    { number: 8, name: 'User Wallet Interface', description: 'Embedded wallet providing token/NFT custody without external browser extensions or seed phrases' },
    { number: 9, name: 'Real-Time Data Collection Step', description: 'Process retrieving current activity readings from authenticated API endpoints or hardware sensors' },
    { number: 10, name: 'Exchange Integration Module', description: 'Interface enabling token transfer to decentralized (DEX) and centralized exchanges for monetization' },
    { number: 11, name: 'Software-Enabled Gateway Interface (SEGI)', description: 'Four-layer architecture: API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge' },
    { number: 12, name: 'Solar Inverter Unit / Energy Production Device', description: 'Residential or commercial solar inverter producing energy data (kWh produced, kWh exported)' },
    { number: 13, name: 'Security Encryption Layer', description: 'TLS/SSL and OAuth 2.0 session security for API communications and data integrity' },
    { number: 14, name: 'Token Minting Step (Mint-on-Proof™)', description: 'Verification-gated process minting tokens exclusively upon cryptographic proof validation' },
    { number: 15, name: 'User/Entity Registration System', description: 'Account creation and device onboarding for residential consumers and commercial entities' },
    { number: 16, name: 'Business/Homeowner Inverter Gateway', description: 'Manufacturer cloud API endpoint providing energy production and consumption data' },
    { number: 17, name: 'Third-Party API Integration Layer', description: 'Aggregation interface connecting to Tesla, Enphase, SolarEdge, Wallbox, and future provider APIs' },
    { number: 18, name: 'Electric Vehicle (EV) Onboard System', description: 'Vehicle telemetry system providing miles driven, charging data, and autonomous driving metrics' },
    { number: 19, name: 'Battery Storage System', description: 'Residential or commercial battery providing discharge/export data (kWh exported to grid)' },
    { number: 20, name: 'EV Charger System', description: 'Home or commercial charging station providing session energy data (kWh delivered)' },
    { number: 21, name: 'NFT Marketplace Integration', description: 'Interface for listing, transferring, and trading milestone NFTs on compatible marketplace platforms' },
    { number: 22, name: 'Data Normalization Layer', description: 'Conversion engine applying domain-specific factors to produce unified impact scores from heterogeneous metrics' },
    { number: 23, name: 'Verification Engine (Proof-of-Delta™)', description: 'SHA-256 hash chain generator computing incremental deltas and preventing double-tokenization' },
    { number: 24, name: 'Device Watermark Registry (Proof-of-Origin™)', description: 'Smart contract mapping device hashes (keccak256) to cumulative tokenized amounts with Merkle root snapshots' },
    { number: 25, name: 'Device Hash Generator', description: 'Deterministic hash computation: keccak256(manufacturer_id | device_id) binding records to physical hardware' },
    { number: 26, name: 'Merkle Root Snapshot Publisher', description: 'Periodic on-chain publication of Merkle roots of all device watermarks for cross-platform auditability' },
    { number: 27, name: 'FSD Supervised Telemetry Module', description: 'Subsystem retrieving and verifying supervised autonomous driving miles with independent watermark W_supervised' },
    { number: 28, name: 'FSD Unsupervised Telemetry Module', description: 'Subsystem retrieving and verifying unsupervised/robotaxi autonomous driving miles with independent watermark W_unsupervised' },
    { number: 29, name: 'Hardware Measurement Device (IoT Sensor / Smart Meter)', description: 'Alternative data source: physical sensors directly measuring energy production, consumption, or miles' },
    { number: 30, name: 'AMM Liquidity Pool Interface', description: 'Automated market maker integration enabling token liquidity provision and trading' },
    { number: 31, name: 'Mint Burn Mechanism', description: 'Deflationary mechanism applying percentage burn on each mint and transfer transaction' },
  ],
};

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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Utility Patent Application Draft</h1>
            <p className="text-muted-foreground mt-1">
              Complete non-provisional utility patent application based on provisional filing + current system architecture. 
              All sections formatted per USPTO requirements (DOCX format required for filing).
            </p>
          </div>
          <PatentDocxExport
            title={TITLE}
            crossReference={CROSS_REFERENCE}
            field={FIELD}
            background={BACKGROUND}
            summary={SUMMARY}
            drawingsBrief={DRAWINGS_BRIEF}
            detailedDescription={DETAILED_DESCRIPTION}
            claims={CLAIMS}
            abstract={ABSTRACT}
          />
        </div>
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
                { item: 'Formal Drawings (12 Figures)', done: false },
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

      {/* USPTO Form Responses */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-500" />
              USPTO Form Responses
            </CardTitle>
            <CardDescription>
              Ready-to-paste answers for Patent Center / LegalZoom form fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Page 1: Purpose of Your Invention */}
            <div className="space-y-1 mb-2">
              <Badge variant="outline" className="text-xs">Page 1 — Purpose of Your Invention</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">What problem does your invention solve?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.problem} label="Problem statement copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.problem}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">How does your invention solve the problem?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.solution} label="Solution statement copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.solution}</p>
              </div>
            </div>

            {/* Page 2: How Your Invention is an Improvement */}
            <div className="border-t border-border/60 pt-6 space-y-1 mb-2">
              <Badge variant="outline" className="text-xs">Page 2 — How Your Invention is an Improvement</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">How is your invention different from and better than anything that exists?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.howDifferent} label="Differentiation copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.howDifferent}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">What are the problems with other devices or systems in the field?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.existingProblems} label="Existing problems copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.existingProblems}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Why don't these devices or systems work well?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.whyDontWork} label="Why they fail copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.whyDontWork}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">How does your invention improve on them?</p>
                <CopyButton text={USPTO_FORM_RESPONSES.howImproves} label="Improvements copied" />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                <p className="text-sm leading-relaxed">{USPTO_FORM_RESPONSES.howImproves}</p>
              </div>
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
              <Badge variant="outline" className="text-xs">9 Figures</Badge>
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
                  {claim.number === 9 && <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 text-xs">FSD Supervised</Badge>}
                  {claim.number === 10 && <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs">FSD Unsupervised</Badge>}
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
