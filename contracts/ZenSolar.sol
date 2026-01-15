// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC721 is IERC721 {
    function mintWithId(address to, uint256 tokenId) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
    function canMint(uint256 tokenId) external view returns (bool);
}

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

contract ZenSolar is Ownable {
    IMintableERC20 public zSolarToken;
    IMintableERC721 public zenSolarNFT;

    // Cumulative lifetime values (raw units)
    mapping(address => uint256) public cumulativeSolarKwh;
    mapping(address => uint256) public cumulativeEvMiles;
    mapping(address => uint256) public cumulativeBatteryKwh;
    mapping(address => uint256) public cumulativeChargingKwh; // Supercharger + Home combined

    mapping(address => bool) public hasWelcomeNFT;

    // NFT metadata helpers
    mapping(uint256 => uint256) public nftMilestoneValue;
    mapping(uint256 => string) public nftCategory;

    // Track which milestones have been minted per user per category
    mapping(address => mapping(string => mapping(uint256 => bool))) public milestonesMinted;

    uint256 public constant TOKENS_PER_UNIT = 1e18; // 1 token per kWh or per mile
    uint256 public constant MAX_SUPPLY = 50_000_000_000 * 10**18;

    // Welcome NFT token ID
    uint256 public constant WELCOME_TOKEN_ID = 0;

    address public treasury;
    address public lpRewards;

    // Milestone arrays with corresponding token IDs
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

    // Combo Token IDs: 34-41
    // 34=Duality, 35=Trifecta, 36=Quadrant, 37=Constellation, 
    // 38=Cyber Echo, 39=Zenith, 40=ZenMaster, 41=Total Eclipse

    event TokensMinted(address indexed user, uint256 totalTokens);
    event MilestoneNFTMinted(address indexed user, uint256 tokenId, uint256 milestoneValue, string category);
    event ComboNFTMinted(address indexed user, uint256 tokenId, string comboType);
    event WelcomeNFTMinted(address indexed user, uint256 tokenId);
    event Burned(uint256 amount);

    constructor(
        address _zSolarToken,
        address _zenSolarNFT,
        address _treasury,
        address _lpRewards
    ) Ownable(msg.sender) {
        zSolarToken = IMintableERC20(_zSolarToken);
        zenSolarNFT = IMintableERC721(_zenSolarNFT);
        treasury = _treasury;
        lpRewards = _lpRewards;
    }

    // Register new user - mints Welcome NFT (Token ID 0)
    function registerUser(address user) external onlyOwner {
        require(!hasWelcomeNFT[user], "User already registered");
        require(zenSolarNFT.canMint(WELCOME_TOKEN_ID), "Welcome NFT already minted");
        
        zenSolarNFT.mintWithId(user, WELCOME_TOKEN_ID);
        hasWelcomeNFT[user] = true;
        nftMilestoneValue[WELCOME_TOKEN_ID] = 0;
        nftCategory[WELCOME_TOKEN_ID] = "Welcome";
        emit WelcomeNFTMinted(user, WELCOME_TOKEN_ID);
    }

    /**
     * @notice Mint rewards based on new activity since last mint
     * @dev CRITICAL: Parameters must be DELTA values (new activity only), NOT lifetime totals.
     *      Each unit of activity (kWh, mile) can only generate tokens ONCE.
     *      The backend is responsible for:
     *        1. Tracking baseline values per device
     *        2. Calculating delta = current_lifetime - baseline
     *        3. Resetting baseline after successful mint
     *      This ensures no double-issuance of tokens for the same activity.
     * 
     * @param user The user address to receive rewards
     * @param solarDeltaKwh NEW solar kWh produced since last mint (not lifetime)
     * @param evMilesDelta NEW EV miles driven since last mint (not lifetime)
     * @param batteryDeltaKwh NEW battery kWh discharged since last mint (not lifetime)
     * @param chargingDeltaKwh NEW charging kWh (supercharger + home) since last mint (not lifetime)
     */
    function mintRewards(
        address user,
        uint256 solarDeltaKwh,
        uint256 evMilesDelta,
        uint256 batteryDeltaKwh,
        uint256 chargingDeltaKwh
    ) external onlyOwner {
        require(user != address(0), "Invalid user");

        uint256 totalUnits = solarDeltaKwh + evMilesDelta + batteryDeltaKwh + chargingDeltaKwh;
        if (totalUnits == 0) return;

        uint256 tokenAmount = totalUnits * TOKENS_PER_UNIT;

        // Distribution: 93% user, 5% burn, 1% LP, 1% treasury
        uint256 burnAmount = (tokenAmount * 5) / 100;
        uint256 lpAmount = (tokenAmount * 1) / 100;
        uint256 treasuryAmount = (tokenAmount * 1) / 100;
        uint256 mintAmount = tokenAmount - burnAmount - lpAmount - treasuryAmount;

        zSolarToken.mint(user, mintAmount);
        zSolarToken.mint(lpRewards, lpAmount);
        zSolarToken.mint(treasury, treasuryAmount);
        zSolarToken.burn(burnAmount);

        emit TokensMinted(user, mintAmount);
        emit Burned(burnAmount);

        // Update cumulatives
        cumulativeSolarKwh[user] += solarDeltaKwh;
        cumulativeEvMiles[user] += evMilesDelta;
        cumulativeBatteryKwh[user] += batteryDeltaKwh;
        cumulativeChargingKwh[user] += chargingDeltaKwh;

        // Check milestones with fixed token IDs
        _checkMilestone(user, cumulativeSolarKwh[user], solarMilestones, solarTokenIds, "Solar");
        _checkMilestone(user, cumulativeBatteryKwh[user], batteryMilestones, batteryTokenIds, "Battery");
        _checkMilestone(user, cumulativeChargingKwh[user], chargingMilestones, chargingTokenIds, "Charging");
        _checkMilestone(user, cumulativeEvMiles[user], evMilesMilestones, evMilesTokenIds, "EV Miles");
    }

    function _checkMilestone(
        address user,
        uint256 current,
        uint256[] storage tiers,
        uint256[] storage tokenIds,
        string memory cat
    ) internal {
        for (uint256 i = 0; i < tiers.length; i++) {
            if (current >= tiers[i] && !milestonesMinted[user][cat][tiers[i]]) {
                uint256 tokenId = tokenIds[i];
                
                // Check if this specific token ID can be minted
                if (zenSolarNFT.canMint(tokenId)) {
                    zenSolarNFT.mintWithId(user, tokenId);
                    nftMilestoneValue[tokenId] = tiers[i];
                    nftCategory[tokenId] = cat;
                    milestonesMinted[user][cat][tiers[i]] = true;
                    emit MilestoneNFTMinted(user, tokenId, tiers[i], cat);
                }
            }
        }
    }

    // Mint combo NFT with specific token ID (called by backend when combo conditions are met)
    // comboTokenId: 34=Duality, 35=Trifecta, 36=Quadrant, 37=Constellation, 
    //               38=Cyber Echo, 39=Zenith, 40=ZenMaster, 41=Total Eclipse
    function mintComboNFT(address user, uint256 comboTokenId, string memory comboType) external onlyOwner {
        require(comboTokenId >= 34 && comboTokenId <= 41, "Invalid combo token ID");
        require(zenSolarNFT.canMint(comboTokenId), "Combo NFT already minted");
        
        zenSolarNFT.mintWithId(user, comboTokenId);
        nftMilestoneValue[comboTokenId] = 0;
        nftCategory[comboTokenId] = comboType;
        emit ComboNFTMinted(user, comboTokenId, comboType);
    }

    // Redeem NFT for tokens (user burns NFT, gets tokens minus 2% burn fee)
    function redeemNFT(uint256 tokenId) external {
        require(zenSolarNFT.ownerOf(tokenId) == msg.sender, "Not owner");

        string memory cat = nftCategory[tokenId];
        require(
            keccak256(abi.encodePacked(cat)) != keccak256(abi.encodePacked("Welcome")) &&
            !startsWith(cat, "Combo"),
            "Cannot redeem welcome or combo NFTs"
        );

        uint256 value = nftMilestoneValue[tokenId];
        uint256 tokenReward = value * TOKENS_PER_UNIT; // 1:1 base unit
        uint256 burnAmount = (tokenReward * 2) / 100;
        uint256 redeemAmount = tokenReward - burnAmount;

        zenSolarNFT.burn(tokenId);
        zSolarToken.mint(msg.sender, redeemAmount);
        zSolarToken.burn(burnAmount);

        emit Burned(burnAmount);

        delete nftMilestoneValue[tokenId];
        delete nftCategory[tokenId];
    }

    // Helper function to check if string starts with prefix
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strB = bytes(str);
        bytes memory preB = bytes(prefix);
        if (preB.length > strB.length) return false;
        for (uint256 i = 0; i < preB.length; i++) {
            if (strB[i] != preB[i]) return false;
        }
        return true;
    }

    // Admin functions
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setLpRewards(address _lpRewards) external onlyOwner {
        lpRewards = _lpRewards;
    }

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

    // Get token ID for a specific milestone (useful for frontend)
    function getSolarTokenId(uint256 index) external view returns (uint256) {
        require(index < solarTokenIds.length, "Index out of bounds");
        return solarTokenIds[index];
    }

    function getBatteryTokenId(uint256 index) external view returns (uint256) {
        require(index < batteryTokenIds.length, "Index out of bounds");
        return batteryTokenIds[index];
    }

    function getChargingTokenId(uint256 index) external view returns (uint256) {
        require(index < chargingTokenIds.length, "Index out of bounds");
        return chargingTokenIds[index];
    }

    function getEvMilesTokenId(uint256 index) external view returns (uint256) {
        require(index < evMilesTokenIds.length, "Index out of bounds");
        return evMilesTokenIds[index];
    }
}
