// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZenSolarNFT is ERC721, Ownable {
    string public baseURI;

    // Mapping from token ID to metadata URI suffix
    mapping(uint256 => string) private _tokenURIs;
    
    // Track which token IDs have been minted (for fixed ID minting)
    mapping(uint256 => bool) public tokenIdExists;

    event BaseURIUpdated(string newBaseURI);
    event NFTMinted(address indexed to, uint256 tokenId);
    event NFTBurned(uint256 tokenId);

    constructor(string memory _baseURI) ERC721("ZenSolarNFT", "ZSNFT") Ownable(msg.sender) {
        baseURI = _baseURI;
    }

    // Mint with a specific token ID (for milestone NFTs with fixed metadata)
    function mintWithId(address to, uint256 tokenId) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(!tokenIdExists[tokenId], "Token ID already minted");
        
        _safeMint(to, tokenId);
        tokenIdExists[tokenId] = true;
        emit NFTMinted(to, tokenId);
        return tokenId;
    }

    // Mint with specific token ID and custom URI
    function mintWithIdAndURI(address to, uint256 tokenId, string memory uri) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(!tokenIdExists[tokenId], "Token ID already minted");
        
        _safeMint(to, tokenId);
        tokenIdExists[tokenId] = true;
        _tokenURIs[tokenId] = uri;
        emit NFTMinted(to, tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _burn(tokenId);
        tokenIdExists[tokenId] = false;
        delete _tokenURIs[tokenId];
        emit NFTBurned(tokenId);
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(baseURI, _tokenURI));
        }
        
        // Default: baseURI + tokenId + .json (e.g., ipfs://CID/0.json)
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    function totalSupply() public view returns (uint256) {
        // Count minted tokens (this is a simple implementation)
        uint256 count = 0;
        for (uint256 i = 0; i <= 50; i++) {
            if (tokenIdExists[i]) count++;
        }
        return count;
    }

    // Check if a token ID can be minted
    function canMint(uint256 tokenId) public view returns (bool) {
        return !tokenIdExists[tokenId];
    }

    // Transfer ownership of the contract
    function transferContractOwnership(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
    }
}
