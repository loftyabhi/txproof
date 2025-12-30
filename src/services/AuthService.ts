import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

interface AuthResponse {
    token: string;
    expiresIn: number;
}

export class AuthService {
    private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
    private readonly adminAddress = process.env.ADMIN_ADDRESS?.toLowerCase();

    /**
     * Verify a wallet signature and issue a JWT if the signer is an admin.
     * @param address The wallet address claiming to be admin.
     * @param signature The signature produced by the wallet.
     * @param nonce The nonce that was signed (e.g., "Login to GChain Bill Generator at 1234567890").
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

        // 4. Issue Token
        const token = jwt.sign({ role: 'admin', address: recoveredAddress }, this.jwtSecret, {
            expiresIn: '24h',
        });

        return {
            token,
            expiresIn: 86400, // 24 hours
        };
    }

    /**
     * Generate a random nonce message for the user to sign.
     */
    generateNonce(): string {
        return `Sign this message to login to GChain Receipt Manager.\nNonce: ${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
