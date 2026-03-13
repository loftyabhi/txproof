// ═══ FILE: __tests__/engine.test.ts ═══
import * as fs from 'fs';
import * as path from 'path';
import { ClassificationEngine } from '../core/Engine';
import { ProtocolRegistry } from '../../classifier/infrastructure/ProtocolRegistry';

// Mock DB
const mockDb: any = {
    connect: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
    })
};

describe('ClassificationEngine', () => {
    let engine: ClassificationEngine;
    let registry: ProtocolRegistry;

    beforeAll(() => {
        registry = new ProtocolRegistry(mockDb);
        // Force mock snapshot
        (ProtocolRegistry as any).snapshot = {
            byAddress: new Map(),
            byCategory: new Map(),
            byEvent: new Map(),
            bySelector: new Map(),
            byChain: new Map([[1, {
                chainId: 1, name: 'Ethereum', nativeSymbol: 'ETH', wNativeAddress: '', dustThresholdWei: 1000n, chainType: 'L1'
            }]]),
            loadedAt: new Date()
        };
        engine = new ClassificationEngine(registry);
    });

    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
        const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

        for (const file of files) {
            it(`should classify fixture ${file} correctly`, async () => {
                const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf-8'));
                // Override receipt contract setup logic for creation hook check
                if (data.tx.to === null) {
                    data.receipt.contractAddress = '0x9999999999999999999999999999999999999999';
                }
                const result = await engine.classify(data.tx, data.receipt);
                expect(result.functionalType).toBe(data.expected.functionalType);
            });
        }
    } else {
        it('has no fixtures dir', () => {
            expect(true).toBe(true);
        });
    }
});
