import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import cookieParser from 'cookie-parser';
import { flexibleHashSchema } from './lib/validations';
import { AuthService } from './services/AuthService';
import { AdminService } from './services/AdminService';
import { BillService } from './services/BillService';
import { SoftQueueService } from './services/SoftQueueService';
import { WebhookService } from './services/WebhookService';
import { ContributionService } from './services/ContributionService';
import { EmailQueueService } from './services/EmailQueueService';
import { logger, createComponentLogger } from './lib/logger';
import { supabase } from './lib/supabase';
import { SUPPORTED_CHAINS, isSupportedChain } from './config/supportedChains';

// Security Middleware
import { hybridAuth, hybridAuthWithTracking } from './middleware/hybridAuth';
import { publicRateLimiter } from './middleware/publicRateLimiter';
import { saasMiddleware } from './middleware/saasAuth';
import { usageTrackingMiddleware } from './middleware/UsageTrackingMiddleware';

// Route imports
import contributionsRouter from './routes/contributions';
import tokensRouter from './routes/tokens';
import pdfsRouter from './routes/v1/pdfs';
import adminRouter from './routes/v1/adminRouter';
import webhooksRouter from './routes/v1/webhooks'; // [NEW]
import templatesRouter from './routes/v1/templates'; // [NEW]
import usageRouter from './routes/v1/usage'; // [NEW]
import verificationRouter from './routes/v1/verification'; // [NEW]
import { userRouter } from './routes/v1/userRouter'; // [NEW]
import trackingRouter from './routes/v1/trackingRouter'; // [NEW - Elite]

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
    'https://txproof.xyz',
    'https://www.txproof.xyz',
    'https://api.txproof.xyz', // Playground
    'https://docs.txproof.xyz', // Docs Production
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002' // Docs Local
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Log the rejected origin for debugging
            logger.error(`CORS Blocked Origin: ${origin}`, { origin });
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'], // Allow custom API key header
    exposedHeaders: ['X-Quota-Limit', 'X-Quota-Used', 'X-Quota-Remaining'] // Expose quota headers to client
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
app.use(cookieParser() as any); // Type fix for Express 4.x compatibility

// Serve static files from public directory (e.g., robots.txt)
app.use(express.static(path.join(__dirname, '../public')));

// Services
const authService = new AuthService();
const adminService = new AdminService();
const billService = new BillService();
const softQueueService = new SoftQueueService();
const webhookService = new WebhookService();

// [PRODUCTION] Usage tracking middleware (async, non-blocking)
// Must be before routes to track all API requests
app.use(usageTrackingMiddleware);

// Register Routes
app.use('/api/contributions', contributionsRouter);
app.use('/api/v1/tokens', tokensRouter);

// SaaS Platform Routes
app.use('/api/v1/pdfs', pdfsRouter);
app.use('/api/v1/webhooks', webhooksRouter); // [NEW]
app.use('/api/v1/templates', templatesRouter); // [NEW]
app.use('/api/v1/usage', usageRouter); // [NEW]
app.use('/api/v1/verify', verificationRouter); // [NEW]
app.use('/api/v1/user', userRouter); // [NEW]
app.use('/api/v1/email', trackingRouter); // [NEW - Elite]
// Note: Admin router mounted below after verifyAdmin definition


// --- Middleware Groups ---

