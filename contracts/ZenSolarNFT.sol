// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZenSolarNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string public baseURI;

    // Mapping from token ID to metadata URI suffix
    mapping(uint256 => string) private _tokenURIs;

    event BaseURIUpdated(string newBaseURI);
    event NFTMinted(address indexed to, uint256 tokenId);
    event NFTBurned(uint256 tokenId);

    constructor(string memory _baseURI) ERC721("ZenSolarNFT", "ZSNFT") Ownable(msg.sender) {
        baseURI = _baseURI;
    }

    function mint(address to) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        emit NFTMinted(to, tokenId);
        return tokenId;
    }

    function mintWithURI(address to, string memory uri) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        emit NFTMinted(to, tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _burn(tokenId);
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
        
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Transfer ownership of the contract
    function transferContractOwnership(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
    }
}
