import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { PriceOracleService } from './PriceOracleService';
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '../abis/Common';

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

        // 4.0 Advanced Transaction Classification
        const { transactionClassifier } = require('./TransactionClassifier');
        const classification = await transactionClassifier.classify(receipt, tx, chainId);

        console.log(`Classification: ${classification.type} (${Math.round(classification.confidence * 100)}% confidence)`);
        if (classification.protocol) {
            console.log(`Protocol: ${classification.protocol}`);
        }

        // 4.1 Fetch Ad (Specific for PDF)
        const { AdminService } = require('./AdminService');
        const adminService = new AdminService();
        const randomAd = adminService.getRandomAd('pdf');

        // 4.2 Generate QR Code locally
        const QRCode = require('qrcode');
        const qrCodeDataUrl = await QRCode.toDataURL(this.getExplorerUrl(chainId, txHash));

        // 5. Prepare Data for Enterprise Template
        const billId = `BILL-${chainId}-${receipt.blockNumber}-${txHash.slice(0, 6)}`;
        const now = new Date();
        const txDate = new Date(timestamp * 1000);

        // Relative Time (Simple implementation)
        const diffMs = now.getTime() - txDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const relativeTime = diffHours < 24 ? `${diffHours} hours ago` : `${Math.floor(diffHours / 24)} days ago`;

        // Participant Avatars (Initials)
        const getAvatar = (addr: string, name: string | null) => {
            if (name) return name.slice(0, 2).toUpperCase();
            return addr.slice(2, 4).toUpperCase();
        };

        // Items Construction - Parse ALL transfers from logs
        const items = [];
        let totalIn = 0;
        let totalOut = 0;
        let tokensInCount = 0;
        let tokensOutCount = 0;

        const userAddress = tx.from.toLowerCase();
        const logs = receipt.logs || [];

        // 1. Parse ERC-20 Transfers
        const erc20TransferTopic = erc20Interface.getEvent('Transfer')?.topicHash;
        const erc20Logs = logs.filter(log => log.topics[0] === erc20TransferTopic && log.topics.length === 3);

        for (const log of erc20Logs) {
            try {
                const parsed = erc20Interface.parseLog(log);
                if (!parsed) continue;

                const from = parsed.args[0].toLowerCase();
                const to = parsed.args[1].toLowerCase();
                const amount = parsed.args[2];

                // Only show transfers involving the user
                if (from === userAddress || to === userAddress) {
                    const isIn = to === userAddress;
                    const amountFormatted = ethers.formatUnits(amount, 18); // Assuming 18 decimals

                    // Fetch token price at transaction block
                    const tokenPrice = await this.getTokenPriceAtBlock(log.address, chainId, receipt.blockNumber);
                    const usdValue = tokenPrice > 0 ? (parseFloat(amountFormatted) * tokenPrice).toFixed(2) : "0.00";

                    items.push({
                        direction: isIn ? 'in' : 'out',
                        isIn: isIn,
                        tokenIcon: isIn ? '📥' : '📤',
                        tokenSymbol: `Token`, // TODO: Fetch symbol from contract
                        tokenAddress: log.address,
                        fromShort: `${from.slice(0, 6)}...${from.slice(-4)}`,
                        toShort: `${to.slice(0, 6)}...${to.slice(-4)}`,
                        amountFormatted: parseFloat(amountFormatted).toFixed(6),
                        usdValue: `$${usdValue}`
                    });

                    // Update totals
                    if (isIn) {
                        tokensInCount++;
                        totalIn += parseFloat(usdValue);
                    } else {
                        tokensOutCount++;
                        totalOut += parseFloat(usdValue);
                    }
                }
            } catch (e) {
                console.log('Failed to parse ERC-20 transfer:', e);
            }
        }

        // 2. Parse ERC-721 (NFT) Transfers
        const erc721Logs = logs.filter(log => log.topics[0] === erc20TransferTopic && log.topics.length === 4);

        for (const log of erc721Logs) {
            try {
                const parsed = erc721Interface.parseLog(log);
                if (!parsed) continue;

                const from = parsed.args[0].toLowerCase();
                const to = parsed.args[1].toLowerCase();
                const tokenId = parsed.args[2].toString();

                if (from === userAddress || to === userAddress) {
                    const isIn = to === userAddress;
                    items.push({
                        direction: isIn ? 'in' : 'out',
                        isIn: isIn,
                        tokenIcon: '🖼️',
                        tokenSymbol: `NFT #${tokenId}`,
                        tokenAddress: log.address,
                        fromShort: `${from.slice(0, 6)}...${from.slice(-4)}`,
                        toShort: `${to.slice(0, 6)}...${to.slice(-4)}`,
                        amountFormatted: "1",
                        usdValue: "$0.00"
                    });
                    if (isIn) tokensInCount++; else tokensOutCount++;
                }
            } catch (e) {
                console.log('Failed to parse ERC-721 transfer:', e);
            }
        }

        // 2.5 Parse ERC-1155 Transfers (Common on L2s like Base)
        const erc1155Interface = new ethers.Interface(ERC1155_ABI);
        const singleTopic = erc1155Interface.getEvent('TransferSingle')?.topicHash;
        const batchTopic = erc1155Interface.getEvent('TransferBatch')?.topicHash;

        const erc1155Logs = logs.filter(log => log.topics[0] === singleTopic || log.topics[0] === batchTopic);

        for (const log of erc1155Logs) {
            try {
                const parsed = erc1155Interface.parseLog(log);
                if (!parsed) continue;

                const from = parsed.args[1].toLowerCase(); // args[1] is from
                const to = parsed.args[2].toLowerCase();   // args[2] is to

                if (from === userAddress || to === userAddress) {
                    const isIn = to === userAddress;

                    if (parsed.name === 'TransferSingle') {
                        const id = parsed.args[3].toString();
                        const value = parsed.args[4].toString();

                        items.push({
                            direction: isIn ? 'in' : 'out',
                            isIn: isIn,
                            tokenIcon: '📦',
                            tokenSymbol: `ID #${id}`,
                            tokenAddress: log.address,
                            fromShort: `${from.slice(0, 6)}...${from.slice(-4)}`,
                            toShort: `${to.slice(0, 6)}...${to.slice(-4)}`,
                            amountFormatted: value,
                            usdValue: "$0.00"
                        });
                        if (isIn) tokensInCount++; else tokensOutCount++;

                    } else if (parsed.name === 'TransferBatch') {
                        const ids = parsed.args[3];
                        const values = parsed.args[4];

                        for (let i = 0; i < ids.length; i++) {
                            items.push({
                                direction: isIn ? 'in' : 'out',
                                isIn: isIn,
                                tokenIcon: '📦',
                                tokenSymbol: `ID #${ids[i]}`,
                                tokenAddress: log.address,
                                fromShort: `${from.slice(0, 6)}...${from.slice(-4)}`,
                                toShort: `${to.slice(0, 6)}...${to.slice(-4)}`,
                                amountFormatted: values[i].toString(),
                                usdValue: "$0.00"
                            });
                            if (isIn) tokensInCount++; else tokensOutCount++;
                        }
                    }
                }
            } catch (e) {
                console.log('Failed to parse ERC-1155 transfer:', e);
            }
        }

        // 3. Add native ETH transfer if value > 0
        const nativeAmount = parseFloat(valueEth);
        if (nativeAmount > 0) {
            items.push({
                direction: 'out',
                isIn: false,
                tokenIcon: this.getNativeSymbol(chainId) === 'ETH' ? '💎' : '🪙',
                tokenSymbol: this.getNativeSymbol(chainId),
                fromShort: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
                toShort: `${tx.to?.slice(0, 6)}...${tx.to?.slice(-4)}`,
                amountFormatted: nativeAmount.toFixed(6),
                usdValue: `$${valueUSD}`
            });
            totalOut += valueUSDNum;
            tokensOutCount++;
        }

        console.log(`Detected ${items.length} token movements (${tokensInCount} in, ${tokensOutCount} out)`);


        // Net Change
        const netChange = totalIn - (totalOut + feeUSDNum);

        const billData = {
            // Identity
            BILL_ID: billId,
            BILL_VERSION: "2.0.0",
            GENERATED_AT: now.toLocaleString(),

            // Status
            STATUS: receipt.status === 1 ? "confirmed" : "failed",
            STATUS_CONFIRMED: receipt.status === 1,
            STATUS_PROVISIONAL: false, // Assume finalized for now

            // Network
            CHAIN_NAME: this.getChainName(chainId),
            CHAIN_ID: chainId,
            CHAIN_SYMBOL: this.getNativeSymbol(chainId),
            CHAIN_ICON: this.getNativeSymbol(chainId) === 'ETH' ? '🔷' : '⛓️',

            // Transaction
            TRANSACTION_HASH: txHash,
            BLOCK_NUMBER: receipt.blockNumber.toLocaleString(),
            BLOCK_HASH_SHORT: `${receipt.blockHash.slice(0, 10)}...`,
            TIMESTAMP: txDate.toLocaleString(),
            TIMESTAMP_RELATIVE: relativeTime,
            CONFIRMATIONS: await this.getConfirmations(provider, receipt.blockNumber),
            REQUIRED_CONFIRMATIONS: 12,
            TYPE: classification.type,
            TYPE_READABLE: transactionClassifier.getReadableType(classification.type),
            TYPE_ICON: transactionClassifier.getTypeIcon(classification.type),

            // Participants
            FROM_ADDRESS: tx.from,
            FROM_ENS: fromName,
            FROM_AVATAR: getAvatar(tx.from, fromName),
            TO_ADDRESS: tx.to || "Contract Creation",
            TO_ENS: toName,
            TO_AVATAR: getAvatar(tx.to || "0x00", toName),

            // Items
            ITEMS: items,
            ITEMS_COUNT: items.length,

            // Fees
            GAS_USED: gasUsed.toLocaleString(),
            GAS_PRICE: ethers.formatUnits(gasPrice, 'gwei'),
            GAS_PRICE_GWEI: ethers.formatUnits(gasPrice, 'gwei'),
            TOTAL_FEE: feeEth.substring(0, 8),
            TOTAL_FEE_USD: feeUSD,
            TOTAL_FEE_ETH: feeEth.substring(0, 8),

            // Totals
            TOTAL_IN_USD: totalIn.toFixed(2),
            TOTAL_OUT_USD: totalOut.toFixed(2),
            TOKENS_IN_COUNT: tokensInCount,
            TOKENS_OUT_COUNT: tokensOutCount,
            NET_CHANGE_USD: Math.abs(netChange).toFixed(2),
            NET_CHANGE_SIGN: netChange >= 0 ? "+" : "-",
            NET_CHANGE_POSITIVE: netChange >= 0,

            // Audit
            INCLUDE_AUDIT: true,
            PRICE_SOURCE: nativePriceData.source,
            PRICE_TIMESTAMP: new Date(timestamp * 1000).toISOString(),
            RPC_PROVIDER: "Alchemy / Public",
            RPC_ENDPOINT_SHORT: "rpc.node",
            CLASSIFICATION_METHOD: "Advanced Pattern Matching",
            CONFIDENCE: Math.round(classification.confidence * 100),
            CONFIDENCE_PERCENT: Math.round(classification.confidence * 100),
            PROTOCOL: classification.protocol || undefined,
            REORG_DETECTED: false,
            REORG_CHECK_TIME: now.toLocaleTimeString(),

            // Verification
            QR_CODE_DATA_URL: qrCodeDataUrl,
            EXPLORER_URL: this.getExplorerUrl(chainId, txHash),
            REGENERATE_URL: "https://blockbill.io", // Placeholder

            // Ad Support
            hasAd: !!randomAd,
            adContent: randomAd ? randomAd.contentHtml : "",
            adLink: randomAd ? randomAd.clickUrl : ""
        };

        // 6. Render PDF
        console.log('Rendering PDF with Enterprise Template...');
        const templatePath = path.join(process.cwd(), 'templates', 'final_templete.html');
        // Register Helpers if needed
        Handlebars.registerHelper('eq', function (a, b) { return a === b; });

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateHtml);
        const html = template(billData);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        // networkidle0 is too strict for some ads; networkidle2 allows 2 active connections
        await page.setContent(html, { waitUntil: 'networkidle2', timeout: 60000 });

        // Explicitly wait for Ad Image/Iframe if present
        if (billData.hasAd) {
            try {
                console.log('Waiting for Ad content to load...');
                // Wait for either image or iframe in the ad content container
                await page.waitForSelector('.ad-content img, .ad-content iframe', { visible: true, timeout: 15000 });

                // Extra safety: ensure images are fully loaded
                await page.evaluate(async () => {
                    const imgs = document.querySelectorAll('.ad-content img');
                    const promises = Array.from(imgs).map(img => {
                        const image = img as HTMLImageElement;
                        if (image && !image.complete) {
                            return new Promise((resolve) => {
                                image.onload = resolve;
                                image.onerror = resolve;
                            });
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(promises);
                });
            } catch (e) {
                console.log('Ad content wait timeout or not found, proceeding...');
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

    private async getConfirmations(provider: ethers.Provider, txBlockNumber: number): Promise<number> {
        try {
            const currentBlock = await provider.getBlockNumber();
            const confirmations = currentBlock - txBlockNumber;
            return confirmations > 0 ? confirmations : 1;
        } catch (e) {
            console.error('Failed to get confirmations:', e);
            return 12; // Fallback
        }
    }

    private async getTokenPriceAtBlock(tokenAddress: string, chainId: number, blockNumber: number): Promise<number> {
        const alchemyKey = process.env.ALCHEMY_API_KEY;
        if (!alchemyKey) {
            console.log('No Alchemy API key, skipping price fetch');
            return 0;
        }

        try {
            // Build Alchemy RPC URL
            let alchemyUrl = '';
            switch (chainId) {
                case 1: alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
                case 8453: alchemyUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
                case 137: alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
                case 42161: alchemyUrl = `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
                case 10: alchemyUrl = `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
                default:
                    console.log(`Alchemy not supported for chain ${chainId}`);
                    return 0;
            }

            // Use Alchemy's getTokenPrice method (enhanced feature)
            const response = await fetch(alchemyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenPrice',
                    params: [tokenAddress, `0x${blockNumber.toString(16)}`] // Block number in hex
                })
            });

            const data = await response.json();

            if (data.result && data.result.price) {
                return parseFloat(data.result.price);
            }

            // Fallback: Try current price if historical not available
            const currentResponse = await fetch(alchemyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenPrice',
                    params: [tokenAddress]
                })
            });

            const currentData = await currentResponse.json();
            if (currentData.result && currentData.result.price) {
                console.log(`Using current price for ${tokenAddress} (historical not available)`);
                return parseFloat(currentData.result.price);
            }

            return 0;
        } catch (e) {
            console.error('Failed to fetch token price from Alchemy:', e);
            return 0;
        }
    }
}
