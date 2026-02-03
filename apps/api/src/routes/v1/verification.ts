import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { verifyReceiptHash, computeReceiptHash } from '../../lib/cryptography';
import { logger } from '../../lib/logger';

const router = Router();

/**
 * POST /v1/verify/receipt
 * Verifies the cryptographic integrity of a receipt
 */
router.post('/receipt', async (req: Request, res: Response) => {
    try {
        const { billId, expectedHash } = req.body;

        if (!billId) {
            return res.status(400).json({ error: 'billId is required' });
        }

        // Fetch bill data from database
        const { data: bill, error } = await supabase
            .from('bills')
            .select('bill_json, receipt_hash, hash_algo')
            .eq('bill_id', billId)
            .single();

        if (error || !bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        if (!bill.bill_json) {
            return res.status(400).json({ error: 'Bill data not available' });
        }

        // Compute hash from stored data
        const computedHash = computeReceiptHash(bill.bill_json);
        const storedHash = bill.receipt_hash;

        // Verify against expected hash if provided
        const hashToVerify = expectedHash || storedHash;

        const result = {
            valid: computedHash === hashToVerify,
            billId,
            computedHash,
            storedHash,
            expectedHash: expectedHash || null,
            algorithm: bill.hash_algo || 'keccak256',
            verified_at: new Date().toISOString()
        };

        logger.info('Receipt verification completed', {
            billId,
            valid: result.valid,
            providedExpected: !!expectedHash
        });

        res.json(result);

    } catch (error: any) {
        logger.error('Receipt verification error', { error: error.message });
        res.status(500).json({ error: 'Verification failed: ' + error.message });
    }
});

/**
 * GET /v1/verify/receipt/:billId
 * Quick verification endpoint (GET request)
 */
router.get('/receipt/:billId', async (req: Request, res: Response) => {
    try {
        const { billId } = req.params;

        const { data: bill, error } = await supabase
            .from('bills')
            .select('bill_json, receipt_hash, hash_algo')
            .eq('bill_id', billId)
            .single();

        if (error || !bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        if (!bill.bill_json || !bill.receipt_hash) {
            return res.status(400).json({ error: 'Receipt proof not available for this bill' });
        }

        const computedHash = computeReceiptHash(bill.bill_json);
        const valid = computedHash === bill.receipt_hash;

        res.json({
            valid,
            billId,
            hash: bill.receipt_hash,
            algorithm: bill.hash_algo || 'keccak256',
            verified_at: new Date().toISOString()
        });

    } catch (error: any) {
        logger.error('Receipt verification error', { error: error.message });
        res.status(500).json({ error: 'Verification failed' });
    }
});

/**
 * GET /v1/verify/webhook/:webhookId/events
 * Returns delivery log for a webhook
 */
router.get('/webhook/:webhookId/events', async (req: Request, res: Response) => {
    try {
        const { webhookId } = req.params;
        const apiKeyId = (req as any).apiKeyId;

        // Verify ownership        
        const { data: webhook, error: webhookError } = await supabase
            .from('webhooks')
            .select('id, api_key_id, url')
            .eq('id', webhookId)
            .eq('api_key_id', apiKeyId)
            .single();

        if (webhookError || !webhook) {
            return res.status(404).json({ error: 'Webhook not found or unauthorized' });
        }

        // Fetch delivery events
        const limit = parseInt(req.query.limit as string) || 50;
        const { data: events, error } = await supabase
            .from('webhook_events')
            .select('event_id, event_type, status, attempt_count, response_status, created_at, updated_at, next_retry_at')
            .eq('webhook_id', webhookId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            logger.error('Failed to fetch webhook events', { webhookId, error: error.message });
            return res.status(500).json({ error: 'Failed to fetch events' });
        }

        res.json({
            webhook: {
                id: webhook.id,
                url: webhook.url
            },
            events: events || [],
            total: events?.length || 0
        });

    } catch (error: any) {
        logger.error('Webhook events verification error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch webhook events' });
    }
});

export default router;
