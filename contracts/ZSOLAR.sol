// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZSOLAR Token
 * @notice ERC-20 token with 7% transfer tax (3% burn, 2% LP, 2% treasury)
 * @dev Aligned with 10B supply strategy and $0.10 launch floor
 */
contract ZSOLAR is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion tokens
    
    address public treasury;
    address public lpRewards;  // Liquidity Pool rewards address
    address public minter;     // The ZenSolar Controller that can mint tokens

    // Tax rates (in basis points, 100 = 1%)
    // Total: 7% (3% burn + 2% LP + 2% treasury)
    uint256 public burnTaxBps = 300;     // 3% burn
    uint256 public lpTaxBps = 200;       // 2% to LP
    uint256 public treasuryTaxBps = 200; // 2% to treasury

    // Addresses exempt from transfer tax
    mapping(address => bool) public isExemptFromTax;

    event Burned(uint256 amount);
    event TreasuryUpdated(address newTreasury);
    event LpRewardsUpdated(address newLpRewards);
    event MinterUpdated(address newMinter);
    event TaxDistributed(uint256 burnAmount, uint256 lpAmount, uint256 treasuryAmount);

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    constructor(
        address _founder,
        address _initialOwner,
        address _treasury,
        address _lpRewards
    ) ERC20("ZenSolar", "ZSOLAR") Ownable(msg.sender) {
        require(_founder != address(0), "Invalid founder");
        require(_initialOwner != address(0), "Invalid owner");
        require(_treasury != address(0), "Invalid treasury");
        require(_lpRewards != address(0), "Invalid LP rewards");

        treasury = _treasury;
        lpRewards = _lpRewards;

        // Initial allocations (10B strategy)
        // 2.5% Founder + 7.5% Treasury = 10% initial mint
        uint256 founderAmount = 250_000_000 * 10**18;     // 250M (2.5%)
        uint256 ownerAmount = 750_000_000 * 10**18;       // 750M (7.5%)

        _mint(_founder, founderAmount);
        _mint(_initialOwner, ownerAmount);

        // Exempt key addresses from tax
        isExemptFromTax[_founder] = true;
        isExemptFromTax[_initialOwner] = true;
        isExemptFromTax[_treasury] = true;
        isExemptFromTax[_lpRewards] = true;
        isExemptFromTax[address(this)] = true;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @notice Set the minter address (ZenSolar Controller)
     * @param _minter The address authorized to mint tokens
     */
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter");
        minter = _minter;
        isExemptFromTax[_minter] = true;
        emit MinterUpdated(_minter);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(amount);
    }

    /**
     * @notice Burn tokens from a specific address (owner only)
     * @dev Used by Controller to burn tokens it minted to itself
     */
    function burnFrom(address from, uint256 amount) external onlyMinter {
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

    /**
     * @notice Internal transfer with 7% tax (3% burn, 2% LP, 2% treasury)
     */
    function _transferWithTax(address from, address to, uint256 amount) internal returns (bool) {
        if (isExemptFromTax[from] || isExemptFromTax[to]) {
            _transfer(from, to, amount);
            return true;
        }

        uint256 burnAmount = (amount * burnTaxBps) / 10000;
        uint256 lpAmount = (amount * lpTaxBps) / 10000;
        uint256 treasuryAmount = (amount * treasuryTaxBps) / 10000;
        uint256 transferAmount = amount - burnAmount - lpAmount - treasuryAmount;

        _burn(from, burnAmount);
        _transfer(from, lpRewards, lpAmount);
        _transfer(from, treasury, treasuryAmount);
        _transfer(from, to, transferAmount);

        emit Burned(burnAmount);
        emit TaxDistributed(burnAmount, lpAmount, treasuryAmount);
        return true;
    }

    // ============ Admin Functions ============

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        isExemptFromTax[_treasury] = true;
        emit TreasuryUpdated(_treasury);
    }

    function setLpRewards(address _lpRewards) external onlyOwner {
        require(_lpRewards != address(0), "Invalid LP rewards");
        lpRewards = _lpRewards;
        isExemptFromTax[_lpRewards] = true;
        emit LpRewardsUpdated(_lpRewards);
    }

    function setExemptFromTax(address account, bool exempt) external onlyOwner {
        isExemptFromTax[account] = exempt;
    }

    /**
     * @notice Update tax rates (max 10% total)
     * @param _burnTaxBps Burn tax in basis points
     * @param _lpTaxBps LP tax in basis points  
     * @param _treasuryTaxBps Treasury tax in basis points
     */
    function setTaxRates(
        uint256 _burnTaxBps, 
        uint256 _lpTaxBps, 
        uint256 _treasuryTaxBps
    ) external onlyOwner {
        require(_burnTaxBps + _lpTaxBps + _treasuryTaxBps <= 1000, "Tax too high"); // Max 10%
        burnTaxBps = _burnTaxBps;
        lpTaxBps = _lpTaxBps;
        treasuryTaxBps = _treasuryTaxBps;
    }

    /**
     * @notice Get current tax configuration
     */
    function getTaxConfig() external view returns (
        uint256 burn,
        uint256 lp,
        uint256 treasuryTax,
        uint256 total
    ) {
        return (burnTaxBps, lpTaxBps, treasuryTaxBps, burnTaxBps + lpTaxBps + treasuryTaxBps);
    }
}
