
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    const content = `Title: TxProof - Professional Blockchain Intelligence

Description:
TxProof (txproof.xyz) is an enterprise-grade blockchain documentation tool that transforms on-chain transaction data into audit-ready receipts/invoices. 
It supports multiple EVM chains including Base, Ethereum, Optimism, Arbitrum, Polygon, BSC, and Avalanche.
The platform prioritizes privacy with a zero-retention architecture.

Main Sections:
- Home: https://txproof.xyz/
- Features: https://txproof.xyz/features
- Transaction Intelligence: https://txproof.xyz/transaction-intelligence
- Knowledge Base: https://txproof.xyz/learn
- How to Read Transactions: https://txproof.xyz/how-to-read-blockchain-transaction
- Developer Console: https://txproof.xyz/developers (API Keys & Usage)
- Email Verification: https://txproof.xyz/verify
- About Us: https://txproof.xyz/about-us
- Contact Sales: https://txproof.xyz/contact-us
- Support Infrastructure: https://txproof.xyz/support

Privacy Policy: https://txproof.xyz/privacy-policy
Terms of Service: https://txproof.xyz/terms-of-service

Notes for Crawlers:
- Transaction detail pages (e.g., /tx/...) are dynamically generated and typically set to noindex to preserve user privacy and prevent index bloat.
- The /print/ path is strictly disallowed.
- Please respect the minimal crawl delay to ensure service stability.

Exclusions:
- /api/
- /print/
`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex, follow',
        },
    });
}
