import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    const content = `Title: TxProof API Documentation
    
Description:
Full technical documentation for the TxProof API. Includes quick start guides, authentication details, API reference, and best practices for generating verifiable blockchain receipts.

Docs Subdomains:
- Welcome: https://docs.txproof.xyz/
- Quick Start: https://docs.txproof.xyz/quick-start
- Authentication: https://docs.txproof.xyz/authentication
- API Reference: https://docs.txproof.xyz/reference
- Status Lifecycle: https://docs.txproof.xyz/status-lifecycle
- Rate Limits: https://docs.txproof.xyz/rate-limits
- Error Codes: https://docs.txproof.xyz/errors
- Best Practices: https://docs.txproof.xyz/best-practices
- Playground: https://docs.txproof.xyz/playground

Main Site: https://txproof.xyz/
`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex, follow',
        },
    });
}
