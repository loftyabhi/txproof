// ═══ FILE: routes/registry.ts ═══
import { Router, Request, Response } from 'express';
import { RegistryAdminService } from '../services/classifier/admin/RegistryAdminService';
import { getDatabasePool } from '../utils/db'; // Placeholder matching standard structure

// Stub for authentication middleware that should already exist in project
const requireAdmin = (req: Request, res: Response, next: Function) => next();

const router = Router();
let adminService: RegistryAdminService;

const getService = () => {
    if (!adminService) adminService = new RegistryAdminService(getDatabasePool());
    return adminService;
};

// Add Protocol
router.post('/protocols', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { slug, name, category } = req.body;
        await getService().addProtocol(slug, name, category);
        res.status(200).json({ success: true, message: 'Protocol added/updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add Protocol Address
router.post('/addresses', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { chainId, protocolSlug, address, addressType, label, confidenceBoost } = req.body;
        await getService().addProtocolAddress(chainId, protocolSlug, address, addressType, label, confidenceBoost);
        res.status(200).json({ success: true, message: 'Address added/updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deprecate Protocol Address
router.delete('/addresses', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { chainId, address } = req.body;
        await getService().deprecateProtocolAddress(chainId, address);
        res.status(200).json({ success: true, message: 'Address deprecated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add Event Signature
router.post('/events', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { topic0, name, category, confidenceBoost, protocolSlug } = req.body;
        await getService().addEventSignature(topic0, name, category, confidenceBoost, protocolSlug);
        res.status(200).json({ success: true, message: 'Event signature added/updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add Function Selector
router.post('/selectors', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { selector, name, category, confidenceBoost, protocolSlug } = req.body;
        await getService().addFunctionSelector(selector, name, category, confidenceBoost, protocolSlug);
        res.status(200).json({ success: true, message: 'Function selector added/updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add Chain
router.post('/chains', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { chainId, name, nativeSymbol, wNativeAddress, dustThresholdWei, chainType } = req.body;
        await getService().addChain(chainId, name, nativeSymbol, wNativeAddress, dustThresholdWei, chainType);
        res.status(200).json({ success: true, message: 'Chain added/updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
