import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/AuthService';
import { ApiKeyService } from '../../services/ApiKeyService';
import { AuditService } from '../../services/AuditService';
import { z } from 'zod';

const router = Router();
const keyService = new ApiKeyService();
const auditService = new AuditService();

// Note: verifyAdmin middleware is applied in index.ts for the /api/v1/admin base path

// Schema
const createKeySchema = z.object({
    ownerId: z.string(),
    planName: z.enum(['Free', 'Pro', 'Enterprise']),
    ipAllowlist: z.array(z.string()).optional()
});

/**
 * GET /api/v1/admin/me
 * Session Introspection
 */
router.get('/me', (req: Request, res: Response) => {
    // If request reached here, it passed verifyAdmin middleware (user is admin)
    const user = (req as any).user;

    // ROTATE SESSION: New JWT + New CSRF on every check
    // This ensures if a token is stolen, the CSRF part becomes stale or invalid if refreshed elsewhere
    const authService = new AuthService();
    const result = authService.rotateSession(user);

    // Set Hardened Cookie
    res.cookie('admin_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain: process.env.NODE_ENV === 'production' ? '.txproof.xyz' : undefined,
        maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.json({
        authenticated: true,
        csrfToken: result.csrfToken, // Send new CSRF token to client
        user: { role: user.role, address: user.address }
    });
});

/**
 * GET /api/v1/admin/keys
 * List all API Keys
 */
router.get('/keys', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('api_keys')
            .select(`
                *,
                plan:plans(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/v1/admin/keys
 * Issue new API Key
 */
router.post('/keys', async (req: Request, res: Response) => {
    try {
        const { ownerId, planName, ipAllowlist } = createKeySchema.parse(req.body);
        const result = await keyService.createKey(ownerId, planName);

        // Update IP Allowlist if provided (createKey doesn't take it directly yet)
        if (ipAllowlist) {
            await supabase.from('api_keys').update({ ip_allowlist: ipAllowlist }).eq('id', result.id);
        }

        await auditService.log({
            actorId: 'admin_user',
            action: 'KEY_CREATE',
            targetId: result.id,
            metadata: { plan: planName, owner: ownerId, ipAllowlist },
            ip: req.ip
        });

        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

/**
 * PUT /api/v1/admin/keys/:id
 * Update Key Plan/Status/Abuse/IPs
 */
router.put('/keys/:id', async (req: Request, res: Response) => {
    try {
        const { isActive, planName, abuseFlag, ipAllowlist } = req.body;
        const updates: any = {};

        if (typeof isActive === 'boolean') updates.is_active = isActive;
        if (typeof abuseFlag === 'boolean') updates.abuse_flag = abuseFlag;
        if (Array.isArray(ipAllowlist)) updates.ip_allowlist = ipAllowlist;

        if (planName) {
            const { data: plan } = await supabase.from('plans').select('id').eq('name', planName).single();
            if (plan) updates.plan_id = plan.id;
        }

        const { data, error } = await supabase
            .from('api_keys')
            .update(updates)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;

        await auditService.log({
            actorId: 'admin_user',
            action: 'KEY_UPDATE',
            targetId: req.params.id,
            metadata: { updates },
            ip: req.ip
        });

        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/v1/admin/audit
 * View Audit Logs
 */
router.get('/audit', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/v1/admin/usage
 * Dashboard Metrics & Analytics
 */
router.get('/usage', async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Basic Counts
        const { count: requestsToday } = await supabase
            .from('api_usage')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 2. Recent Errors
        const { data: errors } = await supabase
            .from('api_usage')
            .select('*')
            .gte('status_code', 400)
            .order('created_at', { ascending: false })
            .limit(10);

        // 3. Top Users (Aggregation via View preferred, using simplified groupBy here if small, 
        // implies we should stick to basic stats or use the new 'aggregates' table)
        // Let's use `api_usage_aggregates` for top quotas
        const { data: topKeys } = await supabase
            .from('api_usage_aggregates')
            .select('api_key_id, request_count, api_keys(prefix, owner_id)')
            .eq('period_start', today.substring(0, 7) + '-01') // This Month
            .order('request_count', { ascending: false })
            .limit(5);

        // 4. SLA Metrics (from new view)
        const { data: sla } = await supabase
            .from('distinct_daily_metrics')
            .select('*')
            .limit(1);

        res.json({
            metrics: {
                requestsToday,
                activeKeys: (await supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('is_active', true)).count,
                avgLatency: sla?.[0]?.p50_latency || 0,
                failureRate: sla?.[0]?.failure_count || 0
            },
            recentErrors: errors,
            topKeys: topKeys,
            sla: sla?.[0]
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

import { ContributionService } from '../../services/ContributionService';

const contributionService = new ContributionService();

/**
 * GET /api/v1/admin/contributions
 * List contribution events or pending transactions
 */
router.get('/contributions', async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        // Pending Queue
        if (status === 'pending') {
            const { data, error } = await supabase
                .from('pending_contributions')
                .select('*')
                .in('status', ['pending', 'failed'])
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return res.json(data);
        }

        // History (Contributor Events)
        let query = supabase
            .from('contributor_events')
            .select('*')
            .order('block_timestamp', { ascending: false })
            .limit(50);

        // Optional filtering by validity
        if (status === 'valid') {
            query = query.eq('is_valid', true);
        } else if (status === 'invalid') {
            query = query.eq('is_valid', false);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/v1/admin/contributions/sync
 * Secure Manual Sync (Audit Safe)
 */
router.post('/contributions/sync', async (req: Request, res: Response) => {
    try {
        const { txHash } = req.body;
        if (!txHash) return res.status(400).json({ error: 'Missing txHash' });

        const result = await contributionService.manualSync(txHash);

        // Log the sync attempt
        await auditService.log({
            actorId: (req as any).user?.address || 'admin',
            action: 'CONTRIBUTION_SYNC',
            targetId: txHash,
            metadata: { result },
            ip: req.ip
        });

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/v1/admin/contributions/:id/invalidate
 * Soft Invalidation (Financial Integrity Safe)
 */
router.post('/contributions/:id/invalidate', async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason is required for invalidation' });

        const actorId = (req as any).user?.address || 'admin';
        await contributionService.invalidateContribution(req.params.id, reason, actorId);

        res.json({ success: true, message: 'Contribution invalidated.' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/v1/admin/contributions/:id/revalidate
 * Restore an invalidated contribution
 */
router.post('/contributions/:id/revalidate', async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        const actorId = (req as any).user?.address || 'admin';
        await contributionService.revalidateContribution(req.params.id, reason || 'Manual Revalidation', actorId);

        res.json({ success: true, message: 'Contribution revalidated.' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
