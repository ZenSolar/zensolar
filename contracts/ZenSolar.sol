// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IZenSolarNFT
 * @notice Interface for the ZenSolarNFT ERC-1155 contract
 */
interface IZenSolarNFT {
    function mint(address to, uint256 tokenId) external;
    function burn(address from, uint256 tokenId) external;
    function canMint(address user, uint256 tokenId) external view returns (bool);
    function hasToken(address user, uint256 tokenId) external view returns (bool);
    function getOwnedTokens(address user) external view returns (uint256[] memory);
}

/**
 * @title IMintableERC20
 * @notice Interface for the ZSOLAR ERC-20 token
 */
interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

/**
 * @title ZenSolar
 * @notice Main coordinator contract for the ZenSolar reward ecosystem
 * @dev Handles token issuance, NFT milestone minting, and NFT redemption
 * 
 * Token Issuance Rules:
 *   - 1 $ZSOLAR per kWh of solar energy produced
 *   - 1 $ZSOLAR per mile driven in an EV
 *   - 1 $ZSOLAR per kWh of battery discharged
 *   - 1 $ZSOLAR per kWh charged (supercharger + home combined)
 * 
 * NFT Milestones:
 *   - Token ID 0: Welcome NFT (auto-minted on registration)
 *   - Token IDs 1-8: Solar Production (500 - 100,000 kWh)
 *   - Token IDs 9-15: Battery Discharge (500 - 50,000 kWh)
 *   - Token IDs 16-23: EV Charging (100 - 25,000 kWh)
 *   - Token IDs 24-33: EV Miles Driven (100 - 200,000 miles)
 *   - Token IDs 34-41: Combo Achievements
 */
