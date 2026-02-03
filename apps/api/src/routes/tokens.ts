import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const router = Router();

// Schema for Admin actions
const tokenSchema = z.object({
    symbol: z.string().min(1).max(10).transform(s => s.toUpperCase()),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address format"),
    name: z.string().min(1),
    decimals: z.number().int().min(0).max(18),
    is_native: z.boolean().default(false),
    is_active: z.boolean().default(true)
});

// GET /api/v1/tokens (Public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabase
            .from('supported_tokens')
            .select('*')
            .eq('is_active', true)
            .order('symbol');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
});


import { verifyAdmin } from '../middleware/adminAuth';

// POST /api/v1/tokens (Admin Only)
router.post('/', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = tokenSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid Input', details: validation.error.issues });
            return;
        }

        const token = validation.data;

        const { data, error } = await supabase
            .from('supported_tokens')
            .upsert(token)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
});

export default router;
