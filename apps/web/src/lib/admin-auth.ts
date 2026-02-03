import { createHash, createHmac } from 'crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

interface AdminPayload {
    role: string;
    address: string;
    exp: number;
    iat: number;
}

/**
 * Native Node.js JWT Verification for HS256
 * Avoids need for external 'jsonwebtoken' package in 'web' workspace
 */
function verifyToken(token: string): AdminPayload {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        throw new Error('CRITICAL SECURITY: JWT_SECRET must be set in production environment for Frontend verification.');
    }
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
        throw new Error('Invalid token format');
    }

    // 1. Verify Signature
    const computedSignature = createHmac('sha256', JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

    if (computedSignature !== signatureB64) {
        throw new Error('Invalid signature');
    }

    // 2. Decode and Parse Payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as AdminPayload;

    // 3. Verify Expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
    }

    // 4. Verify Role
    if (payload.role !== 'admin') {
        throw new Error('Insufficient permissions');
    }

    return payload;
}

export async function verifyAdmin(request?: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
        throw new Error('No admin token found');
    }

    const payload = verifyToken(token);

    // CSRF Check (Server Actions / API Routes)
    if (request && request.method !== 'GET' && request.method !== 'HEAD') {
        const csrfHeader = request.headers.get('x-csrf-token');
        if (!csrfHeader) {
            throw new Error('Missing CSRF Token');
        }

        const headerHash = createHash('sha256').update(csrfHeader).digest('hex');

        // Check against payload
        if ((payload as any).csrfHash && headerHash !== (payload as any).csrfHash) {
            throw new Error('Invalid CSRF Token');
        }
    }

    return payload;
}
