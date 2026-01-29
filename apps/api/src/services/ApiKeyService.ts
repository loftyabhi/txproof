import { createHash, randomBytes } from 'crypto';
import { supabase } from '../lib/supabase';

export interface ApiKeyDetails {
    id: string;
    owner_id: string;
    plan: {
        id: string;
        name: string;
        rate_limit_rps: number;
        monthly_quota: number;
        priority_level: number;
    };
    environment: 'live' | 'test';
    permissions: string[];
    ipAllowlist?: string[] | null;
}

export class ApiKeyService {

    /**
     * Generate a new API Key.
     * Returns the raw key (Display Once) and stores the hash.
     */
    async createKey(ownerId: string, planName: 'Free' | 'Pro' | 'Enterprise' = 'Free') {
        // 1. Get Plan ID
        const { data: plan } = await supabase
            .from('plans')
            .select('id')
            .eq('name', planName)
            .single();

        if (!plan) throw new Error(`Plan ${planName} not found`);

        // 2. Generate Key
        // Format: sk_live_<24-char-hex>
        const random = randomBytes(24).toString('hex');
        const rawKey = `sk_live_${random}`;
        const prefix = `sk_live_${random.substring(0, 4)}`;
        const hash = createHash('sha256').update(rawKey).digest('hex');

        // 3. Store
        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                key_hash: hash,
                prefix: prefix,
                owner_id: ownerId,
                plan_id: plan.id,
                environment: 'live',
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            key: rawKey, // Show this ONLY once
            prefix
        };
    }

    /**
     * Authenticate a request.
     */
    async verifyKey(rawKey: string): Promise<ApiKeyDetails | null> {
        const hash = createHash('sha256').update(rawKey).digest('hex');

        const { data, error } = await supabase
            .from('api_keys')
            .select(`
                id,
                owner_id,
                environment,
                permissions,
                is_active,
                ip_allowlist,
                abuse_flag,
                plan:plans (
                    id, 
                    name, 
                    rate_limit_rps, 
                    monthly_quota,
                    max_burst,
                    priority_level
                )
            `)
            .eq('key_hash', hash)
            .single();

        if (error || !data) return null;

        // 1. Hard Abuse Validation
        if (data.abuse_flag) {
            console.warn(`[Security] Blocked abuse-flagged key: ${data.id}`);
            return null;
        }

        if (!data.is_active) return null;

        // Flatten checks
        return {
            id: data.id,
            owner_id: data.owner_id,
            environment: data.environment,
            permissions: data.permissions,
            ipAllowlist: data.ip_allowlist,
            plan: data.plan as any
        };
    }

    /**
     * Check Quota & Increment
     * Returns true if allowed, false if quota exceeded
     */
    async checkAndIncrementUsage(apiKeyId: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('increment_api_usage', {
            p_key_id: apiKeyId,
            p_cost: 1
        });

        if (error) {
            console.error('Usage RPC Error:', error);
            // Fail open or closed? Closed for safety.
            return false;
        }

        return data as boolean;
    }

    /**
     * Async Log (Fire & Forget)
     */
    async logRequest(log: { apiKeyId: string, endpoint: string, status: number, duration: number, ip: string }) {
        // In high scale, push to a queue. For now, direct insert.
        await supabase.from('api_usage').insert({
            api_key_id: log.apiKeyId,
            endpoint: log.endpoint,
            status_code: log.status,
            duration_ms: log.duration,
            ip_address: log.ip
        });
    }
}
