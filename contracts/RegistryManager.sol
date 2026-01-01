// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RegistryManager
 * @notice Manages user registration and signatures for the Chain Receipt on Base.
 * @dev Plans are managed off-chain for flexibility; this contract tracks on-chain registration presence.
 */
contract RegistryManager is Ownable, ReentrancyGuard {
    
    struct User {
        bool isRegistered;
        uint256 registeredAt;
        string tcHash; // IFPS hash or Hash of the T&C text accepted
    }

    mapping(address => User) public users;
    
    // Events
    event Registered(address indexed user, uint256 timestamp, string tcHash);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Registers the caller.
     * @param _tcHash The hash of the Terms & Conditions accepted by the user.
     */
    function register(string calldata _tcHash) external payable {
        require(!users[msg.sender].isRegistered, "Already registered");
        // We accept ETH if sent, but fees are optional (gas only by default)
        
        users[msg.sender] = User({
            isRegistered: true,
            registeredAt: block.timestamp,
            tcHash: _tcHash
        });

        emit Registered(msg.sender, block.timestamp, _tcHash);
    }

    /**
     * @notice Checks if a user is registered.
     */
    function isRegistered(address _user) external view returns (bool) {
        return users[_user].isRegistered;
    }

    /**
     * @notice Withdraws any collected fees to the admin address.
     */
    function withdraw(address payable _to) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = _to.call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_to, balance);
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
