import { Router, Request, Response, NextFunction } from 'express';
import { TemplateService } from '../../services/TemplateService';
import { saasMiddleware, AuthenticatedRequest } from '../../middleware/saasAuth';

const router = Router();
const templateService = new TemplateService();

// Protected by SaaS Auth
router.use(saasMiddleware);

// GET /api/v1/templates
// Get current template for the authenticated API Key
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = (req as AuthenticatedRequest).auth!;
        const template = await templateService.getTemplate(auth.id);
        res.json(template || {}); // Return empty object if no template
    } catch (e) { next(e); }
});

// POST /api/v1/templates
// Create or Update template
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = (req as AuthenticatedRequest).auth!;
        const result = await templateService.saveTemplate(auth.id, req.body);
        res.json(result);
    } catch (e) { next(e); }
});

export default router;
