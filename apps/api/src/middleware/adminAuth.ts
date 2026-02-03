import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

/**
 * Enterprise-grade Admin Verification Middleware
 * 
 * Features:
 * 1. Multi-source Token Lookup (Cookie > Header)
 * 2. Role Enforcement (JWT claim check)
 * 3. CSRF Protection for mutating requests
 * 4. Cache-Control enforcement for authed responses
 */
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    // 1. Try Cookie first (Browser flow)
    let token = req.cookies?.admin_token;

    // 2. Fallback to Header (Dev/CLI flow)
    const authHeader = req.headers.authorization;
    if (!token && authHeader) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const payload = authService.verifyToken(token);

        // Security: Explicit Role Check
        if (payload.role !== 'admin') {
            throw new Error('Unauthorized: Admin role required');
        }

        // Security: Verify current authorized address (in case ENV changed)
        const currentAdmin = process.env.ADMIN_ADDRESS?.toLowerCase();
        if (!currentAdmin || payload.address?.toLowerCase() !== currentAdmin) {
            throw new Error('Unauthorized: Session no longer matches configured admin');
        }

        // Security: CSRF Check for mutating requests (POST, PUT, DELETE, PATCH)
        const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
        if (isMutating) {
            const csrfHeader = req.headers['x-csrf-token'];
            if (!csrfHeader || Array.isArray(csrfHeader)) {
                throw new Error('Security Error: Missing CSRF Token');
            }

            const headerHash = createHash('sha256').update(csrfHeader as string).digest('hex');

            // Compare with hash stored in JWT
            if (payload.csrfHash && headerHash !== payload.csrfHash) {
                throw new Error('Security Error: Invalid CSRF Token');
            }
        }

        // Attach user to request
        (req as any).user = payload;

        // Anti-Caching for privileged data
        res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.set('Pragma', 'no-cache');

        next();
    } catch (error: any) {
        res.status(403).json({ error: error.message || 'Invalid or expired token' });
    }
};
