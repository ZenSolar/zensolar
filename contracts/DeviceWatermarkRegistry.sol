// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeviceWatermarkRegistry
 * @notice Public, device-bound registry of tokenized energy activity.
 *         Prevents cross-platform double-minting by recording the highest
 *         tokenized value per (deviceIdHash, dataType) on-chain, queryable
 *         by anyone — including competing platforms.
 *
 * Architecture
 * ───────────
 *  1. Real-time updates  – Every ZenSolar mint calls `updateWatermark`,
 *     writing the new cumulative total for the device + data type.
 *  2. Merkle snapshots   – The operator periodically publishes a Merkle
 *     root covering ALL device watermarks, enabling bulk auditability
 *     without replaying every event.
 *
 * Device ID hashing
 * ─────────────────
 *  Callers pass `keccak256(abi.encodePacked(manufacturerId, deviceId))`
 *  e.g. keccak256("tesla", "5YJ3E1EA7NF123456") for a Tesla VIN.
 *  This keeps raw identifiers off-chain while remaining deterministic
 *  so anyone with the VIN can verify the on-chain record.
 *
 * Data types
 * ──────────
 *  Each physical device can produce multiple activity streams:
 *    0 = Solar Production (kWh)
 *    1 = Battery Discharge (kWh)
 *    2 = EV Charging (kWh)
 *    3 = EV Miles Driven
 */
