const { Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber, PageBreak } = require("docx");
const fs = require("fs");

const TITLE = "System and Method for Tokenizing and Gamifying Verified Clean Energy and Real-World Activity Using Blockchain Technology";

const CROSS_REFERENCE = `This application claims the benefit of U.S. Provisional Application No. 63/782,397, filed April 2, 2025, entitled "Gamifying and Tokenizing Sustainable Behaviors," the entire disclosure of which is incorporated herein by reference.`;

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
  `Proof-of-Delta™: A method for preventing double-tokenization comprising maintaining a device-bound watermark representing cumulative tokenized activity, computing a delta between the current activity reading and the stored watermark, issuing tokens exclusively for positive delta values, and atomically updating the watermark upon successful token issuance—all linked through a SHA-256 hash chain of the form SHA-256(device_id + timestamp + value + prevHash).`,
  `Proof-of-Origin™: A device-bound anti-fraud system comprising generating a deterministic cryptographic hash from manufacturer-assigned identifiers using keccak256(manufacturer_id + device_id), associating said hash with a physical device regardless of user account or business entity ownership, persisting activity watermarks against the device hash rather than user or entity accounts, and publishing periodic Merkle root snapshots on-chain for public cross-platform auditability.`,
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
  { fig: 'FIG. 10', desc: 'is a system diagram illustrating the baseline initialization engine, showing device activation requests and device-to-hash mapping for a plurality of device types (Tesla Powerwall, Rivian EV, Sense Smart Meter, Enphase Solar), including ownership validation via OAuth token, device registry queries via keccak256 hashing, blacklist status verification, initial reading capture, proof hash creation, and on-chain/off-chain watermark table storage establishing the starting point for incremental token issuance.' },
  { fig: 'FIG. 11', desc: 'is a system diagram illustrating the token distribution and settlement architecture, showing verified reward payloads with signed delta data, user wallet addresses, and signed reward authorizations flowing through a distribution router smart contract that performs network selection across L2/sidechains, mainnet, and private enterprise ledgers, batch transaction optimization, platform fee deduction, and direct payout via smart wallet abstraction to user and exchange wallets, with on-chain ledger updates confirming instant cross-chain settlement and reward distribution.' },
  { fig: 'FIG. 12', desc: 'is a system diagram illustrating the organizational aggregation hub for commercial and fleet deployments, showing an organizational hardware registry receiving activation requests and verified device activity streams, consolidating data points, verifying organization ownership, generating organization hashes via keccak256, auditing individual device proofs, calculating tiered fleet rewards, issuing organizational milestone NFTs, and providing outputs including a corporate sustainability dashboard, real-time fleet CO2 reports, aggregate asset token balances, and API/webhook integration for enterprise resource planning systems.' },
];

