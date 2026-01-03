import { supabase } from '../lib/supabase';

// Interfaces for our Data Model
export interface Plan {
    id: string; // We will use this as 'id' or map to DB ID if integer? 
    // DB 'plans' has integer ID. User uses string IDs like 'plan_basic'.
    // We should probably map 'plan_basic' to 'title' or use a separate 'slug'?
    // Schema has: id (serial), title, validity_interval, price_wei, has_ads, can_download_pdf, is_active
    // It doesn't have a string ID.
    // For now, we will treat 'id' as string in API but we might need to store it?
    // WARNING: 'plans' table ID is SERIAL (number). The current frontend/JSON uses string IDs.
    // To minimize breakage, we will assume 'title' is unique enough or we map strings to new rows?
    // Actually, 'plans' table doesn't have a SLUG.
    // Let's rely on 'id' being stringified number OR we add a column?
    // To match user's "plan_basic", we might need a mapping.
    // Simpler approach: Just stick to numeric IDs from DB and cast to string for Frontend? 
    // The frontend sends `id: "123"`?
    // Let's modify the interface to handle this.

    // ADJUSTMENT: We will cast DB ID (number) to string for the API.
    // If frontend sends "plan_basic" (new), we ignore it and let DB generate ID?
    // Or we update the Schema to allow textual IDs? 
    // Schema says: id SERIAL.
    // Let's stick to DB truth. The frontend might need adjustment if it relies strictly on "plan_basic".

    title: string;
    priceWei: string;
    validitySeconds: number;
    hasAds: boolean;
    canDownloadPdf: boolean;
    isActive: boolean;
}

export interface Ad {
    id: string; // DB ID is number
    contentHtml: string;
    isActive: boolean;
    clickUrl?: string; // Schema: click_url
    placement?: 'web' | 'pdf' | 'both'; // Schema: placement (added via migration)
}

export class AdminService {

    constructor() { }

    // --- PLANS ---

    async getPlans(): Promise<Plan[]> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('[AdminService] getPlans error:', error);
            return [];
        }

        return data.map((row: any) => ({
            id: row.id.toString(),
            title: row.title,
            priceWei: row.price_wei?.toString() || '0',
            validitySeconds: this.parseIntervalToSeconds(row.validity_interval),
            hasAds: row.has_ads,
            canDownloadPdf: row.can_download_pdf,
            isActive: row.is_active
        }));
    }

    async savePlan(plan: Plan): Promise<Plan> {
        // Prepare DB object
        const dbPlan: any = {
            title: plan.title,
            price_wei: plan.priceWei,
            validity_interval: `${plan.validitySeconds} seconds`,
            has_ads: plan.hasAds,
            can_download_pdf: plan.canDownloadPdf,
            is_active: plan.isActive
        };

        // If ID is numeric, it's an update
        if (plan.id && !isNaN(Number(plan.id))) {
            dbPlan.id = Number(plan.id);
        }

        const { data, error } = await supabase
            .from('plans')
            .upsert(dbPlan)
            .select()
            .single();

        if (error) {
            console.error('[AdminService] savePlan error:', error);
            throw error;
        }

        return {
            id: data.id.toString(),
            title: data.title,
            priceWei: data.price_wei?.toString() || '0',
            validitySeconds: this.parseIntervalToSeconds(data.validity_interval),
            hasAds: data.has_ads,
            canDownloadPdf: data.can_download_pdf,
            isActive: data.is_active
        };
    }

    async deletePlan(id: string): Promise<void> {
        if (!id || isNaN(Number(id))) return; // Can't delete non-numeric legacy ID
        await supabase.from('plans').delete().eq('id', Number(id));
    }

    // --- ADS ---

    async getAds(): Promise<Ad[]> {
        const { data, error } = await supabase
            .from('ad_profiles')
            .select('*')
            .eq('is_deleted', false)
            .order('id', { ascending: true });

        if (error) {
            console.error('[AdminService] getAds error:', error);
            return [];
        }

        return data.map((row: any) => ({
            id: row.id.toString(),
            contentHtml: row.html_content,
            isActive: row.is_active,
            clickUrl: row.click_url,
            placement: row.placement || 'both'
        }));
    }

    async getRandomAd(placement: 'web' | 'pdf' = 'web'): Promise<Ad | null> {
        // Logic: active = true, is_deleted = false, placement IN ('both', placement)
        // Since we can't do complex random efficiently in Supabase-js without RPC, 
        // we'll fetch active ones and pick random in memory (assuming low count of ads).
        const { data, error } = await supabase
            .from('ad_profiles')
            .select('*')
            .eq('is_active', true)
            .eq('is_deleted', false);

        if (error || !data || data.length === 0) return null;

        // Filter by placement
        const validAds = data.filter((row: any) => {
            const rowPlacement = row.placement || 'both';
            return rowPlacement === 'both' || rowPlacement === placement;
        });

        if (validAds.length === 0) return null;

        const randomRow = validAds[Math.floor(Math.random() * validAds.length)];

        return {
            id: randomRow.id.toString(),
            contentHtml: randomRow.html_content,
            isActive: randomRow.is_active,
            clickUrl: randomRow.click_url,
            placement: randomRow.placement || 'both'
        };
    }

    async saveAd(ad: Ad): Promise<Ad> {
        const dbAd: any = {
            html_content: ad.contentHtml,
            click_url: ad.clickUrl || '',
            is_active: ad.isActive,
            placement: ad.placement || 'both'
        };

        if (ad.id && !isNaN(Number(ad.id))) {
            dbAd.id = Number(ad.id);
        }

        const { data, error } = await supabase
            .from('ad_profiles')
            .upsert(dbAd)
            .select()
            .single();

        if (error) {
            console.error('[AdminService] saveAd error:', error);
            throw error;
        }

        return {
            id: data.id.toString(),
            contentHtml: data.html_content,
            isActive: data.is_active,
            clickUrl: data.click_url,
            placement: data.placement || 'both'
        };
    }

    async deleteAd(id: string): Promise<void> {
        if (!id || isNaN(Number(id))) return;
        // Soft delete
        await supabase
            .from('ad_profiles')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', Number(id));
    }

    // --- Helpers ---

    private parseIntervalToSeconds(interval: any): number {
        if (!interval) return 0;
        if (typeof interval === 'number') return interval;

        // Handle ISO 8601 Duration (e.g. PT10S, P1D)
        if (typeof interval === 'string') {
            // Simple seconds detection "3600 seconds"?
            if (interval.includes('second')) return parseInt(interval, 10);

            // ISO Parser
            const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
            const match = interval.match(regex);

            if (match) {
                const years = parseInt(match[1] || '0', 10);
                const months = parseInt(match[2] || '0', 10);
                const weeks = parseInt(match[3] || '0', 10);
                const days = parseInt(match[4] || '0', 10);
                const hours = parseInt(match[5] || '0', 10);
                const minutes = parseInt(match[6] || '0', 10);
                const seconds = parseFloat(match[7] || '0');

                return (
                    (years * 31536000) +
                    (months * 2592000) +
                    (weeks * 604800) +
                    (days * 86400) +
                    (hours * 3600) +
                    (minutes * 60) +
                    seconds
                );
            }
        }
        return 0;
    }
}