contract DeviceWatermarkRegistry is Ownable {

    // =========================================================================
    //  DATA TYPES
    // =========================================================================

    /// @notice Allowed activity data types
    enum DataType {
        SolarProduction,    // 0
        BatteryDischarge,   // 1
        EVCharging,         // 2
        EVMilesDriven       // 3
    }

    /// @notice Per-device, per-dataType watermark record
    struct Watermark {
        uint256 totalTokenized;   // Cumulative units tokenized (kWh or miles)
        uint256 lastUpdatedBlock; // Block number of last update
        uint256 lastUpdatedTime;  // Timestamp of last update
    }

    /// @notice Periodic Merkle root snapshot
    struct MerkleSnapshot {
        bytes32 merkleRoot;      // Root of all device watermarks at snapshot time
        uint256 deviceCount;     // Number of devices included
        uint256 blockNumber;     // Block when snapshot was published
        uint256 timestamp;       // Timestamp of publication
        string  metadataURI;     // Off-chain URI to full data (IPFS / Arweave)
    }

    // =========================================================================
    //  STATE
    // =========================================================================

    /// @notice deviceIdHash => dataType => Watermark
    mapping(bytes32 => mapping(DataType => Watermark)) public watermarks;

    /// @notice Track all known device hashes for enumeration
    bytes32[] public deviceHashes;
    mapping(bytes32 => bool) public knownDevice;

    /// @notice Ordered list of Merkle snapshots
    MerkleSnapshot[] public snapshots;

    /// @notice Addresses authorised to call updateWatermark (e.g. ZenSolar.sol)
    mapping(address => bool) public authorisedMinters;

    /// @notice Global counters
    uint256 public totalDevices;
    uint256 public totalUpdates;

    // =========================================================================
    //  EVENTS
    // =========================================================================

    event WatermarkUpdated(
        bytes32 indexed deviceIdHash,
        DataType indexed dataType,
        uint256 previousTotal,
        uint256 newTotal,
        uint256 delta
    );

    event MerkleSnapshotPublished(
        uint256 indexed snapshotIndex,
        bytes32 merkleRoot,
        uint256 deviceCount,
        uint256 blockNumber
    );

    event MinterAuthorised(address indexed minter);
    event MinterRevoked(address indexed minter);

    // =========================================================================
    //  MODIFIERS
    // =========================================================================

    modifier onlyAuthorisedMinter() {
        require(authorisedMinters[msg.sender] || msg.sender == owner(), "Not authorised");
        _;
    }

    // =========================================================================
    //  CONSTRUCTOR
    // =========================================================================

    constructor() Ownable(msg.sender) {}

    // =========================================================================
    //  REAL-TIME WATERMARK UPDATES
    // =========================================================================

    /**
     * @notice Record a new cumulative tokenized total for a device + data type.
     * @dev    Called by ZenSolar.sol (or future authorised minters) during every mint.
     *         The newTotal MUST be >= the existing total (monotonically increasing).
     *
     * @param deviceIdHash  keccak256(manufacturer, deviceId) — e.g. keccak256("tesla", VIN)
     * @param dataType      The activity category (solar, battery, charging, miles)
     * @param newTotal      The updated cumulative total for this device + type
     */
    function updateWatermark(
        bytes32 deviceIdHash,
        DataType dataType,
        uint256 newTotal
    ) external onlyAuthorisedMinter {
        require(deviceIdHash != bytes32(0), "Invalid device hash");

        Watermark storage wm = watermarks[deviceIdHash][dataType];
        require(newTotal >= wm.totalTokenized, "Cannot decrease watermark");

        uint256 previousTotal = wm.totalTokenized;
        uint256 delta = newTotal - previousTotal;

        // Skip if no change
        if (delta == 0) return;

        wm.totalTokenized = newTotal;
        wm.lastUpdatedBlock = block.number;
        wm.lastUpdatedTime = block.timestamp;

        // Track new devices
        if (!knownDevice[deviceIdHash]) {
            knownDevice[deviceIdHash] = true;
            deviceHashes.push(deviceIdHash);
            totalDevices++;
        }

        totalUpdates++;

        emit WatermarkUpdated(deviceIdHash, dataType, previousTotal, newTotal, delta);
    }

    /**
     * @notice Batch update watermarks for multiple devices in one transaction.
     * @dev    Gas-efficient for mints involving multiple devices (e.g. cron batch).
     */
    function updateWatermarkBatch(
        bytes32[] calldata deviceIdHashes,
        DataType[] calldata dataTypes,
        uint256[] calldata newTotals
    ) external onlyAuthorisedMinter {
        require(
            deviceIdHashes.length == dataTypes.length &&
            dataTypes.length == newTotals.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < deviceIdHashes.length; i++) {
            bytes32 deviceIdHash = deviceIdHashes[i];
            require(deviceIdHash != bytes32(0), "Invalid device hash");

            Watermark storage wm = watermarks[deviceIdHash][dataTypes[i]];
            require(newTotals[i] >= wm.totalTokenized, "Cannot decrease watermark");

            uint256 delta = newTotals[i] - wm.totalTokenized;
            if (delta == 0) continue;

            uint256 previousTotal = wm.totalTokenized;
            wm.totalTokenized = newTotals[i];
            wm.lastUpdatedBlock = block.number;
            wm.lastUpdatedTime = block.timestamp;

            if (!knownDevice[deviceIdHash]) {
                knownDevice[deviceIdHash] = true;
                deviceHashes.push(deviceIdHash);
                totalDevices++;
            }

            totalUpdates++;
            emit WatermarkUpdated(deviceIdHash, dataTypes[i], previousTotal, newTotals[i], delta);
        }
    }

    // =========================================================================
    //  MERKLE SNAPSHOTS (Periodic bulk auditability)
    // =========================================================================

    /**
     * @notice Publish a Merkle root snapshot of all device watermarks.
     * @dev    Called periodically (daily/weekly) by the operator.
     *         The full dataset backing the root is stored off-chain at metadataURI.
     *
     * @param merkleRoot   Root hash of the Merkle tree covering all watermarks
     * @param deviceCount  Number of unique devices in the snapshot
     * @param metadataURI  IPFS/Arweave URI pointing to the full snapshot data
     */
    function publishMerkleSnapshot(
        bytes32 merkleRoot,
        uint256 deviceCount,
        string calldata metadataURI
    ) external onlyOwner {
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(deviceCount > 0, "No devices in snapshot");

        uint256 index = snapshots.length;

        snapshots.push(MerkleSnapshot({
            merkleRoot: merkleRoot,
            deviceCount: deviceCount,
            blockNumber: block.number,
            timestamp: block.timestamp,
            metadataURI: metadataURI
        }));

        emit MerkleSnapshotPublished(index, merkleRoot, deviceCount, block.number);
    }

    // =========================================================================
    //  PUBLIC VIEW FUNCTIONS (Anyone can query — competitors included)
    // =========================================================================

    /**
     * @notice Check how much energy/miles have been tokenized for a device.
     * @dev    Anyone can call this. Competitors can verify before minting.
     *         To query: pass keccak256(abi.encodePacked("tesla", VIN))
     *
     * @param deviceIdHash  The hashed device identifier
     * @param dataType      The activity type to check
     * @return totalTokenized   Cumulative units already tokenized
     * @return lastUpdatedBlock Block of last watermark update
     * @return lastUpdatedTime  Timestamp of last watermark update
     */
    function getWatermark(
        bytes32 deviceIdHash,
        DataType dataType
    ) external view returns (
        uint256 totalTokenized,
        uint256 lastUpdatedBlock,
        uint256 lastUpdatedTime
    ) {
        Watermark storage wm = watermarks[deviceIdHash][dataType];
        return (wm.totalTokenized, wm.lastUpdatedBlock, wm.lastUpdatedTime);
    }

    /**
     * @notice Get all watermarks for a device across all data types.
     * @param deviceIdHash  The hashed device identifier
     * @return solar       Solar production watermark (kWh)
     * @return battery     Battery discharge watermark (kWh)
     * @return charging    EV charging watermark (kWh)
     * @return miles       EV miles driven watermark
     */
    function getDeviceWatermarks(bytes32 deviceIdHash) external view returns (
        uint256 solar,
        uint256 battery,
        uint256 charging,
        uint256 miles
    ) {
        solar = watermarks[deviceIdHash][DataType.SolarProduction].totalTokenized;
        battery = watermarks[deviceIdHash][DataType.BatteryDischarge].totalTokenized;
        charging = watermarks[deviceIdHash][DataType.EVCharging].totalTokenized;
        miles = watermarks[deviceIdHash][DataType.EVMilesDriven].totalTokenized;
    }

    /**
     * @notice Check if a device has ANY tokenized activity on record.
     * @param deviceIdHash  The hashed device identifier
     * @return exists  True if the device has been registered
     */
    function isDeviceRegistered(bytes32 deviceIdHash) external view returns (bool exists) {
        return knownDevice[deviceIdHash];
    }

    /**
     * @notice Get the total number of Merkle snapshots published.
     */
    function getSnapshotCount() external view returns (uint256) {
        return snapshots.length;
    }

    /**
     * @notice Get a specific Merkle snapshot by index.
     */
    function getSnapshot(uint256 index) external view returns (
        bytes32 merkleRoot,
        uint256 deviceCount,
        uint256 blockNumber,
        uint256 timestamp,
        string memory metadataURI
    ) {
        require(index < snapshots.length, "Snapshot does not exist");
        MerkleSnapshot storage s = snapshots[index];
        return (s.merkleRoot, s.deviceCount, s.blockNumber, s.timestamp, s.metadataURI);
    }

    /**
     * @notice Get the latest Merkle snapshot.
     */
    function getLatestSnapshot() external view returns (
        bytes32 merkleRoot,
        uint256 deviceCount,
        uint256 blockNumber,
        uint256 timestamp,
        string memory metadataURI
    ) {
        require(snapshots.length > 0, "No snapshots published");
        MerkleSnapshot storage s = snapshots[snapshots.length - 1];
        return (s.merkleRoot, s.deviceCount, s.blockNumber, s.timestamp, s.metadataURI);
    }

    // =========================================================================
    //  ADMIN FUNCTIONS
    // =========================================================================

    /**
     * @notice Authorise an address to update watermarks (e.g. ZenSolar.sol).
     */
    function authoriseMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid address");
        authorisedMinters[minter] = true;
        emit MinterAuthorised(minter);
    }

    /**
     * @notice Revoke an address's watermark update rights.
     */
    function revokeMinter(address minter) external onlyOwner {
        authorisedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @notice Get the total number of registered devices.
     */
    function getDeviceCount() external view returns (uint256) {
        return totalDevices;
    }
}
