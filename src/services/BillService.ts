import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { PriceOracleService } from './PriceOracleService';
import { ERC20_ABI, ERC721_ABI } from '../abis/Common';

interface BillRequest {
    txHash: string;
    chainId: number;
}

export class BillService {
    private oracle: PriceOracleService;
    // Simple in-memory mapping for providers
    private rpcs: { [key: number]: string } = {
        1: 'https://eth.llamarpc.com',
        8453: 'https://mainnet.base.org',
        137: 'https://polygon-rpc.com',
        11155111: 'https://rpc.sepolia.org',
        42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum One
        10: 'https://mainnet.optimism.io'     // Optimism
    };

    constructor() {
        this.oracle = new PriceOracleService();
    }

    private getRpcUrl(chainId: number): string {
        const alchemyKey = process.env.ALCHEMY_API_KEY;

        // If Alchemy Key exists, try to use it for supported chains
        if (alchemyKey) {
            switch (chainId) {
                case 1: return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
                case 8453: return `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
                case 137: return `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`;
                case 42161: return `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`;
                case 10: return `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`;
                case 11155111: return `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
            }
        }

        // Fallback to public RPCs
        return this.rpcs[chainId];
    }

    async generateBill(request: BillRequest): Promise<{ pdfPath: string, billData: any }> {
        const { txHash, chainId } = request;
        const rpcUrl = this.getRpcUrl(chainId);

        if (!rpcUrl) throw new Error(`Unsupported Chain ID: ${chainId}`);

        console.log(`Using RPC for Chain ${chainId}: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Use Alchemy for Mainnet (ENS) if available, else fallback
        const mainnetUrl = this.getRpcUrl(1);
        const mainnetProvider = new ethers.JsonRpcProvider(mainnetUrl);

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

        console.log("Resolving ENS names...");
        const [fromName, toName] = await Promise.all([
            this.resolveName(tx.from, mainnetProvider),
            tx.to ? this.resolveName(tx.to, mainnetProvider) : Promise.resolve(null)
        ]);
        console.log(`ENS Results - From: ${fromName}, To: ${toName}`);

        // 3. Resolve Prices & Fees
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

        // 4. Advanced Classification (Swap/NFT)
        const erc20Interface = new ethers.Interface(ERC20_ABI);
        const erc721Interface = new ethers.Interface(ERC721_ABI);

        let shouldShowSwap = false;
        let swapData: any = {};

        // Detect ERC20 Transfers
        const erc20Logs = receipt.logs.filter(log => log.topics[0] === erc20Interface.getEvent('Transfer')?.topicHash);

        // Heuristic: If we have > 1 generic transfer involving Sender and Router/Pools, probably a swap
        if (erc20Logs.length >= 1 && !isNativeSend) {
            // simplified Single-hop detection
            // Find transfer FROM user (Sent) and transfer TO user (Received)
            const sentLog = erc20Logs.find(l => {
                try { return erc20Interface.parseLog(l)?.args[0].toLowerCase() === tx.from.toLowerCase(); } catch { return false; }
            });
            const receivedLog = erc20Logs.find(l => {
                try { return erc20Interface.parseLog(l)?.args[1].toLowerCase() === tx.from.toLowerCase(); } catch { return false; }
            });

            if (sentLog || receivedLog) {
                shouldShowSwap = true;

                // Resolving Tokens (Simplified - In Prod use a TokenList)
                if (sentLog) {
                    const parsed = erc20Interface.parseLog(sentLog);
                    swapData.sentTokenSymbol = "TOKEN"; // Would typically fetch `symbol()`
                    swapData.sentAmount = ethers.formatEther(parsed!.args[2]); // Assuming 18 decimals fallback
                    swapData.sentValueUSD = "?.??"; // Would need Oracle for this token
                    swapData.sentTokenName = sentLog.address;
                }
                if (receivedLog) {
                    const parsed = erc20Interface.parseLog(receivedLog);
                    swapData.receivedTokenSymbol = "TOKEN";
                    swapData.receivedAmount = ethers.formatEther(parsed!.args[2]);
                    swapData.receivedValueUSD = "?.??";
                    swapData.receivedTokenName = receivedLog.address;
                }
            }
        }

        const type = isNativeSend ? 'NATIVE SEND' : (shouldShowSwap ? 'SWAP' : 'CONTRACT INTERACTION');

        // 4.1 Fetch Ad (Specific for PDF)
        const { AdminService } = require('./AdminService');
        const adminService = new AdminService();
        const randomAd = adminService.getRandomAd('pdf');

        // 4.2 Generate QR Code locally
        const QRCode = require('qrcode');
        const qrCodeDataUrl = await QRCode.toDataURL(this.getExplorerUrl(chainId, txHash));

        // 4.3 NFT Detection (ERC721)
        let isNFT = false;
        let nftData: any = {};

        // Filter for ERC721 Transfer events (same topic as ERC20, but we check logic)
        // Topic 0: Transfer(address,address,uint256) -> 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
        // ERC721: 3 indexed args (topic 1=from, topic 2=to, topic 3=tokenId)
        // ERC20: 2 indexed args (topic 1=from, topic 2=to) + data=amount

        const transferTopic = erc721Interface.getEvent('Transfer')?.topicHash;
        const potentialNftLogs = receipt.logs.filter(log => log.topics[0] === transferTopic);

        for (const log of potentialNftLogs) {
            // ERC721 has 4 topics (Signature + From + To + TokenId)
            // ERC20 has 3 topics (Signature + From + To)
            if (log.topics.length === 4) {
                try {
                    const parsed = erc721Interface.parseLog(log);
                    if (parsed) {
                        // Check if user is sender or receiver
                        const logFrom = parsed.args[0].toLowerCase();
                        const logTo = parsed.args[1].toLowerCase();
                        const user = tx.from.toLowerCase();

                        if (logFrom === user || logTo === user) {
                            isNFT = true;
                            nftData = {
                                nftTokenId: parsed.args[2].toString(),
                                nftContract: log.address,
                                nftType: 'ERC721'
                            };
                            // Prioritize NFT over generic contract interaction
                            if (!shouldShowSwap) {
                                // Update type if it's just an NFT Move
                                // type = 'NFT TRANSFER'; // We can't reassign const 'type' here, handle in billData construction
                            }
                            break; // Assume primary action for now
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }

        // 5. Prepare Data for Template
        const billData = {
            billId: `BILL-${chainId.toString().slice(-4)}-${receipt.blockNumber}`,
            txHash: txHash,
            chainName: this.getChainName(chainId),
            status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
            date: new Date(timestamp * 1000).toUTCString(),
            type: isNFT ? 'NFT TRANSFER' : type,
            feeUSD: feeUSD,
            totalValueUSD: valueUSD, // Show value sent even for interactions
            from: fromName || tx.from,
            to: toName || tx.to,

            // Explicit Details for Template
            fromEns: fromName,
            fromAddress: tx.from,
            toEns: toName,
            toAddress: tx.to,

            // Context Specific
            gasUsed: feeEth.substring(0, 8), // Show actual ETH cost
            nativeSymbol: this.getNativeSymbol(chainId),
            totalCostUSD: (feeUSDNum + valueUSDNum).toFixed(2),

            // Meta
            priceSource: nativePriceData.source,
            blockNumber: receipt.blockNumber,
            confirmations: 1,
            generatedAt: new Date().toISOString(),
            qrCodeUrl: qrCodeDataUrl, // Use local Data URI

            // Flags (Decoder stubs for now)
            isSwap: shouldShowSwap,
            ...swapData,

            isNFT: isNFT,
            ...nftData,

            hasAd: !!randomAd,
            adContent: randomAd ? randomAd.contentHtml : "",
            adLink: randomAd ? randomAd.clickUrl : "#"
        };

        // 6. Render PDF
        console.log('Rendering PDF...');
        const templatePath = path.join(process.cwd(), 'templates', 'advanced_bill_template.html');
        // Register Helpers if needed
        Handlebars.registerHelper('eq', function (a, b) { return a === b; });

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateHtml);
        const html = template(billData);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        // networkidle0 is too strict for some ads; networkidle2 allows 2 active connections
        await page.setContent(html, { waitUntil: 'networkidle2', timeout: 60000 });

        // Explicitly wait for Ad Image if present
        if (billData.hasAd) {
            try {
                console.log('Waiting for Ad Image to load...');
                await page.waitForSelector('.ad-space img', { visible: true, timeout: 15000 });
                // Extra safety: ensure the image is fully loaded
                await page.evaluate(async () => {
                    const img = document.querySelector('.ad-space img') as HTMLImageElement;
                    if (img && !img.complete) {
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    }
                });
            } catch (e) {
                console.log('Ad image wait timeout or not found, proceeding...');
            }
        }

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
            case 42161: return 'Arbitrum One';
            case 10: return 'Optimism';
            case 56: return 'BNB Smart Chain';
            case 43114: return 'Avalanche C-Chain';
            case 11155111: return 'Sepolia';
            default: return 'Unknown Chain';
        }
    }

    private getNativeSymbol(chainId: number): string {
        if (chainId === 137) return 'MATIC';
        if (chainId === 56) return 'BNB';
        if (chainId === 43114) return 'AVAX';
        return 'ETH';
    }

    private getExplorerUrl(chainId: number, txHash: string): string {
        let baseUrl = 'https://etherscan.io';
        switch (chainId) {
            case 1: baseUrl = 'https://etherscan.io'; break;
            case 8453: baseUrl = 'https://basescan.org'; break;
            case 137: baseUrl = 'https://polygonscan.com'; break;
            case 42161: baseUrl = 'https://arbiscan.io'; break;
            case 10: baseUrl = 'https://optimistic.etherscan.io'; break;
            case 56: baseUrl = 'https://bscscan.com'; break;
            case 43114: baseUrl = 'https://snowtrace.io'; break;
            case 11155111: baseUrl = 'https://sepolia.etherscan.io'; break;
        }
        return `${baseUrl}/tx/${txHash}`;
    }
}
