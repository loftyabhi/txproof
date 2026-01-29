import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { ApiKeyService } from '../../services/ApiKeyService';
import { AuditService } from '../../services/AuditService';
import { z } from 'zod';

const router = Router();
const keyService = new ApiKeyService();
const auditService = new AuditService();

// Middleware placeholder - Ensure this is protected in index.ts or here
// router.use(verifyAdmin); 

// Schema
const createKeySchema = z.object({
    ownerId: z.string(),
    planName: z.enum(['Free', 'Pro', 'Enterprise']),
    ipAllowlist: z.array(z.string()).optional()
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

export default router;
