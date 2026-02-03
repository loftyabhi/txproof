import { Request, Response, NextFunction } from 'express';
import { ApiKeyService, ApiKeyDetails } from '../services/ApiKeyService';
import { AnalyticsService } from '../services/AnalyticsService';

const apiKeyService = new ApiKeyService();
const analyticsService = new AnalyticsService();

// Extended Request type to include auth context
export interface AuthenticatedRequest extends Request {
    auth?: ApiKeyDetails;
}

// In-Memory Token Bucket for Realtime RPS (Per Instance)
// Key: api_key_id -> { tokens, lastRefill }
const buckets = new Map<string, { tokens: number, lastRefill: number }>();

function checkRealtimeLimit(keyId: string, limitRps: number): boolean {
    const now = Date.now();
    const bucket = buckets.get(keyId) || { tokens: limitRps, lastRefill: now };

    // Refill logic
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    if (elapsed > 0) {
        const added = elapsed * limitRps;
        bucket.tokens = Math.min(limitRps, bucket.tokens + added);
        bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        buckets.set(keyId, bucket);
        return true;
    }

    return false;
}

export const saasMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // 1. Authentication
    if (!apiKey || !apiKey.startsWith('sk_')) {
        return res.status(401).json({ code: 'MISSING_API_KEY', error: 'Missing or invalid API Key' });
    }

    try {
        const details = await apiKeyService.verifyKey(apiKey);

        // 1.1 Hard Abuse/Invalid Check
        if (!details) {
            console.warn(`[Security] Invalid key attempt from ${req.ip}`);
            return res.status(403).json({ code: 'INVALID_API_KEY', error: 'Invalid, inactive, or flagged API Key' });
        }

        // 1.2 IP Whitelist Enformcement
        if (details.ipAllowlist && details.ipAllowlist.length > 0) {
            const clientIp = req.ip || '0.0.0.0';
            if (!details.ipAllowlist.includes(clientIp)) {
                console.warn(`[Security] Key ${details.id} blocked: IP ${clientIp} not allowed`);
                return res.status(403).json({ code: 'IP_NOT_ALLOWED', error: 'IP Address not allowed' });
            }
        }

        // 2. Realtime Rate Limit (RPS)
        if (!checkRealtimeLimit(details.id, details.plan.rate_limit_rps)) {
            return res.status(429).json({ code: 'RATE_LIMIT_EXCEEDED', error: 'Too Many Requests (Rate Limit)' });
        }

        // 3. Quota Limit (Monthly)
        const quota = await apiKeyService.checkAndIncrementUsage(details.id);

        // Standard Headers (Stripe-like)
        res.setHeader('X-Quota-Limit', quota.limit);
        res.setHeader('X-Quota-Used', quota.used);
        res.setHeader('X-Quota-Remaining', quota.remaining);

        if (!quota.allowed) {
            // Overage logic handled in Service or here?
            return res.status(402).json({
                code: 'QUOTA_EXCEEDED',
                error: 'Monthly Quota Exceeded. Please upgrade your plan.'
            });
        }

        // Attach context
        (req as AuthenticatedRequest).auth = details;

        // Response Hook for Logging (Latency & Status)
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            // Fire & Forget Logging
            analyticsService.trackRequest({
                apiKeyId: details.id,
                endpoint: req.originalUrl || req.path,
                method: req.method,
                status: res.statusCode,
                duration,
                ip: req.ip || 'unknown',
                userAgent: req.get('user-agent')
            }).catch(console.error);
        });

        next();

    } catch (error) {
        console.error('Middleware Error:', error);
        res.status(500).json({ code: 'INTERNAL_AUTH_ERROR', error: 'Internal Auth Error' });
    }
};
