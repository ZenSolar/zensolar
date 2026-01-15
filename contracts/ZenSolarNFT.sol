// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZenSolarNFT
 * @notice ERC-1155 Multi-Token NFT contract for ZenSolar milestone achievements
 * @dev Each token ID (0-41) represents an NFT TYPE that multiple users can earn.
 *      - Token ID 0: Welcome NFT (non-redeemable)
 *      - Token IDs 1-8: Solar Production milestones
 *      - Token IDs 9-15: Battery Discharge milestones
 *      - Token IDs 16-23: EV Charging milestones
 *      - Token IDs 24-33: EV Miles Driven milestones
 *      - Token IDs 34-41: Combo Achievement milestones (non-redeemable)
 */
contract ZenSolarNFT is ERC1155, Ownable {
    using Strings for uint256;

    string public name = "ZenSolar NFT";
    string public symbol = "ZSNFT";
    string public baseURI;

    // Track which users have which token types (each user can only have 1 of each type)
    mapping(address => mapping(uint256 => bool)) public userHasToken;
    
    // Track total supply per token type
    mapping(uint256 => uint256) public tokenSupply;

    // Total number of NFT types (0-41 = 42 types)
    uint256 public constant TOTAL_TOKEN_TYPES = 42;

    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTBurned(address indexed from, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);

    constructor(string memory _baseURI) ERC1155(_baseURI) Ownable(msg.sender) {
        baseURI = _baseURI;
    }

    /**
     * @notice Mint a milestone NFT to a user
     * @dev Each user can only own one copy of each token type
     * @param to The address to mint to
     * @param tokenId The token type ID (0-41)
     */
    function mint(address to, uint256 tokenId) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(tokenId < TOTAL_TOKEN_TYPES, "Invalid token ID");
        require(!userHasToken[to][tokenId], "User already has this NFT type");

        userHasToken[to][tokenId] = true;
        tokenSupply[tokenId] += 1;
        _mint(to, tokenId, 1, "");

        emit NFTMinted(to, tokenId);
    }

    /**
     * @notice Batch mint multiple NFTs to a user
     * @param to The address to mint to
     * @param tokenIds Array of token type IDs
     */
    function mintBatch(address to, uint256[] calldata tokenIds) external onlyOwner {
        require(to != address(0), "Invalid address");

        uint256[] memory amounts = new uint256[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIds[i] < TOTAL_TOKEN_TYPES, "Invalid token ID");
            require(!userHasToken[to][tokenIds[i]], "User already has this NFT type");
            
            userHasToken[to][tokenIds[i]] = true;
            tokenSupply[tokenIds[i]] += 1;
            amounts[i] = 1;
            
            emit NFTMinted(to, tokenIds[i]);
        }

        _mintBatch(to, tokenIds, amounts, "");
    }

    /**
     * @notice Burn a user's NFT (for redemption)
     * @param from The address to burn from
     * @param tokenId The token type ID
     */
    function burn(address from, uint256 tokenId) external onlyOwner {
        require(userHasToken[from][tokenId], "User does not have this NFT");

        userHasToken[from][tokenId] = false;
        tokenSupply[tokenId] -= 1;
        _burn(from, tokenId, 1);

        emit NFTBurned(from, tokenId);
    }

    /**
     * @notice Check if a user can receive a specific token type
     * @param user The user address
     * @param tokenId The token type ID
     * @return bool True if user doesn't have this token type yet
     */
    function canMint(address user, uint256 tokenId) external view returns (bool) {
        return tokenId < TOTAL_TOKEN_TYPES && !userHasToken[user][tokenId];
    }

    /**
     * @notice Check if a user has a specific token type
     * @param user The user address
     * @param tokenId The token type ID
     * @return bool True if user has this token type
     */
    function hasToken(address user, uint256 tokenId) external view returns (bool) {
        return userHasToken[user][tokenId];
    }

    /**
     * @notice Get all token types owned by a user
     * @param user The user address
     * @return uint256[] Array of token type IDs the user owns
     */
    function getOwnedTokens(address user) external view returns (uint256[] memory) {
        // Count owned tokens first
        uint256 count = 0;
        for (uint256 i = 0; i < TOTAL_TOKEN_TYPES; i++) {
            if (userHasToken[user][i]) count++;
        }

        // Build array of owned token IDs
        uint256[] memory owned = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < TOTAL_TOKEN_TYPES; i++) {
            if (userHasToken[user][i]) {
                owned[index] = i;
                index++;
            }
        }

        return owned;
    }

    /**
     * @notice Get the total supply of a token type
     * @param tokenId The token type ID
     * @return uint256 Number of tokens minted for this type
     */
    function totalSupply(uint256 tokenId) external view returns (uint256) {
        return tokenSupply[tokenId];
    }

    /**
     * @notice Get total supply across all token types
     * @return uint256 Total NFTs minted
     */
    function totalSupplyAll() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < TOTAL_TOKEN_TYPES; i++) {
            total += tokenSupply[i];
        }
        return total;
    }

    /**
     * @notice Update the base URI for metadata
     * @param _newBaseURI New base URI (e.g., ipfs://CID/)
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @notice Get the URI for a token type's metadata
     * @param tokenId The token type ID
     * @return string The full URI for the token metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < TOTAL_TOKEN_TYPES, "Invalid token ID");
        // Returns: baseURI + tokenId + ".json" (e.g., ipfs://CID/0.json)
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    /**
     * @notice Disable token transfers (soulbound NFTs)
     * @dev Override to prevent transfers - these are achievement badges
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        // Only allow minting (from zero address) and burning (to zero address)
        require(from == address(0) || to == address(0), "Transfers disabled - soulbound NFT");
        super.safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @notice Disable batch transfers (soulbound NFTs)
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        require(from == address(0) || to == address(0), "Transfers disabled - soulbound NFT");
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}