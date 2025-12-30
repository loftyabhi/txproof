import { ethers } from "ethers";

// ABI for the Smart Contract (RegistryManager & Subscription)
// TODO: Replace with real ABI from artifacts after compilation
export const REGISTRY_ABI = [
    "function register(string calldata _tcHash) external payable",
    "function isRegistered(address _user) external view returns (bool)",
    "function withdraw(address payable _to) external",
    "event Registered(address indexed user, uint256 timestamp, string tcHash)",
    "event FundsWithdrawn(address indexed to, uint256 amount)"
] as const;

// Placeholder Address - User must update this after deployment
export const REGISTRY_ADDRESS = "0xF94C13e08A004e93dD595Fa640F634ad24b9549c"; 