import fs from 'fs';
import path from 'path';

// Interfaces for our Data Model
export interface Plan {
    id: string; // e.g., "plan_basic", "plan_pro"
    title: string;
    priceWei: string; // Ensure string for BigInt safety in JSON
    validitySeconds: number;
    hasAds: boolean;
    canDownloadPdf: boolean;
}

export interface Ad {
    id: string;
    contentHtml: string;
    isActive: boolean;
    clickUrl?: string;
    placement?: 'web' | 'pdf' | 'both'; // Default to 'both' if undefined
}

const DATA_DIR = path.join(process.cwd(), 'data');

export class AdminService {
    private plansFile = path.join(DATA_DIR, 'plans.json');
    private adsFile = path.join(DATA_DIR, 'ads.json');

    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        // Initialize files if not exist
        if (!fs.existsSync(this.plansFile)) this.savePlans([]);
        if (!fs.existsSync(this.adsFile)) this.saveAds([]);
    }

    // --- PLANS ---
    getPlans(): Plan[] {
        return JSON.parse(fs.readFileSync(this.plansFile, 'utf8'));
    }

    savePlan(plan: Plan): Plan {
        const plans = this.getPlans();
        const index = plans.findIndex(p => p.id === plan.id);

        if (index >= 0) {
            plans[index] = plan; // Update
        } else {
            plans.push(plan); // Create
        }

        this.savePlans(plans);
        return plan;
    }

    deletePlan(id: string): void {
        const plans = this.getPlans().filter(p => p.id !== id);
        this.savePlans(plans);
    }

    private savePlans(plans: Plan[]) {
        fs.writeFileSync(this.plansFile, JSON.stringify(plans, null, 2));
    }

    // --- ADS ---
    getAds(): Ad[] {
        return JSON.parse(fs.readFileSync(this.adsFile, 'utf8'));
    }

    getRandomAd(placement: 'web' | 'pdf' = 'web'): Ad | null {
        const ads = this.getAds().filter(a => {
            if (!a.isActive) return false;
            // If placement not set, treat as 'both'. Else check match or 'both'
            const adPlacement = a.placement || 'both';
            return adPlacement === 'both' || adPlacement === placement;
        });

        if (ads.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * ads.length);
        return ads[randomIndex];
    }

    saveAd(ad: Ad): Ad {
        const ads = this.getAds();
        const index = ads.findIndex(a => a.id === ad.id);

        if (index >= 0) {
            ads[index] = ad;
        } else {
            ads.push(ad);
        }

        this.saveAds(ads);
        return ad;
    }

    deleteAd(id: string): void {
        const ads = this.getAds().filter(a => a.id !== id);
        this.saveAds(ads);
    }

    private saveAds(ads: Ad[]) {
        fs.writeFileSync(this.adsFile, JSON.stringify(ads, null, 2));
    }
}