contract ZenSolar is Ownable {
    IMintableERC20 public zSolarToken;
    IZenSolarNFT public zenSolarNFT;

    // Cumulative lifetime values per user (used for NFT milestone checks)
    mapping(address => uint256) public cumulativeSolarKwh;
    mapping(address => uint256) public cumulativeEvMiles;
    mapping(address => uint256) public cumulativeBatteryKwh;
    mapping(address => uint256) public cumulativeChargingKwh;

    // Track if user has received Welcome NFT
    mapping(address => bool) public hasWelcomeNFT;

    // NFT metadata (for redemption value calculation)
    mapping(uint256 => uint256) public nftMilestoneValue;
    mapping(uint256 => string) public nftCategory;

    // Token economics
    uint256 public constant TOKENS_PER_UNIT = 1e18; // 1 token (18 decimals) per kWh or mile
    uint256 public constant MAX_SUPPLY = 50_000_000_000 * 10**18; // 50 billion max

    // Special token IDs
    uint256 public constant WELCOME_TOKEN_ID = 0;

    // Treasury and LP addresses for distribution
    address public treasury;
    address public lpRewards;

    // =========================================================================
    // MILESTONE THRESHOLDS - Must match frontend and metadata exactly
    // =========================================================================
    
    // Solar: Token IDs 1-8
    uint256[] public solarMilestones = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    uint256[] public solarTokenIds = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Battery: Token IDs 9-15
    uint256[] public batteryMilestones = [500, 1000, 2500, 5000, 10000, 25000, 50000];
    uint256[] public batteryTokenIds = [9, 10, 11, 12, 13, 14, 15];
    
    // Charging: Token IDs 16-23
    uint256[] public chargingMilestones = [100, 500, 1000, 1500, 2500, 5000, 10000, 25000];
    uint256[] public chargingTokenIds = [16, 17, 18, 19, 20, 21, 22, 23];
    
    // EV Miles: Token IDs 24-33
    uint256[] public evMilesMilestones = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 150000, 200000];
    uint256[] public evMilesTokenIds = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33];

    // Combo Token IDs: 34-41 (minted via mintComboNFT, not automatic)
    // 34=Duality, 35=Trifecta, 36=Quadrant, 37=Constellation, 
    // 38=Cyber Echo, 39=Zenith, 40=ZenMaster, 41=Total Eclipse

    // =========================================================================
    // EVENTS
    // =========================================================================
    
    event TokensMinted(address indexed user, uint256 totalTokens, uint256 userAmount);
    event MilestoneNFTMinted(address indexed user, uint256 tokenId, uint256 milestoneValue, string category);
    event ComboNFTMinted(address indexed user, uint256 tokenId, string comboType);
    event WelcomeNFTMinted(address indexed user, uint256 tokenId);
    event NFTRedeemed(address indexed user, uint256 tokenId, uint256 tokensReceived);
    event Burned(uint256 amount);

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    
    constructor(
        address _zSolarToken,
        address _zenSolarNFT,
        address _treasury,
        address _lpRewards
    ) Ownable(msg.sender) {
        require(_zSolarToken != address(0), "Invalid token address");
        require(_zenSolarNFT != address(0), "Invalid NFT address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_lpRewards != address(0), "Invalid LP address");

        zSolarToken = IMintableERC20(_zSolarToken);
        zenSolarNFT = IZenSolarNFT(_zenSolarNFT);
        treasury = _treasury;
        lpRewards = _lpRewards;
        
        // Initialize milestone values for redemption
        _initializeMilestoneValues();
    }

    /**
     * @dev Initialize milestone values for redemption calculations
     */
    function _initializeMilestoneValues() internal {
        // Solar milestones
        for (uint256 i = 0; i < solarMilestones.length; i++) {
            nftMilestoneValue[solarTokenIds[i]] = solarMilestones[i];
            nftCategory[solarTokenIds[i]] = "Solar";
        }
        // Battery milestones
        for (uint256 i = 0; i < batteryMilestones.length; i++) {
            nftMilestoneValue[batteryTokenIds[i]] = batteryMilestones[i];
            nftCategory[batteryTokenIds[i]] = "Battery";
        }
        // Charging milestones
        for (uint256 i = 0; i < chargingMilestones.length; i++) {
            nftMilestoneValue[chargingTokenIds[i]] = chargingMilestones[i];
            nftCategory[chargingTokenIds[i]] = "Charging";
        }
        // EV Miles milestones
        for (uint256 i = 0; i < evMilesMilestones.length; i++) {
            nftMilestoneValue[evMilesTokenIds[i]] = evMilesMilestones[i];
            nftCategory[evMilesTokenIds[i]] = "EV Miles";
        }
        // Welcome NFT (non-redeemable)
        nftCategory[WELCOME_TOKEN_ID] = "Welcome";
        // Combo NFTs (non-redeemable) - categories set when minted
    }

    // =========================================================================
    // USER REGISTRATION
    // =========================================================================

    /**
     * @notice Register a new user and mint their Welcome NFT
     * @param user The user address to register
     */
    function registerUser(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(!hasWelcomeNFT[user], "User already registered");
        require(zenSolarNFT.canMint(user, WELCOME_TOKEN_ID), "Cannot mint Welcome NFT");
        
        zenSolarNFT.mint(user, WELCOME_TOKEN_ID);
        hasWelcomeNFT[user] = true;
        
        emit WelcomeNFTMinted(user, WELCOME_TOKEN_ID);
    }

    // =========================================================================
    // TOKEN MINTING
    // =========================================================================

    /**
     * @notice Mint ZSOLAR tokens based on new activity since last mint
     * @dev CRITICAL: Parameters must be DELTA values (new activity only), NOT lifetime totals.
     *      Each unit of activity (kWh, mile) can only generate tokens ONCE.
     *      The backend is responsible for:
     *        1. Tracking baseline values per device
     *        2. Calculating delta = current_lifetime - baseline
     *        3. Resetting baseline after successful mint
     *      This ensures no double-issuance of tokens for the same activity.
     * 
     * @param user The user address to receive rewards
     * @param solarDeltaKwh NEW solar kWh produced since last mint
     * @param evMilesDelta NEW EV miles driven since last mint
     * @param batteryDeltaKwh NEW battery kWh discharged since last mint
     * @param chargingDeltaKwh NEW charging kWh since last mint
     */
    function mintRewards(
        address user,
        uint256 solarDeltaKwh,
        uint256 evMilesDelta,
        uint256 batteryDeltaKwh,
        uint256 chargingDeltaKwh
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");

        uint256 totalUnits = solarDeltaKwh + evMilesDelta + batteryDeltaKwh + chargingDeltaKwh;
        if (totalUnits == 0) return;

        uint256 tokenAmount = totalUnits * TOKENS_PER_UNIT;

        // Distribution: 93% user, 5% burn, 1% LP, 1% treasury
        uint256 burnAmount = (tokenAmount * 5) / 100;
        uint256 lpAmount = (tokenAmount * 1) / 100;
        uint256 treasuryAmount = (tokenAmount * 1) / 100;
        uint256 userAmount = tokenAmount - burnAmount - lpAmount - treasuryAmount;

        // Mint tokens
        zSolarToken.mint(user, userAmount);
        zSolarToken.mint(lpRewards, lpAmount);
        zSolarToken.mint(treasury, treasuryAmount);
        
        // Burn tokens (mint to controller then burn from controller)
        zSolarToken.mint(address(this), burnAmount);
        zSolarToken.burnFrom(address(this), burnAmount);

        emit TokensMinted(user, tokenAmount, userAmount);
        emit Burned(burnAmount);

        // Update cumulative values (for NFT milestone checks)
        cumulativeSolarKwh[user] += solarDeltaKwh;
        cumulativeEvMiles[user] += evMilesDelta;
        cumulativeBatteryKwh[user] += batteryDeltaKwh;
        cumulativeChargingKwh[user] += chargingDeltaKwh;

        // Check and mint milestone NFTs
        _checkMilestones(user, cumulativeSolarKwh[user], solarMilestones, solarTokenIds, "Solar");
        _checkMilestones(user, cumulativeBatteryKwh[user], batteryMilestones, batteryTokenIds, "Battery");
        _checkMilestones(user, cumulativeChargingKwh[user], chargingMilestones, chargingTokenIds, "Charging");
        _checkMilestones(user, cumulativeEvMiles[user], evMilesMilestones, evMilesTokenIds, "EV Miles");
    }

    /**
     * @dev Check and mint milestone NFTs for a category
     */
    function _checkMilestones(
        address user,
        uint256 currentValue,
        uint256[] storage thresholds,
        uint256[] storage tokenIds,
        string memory category
    ) internal {
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (currentValue >= thresholds[i] && zenSolarNFT.canMint(user, tokenIds[i])) {
                zenSolarNFT.mint(user, tokenIds[i]);
                emit MilestoneNFTMinted(user, tokenIds[i], thresholds[i], category);
            }
        }
    }

    // =========================================================================
    // COMBO NFT MINTING
    // =========================================================================

    /**
     * @notice Mint a combo achievement NFT
     * @dev Called by backend when combo conditions are met
     * @param user The user address
     * @param comboTokenId The combo token ID (34-41)
     * @param comboType Description of the combo achievement
     */
    function mintComboNFT(
        address user, 
        uint256 comboTokenId, 
        string memory comboType
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(comboTokenId >= 34 && comboTokenId <= 41, "Invalid combo token ID");
        require(zenSolarNFT.canMint(user, comboTokenId), "User already has this combo NFT");
        
        zenSolarNFT.mint(user, comboTokenId);
        nftCategory[comboTokenId] = comboType;
        
        emit ComboNFTMinted(user, comboTokenId, comboType);
    }

    /**
     * @notice Batch mint multiple combo NFTs
     * @param user The user address
     * @param comboTokenIds Array of combo token IDs
     * @param comboTypes Array of combo type descriptions
     */
    function mintComboNFTBatch(
        address user,
        uint256[] calldata comboTokenIds,
        string[] calldata comboTypes
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(comboTokenIds.length == comboTypes.length, "Array length mismatch");
        
        for (uint256 i = 0; i < comboTokenIds.length; i++) {
            require(comboTokenIds[i] >= 34 && comboTokenIds[i] <= 41, "Invalid combo token ID");
            
            if (zenSolarNFT.canMint(user, comboTokenIds[i])) {
                zenSolarNFT.mint(user, comboTokenIds[i]);
                nftCategory[comboTokenIds[i]] = comboTypes[i];
                emit ComboNFTMinted(user, comboTokenIds[i], comboTypes[i]);
            }
        }
    }

    // =========================================================================
    // NFT REDEMPTION
    // =========================================================================

    /**
     * @notice Redeem an NFT for ZSOLAR tokens
     * @dev User burns their NFT and receives tokens equal to milestone value minus 2% burn fee
     *      Welcome NFTs (ID 0) and Combo NFTs (IDs 34-41) cannot be redeemed
     * @param tokenId The token ID to redeem
     */
    function redeemNFT(uint256 tokenId) external {
        require(zenSolarNFT.hasToken(msg.sender, tokenId), "You don't own this NFT");
        
        // Check if redeemable (not Welcome or Combo)
        require(tokenId != WELCOME_TOKEN_ID, "Welcome NFT cannot be redeemed");
        require(tokenId < 34, "Combo NFTs cannot be redeemed");

        uint256 milestoneValue = nftMilestoneValue[tokenId];
        require(milestoneValue > 0, "NFT has no redemption value");

        uint256 tokenReward = milestoneValue * TOKENS_PER_UNIT;
        uint256 burnAmount = (tokenReward * 2) / 100; // 2% burn fee
        uint256 redeemAmount = tokenReward - burnAmount;

        // Burn the NFT
        zenSolarNFT.burn(msg.sender, tokenId);

        // Mint tokens to user (minus burn fee)
        zSolarToken.mint(msg.sender, redeemAmount);
        
        // Burn the fee
        zSolarToken.mint(address(this), burnAmount);
        zSolarToken.burn(burnAmount);

        emit NFTRedeemed(msg.sender, tokenId, redeemAmount);
        emit Burned(burnAmount);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /**
     * @notice Get user's cumulative activity stats
     */
    function getUserStats(address user) external view returns (
        uint256 solar,
        uint256 evMiles,
        uint256 battery,
        uint256 charging,
        bool hasWelcome
    ) {
        return (
            cumulativeSolarKwh[user],
            cumulativeEvMiles[user],
            cumulativeBatteryKwh[user],
            cumulativeChargingKwh[user],
            hasWelcomeNFT[user]
        );
    }

    /**
     * @notice Get all NFTs owned by a user
     */
    function getUserNFTs(address user) external view returns (uint256[] memory) {
        return zenSolarNFT.getOwnedTokens(user);
    }

    /**
     * @notice Check if user has a specific NFT
     */
    function userHasNFT(address user, uint256 tokenId) external view returns (bool) {
        return zenSolarNFT.hasToken(user, tokenId);
    }

    /**
     * @notice Get redemption value for an NFT
     */
    function getRedemptionValue(uint256 tokenId) external view returns (uint256 tokens, uint256 afterFee) {
        uint256 value = nftMilestoneValue[tokenId];
        tokens = value * TOKENS_PER_UNIT;
        afterFee = tokens - (tokens * 2) / 100;
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    function setLpRewards(address _lpRewards) external onlyOwner {
        require(_lpRewards != address(0), "Invalid address");
        lpRewards = _lpRewards;
    }

    /**
     * @notice Update contract references (in case of upgrades)
     */
    function setContracts(address _zSolarToken, address _zenSolarNFT) external onlyOwner {
        if (_zSolarToken != address(0)) {
            zSolarToken = IMintableERC20(_zSolarToken);
        }
        if (_zenSolarNFT != address(0)) {
            zenSolarNFT = IZenSolarNFT(_zenSolarNFT);
        }
    }
}