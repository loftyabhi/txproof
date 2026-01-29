import { supabase } from '../lib/supabase';

export interface AuditEntry {
    actorId: string;
    action: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ip?: string;
}

export class AuditService {
    /**
     * Log a sensitive action.
     * Guaranteed no-throw (logging should not break flow).
     */
    async log(entry: AuditEntry) {
        try {
            await supabase.from('audit_logs').insert({
                actor_id: entry.actorId,
                action: entry.action,
                target_id: entry.targetId,
                metadata: entry.metadata || {},
                ip_address: entry.ip || 'system',
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AuditService] Failed to log:', error);
        }
    }
}
