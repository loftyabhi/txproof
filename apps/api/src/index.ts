import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import cookieParser from 'cookie-parser';
import { AuthService } from './services/AuthService';
import { AdminService } from './services/AdminService';
import { BillService } from './services/BillService';
import { SoftQueueService } from './services/SoftQueueService';

// Security Middleware
import { hybridAuth, hybridAuthWithTracking } from './middleware/hybridAuth';
import { publicRateLimiter } from './middleware/publicRateLimiter';
import { saasMiddleware } from './middleware/saasAuth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
    'https://txproof.xyz',
    'https://www.txproof.xyz',
    'https://api.txproof.xyz', // Playground
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Host Header Guard to protect backend.txproof.xyz
// Goal: Allow 'txproof.xyz' frontend to use it, but block other browsers/public users.
app.use((req: Request, res: Response, next: NextFunction) => {
    const host = req.get('host');

    // Strict rules for the Private Backend Domain
    if (host === 'backend.txproof.xyz') {
        const origin = req.get('origin');

        // If request comes from a browser (has Origin)
        if (origin) {
            // ONLY Allow the official frontend
            const isAllowedFrontend = origin === 'https://txproof.xyz' || origin === 'https://www.txproof.xyz';

            if (!isAllowedFrontend) {
                // Block random sites / users trying to hit backend directly
                res.status(403).json({ error: 'Direct browser access forbidden. Use https://txproof.xyz' });
                return;
            }
            // If it IS the allowed frontend, pass through.
        }
        // If No Origin (Server-to-Server / Curl / Mobile App), pass through (assumes API Key/Auth layers handle security)
    }
    next();
});
app.use(express.json());
app.use(cookieParser());

import { supabase } from './lib/supabase';
import contributionsRouter from './routes/contributions';
import tokensRouter from './routes/tokens';
import pdfsRouter from './routes/v1/pdfs';
import adminRouter from './routes/v1/adminRouter';

// Services
const authService = new AuthService();
const adminService = new AdminService();
const billService = new BillService();
const softQueueService = new SoftQueueService();

// Register Routes
app.use('/api/contributions', contributionsRouter);
app.use('/api/v1/tokens', tokensRouter);

// SaaS Platform Routes
app.use('/api/v1/pdfs', pdfsRouter);
// Note: Admin router mounted below after verifyAdmin definition


// --- Middleware Groups ---

const setupPublicRoutes = (app: express.Application) => {
    // 1. Health Check
    app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 2. Ads (Public, Rate Limited)
    app.get('/api/v1/ads/random', publicRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const placement = (req.query.placement as 'web' | 'pdf') || 'web';
            res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.json(await adminService.getRandomAd(placement));
        } catch (e) { next(e); }
    });

    // 3. Serve Generated PDFs (Public Storage Read ONLY)
    app.get('/bills/:fileName', publicRateLimiter, async (req: Request, res: Response) => {
        const { fileName } = req.params;
        try {
            // [HARDENING] Removed Self-Healing (Regen). 
            // Public users can only read. If missing, they must use/authed flow.

            // 1. Check & Serve from Storage
            const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);

            // Verify existence via a HEAD check or just return URL? 
            // Storage.getPublicUrl doesn't validate existence, but list() does.
            const { data: files } = await supabase.storage.from('receipts').list('', { search: fileName, limit: 1 });

            if (files && files.length > 0) {
                res.redirect(307, data.publicUrl);
            } else {
                res.status(404).send('Receipt not found. Please regenerate via dashboard.');
            }
        } catch (error) {
            res.status(500).send('Error resolving receipt URL');
        }
    });

    // 4. Get Bill JSON Data (Restricted Public Fallback)
    app.get('/api/v1/bills/:billId/data', hybridAuthWithTracking, async (req: Request, res: Response) => {
        const { billId } = req.params;
        const hybridReq = req as any; // Access isPublicRequest flag
        const jsonKey = billId.endsWith('.json') ? billId : `${billId}.json`;

        try {
            // 1. Storage Check (Allowed for PUBLIC + AUTHED)
            const { data } = await supabase.storage.from('receipts').download(jsonKey);
            if (data) {
                const text = await data.text();
                res.json(JSON.parse(text));
                return;
            }

            // [HARDENING] If Public, STOP HERE. No expensive DB queries or Regen.
            if (hybridReq.isPublicRequest) {
                console.warn(`[Security] Public fallback denied heavy op for ${jsonKey}`);
                res.status(404).json({ code: 'NOT_FOUND', error: 'Bill data not found (Login to regenerate)' });
                return;
            }

            // [...] Authenticated Logic (DB Fallback, Regen) continues below...
            // Note: Reuse original logic block but now strictly guarded
            console.log(`[API] Auth User Storage miss for ${jsonKey}. Starting DB Fallback...`);

            // ... (Insert original DB/Regen logic here via BillService) ...
            // For brevity in replacement, re-implementing the core logic:

            const cleanId = billId.replace('.json', '');
            const parts = cleanId.split('-');

            if (parts.length >= 4 && parts[0].toUpperCase() === 'BILL') {
                // ... DB Fallback Code ...
                const chainId = parseInt(parts[1]);
                const shortHash = parts[3];
                if (!isNaN(chainId) && shortHash) {
                    const { data: dbBill } = await supabase.from('bills').select('bill_json').eq('chain_id', chainId).ilike('tx_hash', `${shortHash}%`).maybeSingle();
                    if (dbBill?.bill_json) {
                        res.json(dbBill.bill_json);
                        // Cache Repair (Async)
                        // ...
                        return;
                    }
                }
            }

            // Regen Fallback
            try {
                await billService.regenerateFromId(cleanId);
                const { data: retryData } = await supabase.storage.from('receipts').download(jsonKey);
                if (retryData) {
                    const text = await retryData.text();
                    res.json(JSON.parse(text));
                    return;
                }
            } catch (e: any) {
                console.error(e);
            }

            res.status(404).json({ code: 'NOT_FOUND', error: 'Bill data not found' });

        } catch (err: any) {
            console.error(err);
            res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Internal Server Error' });
        }
    });
};