const DETAILED_DESCRIPTION = {
  segiArchitecture: {
    title: 'I. SEGI Architecture (Four-Layer System)',
    paragraphs: [
      `Referring now to FIG. 1, the present invention implements a Software-Enabled Gateway Interface (SEGI) comprising four distinct processing layers operating in sequence to convert verified real-world activity data into blockchain-based digital assets.`,
      `Layer 1 — API Aggregation Layer: The first layer establishes authenticated connections to a plurality of third-party API endpoints using industry-standard OAuth 2.0 authentication protocols. In a preferred embodiment, the system connects to energy production APIs (Tesla Energy, Enphase Enlighten, SolarEdge Monitoring), electric vehicle APIs (Tesla Fleet API, Wallbox API), and battery storage APIs. The system supports both individual residential accounts and commercial multi-site or fleet-level API credentials. Each connection is established without requiring installation of additional measurement devices or proprietary hardware, making the system entirely hardware-agnostic. The API aggregation layer retrieves raw activity data including, but not limited to: kilowatt-hours (kWh) produced, kilowatt-hours exported, miles driven, and charging session energy delivered.`,
      `Layer 2 — Data Normalization Layer: The second layer receives heterogeneous activity metrics from the API aggregation layer and applies domain-specific conversion factors to output a normalized impact score. For example, 1 kWh of solar production, 1 kWh of battery export, and 1 mile of EV driving may each be assigned different weighting factors to produce a unified score enabling consistent token issuance across disparate activity types. This normalization enables the system to be domain-agnostic—the same architecture can tokenize fitness data, educational achievements, gaming milestones, or any other measurable activity by simply substituting the appropriate conversion factors.`,
      `Layer 3 — Verification Engine: The third layer generates cryptographic proofs for each activity data point. As described in detail below under Proof-of-Delta™, the verification engine constructs a SHA-256 hash chain of the form SHA-256(device_id + timestamp + value + prevHash) for every reading, creating a tamper-evident, linked provenance trail. The verification engine also performs delta computation to ensure only incremental, never-before-tokenized activity proceeds to the minting stage.`,
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
      `The method comprises: (a) maintaining a device-bound watermark W representing the cumulative activity that has been previously tokenized for a specific physical device; (b) upon receiving a new activity reading R from the API, computing the delta D = R − W; (c) if D > 0, generating a cryptographic proof P = SHA-256(device_id + timestamp + D + P_prev), where P_prev is the hash of the immediately preceding proof for this device; (d) issuing tokens exclusively for the positive delta value D; (e) atomically updating the watermark W ← R upon successful token issuance, ensuring no gap or overlap in credited activity.`,
      `If D ≤ 0 (indicating the current reading is equal to or less than the previously tokenized amount), no tokens are issued and no proof is generated. This handles edge cases including meter resets, data corrections, and API reporting delays.`,
      `The linked hash chain creates a tamper-evident audit trail. Any modification to a historical reading would invalidate all subsequent proofs in the chain, making retroactive manipulation detectable and provable.`,
      `Historical energy production data (readings that predate the device's registration on the platform) is explicitly excluded from minting eligibility. Only activity occurring after device registration and generating a verified positive delta is eligible for tokenization.`,
    ],
  },
  proofOfOrigin: {
    title: 'IV. Proof-of-Origin™ (Device Watermark Registry)',
    paragraphs: [
      `Referring now to FIG. 4, the Proof-of-Origin™ system implements a Device Watermark Registry that binds tokenization records to physical hardware rather than user accounts.`,
      `The system comprises: (a) generating a unique deterministic device hash H = keccak256(manufacturer_id + device_id) from manufacturer-assigned identifiers, such as a Tesla VIN, Enphase Site ID, or SolarEdge serial number; (b) associating said hash H with the physical device regardless of which user account or business entity currently controls it; (c) maintaining a monotonically increasing watermark W against device hash H, representing the cumulative verified activity that has been tokenized for this specific physical device; (d) persisting the watermark against the device hash rather than the user or entity account, such that if device ownership transfers (e.g., home sale, business acquisition, or fleet reassignment), the new owner cannot re-tokenize previously credited activity.`,
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
  baselineInitialization: {
    title: 'VII. Baseline Initialization Engine',
    paragraphs: [
      `Referring now to FIG. 10, the system implements a baseline initialization engine that establishes the starting point for incremental token issuance when a new physical device is registered on the platform. The initialization engine processes activation requests from a plurality of device types, including but not limited to: Tesla Powerwall (solar + battery), Rivian EV, Sense Smart Meter (IoT), and Enphase Solar systems.`,
      `For each activation request, the engine performs a device-to-hash mapping by computing a deterministic device hash using keccak256(manufacturer_id + device_id). The engine then executes a multi-step validation sequence comprising: (a) validating device ownership through the OAuth 2.0 token associated with the user's authenticated API connection; (b) querying the Device Watermark Registry using the computed keccak256 hash to determine whether the device has been previously registered on this or any other platform; (c) verifying the device's blacklist status to ensure it has not been flagged for fraudulent activity.`,
      `Upon successful validation, the engine captures the initial device reading (R0) from the manufacturer's API endpoint and creates a genesis proof hash P0 = SHA-256(device_id + timestamp + R0). This proof hash, along with the baseline reading, is stored in both the on-chain Device Watermark Registry (mapping Device_Hash to R0, P0 (Proof)) and an off-chain watermark table for operational efficiency.`,
      `The baseline initialization establishes a starting point with zero token history, ensuring that only activity occurring after registration generates tokenizable deltas. This prevents retroactive tokenization of historical energy production or driving miles that predate the device's enrollment on the platform, maintaining the integrity of the Proof-of-Delta verification chain.`,
      `In an alternative or supplementary embodiment, the system's API aggregation layer may be supplemented or replaced by direct hardware-based data collection from IoT sensors, smart meters, or dedicated energy monitors. The verification engine applies identical Proof-of-Delta and Proof-of-Origin methods to hardware-sourced data, ensuring that a device may transition between data sources without disrupting the cryptographic proof chain.`,
    ],
  },
  tokenDistribution: {
    title: 'VIII. Token Distribution and Settlement',
    paragraphs: [
      `Referring now to FIG. 11, the system implements a token distribution and settlement architecture that routes verified reward payloads from the verification engine to user wallets across multiple blockchain networks. The distribution system receives four input components for each reward transaction: (a) a verified reward payload containing the cryptographic proof and token quantity; (b) signed delta data confirming the incremental activity; (c) the user's wallet address; and (d) a signed reward authorization from the verification engine.`,
      `A distribution router smart contract processes these inputs and performs network selection based on gas cost optimization and transaction value. Low-value, high-frequency rewards are routed to Layer 2 sidechains for cost efficiency, while high-value transactions may be settled on the Ethereum mainnet for maximum security. The system additionally supports private enterprise ledgers for commercial deployments requiring permissioned settlement.`,
      `The distribution router batches multiple reward transactions to optimize gas fees, deducts applicable platform fees (transaction tax), and executes direct payout via smart wallet abstraction—enabling users to receive tokens without managing complex blockchain interactions. Settlement flows to both user smart wallets and exchange deposit addresses, with on-chain ledger updates confirming instant cross-chain settlement and providing feedback that the reward has been successfully distributed.`,
      `The system includes an embedded wallet interface providing users with secure custody of earned tokens without requiring external browser extensions, seed phrase management, or third-party wallet software. For decentralized exchange integration, the system supports automated market maker (AMM) liquidity pools wherein token holders may provide liquidity and earn additional yield.`,
    ],
  },
  organizationalAggregation: {
    title: 'IX. Organizational Aggregation Hub',
    paragraphs: [
      `Referring now to FIG. 12, the system implements an organizational aggregation hub enabling commercial entities and fleet operators to consolidate verified activity data across a plurality of devices into unified organizational metrics. The hub maintains an organizational hardware registry that receives activation requests and maps each device to its verified activity stream via the Proof-of-Origin device hash.`,
      `The aggregation process comprises: (a) consolidating individual device data points from all registered devices within the organization; (b) verifying organization ownership through keccak256-based organization hashes (H = keccak256(org_id)); (c) auditing individual device proofs (D1, D2, ... DN) to ensure each contributing device's Proof-of-Delta chain is valid and unbroken; and (d) performing organization-level verification to confirm the entity's authority over the claimed devices.`,
      `Upon successful aggregation and verification, the hub calculates tiered fleet rewards based on collective verified activity and issues organizational milestone NFTs using standard non-fungible token interfaces (e.g., ERC-721 or ERC-1155). Each organizational NFT contains embedded provenance metadata comprising the aggregate activity type, cumulative threshold value, verification timestamp, contributing device hashes, and the organization hash.`,
      `The system provides four organizational output interfaces: (a) a corporate sustainability dashboard displaying real-time fleet-wide clean energy metrics; (b) real-time fleet CO2 reports quantifying verified environmental impact; (c) aggregate asset token balances across all organizational wallets; and (d) API/webhook integration enabling data flow to enterprise resource planning (ERP) systems for compliance reporting and sustainability disclosures.`,
    ],
  },
};

const CLAIMS = [
  { number: 1, type: 'independent', text: `A computer-implemented system for tokenizing verified real-world activity using blockchain technology, the system comprising:\n\n(a) an API aggregation layer configured to establish authenticated connections to a plurality of third-party data source endpoints using OAuth 2.0 authentication protocols, said layer retrieving activity data without requiring installation of proprietary measurement hardware;\n\n(b) a data normalization layer configured to receive heterogeneous activity metrics from said plurality of data sources and apply domain-specific conversion factors to produce a normalized impact score;\n\n(c) a verification engine configured to:\n    (i) maintain a device-bound watermark representing cumulative tokenized activity for each physical device identified by a deterministic cryptographic hash;\n    (ii) compute a delta between a current activity reading and the stored watermark;\n    (iii) generate a cryptographic proof linking said delta to a tamper-evident hash chain; and\n    (iv) output a verified activity record exclusively when said delta is positive; and\n\n(d) a smart contract bridge configured to execute atomic token minting on a blockchain network exclusively upon receipt of said verified activity record from said verification engine, wherein no tokens representing said activity exist prior to said verification event.` },
  { number: 2, type: 'dependent', text: `The system of claim 1, wherein said verification engine implements a Mint-on-Proof method comprising:\nreceiving said activity data from an authenticated third-party API endpoint;\nvalidating data authenticity through provider-signed API responses;\ngenerating said cryptographic proof comprising a SHA-256 hash binding said activity data to a specific device identifier, timestamp, and a hash of the immediately preceding proof in a linked chain; and\nwherein said smart contract bridge rejects any minting request not accompanied by a valid cryptographic proof.` },
  { number: 3, type: 'dependent', text: `The system of claim 1, wherein said verification engine implements a Proof-of-Delta method for preventing double-tokenization, comprising:\nmaintaining said device-bound watermark W representing cumulative tokenized activity for a specific physical device;\nupon receiving a new activity reading R, computing delta D = R − W;\ngenerating a cryptographic proof P = SHA-256(device_id + timestamp + D + P_prev) exclusively when D > 0;\nissuing tokens corresponding exclusively to said positive delta value D; and\natomically updating said watermark W ← R upon successful token issuance.` },
  { number: 4, type: 'dependent', text: `The system of claim 1, wherein said deterministic cryptographic hash for each physical device is computed as keccak256(manufacturer_id + device_id), wherein manufacturer_id comprises a manufacturer-assigned identifier and device_id comprises a unique device serial number, VIN, or site identifier, and wherein said watermark persists against said device hash independently of user account or business entity ownership.` },
  { number: 5, type: 'dependent', text: `The system of claim 4, further comprising a Device Watermark Registry implemented as a smart contract maintaining a mapping of device hashes to cumulative tokenized activity amounts, said registry further configured to:\nenforce monotonically increasing watermark values;\npublish periodic Merkle root snapshots of all device watermarks on-chain; and\nenable third-party verification that any claimed activity range for a specific device has not been previously tokenized.` },
  { number: 6, type: 'dependent', text: `The system of claim 1, wherein said activity data comprises one or more of: residential or commercial energy production measured in kilowatt-hours, electric vehicle miles driven, fleet vehicle telemetry, battery storage energy exported, electric vehicle charging session energy delivered, autonomous driving miles in supervised mode, autonomous driving miles in unsupervised mode, physical exercise metrics, educational achievement data, gaming progress data, environmental action metrics, or any other measurable activity verifiable through a third-party API or sensor data source.` },
  { number: 7, type: 'dependent', text: `The system of claim 1, further comprising a milestone monitoring subsystem configured to:\nmonitor cumulative verified activity for each user or entity against configurable threshold values;\ntrigger a non-fungible token (NFT) minting transaction upon a threshold crossing; and\nencode within said NFT achievement metadata including activity type, threshold value, verification timestamp, and the hash of the most recent cryptographic proof at the time of threshold crossing.` },
  { number: 8, type: 'dependent', text: `A computer-implemented method for tokenizing verified real-world activity, the method comprising:\nestablishing authenticated connections to a plurality of third-party API endpoints;\nretrieving activity data from said endpoints without requiring proprietary measurement hardware;\nnormalizing said activity data into a unified impact score;\nfor each physical device, computing a deterministic device hash from manufacturer-assigned identifiers;\nmaintaining a watermark for each device hash representing cumulative tokenized activity;\ncomputing an incremental delta between a current reading and said watermark;\ngenerating a SHA-256 hash chain proof linking said delta to a tamper-evident provenance trail;\nminting blockchain tokens exclusively for positive delta values upon successful cryptographic verification; and\natomically updating said watermark upon successful minting.` },
  { number: 9, type: 'dependent', text: `The system of claim 1, further comprising a supervised autonomous driving verification subsystem configured to:\nretrieve driving telemetry data classified as supervised autonomous mode from a vehicle manufacturer's API endpoint, wherein said supervised mode requires a human driver to maintain attentiveness and intervention readiness;\nidentify the vehicle by computing a deterministic device hash from the manufacturer-assigned Vehicle Identification Number (VIN) using keccak256;\nmaintain a dedicated supervised-mode watermark W_supervised for each vehicle device hash, said watermark representing cumulative supervised autonomous miles previously tokenized;\ncompute a supervised delta D_supervised = R_supervised − W_supervised, where R_supervised is the current cumulative supervised autonomous miles reported by the manufacturer API;\ngenerate a cryptographic proof P_supervised = SHA-256(device_hash + timestamp + D_supervised + P_prev_supervised) exclusively when D_supervised > 0, maintaining a hash chain independent from other activity types for the same device; and\natomically update W_supervised upon successful token issuance.` },
  { number: 10, type: 'dependent', text: `The system of claim 1, further comprising an unsupervised autonomous driving verification subsystem configured to:\nretrieve driving telemetry data classified as unsupervised autonomous mode from a vehicle manufacturer's API endpoint, wherein said unsupervised mode operates with full autonomous capability without requiring human driver attention;\nidentify the vehicle by computing a deterministic device hash from the manufacturer-assigned Vehicle Identification Number (VIN) using keccak256;\nmaintain a dedicated unsupervised-mode watermark W_unsupervised for each vehicle device hash, said watermark being independent of any supervised-mode watermark maintained for the same device;\ncompute an unsupervised delta D_unsupervised = R_unsupervised − W_unsupervised, where R_unsupervised is the current cumulative unsupervised autonomous miles reported by the manufacturer API;\ngenerate a cryptographic proof P_unsupervised = SHA-256(device_hash + timestamp + D_unsupervised + P_prev_unsupervised) exclusively when D_unsupervised > 0, maintaining a hash chain independent from supervised-mode proofs and other activity types; and\natomically update W_unsupervised upon successful token issuance;\nwherein said system further supports classification of commercial robotaxi fleet miles under the unsupervised mode with additional fleet operator metadata encoded in the cryptographic proof.` },
  { number: 11, type: 'dependent', text: `The system of claim 1, wherein said API aggregation layer is alternatively or additionally configured to receive activity data from one or more hardware measurement devices comprising IoT sensors, smart meters, or dedicated energy monitors connected to the physical device, said hardware measurement devices transmitting activity readings via local network, cellular, or manufacturer cloud relay connections;\nwherein said verification engine applies identical Proof-of-Delta and Proof-of-Origin methods to hardware-sourced activity data as to API-sourced data;\nwherein said device-bound watermark and SHA-256 hash chain operate identically regardless of data source; and\nwherein a device may transition between API-based and hardware-based data collection without disrupting said cryptographic proof chain.` },
  { number: 12, type: 'dependent', text: `The system of claim 1, further comprising an exchange integration subsystem configured to:\nenable transfer of minted tokens from an embedded user wallet to external decentralized or centralized exchange platforms via standard token interfaces;\nfacilitate monetization of verified tokens through supported trading pairs and fiat on-ramp/off-ramp providers; and\nsupport automated market maker (AMM) liquidity pool participation wherein token holders may provide liquidity.` },
  { number: 13, type: 'dependent', text: `The system of claim 7, further comprising an NFT marketplace integration subsystem configured to:\nimplement milestone NFTs using standard non-fungible token interfaces compatible with existing marketplace platforms;\nembed within each milestone NFT provenance metadata comprising activity type, cumulative threshold value, verification timestamp, the hash of the most recent Proof-of-Delta cryptographic proof, and the Proof-of-Origin device hash;\nenable listing, transfer, sale, or auction of milestone NFTs on compatible marketplace platforms; and\nsupport organizational and fleet-level aggregate milestone NFTs representing collective verified activity across a plurality of devices operated by a single entity.` },
];

const ABSTRACT = `A computer-implemented system and method that creates a new financial incentive layer for consumers and businesses utilizing solar, battery storage, electric vehicle, and autonomous driving technologies, independent of government tax credits or utility programs. The system tokenizes verified real-world activity using a four-layer Software-Enabled Gateway Interface (SEGI) architecture comprising an API aggregation layer connecting to third-party data sources via OAuth 2.0 without proprietary hardware, a data normalization layer producing unified impact scores, a verification engine implementing SHA-256 hash chain proofs with device-bound watermarks, and a smart contract bridge for conditional blockchain token minting. The system employs three novel verification methods: Mint-on-Proof (verification-gated issuance preventing pre-minted pools), Proof-of-Delta (incremental cryptographic verification preventing double-tokenization), and Proof-of-Origin (a Device Watermark Registry using keccak256 hardware hashes with Merkle root snapshots for cross-platform auditability). The invention is domain-agnostic and applicable to both residential and commercial deployments, supporting any measurable real-world activity verifiable through third-party APIs.`;

const LINE_SPACING = 360;
let paraCounter = 0;
const nextParaNum = () => { paraCounter++; return `[${String(paraCounter).padStart(4, '0')}]`; };

const textPara = (text, opts) => {
  const numbered = opts?.numbered !== false;
  const children = [];
  if (numbered) children.push(new TextRun({ text: `${nextParaNum()}  `, bold: true, font: 'Times New Roman', size: 24 }));
  children.push(new TextRun({ text, bold: opts?.bold, font: 'Times New Roman', size: 24 }));
  return new Paragraph({ spacing: { after: opts?.spacing ?? 200, line: LINE_SPACING }, children });
};

const sectionHeading = (text, isH1 = true) =>
  new Paragraph({
    spacing: { before: 360, after: 200, line: LINE_SPACING },
    alignment: isH1 ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: isH1 ? 28 : 24 })],
  });

