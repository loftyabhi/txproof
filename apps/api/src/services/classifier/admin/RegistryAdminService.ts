// ═══ FILE: admin/RegistryAdminService.ts ═══
import { Pool } from 'pg';
import { ProtocolRegistry } from '../infrastructure/ProtocolRegistry';

export class RegistryAdminService {
    constructor(private readonly db: Pool) { }

    async addProtocol(slug: string, name: string, category: string): Promise<void> {
        const query = `
            INSERT INTO protocols (slug, name, category) 
            VALUES ($1, $2, $3)
            ON CONFLICT (slug) DO UPDATE 
            SET name = $2, category = $3, is_active = true, updated_at = NOW()
        `;
        await this.db.query(query, [slug, name, category]);
        ProtocolRegistry.invalidate();
    }

    async addChain(
        chainId: number, name: string, nativeSymbol: string,
        wNativeAddress: string | null, dustThresholdWei: string, chainType: string
    ): Promise<void> {
        const query = `
            INSERT INTO chain_configs (chain_id, name, native_symbol, w_native_address, dust_threshold_wei, chain_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (chain_id) DO UPDATE
            SET name = $2, native_symbol = $3, w_native_address = $4, dust_threshold_wei = $5, chain_type = $6, is_active = true, updated_at = NOW()
        `;
        await this.db.query(query, [chainId, name, nativeSymbol, wNativeAddress, dustThresholdWei, chainType]);
        ProtocolRegistry.invalidate();
    }

    async addProtocolAddress(
        chainId: number, protocolSlug: string, address: string,
        addressType: string, label: string, confidenceBoost: number
    ): Promise<void> {
        const addressLower = address.toLowerCase();

        // Ensure protocol exists
        const pRes = await this.db.query('SELECT id FROM protocols WHERE slug = $1', [protocolSlug]);
        if (pRes.rowCount === 0) throw new Error(`Protocol ${protocolSlug} not found`);
        const protocolId = pRes.rows[0].id;

        const query = `
            INSERT INTO protocol_addresses (protocol_id, chain_id, address, address_type, label, confidence_boost)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (chain_id, address) DO UPDATE
            SET protocol_id = $1, address_type = $4, label = $5, confidence_boost = $6, is_active = true, updated_at = NOW()
        `;
        await this.db.query(query, [protocolId, chainId, addressLower, addressType, label, confidenceBoost]);
        ProtocolRegistry.invalidate();
    }

    async deprecateProtocolAddress(chainId: number, address: string): Promise<void> {
        const query = `
            UPDATE protocol_addresses 
            SET is_active = false, updated_at = NOW() 
            WHERE chain_id = $1 AND address = $2
        `;
        await this.db.query(query, [chainId, address.toLowerCase()]);
        ProtocolRegistry.invalidate();
    }

    async addEventSignature(
        topic0: string, name: string, category: string,
        confidenceBoost: number, protocolSlug: string | null = null
    ): Promise<void> {
        const t0 = topic0.toLowerCase();
        let protocolId = null;

        if (protocolSlug) {
            const pRes = await this.db.query('SELECT id FROM protocols WHERE slug = $1', [protocolSlug]);
            if (pRes.rowCount === 0) throw new Error(`Protocol ${protocolSlug} not found`);
            protocolId = pRes.rows[0].id;
        }

        const query = `
            INSERT INTO event_signatures (topic0, name, category, confidence_boost, protocol_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (topic0) DO UPDATE
            SET name = $2, category = $3, confidence_boost = $4, protocol_id = $5, updated_at = NOW()
        `;
        await this.db.query(query, [t0, name, category, confidenceBoost, protocolId]);
        ProtocolRegistry.invalidate();
    }

    async addFunctionSelector(
        selector: string, name: string, category: string,
        confidenceBoost: number, protocolSlug: string | null = null
    ): Promise<void> {
        const sel = selector.toLowerCase();
        let protocolId = null;

        if (protocolSlug) {
            const pRes = await this.db.query('SELECT id FROM protocols WHERE slug = $1', [protocolSlug]);
            if (pRes.rowCount === 0) throw new Error(`Protocol ${protocolSlug} not found`);
            protocolId = pRes.rows[0].id;
        }

        const query = `
            INSERT INTO function_selectors (selector, name, category, confidence_boost, protocol_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (selector) DO UPDATE
            SET name = $2, category = $3, confidence_boost = $4, protocol_id = $5, updated_at = NOW()
        `;
        await this.db.query(query, [sel, name, category, confidenceBoost, protocolId]);
        ProtocolRegistry.invalidate();
    }

    async listAddresses(chainId: number): Promise<any[]> {
        const query = `
            SELECT a.*, p.slug as protocol_slug, p.name as protocol_name, p.category as protocol_category 
            FROM protocol_addresses a 
            JOIN protocols p ON p.id = a.protocol_id 
            WHERE a.chain_id = $1 AND a.is_active = true
        `;
        const res = await this.db.query(query, [chainId]);
        return res.rows;
    }

    async getStats(): Promise<any> {
        const [protocols, addresses, events, selectors, chains] = await Promise.all([
            this.db.query('SELECT COUNT(*) FROM protocols WHERE is_active = true'),
            this.db.query('SELECT COUNT(*) FROM protocol_addresses WHERE is_active = true'),
            this.db.query('SELECT COUNT(*) FROM event_signatures'),
            this.db.query('SELECT COUNT(*) FROM function_selectors'),
            this.db.query('SELECT chain_id, COUNT(*) as count FROM protocol_addresses WHERE is_active = true GROUP BY chain_id')
        ]);

        const chainBreakdown: Record<number, number> = {};
        chains.rows.forEach(r => {
            chainBreakdown[r.chain_id] = parseInt(r.count);
        });

        return {
            totalProtocols: parseInt(protocols.rows[0].count),
            totalAddresses: parseInt(addresses.rows[0].count),
            totalEventSignatures: parseInt(events.rows[0].count),
            totalSelectors: parseInt(selectors.rows[0].count),
            chainBreakdown
        };
    }
}