// --- Schemas ---
const billGenerateSchema = z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Transaction Hash format"),
    chainId: z.number().int().positive("Chain ID must be a positive integer"),
    connectedWallet: z.string().optional()
});

const setupPrivateRoutes = (app: express.Application) => {
    // 1. Resolve Bill (Soft Queue) - STRICT SAAS AUTH
    app.post('/api/v1/bills/resolve', saasMiddleware, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validation = billGenerateSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid Input', details: validation.error.issues });
                return;
            }

            const { txHash, chainId, connectedWallet } = validation.data;
            const apiKeyId = (req as any).auth?.id; // Guaranteed by saasMiddleware

            console.log(`[API] Enqueueing request: ${txHash} (Key: ${apiKeyId})`);

            // Pass apiKeyId to enqueue for robust worker checking
            const job = await softQueueService.enqueue(txHash, chainId, { connectedWallet, apiKeyId });

            setImmediate(() => softQueueService.processNext().catch(e => console.error(e)));

            res.json({
                success: true,
                jobId: job.jobId,
                status: job.status,
                message: 'Request queued'
            });
        } catch (error) { next(error); }
    });

    // 2. Check Job Status - STRICT SAAS AUTH
    app.get('/api/v1/bills/job/:id', saasMiddleware, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = await softQueueService.getJobStatus(req.params.id);
            if (!status) {
                res.status(404).json({ code: 'JOB_NOT_FOUND', error: 'Job not found' });
                return;
            }

            if (status.state === 'pending' || status.state === 'processing') {
                setImmediate(() => softQueueService.processNext().catch(e => console.error(e)));
            }

            res.set('Retry-After', '2');
            res.json({
                id: status.id,
                state: status.state,
                data: status.result?.billData || null,
                pdfUrl: status.result?.pdfPath || null,
                error: status.error,
                queuePosition: status.queuePosition,
                estimatedWaitMs: status.estimatedWaitMs
            });
        } catch (error) { next(error); }
    });
};

// --- Apply Groups ---
setupPublicRoutes(app);
setupPrivateRoutes(app);

// 3. Admin Login
app.post('/api/v1/auth/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { address, signature, nonce } = req.body;
        const result = await authService.loginAdmin(address, signature, nonce);

        // Set HttpOnly Cookie
        res.cookie('admin_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in prod
            sameSite: 'lax', // or 'strict' if on same domain
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

// 5. Admin Routes (Protected)

// Middleware to verify Admin JWT
const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    // 1. Try Cookie first (Secure)
    let token = req.cookies?.admin_token;

    // 2. Fallback to Header (Dev/Curl)
    const authHeader = req.headers.authorization;
    if (!token && authHeader) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const payload = authService.verifyToken(token);
        // Explicit Role Check
        if (payload.role !== 'admin') {
            throw new Error('Not an admin');
        }
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// SaaS Admin Dashboard
app.use('/api/v1/admin', verifyAdmin, adminRouter);


// Ads
// Public Random Ad - Rate Limited
app.get('/api/v1/ads/random', publicRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const placement = (req.query.placement as 'web' | 'pdf') || 'web';
        // Prevent caching to ensure random distribution (Equal Proportion)
        res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.json(await adminService.getRandomAd(placement));
    } catch (e) { next(e); }
});

app.get('/api/v1/admin/ads', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await adminService.getAds());
    } catch (e) { next(e); }
});

app.post('/api/v1/admin/ads', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await adminService.saveAd(req.body));
    } catch (e) { next(e); }
});

app.delete('/api/v1/admin/ads/:id', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await adminService.deleteAd(req.params.id);
        res.json({ success: true });
    } catch (e) { next(e); }
});

// --- Centralized Error Handler ---

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[API ERROR]', err);

    // Distinguish between operational errors and programming errors if possible
    // For now, straightforward mapping:
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
        // In production, might want to hide stack trace
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`⚡ TxProof API running on port ${port} (SafeQueue Mode)`);
});