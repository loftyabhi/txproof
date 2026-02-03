import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

interface AuthResponse {
    token: string;
    csrfToken: string;
    expiresIn: number;
}

export class AuthService {
    private readonly jwtSecret: string;
    private readonly adminAddress = process.env.ADMIN_ADDRESS?.toLowerCase();

    constructor() {
        if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
            throw new Error('CRITICAL SECURITY: JWT_SECRET must be set in production environment.');
        }
        this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
    }

    /**
     * Verify a wallet signature and issue a JWT if the signer is an admin.
     * @param address The wallet address claiming to be admin.
     * @param signature The signature produced by the wallet.
     * @param nonce The nonce that was signed (e.g., "Login to Chain Receipt at 1234567890").
     */
    async loginAdmin(address: string, signature: string, nonce: string): Promise<AuthResponse> {
        if (!this.adminAddress) {
            throw new Error('ADMIN_ADDRESS environment variable not set');
        }

        // 1. Recover Address from Signature
        const recoveredAddress = ethers.verifyMessage(nonce, signature).toLowerCase();

        // 2. Verify Address matches Claim
        if (recoveredAddress !== address.toLowerCase()) {
            throw new Error('Signature verification failed: Address mismatch');
        }

        // 3. Verify Address is Admin
        if (recoveredAddress !== this.adminAddress) {
            throw new Error('Unauthorized: Wallet is not an admin');
        }

        // 4. Generate CSRF Token and Hash
        const csrfToken = randomBytes(32).toString('hex');
        const csrfHash = createHash('sha256').update(csrfToken).digest('hex');

        // 5. Issue Token with CSRF Hash
        const token = jwt.sign({
            role: 'admin',
            address: recoveredAddress,
            csrfHash // Bind session to this specific CSRF token
        }, this.jwtSecret, {
            expiresIn: '30m',
        });

        return {
            token,
            csrfToken,
            expiresIn: 1800, // 30 minutes
        };
    }

    /**
     * Issue a rotated session (new JWT + new CSRF) for an existing valid user
     */
    rotateSession(currentPayload: any): AuthResponse {
        const csrfToken = randomBytes(32).toString('hex');
        const csrfHash = createHash('sha256').update(csrfToken).digest('hex');

        const token = jwt.sign({
            role: 'admin',
            address: currentPayload.address,
            csrfHash
        }, this.jwtSecret, { expiresIn: '30m' });

        return { token, csrfToken, expiresIn: 1800 };
    }

    /**
     * Generate a random nonce message for the user to sign.
     */
    generateNonce(): string {
        return `Sign this message to login to TxProof Manager.\nNonce: ${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Verify a JWT token.
     * @param token The JWT token string.
     * @returns The decoded payload if valid, throws error otherwise.
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}
