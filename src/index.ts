import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PriceOracleService } from './services/PriceOracleService';
import { AuthService } from './services/AuthService';
import { BillService } from './services/BillService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Services
const priceOracle = new PriceOracleService();
const authService = new AuthService();

// Routes

// 1. Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Resolve Bill (Real Implementation)
app.post('/api/v1/bills/resolve', async (req, res) => {
    try {
        const { txHash, chainId } = req.body;
        if (!txHash || !chainId) {
            res.status(400).json({ error: 'Missing txHash or chainId' });
            return;
        }

        console.log(`Received request: ${txHash}`);

        // For MVP: Synchronous processing (In prod -> BullMQ)
        const billService = new BillService();
        const result = await billService.generateBill({ txHash, chainId: Number(chainId) });

        res.json({
            success: true,
            data: result.billData,
            pdfUrl: result.pdfPath
        });

    } catch (error) {
        console.error('Bill Generation Error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// 3. Admin Login
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { address, signature, nonce } = req.body;
        const result = await authService.loginAdmin(address, signature, nonce);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: (error as Error).message });
    }
});

// 4. Get Price (Debug Route)
app.get('/api/v1/oracle/price', async (req, res) => {
    try {
        const { chainId, token, timestamp } = req.query;
        // @ts-ignore
        const price = await priceOracle.getPrice(Number(chainId), String(token), Number(timestamp));
        res.json(price);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.listen(port, () => {
    console.log(`⚡ GChain Receipt API running on port ${port}`);
});
