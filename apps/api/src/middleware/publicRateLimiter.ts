/**
 * Public Rate Limiter Middleware
 * 
 * IP-based rate limiting for public endpoints using token bucket algorithm.
 * This protects against anonymous flooding while allowing legitimate use.
 * 
 * For authenticated API clients, saasMiddleware provides more granular control.
 */
import { Request, Response, NextFunction } from 'express';

// Configuration (move to env for production)
const PUBLIC_RATE_LIMIT = parseInt(process.env.PUBLIC_RATE_LIMIT_RPM || '30'); // requests per minute
const CLEANUP_INTERVAL_MS = 60 * 1000; // Cleanup stale entries every minute

interface BucketEntry {
    tokens: number;
    lastRefill: number;
    violations: number;
}

// In-memory store (per instance; for multi-instance, use Redis)
const buckets = new Map<string, BucketEntry>();

// Periodic cleanup to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    for (const [ip, entry] of buckets.entries()) {
        if (now - entry.lastRefill > staleThreshold) {
            buckets.delete(ip);
        }
    }
}, CLEANUP_INTERVAL_MS);

/**
 * Get client IP, handling proxies (X-Forwarded-For)
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Token Bucket Rate Limiter
 * Returns true if request is allowed, false if rate limited.
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const tokensPerMs = PUBLIC_RATE_LIMIT / 60000; // tokens per millisecond

    let bucket = buckets.get(ip);

    if (!bucket) {
        bucket = { tokens: PUBLIC_RATE_LIMIT, lastRefill: now, violations: 0 };
        buckets.set(ip, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refillAmount = elapsed * tokensPerMs;
    bucket.tokens = Math.min(PUBLIC_RATE_LIMIT, bucket.tokens + refillAmount);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
    }

    // Rate limited
    bucket.violations += 1;
    const retryAfterMs = Math.ceil((1 - bucket.tokens) / tokensPerMs);
    return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Express Middleware
 */
export const publicRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const { allowed, remaining, retryAfterMs } = checkRateLimit(clientIp);

    // Always set rate limit headers
    res.setHeader('X-RateLimit-Limit', PUBLIC_RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (!allowed) {
        const retryAfterSec = Math.ceil(retryAfterMs / 1000);
        res.setHeader('Retry-After', retryAfterSec);

        console.warn(`[RateLimit] IP ${clientIp} exceeded limit on ${req.method} ${req.path}`);

        return res.status(429).json({
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Retry in ${retryAfterSec} seconds.`,
            retryAfterMs
        });
    }

    next();
};

/**
 * Strict Rate Limiter (Lower limits for expensive operations like PDF generation)
 */
const STRICT_RATE_LIMIT = parseInt(process.env.STRICT_RATE_LIMIT_RPM || '10');
const strictBuckets = new Map<string, BucketEntry>();

export const strictRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const tokensPerMs = STRICT_RATE_LIMIT / 60000;

    let bucket = strictBuckets.get(clientIp);

    if (!bucket) {
        bucket = { tokens: STRICT_RATE_LIMIT, lastRefill: now, violations: 0 };
        strictBuckets.set(clientIp, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(STRICT_RATE_LIMIT, bucket.tokens + elapsed * tokensPerMs);
    bucket.lastRefill = now;

    res.setHeader('X-RateLimit-Limit', STRICT_RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return next();
    }

    bucket.violations += 1;
    const retryAfterMs = Math.ceil((1 - bucket.tokens) / tokensPerMs);
    res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));

    console.warn(`[StrictRateLimit] IP ${clientIp} blocked on ${req.method} ${req.path} (violations: ${bucket.violations})`);

    return res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for this resource-intensive operation.',
        retryAfterMs
    });
};

/**
 * Get Abuse Score for an IP (for logging/monitoring)
 */
export function getAbuseScore(ip: string): number {
    const entry = buckets.get(ip) || strictBuckets.get(ip);
    return entry?.violations || 0;
}
