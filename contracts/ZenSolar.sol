// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC721 is IERC721 {
    function mint(address to) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
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

    address public treasury;
    address public lpRewards;

    // Separate milestone arrays per category (matching app exactly)
    uint256[] public solarMilestones = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    uint256[] public batteryMilestones = [500, 1000, 2500, 5000, 10000, 25000, 50000];
    uint256[] public chargingMilestones = [100, 500, 1000, 1500, 2500, 5000, 10000, 25000];
    uint256[] public evMilesMilestones = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 150000, 200000];

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

    // Register new user - mints Welcome NFT
    function registerUser(address user) external onlyOwner {
        require(!hasWelcomeNFT[user], "User already registered");
        uint256 tokenId = zenSolarNFT.mint(user);
        hasWelcomeNFT[user] = true;
        nftMilestoneValue[tokenId] = 0;
        nftCategory[tokenId] = "Welcome";
        emit WelcomeNFTMinted(user, tokenId);
    }

    // Mint rewards based on new activity
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

        // Check milestones with correct array per category
        _checkMilestone(user, cumulativeSolarKwh[user], solarMilestones, "Solar");
        _checkMilestone(user, cumulativeBatteryKwh[user], batteryMilestones, "Battery");
        _checkMilestone(user, cumulativeChargingKwh[user], chargingMilestones, "Charging");
        _checkMilestone(user, cumulativeEvMiles[user], evMilesMilestones, "EV Miles");
    }

    function _checkMilestone(
        address user,
        uint256 current,
        uint256[] storage tiers,
        string memory cat
    ) internal {
        for (uint256 i = 0; i < tiers.length; i++) {
            if (current >= tiers[i] && !milestonesMinted[user][cat][tiers[i]]) {
                uint256 tokenId = zenSolarNFT.mint(user);
                nftMilestoneValue[tokenId] = tiers[i];
                nftCategory[tokenId] = cat;
                milestonesMinted[user][cat][tiers[i]] = true;
                emit MilestoneNFTMinted(user, tokenId, tiers[i], cat);
            }
        }
    }

    // Mint combo NFT (called by backend when combo conditions are met)
    function mintComboNFT(address user, string memory comboType) external onlyOwner {
        uint256 tokenId = zenSolarNFT.mint(user);
        nftMilestoneValue[tokenId] = 0;
        nftCategory[tokenId] = comboType;
        emit ComboNFTMinted(user, tokenId, comboType);
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
}
