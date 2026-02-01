/**
 * Hybrid Authentication Middleware
 * 
 * Implements a non-breaking security model:
 * - If API key is provided: Full SaaS governance (auth, rate limit, quota)
 * - If no API key: Public rate limiting (graceful degradation)
 * 
 * Enterprise customers ALWAYS go through full governance.
 */
import { Request, Response, NextFunction } from 'express';
import { saasMiddleware, AuthenticatedRequest } from './saasAuth';
import { strictRateLimiter } from './publicRateLimiter';

/**
 * Hybrid middleware that checks for API key presence.
 * - With key: saasMiddleware (full governance)
 * - Without key: strictRateLimiter (public throttle)
 */
export const hybridAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const hasApiKey = authHeader?.startsWith('Bearer sk_');

    if (hasApiKey) {
        // Full SaaS Governance Path
        return saasMiddleware(req, res, next);
    } else {
        // Public Path with Rate Limiting
        return strictRateLimiter(req, res, next);
    }
};

/**
 * Mark request as public (for logging/analytics)
 */
export interface HybridRequest extends Request {
    isPublicRequest?: boolean;
    auth?: AuthenticatedRequest['auth'];
}

/**
 * Enhanced hybrid middleware with request tagging
 */
export const hybridAuthWithTracking = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const hasApiKey = authHeader?.startsWith('Bearer sk_');

    if (hasApiKey) {
        (req as HybridRequest).isPublicRequest = false;
        return saasMiddleware(req, res, next);
    } else {
        (req as HybridRequest).isPublicRequest = true;
        return strictRateLimiter(req, res, next);
    }
};
