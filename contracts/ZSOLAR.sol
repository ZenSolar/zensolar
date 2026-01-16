// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZSOLAR is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 50_000_000_000 * 10**18; // 50 billion tokens
    address public treasury;

    // Tax rates (in basis points, 100 = 1%)
    uint256 public burnTaxBps = 350;    // 3.5%
    uint256 public treasuryTaxBps = 350; // 3.5%

    // Addresses exempt from transfer tax
    mapping(address => bool) public isExemptFromTax;

    event Burned(uint256 amount);
    event TreasuryUpdated(address newTreasury);

    constructor(
        address _founder,
        address _initialOwner,
        address _treasury
    ) ERC20("ZenSolar", "ZSOLAR") Ownable(msg.sender) {
        require(_founder != address(0), "Invalid founder");
        require(_initialOwner != address(0), "Invalid owner");
        require(_treasury != address(0), "Invalid treasury");

        treasury = _treasury;

        // Initial allocations
        uint256 founderAmount = 1_250_000_000 * 10**18;     // 1.25 billion (2.5%)
        uint256 ownerAmount = 3_750_000_000 * 10**18;       // 3.75 billion (7.5%)

        _mint(_founder, founderAmount);
        _mint(_initialOwner, ownerAmount);

        // Exempt key addresses from tax
        isExemptFromTax[_founder] = true;
        isExemptFromTax[_initialOwner] = true;
        isExemptFromTax[_treasury] = true;
        isExemptFromTax[address(this)] = true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(amount);
    }

    /**
     * @notice Burn tokens from a specific address (owner only)
     * @dev Used by Controller to burn tokens it minted to itself
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit Burned(amount);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        return _transferWithTax(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        return _transferWithTax(from, to, amount);
    }

    function _transferWithTax(address from, address to, uint256 amount) internal returns (bool) {
        if (isExemptFromTax[from] || isExemptFromTax[to]) {
            _transfer(from, to, amount);
            return true;
        }

        uint256 burnAmount = (amount * burnTaxBps) / 10000;
        uint256 treasuryAmount = (amount * treasuryTaxBps) / 10000;
        uint256 transferAmount = amount - burnAmount - treasuryAmount;

        _burn(from, burnAmount);
        _transfer(from, treasury, treasuryAmount);
        _transfer(from, to, transferAmount);

        emit Burned(burnAmount);
        return true;
    }

    // Admin functions
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        isExemptFromTax[_treasury] = true;
        emit TreasuryUpdated(_treasury);
    }

    function setExemptFromTax(address account, bool exempt) external onlyOwner {
        isExemptFromTax[account] = exempt;
    }

    function setTaxRates(uint256 _burnTaxBps, uint256 _treasuryTaxBps) external onlyOwner {
        require(_burnTaxBps + _treasuryTaxBps <= 1000, "Tax too high"); // Max 10%
        burnTaxBps = _burnTaxBps;
        treasuryTaxBps = _treasuryTaxBps;
    }
}
