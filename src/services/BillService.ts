import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { PriceOracleService } from './PriceOracleService';

interface BillRequest {
    txHash: string;
    chainId: number;
}

export class BillService {
    private oracle: PriceOracleService;
    // Simple in-memory mapping for providers
    private rpcs: { [key: number]: string } = {
        1: 'https://rpc.ankr.com/eth',
        8453: 'https://mainnet.base.org',
        137: 'https://polygon-rpc.com',
        11155111: 'https://rpc.sepolia.org'
    };

    constructor() {
        this.oracle = new PriceOracleService();
    }

    async generateBill(request: BillRequest): Promise<{ pdfPath: string, billData: any }> {
        const { txHash, chainId } = request;
        const rpcUrl = this.rpcs[chainId];

        if (!rpcUrl) throw new Error(`Unsupported Chain ID: ${chainId}`);

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        // Using Mainnet for ENS resolution regardless of chain (common pattern)
        const mainnetProvider = new ethers.JsonRpcProvider(this.rpcs[1]);

        // 1. Fetch Transaction Data
        console.log(`Fetching Tx: ${txHash} on Chain ${chainId}`);
        const [tx, receipt] = await Promise.all([
            provider.getTransaction(txHash),
            provider.getTransactionReceipt(txHash)
        ]);

        if (!tx || !receipt) throw new Error('Transaction not found');

        const block = await provider.getBlock(receipt.blockNumber);
        if (!block) throw new Error('Block not found');

        // 2. Classify Transaction & Resolve Names
        const isNativeSend = tx.data === '0x' && tx.value > 0n;
        const type = isNativeSend ? 'NATIVE SEND' : 'CONTRACT INTERACTION';

        const [fromName, toName] = await Promise.all([
            this.resolveName(tx.from, mainnetProvider),
            tx.to ? this.resolveName(tx.to, mainnetProvider) : Promise.resolve(null)
        ]);

        // 3. Resolve Prices
        const timestamp = block.timestamp;
        const nativePriceData = await this.oracle.getPrice(chainId, 'native', timestamp);

        // Calculate Fees
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || 0n;
        const feeWei = gasUsed * gasPrice;
        const feeEth = ethers.formatEther(feeWei);
        const feeUSDNum = parseFloat(feeEth) * nativePriceData.price;
        // Show < $0.01 for tiny fees instead of $0.00
        const feeUSD = feeUSDNum < 0.01 && feeUSDNum > 0 ? '< $0.01' : feeUSDNum.toFixed(2);

        // Native Value (Amount Sent)
        const valueEth = ethers.formatEther(tx.value);
        const valueUSDNum = parseFloat(valueEth) * nativePriceData.price;
        const valueUSD = valueUSDNum < 0.01 && valueUSDNum > 0 ? '< $0.01' : valueUSDNum.toFixed(2);

        // 4. Prepare Data for Template
        const billData = {
            billId: `BILL-${chainId.toString().slice(-4)}-${receipt.blockNumber}`,
            txHash: txHash,
            chainName: this.getChainName(chainId),
            status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
            date: new Date(timestamp * 1000).toUTCString(),
            type: type,
            feeUSD: feeUSD,
            totalValueUSD: valueUSD, // Show value sent even for interactions
            from: fromName || tx.from,
            to: toName || tx.to,

            // Context Specific
            gasUsed: feeEth.substring(0, 8), // Show actual ETH cost
            nativeSymbol: this.getNativeSymbol(chainId),
            totalCostUSD: (feeUSDNum + valueUSDNum).toFixed(2),

            // Meta
            priceSource: nativePriceData.source,
            blockNumber: receipt.blockNumber,
            confirmations: 1,
            generatedAt: new Date().toISOString(),
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${txHash}`,

            // Flags (Decoder stubs for now)
            isSwap: false,
            isNFT: false,
            hasAd: true,
            adContent: "<div style='color:#666; font-size:12px'>Verified by GChain Receipt</div>"
        };

        // 5. Render PDF
        console.log('Rendering PDF...');
        const templatePath = path.join(process.cwd(), 'templates', 'advanced_bill_template.html');
        // Register Helpers if needed
        Handlebars.registerHelper('eq', function (a, b) { return a === b; });

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateHtml);
        const html = template(billData);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const outputDir = path.join(process.cwd(), 'client', 'public', 'bills');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `${txHash}.pdf`;
        const pdfPath = path.join(outputDir, fileName);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        return {
            pdfPath: `/bills/${fileName}`, // Relative path for frontend
            billData
        };
    }

    private async resolveName(address: string, mainnetProvider: ethers.JsonRpcProvider): Promise<string | null> {
        try {
            // 1. Try Mainnet ENS
            const ensName = await mainnetProvider.lookupAddress(address);
            if (ensName) return ensName;

            // 2. Basenames (L2) - Placeholder for future implementation
            // Currently relies on address
            return null;
        } catch (e) {
            return null;
        }
    }

    private getChainName(chainId: number): string {
        switch (chainId) {
            case 1: return 'Ethereum Mainnet';
            case 8453: return 'Base Mainnet';
            case 137: return 'Polygon';
            case 11155111: return 'Sepolia';
            default: return 'Unknown Chain';
        }
    }

    private getNativeSymbol(chainId: number): string {
        if (chainId === 137) return 'MATIC';
        return 'ETH';
    }
}