const children = [];

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 400, line: LINE_SPACING },
  children: [new TextRun({ text: TITLE.toUpperCase(), bold: true, font: 'Times New Roman', size: 28 })],
}));

children.push(sectionHeading('CROSS-REFERENCE TO RELATED APPLICATIONS'));
children.push(textPara(CROSS_REFERENCE));

children.push(sectionHeading('FIELD OF THE INVENTION'));
children.push(textPara(FIELD));

children.push(sectionHeading('BACKGROUND OF THE INVENTION'));
BACKGROUND.forEach(p => children.push(textPara(p)));

children.push(sectionHeading('BRIEF SUMMARY OF THE INVENTION'));
SUMMARY.forEach(p => children.push(textPara(p)));

children.push(sectionHeading('BRIEF DESCRIPTION OF THE DRAWINGS'));
DRAWINGS_BRIEF.forEach(d => children.push(textPara(`${d.fig} ${d.desc}`)));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(sectionHeading('DETAILED DESCRIPTION OF THE INVENTION'));
Object.values(DETAILED_DESCRIPTION).forEach(section => {
  children.push(sectionHeading(section.title, false));
  section.paragraphs.forEach(p => children.push(textPara(p)));
});

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(sectionHeading('CLAIMS'));
children.push(textPara('What is claimed is:', { numbered: false }));
CLAIMS.forEach(claim => {
  children.push(new Paragraph({
    spacing: { after: 240, line: LINE_SPACING },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${claim.number}. `, bold: true, font: 'Times New Roman', size: 24 }),
      new TextRun({ text: claim.text.trim(), font: 'Times New Roman', size: 24 }),
    ],
  }));
});

const abstractWordCount = ABSTRACT.trim().split(/\s+/).filter(Boolean).length;
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(sectionHeading('ABSTRACT OF THE DISCLOSURE'));
children.push(textPara(ABSTRACT, { numbered: false }));

const doc = new Document({
  styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Attorney Docket No. ZEN-001', font: 'Times New Roman', size: 20, italics: true })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 }),
          ],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/dev-server/public/documents/ZenSolar_Utility_Patent_Application.docx", buffer);
  console.log(`Patent DOCX written. Abstract: ${abstractWordCount} words. Paragraphs: ${paraCounter}.`);
});
