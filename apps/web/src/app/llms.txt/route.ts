
import { NextResponse } from 'next/server';
import { DOMAIN } from '@/lib/seo';

export const runtime = 'edge';

export async function GET() {
    const content = `Title: TxProof - Professional Blockchain Intelligence

Description:
TxProof (${DOMAIN}) is an enterprise-grade blockchain documentation tool that transforms on-chain transaction data into audit-ready receipts/invoices. 
It supports multiple EVM chains including Base, Ethereum, Optimism, Arbitrum, Polygon, BSC, and Avalanche.
The platform prioritizes privacy with a zero-retention architecture.

Main Sections:
- Home: ${DOMAIN}/
- Features: ${DOMAIN}/features
- Transaction Intelligence: ${DOMAIN}/transaction-intelligence
- Knowledge Base: ${DOMAIN}/learn
- How to Read Transactions: ${DOMAIN}/how-to-read-blockchain-transaction
- Developer Console: ${DOMAIN}/developers (API Keys & Usage)
- Email Verification: ${DOMAIN}/verify
- About Us: ${DOMAIN}/about-us
- Contact Sales: ${DOMAIN}/contact-us
- Support Infrastructure: ${DOMAIN}/support

Privacy Policy: ${DOMAIN}/privacy-policy
Terms of Service: ${DOMAIN}/terms-of-service

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
