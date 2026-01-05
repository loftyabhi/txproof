import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContributionService } from '../services/ContributionService';
import { supabase } from '../lib/supabase';

const router = Router();
const contributionService = new ContributionService();

const submitSchema = z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Transaction Hash format"),
    isAnonymous: z.boolean().default(false)
});

router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = submitSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid Input', details: validation.error.issues });
            return;
        }

        const { txHash, isAnonymous } = validation.data;

        const result = await contributionService.submitContribution(txHash, isAnonymous);

        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /status/:txHash - Check status of a contribution
router.get('/status/:txHash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { txHash } = req.params;

        // Basic format check
        if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            res.status(400).json({ error: "Invalid transaction hash format" });
            return; // Explicit return to avoid void type error
        }

        const { data: pending } = await supabase
            .from('pending_contributions')
            .select('*')
            .eq('tx_hash', txHash)
            .single();

        if (pending) {
            res.json({
                found: true,
                source: 'pending_table',
                status: pending.status,
                details: pending
            });
            return;
        }

        const { data: confirmed } = await supabase
            .from('contributor_events')
            .select('*')
            .eq('tx_hash', txHash)
            .single();

        if (confirmed) {
            res.json({
                found: true,
                source: 'events_table',
                status: 'confirmed',
                details: confirmed
            });
            return;
        }

        res.status(404).json({ found: false, status: 'unknown', message: 'Transaction not tracked by system.' });

    } catch (error) {
        next(error);
    }
});

export default router;
