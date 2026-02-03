import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WebhookService } from '../../services/WebhookService';
import { saasMiddleware, AuthenticatedRequest } from '../../middleware/saasAuth';

const router = Router();
const webhookService = new WebhookService();

// Protected by SaaS Auth
router.use(saasMiddleware);

// Schema
const createWebhookSchema = z.object({
    url: z.string().url(),
    events: z.array(z.string()).min(1)
});

// GET /api/v1/webhooks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = (req as AuthenticatedRequest).auth!;
        const hooks = await webhookService.listWebhooks(auth.id);
        res.json(hooks);
    } catch (e) { next(e); }
});

// POST /api/v1/webhooks
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = createWebhookSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid Input', details: validation.error.issues });
            return;
        }

        const auth = (req as AuthenticatedRequest).auth!;
        const result = await webhookService.createWebhook(auth.id, validation.data.url, validation.data.events);

        // Returns secret ONLY here
        res.status(201).json(result);
    } catch (e) { next(e); }
});

// DELETE /api/v1/webhooks/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = (req as AuthenticatedRequest).auth!;
        await webhookService.deleteWebhook(req.params.id, auth.id);
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