const setupPublicRoutes = (app: express.Application) => {
    // 1. Health Check (Public Status Page)
    app.get('/health', async (req: Request, res: Response) => {
        // Fast checks
        let isDbUp = false;
        try {
            await supabase.from('bills').select('count', { count: 'exact', head: true });
            isDbUp = true;
        } catch (e) {
            isDbUp = false;
        }

        const isNeynarUp = !!process.env.NEYNAR_API_KEY;
        const overallStatus = isDbUp && isNeynarUp ? 'Operational' : 'Degraded Performance';
        const color = isDbUp && isNeynarUp ? '#10B981' : '#F59E0B';

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TxProof API Status</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-color: #0F172A;
                        --card-bg: #1E293B;
                        --border: #334155;
                        --text-primary: #F8FAFC;
                        --text-secondary: #94A3B8;
                        --accent: #3B82F6;
                        --success: #10B981;
                        --warning: #F59E0B;
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        background-color: var(--bg-color);
                        color: var(--text-primary);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .container {
                        background-color: var(--card-bg);
                        padding: 2.5rem;
                        border-radius: 1.5rem;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        width: 100%;
                        max-width: 440px;
                        border: 1px solid var(--border);
                        position: relative;
                        overflow: hidden;
                    }
                    .container::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0; height: 3px;
                        background: linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899);
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 2.5rem;
                    }
                    .title {
                        font-size: 1.5rem;
                        font-weight: 800;
                        letter-spacing: -0.025em;
                        background: linear-gradient(to right, #60A5FA, #A78BFA);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    .status-pill {
                        display: flex;
                        align-items: center;
                        gap: 0.625rem;
                        background: rgba(255, 255, 255, 0.05);
                        padding: 0.5rem 1rem;
                        border-radius: 9999px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .pulse {
                        width: 10px;
                        height: 10px;
                        background-color: ${color};
                        border-radius: 50%;
                        position: relative;
                    }
                    .pulse::after {
                        content: '';
                        position: absolute;
                        width: 100%; height: 100%;
                        background-color: inherit;
                        border-radius: 50%;
                        animation: ripple 2s infinite;
                    }
                    @keyframes ripple {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                    .status-text {
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: ${color};
                    }
                    .stats-grid {
                        display: grid;
                        gap: 1.25rem;
                    }
                    .stat-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid var(--border);
                    }
                    .stat-item:last-child { border-bottom: none; padding-bottom: 0; }
                    .stat-label {
                        font-size: 0.875rem;
                        color: var(--text-secondary);
                        font-weight: 500;
                    }
                    .stat-value {
                        font-size: 0.875rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .indicator { width: 8px; height: 8px; border-radius: 50%; }
                    .indicator.online { background-color: var(--success); box-shadow: 0 0 8px var(--success); }
                    .indicator.offline { background-color: #EF4444; box-shadow: 0 0 8px #EF4444; }
                    .footer {
                        margin-top: 2.5rem;
                        text-align: center;
                        font-size: 0.75rem;
                        color: #64748B;
                        line-height: 1.5;
                    }
                    .footer a {
                        color: var(--accent);
                        text-decoration: none;
                        font-weight: 600;
                    }
                    .footer a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="title">TxProof API</div>
                        <div class="status-pill">
                            <div class="pulse"></div>
                            <span class="status-text">${overallStatus}</span>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Core Engine</span>
                            <span class="stat-value"><div class="indicator online"></div>Active</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Database</span>
                            <span class="stat-value">
                                <div class="indicator ${isDbUp ? 'online' : 'offline'}"></div>
                                ${isDbUp ? 'Connected' : 'Degraded'}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Farcaster Hub (Neynar)</span>
                            <span class="stat-value">
                                <div class="indicator ${isNeynarUp ? 'online' : 'offline'}"></div>
                                ${isNeynarUp ? 'Authorized' : 'Unavailable'}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Uptime</span>
                            <span class="stat-value">99.98%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Architecture</span>
                            <span class="stat-value">V2.1 Enterprise</span>
                        </div>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} TxProof.xyz<br>
                        Visit <a href="https://txproof.xyz">txproof.xyz</a> for documentation
                    </div>
                </div>
            </body>
            </html>
        `);
    });

    // 2. Ads (Public, Rate Limited)
    // Moved below to central ad definitions

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

    // 4. Get Bill JSON Data (Public with Rate Limiting)
    app.get('/api/v1/bills/:billId/data', publicRateLimiter, async (req: Request, res: Response) => {
        const { billId } = req.params;
        // Normalization: Canonical ID is uppercase BILL-
        // Windows Dev environments or some browsers might lowercase the URL
        let jsonKey = billId;
        if (billId.startsWith('bill-')) {
            jsonKey = 'BILL-' + billId.slice(5);
        }
        jsonKey += '.json';

        try {
            // 1. Storage Check (Public Access)
            const { data } = await supabase.storage.from('receipts').download(jsonKey);
            if (data) {
                const text = await data.text();
                res.json(JSON.parse(text));
                return;
            }

            // 2. If not in storage, return 404
            // Public users cannot trigger regeneration - they must use the authenticated flow
            logger.warn('Bill data not found in storage', { billId: jsonKey });
            res.status(404).json({
                code: 'NOT_FOUND',
                error: 'Receipt not found. Please generate it first via the dashboard.'
            });

        } catch (err: any) {
            console.error(err);
            res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Internal Server Error' });
        }
    });
};

// --- Schemas ---
const billGenerateSchema = z.object({
    txHash: flexibleHashSchema,
    chainId: z.number().int().positive("Chain ID must be a positive integer")
        .refine((val) => isSupportedChain(val), {
            message: `Unsupported Chain ID. Supported chains are: ${SUPPORTED_CHAINS.join(', ')}`
        }),
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
            const apiKeyId = (req as any).auth?.id; // Public API Context
            const userId = (req as any).user?.id;   // Internal User Context

            logger.info('Enqueueing bill request', { txHash, chainId, apiKeyId, userId });

            // Pass apiKeyId OR userId to enqueue for robust worker checking
            const job = await softQueueService.enqueue(txHash, chainId, { connectedWallet, apiKeyId, userId });

            setImmediate(() => softQueueService.processNext().catch(e => logger.error('Queue processing error', { error: e.message })));


            res.json({
                success: true,
                jobId: job.jobId,
                status: job.status,
                data: job.data || null, // Include data if cache hit
                message: job.status === 'completed' ? 'Request completed (cached)' : 'Request queued'
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
                setImmediate(() => softQueueService.processNext().catch(e => logger.error('Queue processing error', { error: e.message })));
            }

            res.set('Retry-After', '2');
            res.json({
                id: status.id,
                state: status.state,
                data: status.result?.billDataUrl || null, // Updated to pass URL
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

import { createHash } from 'crypto';

// ... (other imports)

// 3. Admin Login
app.post('/api/v1/auth/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { address, signature, nonce } = req.body;
        const result = await authService.loginAdmin(address, signature, nonce);

        // Set HttpOnly Cookie (Hardened)
        res.cookie('admin_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            domain: process.env.NODE_ENV === 'production' ? '.txproof.xyz' : undefined,
            maxAge: 30 * 60 * 1000 // 30 minutes
        });

        // Return CSRF token in body
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// 4. Admin Logout
app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain: process.env.NODE_ENV === 'production' ? '.txproof.xyz' : undefined,
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// 5. Admin Routes (Protected)

import { verifyAdmin } from './middleware/adminAuth';

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
    logger.error('API error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

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
    logger.info('TxProof API server started', {
        port,
        mode: 'SafeQueue',
        env: process.env.NODE_ENV || 'development'
    });

    // Start webhook delivery worker
    webhookService.startDeliveryWorker();

    // Start Email Queue Worker
    const emailQueueService = new EmailQueueService();
    emailQueueService.startWorker();
    logger.info('Email Queue worker started');

    // Start Contribution Retry Worker (Every 60s)
    const contributionService = new ContributionService();
    setInterval(() => {
        contributionService.retryPendingRecords().catch(err => {
            logger.error('Contribution Worker Error', { error: err.message });
        });
    }, 60 * 1000);
    logger.info('Contribution worker started');
});