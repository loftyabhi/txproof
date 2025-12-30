import { parseAbi } from "viem";

// ABI for the Smart Contract (RegistryManager & Subscription)
export const REGISTRY_ABI = parseAbi([
    "function register(string calldata _tcHash) external payable",
    "function isRegistered(address _user) external view returns (bool)",
    "event Registered(address indexed user, uint256 timestamp, string tcHash)"
]);

// Placeholder Address - User must update this after deployment
export const REGISTRY_ADDRESS = "0xF94C13e08A004e93dD595Fa640F634ad24b9549c"; 
