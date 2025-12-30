export const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

export const ERC721_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function tokenURI(uint256 tokenId) view returns (string)"
];

// Common Router Functions for heuristic detection
export const ROUTER_SIGNATURES = [
    "0x7ff36ab5", // swapExactETHForTokens
    "0x38ed1739", // swapExactTokensForTokens
    "0x18cbafe5"  // swapExactTokensForETH
];
