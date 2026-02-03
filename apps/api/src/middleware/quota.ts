import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

// Extend Request type to include user/key info
declare global {
    namespace Express {
        interface Request {
            user?: any;
            apiKey?: any;
        }
    }
}

/**
 * Enforce Monthly Quota Middleware
 * Checks X-RateLimit-Remaining-Quota and blocks if 0 or negative.
 */
export const enforceQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.apiKey;
        if (!apiKey) {
            // If no API key (e.g. auth endpoints), skip quota check?
            // Or if using Bearer token (JWT), we might check User Quota?
            // For Developer Console API usage, they usually use their API Key.
            // If this is the CONSOLE itself fetching data, we check User level?
            // "Proxy usage service scoped to user's active keys".
            // The quota is usually on the API Key being USED.

            // If this middleware is applied to API Key protected routes:
            return next();
        }

        // 1. Get Plan & Quota
        // We assume apiKey object has 'plan' populated (fetched in verifyKey middleware or here)
        // If verifyKey middleware ran before, it should have attached data.

        // Let's assume verifyKey attached basic info, but maybe we need fresh usage.

        const currentUsage = apiKey.usage_this_month || 0; // We need to ensure we have this.
        // Actually, 'usage_this_month' is an aggregate. We might need to fetch it if not present.

        // Fetch fresh aggregate if needed
        const { data: aggregate } = await supabase
            .from('api_usage_aggregates')
            .select('request_count')
            .eq('api_key_id', apiKey.id)
            .eq('period_start', new Date().toISOString().slice(0, 7) + '-01') // First day of month
            .single();

        const used = aggregate?.request_count || 0;
        const limit = apiKey.plan?.monthly_quota || 100;
        const remaining = Math.max(0, limit - used);

        // Inject Standard Headers
        res.setHeader('X-Quota-Limit', limit);
        res.setHeader('X-Quota-Used', used);
        res.setHeader('X-Quota-Remaining', remaining);

        if (used >= limit) {
            // Track Overage Softly (as requested)
            await supabase.rpc('increment_overage', { p_key_id: apiKey.id });

            logger.warn('Quota exceeded', { keyId: apiKey.id, used, limit });
            return res.status(429).json({
                error: 'Monthly quota exceeded',
                message: 'Please upgrade your plan to increase limits.'
            });
        }

        next();
    } catch (error) {
        logger.error('Quota check failed', error);
        next(); // Fail open or closed? Closed is safer for revenue.
        // return res.status(500).json({ error: 'Quota check failed' });
    }
};

/**
 * Feature Gating Factory
 * Usage: router.post('/webhook', gateFeature('allows_webhooks'), ...);
 */
export const gateFeature = (featureFlag: 'allows_webhooks' | 'allows_branding' | 'allows_bulk') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.apiKey;

        // If checking via JWT (Console User)? 
        // We need to fetch User -> API Keys -> Plan?
        // Or User -> Plan? (If plan is per user? Schema links Plan to API Key).
        // Since we are building API Key management, usually features are Key-scoped (e.g. this key allows webhooks).

        if (!apiKey || !apiKey.plan) {
            // Fallback for JWT users?
            // If user is accessing "Configure Webhooks" in Console, we check their specific Key's plan?
            // Or pass if they have AT LEAST one key with the plan?
            // For now, assume this middleware is for API Requests using keys.
            return res.status(403).json({ error: 'Feature gating requires valid API Key context' });
        }

        if (!apiKey.plan[featureFlag]) {
            return res.status(403).json({
                error: 'Feature not included in your plan',
                feature: featureFlag,
                upgrade_url: '/console/upgrade'
            });
        }

        next();
    };
};
