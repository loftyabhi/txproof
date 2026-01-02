// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SupportVault
 * @notice A secure vault for accepting contributions to support the project.
 * @dev Immutable V1 design for Base Mainnet. No proxies. Optimized for gas.
 *      Admin (owner) is the only one who can withdraw.
 *
 *      SECURITY NOTES:
 *      - Admin Key: The owner SHOULD be a multisig wallet (e.g., Safe) in production.
 *      - Hardware Wallet: Signers should use hardware wallets.
 *      - Migration: This contract is immutable V1. Future upgrades require a new deployment
 *        and backend migration. Legacy events should be indexed off-chain.
 *      - Privacy: 'isAnonymous' is a UI/API hint only. All addresses are public on-chain.
 *
 *      GAS IMPACT SUMMARY:
 *      - Storage: +2 SSTORE per contributor (totalContributed, contributionCount). ~10k-40k gas/tx.
 *      - Checks: Minimal overhead (reading mappings/timestamps).
 *      - Overall: Optimized for safety over extreme gas savings for these V1 aggregations.
 */
contract SupportVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Events ---
    // Emitted when a contribution is received. Vital for off-chain indexing.
    event Contributed(
        address indexed contributor,
        address indexed token, // address(0) for Native ETH
        uint256 amount,
        bool isAnonymous,
        uint256 timestamp
    );

    // Emitted when admin withdraws funds.
    event Withdrawn(
        address indexed admin,
        address indexed token,
        uint256 amount,
        address to
    );

    // --- State Variables ---
    
    // Minimum contribution amount to prevent dust spam (configurable by admin)
    // Stored in wei. Default: 0.0001 ETH (approx $0.20-$0.30 at typical ETH prices)
    uint256 public minContributionNative = 100000000000000; 

    // Cooldown period between contributions to prevent spamming the leaderboard
    uint256 public cooldownPeriod = 1 minutes;
    
    // --- Aggregation & Safety ---
    
    // Aggregation of total contributed amount per contributor (Native + ERC20 raw value)
    mapping(address => uint256) public totalContributed;
    // Total count of contributions per contributor
    mapping(address => uint256) public contributionCount;
    // ERC20 Allowlist to prevent spam tokens
    mapping(address => bool) public isTokenAllowed;
    
    // Track last contribution time for cooldown enforcement
    mapping(address => uint256) public lastContributionTime;

    constructor(address initialOwner) Ownable(initialOwner) {
        // Start unpaused
    }

    /**
     * @notice Contribute native ETH to the vault.
     * @param isAnonymous If true, the UI should not display this address in the public leaderboard.
     */
    function contributeNative(bool isAnonymous) external payable whenNotPaused {
        require(msg.value >= minContributionNative, "Contribution too small");
        require(block.timestamp >= lastContributionTime[msg.sender] + cooldownPeriod, "Cooldown active");

        lastContributionTime[msg.sender] = block.timestamp;
        
        // Update Aggregation
        // unchecked { ... } could be used for gas savings since overflow is unlikely, 
        // but explicit safety is preferred for financial variables unless extreme optimization needed.
        totalContributed[msg.sender] += msg.value;
        contributionCount[msg.sender] += 1;

        emit Contributed(
            msg.sender,
            address(0),
            msg.value,
            isAnonymous,
            block.timestamp
        );
    }

    /**
     * @notice Contribute ERC20 tokens to the vault.
     * @param token The address of the ERC20 token.
     * @param amount The amount to contribute.
     * @param isAnonymous If true, the UI should not display this address.
     */
    function contributeERC20(address token, uint256 amount, bool isAnonymous) external whenNotPaused nonReentrant {
        require(isTokenAllowed[token], "Token not allowed");
        require(amount > 0, "Amount must be > 0");
        require(block.timestamp >= lastContributionTime[msg.sender] + cooldownPeriod, "Cooldown active");
        
        lastContributionTime[msg.sender] = block.timestamp;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update Aggregation
        totalContributed[msg.sender] += amount;
        contributionCount[msg.sender] += 1;

        emit Contributed(
            msg.sender,
            token,
            amount,
            isAnonymous,
            block.timestamp
        );
    }

    // --- Admin Functions ---

    /**
     * @notice Withdraw native ETH from the vault to a specified address.
     * @dev Only owner can call. Rate limiting is manual operation by admin.
     */
    function withdrawNative(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, address(0), amount, to);
    }

    /**
     * @notice Withdraw ERC20 tokens from the vault.
     */
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        IERC20(token).safeTransfer(to, amount);

        emit Withdrawn(msg.sender, token, amount, to);
    }

    /**
     * @notice Update the minimum native contribution amount.
     */
    function setMinContributionNative(uint256 _min) external onlyOwner {
        minContributionNative = _min;
    }

    /**
     * @notice Pause all contributions (Emergency).
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resume contributions.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Allowed or disallow an ERC20 token for contribution.
     * @param token Address of the ERC20 token.
     * @param status True to allow, false to disallow.
     */
    function setTokenStatus(address token, bool status) external onlyOwner {
        isTokenAllowed[token] = status;
    }

    // Fallback to receive ETH
    receive() external payable {
        if (msg.value >= minContributionNative) {
             // Enforce cooldown even on direct transfers for safety
             require(block.timestamp >= lastContributionTime[msg.sender] + cooldownPeriod, "Cooldown active");
             lastContributionTime[msg.sender] = block.timestamp;

             // Update Aggregation
             totalContributed[msg.sender] += msg.value;
             contributionCount[msg.sender] += 1;

             emit Contributed(
                msg.sender,
                address(0),
                msg.value,
                false, // Default to non-anonymous if sent directly without function call
                block.timestamp
            );
        } else {
            // Revert if below min contribution to avoid dust spam in logs, 
            // though receive() often used for gas, standard wallets limit gas for simple transfers.
            // We revert to enforce policy strictly.
            revert("Contribution too small");
        }
    }
}
