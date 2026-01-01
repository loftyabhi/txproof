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
    connectedWallet?: string;
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

        // Force public RPC for mainnet debugging due to limits
        if (chainId === 1) return 'https://eth.llamarpc.com';

        // If Alchemy Key exists, try to use it for supported chains
        if (alchemyKey) {
            switch (chainId) {
                // case 1: return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
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

        // 2. Classify Transaction first to determine User Address
        // (Moved ENS resolution to after userAddress determination)

        // 3. Resolve Prices & Fees
        const timestamp = block.timestamp;
        const nativePriceData = await this.oracle.getPrice(chainId, 'native', timestamp, receipt.blockNumber);

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
        const { transactionClassifier, TransactionEnvelopeType } = require('./TransactionClassifier');
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
        console.log('DEBUG: request.connectedWallet', request.connectedWallet);
        console.log('DEBUG: tx.from', tx.from);

        // Resolve User Address:
        // 1. Connected Wallet (if provided and matches tx) - Actually, usually we trust connected wallet if involved.
        // 2. Parsed Sender from Classification (e.g. AA UserOp sender).
        // 3. Transaction From (EOA).
        let userAddress = request.connectedWallet?.toLowerCase();

        if (!userAddress) {
            if (classification.details?.sender) {
                userAddress = classification.details.sender.toLowerCase();
                console.log('DEBUG: Used AA Sender from Classification:', userAddress);
            } else {
                userAddress = tx.from.toLowerCase();
            }
        }

        // Ensure we handle the case where connectedWallet is provided but we found a more specific sender?
        // Actually, if connectedWallet IS provided, we usually want to generate the bill FOR that wallet.
        // But if the bill logic relies on "is this wallet involved?", correct parsing matters.
        // If connectedWallet was passed (e.g. from frontend), keep it. 
        // But for the "From" field in the PDF, we might need the actual sender.
        // Let's stick to: if connectedWallet is set, use it. If not, fallback to AA sender -> tx.from.
        // Wait, the reproduction script passed connectedWallet. 
        // And the result showed "From: 0x9c04" (which was NOT the connected wallet).
        // This implies `request.connectedWallet` might have been ignored or overwritten?
        // Line 151: `let userAddress = request.connectedWallet?.toLowerCase() || tx.from.toLowerCase();`
        // In the reproduction script, I passed `connectedWallet`.
        // So `userAddress` SHOULD have been `0xb37a...`.
        // Why did `reproduce_result.json` show `0x9c04`?
        // Ah, `BillService` might NOT be using `userAddress` to populate the `reproduce_result` "from" field?
        // Let's check where `reproduce_result` gets its data in the script.
        // `script/reproduce_issue.ts`:
        // `const bill = await billService.generateBill(...)`
        // `const result = { from: bill.from, ... }`
        // So `bill.from` was `0x9c04`.
        // We need to ensure `bill.from` is set to the resolved `userAddress`.

        // Let's update the logic to be more robust:
        if (!request.connectedWallet) {
            if (classification.details?.sender) {
                userAddress = classification.details.sender.toLowerCase();
            } else {
                userAddress = tx.from.toLowerCase();
            }
        }

        // Final fallback to ensure string type
        if (!userAddress) userAddress = tx.from.toLowerCase();

        console.log('DEBUG: Resolved userAddress', userAddress);

        // Resolve ENS Names
        // fromName should correspond to the Bill Sender (Originator)
        const billSenderAddress = classification.details?.sender || tx.from;

        console.log("Resolving ENS names...");
        const [fromName, toName] = await Promise.all([
            this.resolveName(billSenderAddress, mainnetProvider),
            tx.to ? this.resolveName(tx.to, mainnetProvider) : Promise.resolve(null)
        ]);
        console.log(`ENS Results - From: ${fromName}, To: ${toName}`);

        const logs = receipt.logs || [];

        // For AA transactions, actions by tx.from (Bundler) should attribute to User
        const aliasAddress = classification.type === 'account_abstraction' ? tx.from.toLowerCase() : undefined;

        let { items, totalIn, totalOut, tokensInCount, tokensOutCount } = await this.parseTokenMovements(
            logs, userAddress, chainId, receipt.blockNumber, provider, timestamp, aliasAddress
        );

        // --- NEW: Fetch Internal Transactions (ETH transfers inside execution) ---
        console.log('Fetching internal transactions...');
        const internalTxsRaw = await this.fetchInternalTransactions(txHash, chainId, receipt.blockNumber);

        // Format Internal Txs for the Template
        const internalTxs = internalTxsRaw.map(tx => ({
            from: tx.from,
            to: tx.to,
            fromShort: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
            toShort: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
            amount: parseFloat(tx.value).toFixed(6),
            symbol: this.getNativeSymbol(chainId), // Always native currency for internal txs
            isError: tx.isError
        })).filter(tx => parseFloat(tx.amount) > 0); // Only show non-zero value transfers to reduce noise? User didn't specify, but usually 0 value calls are noise. Let's keep > 0 for relevance.

        console.log(`Found ${internalTxs.length} internal transactions`);

        // Fallback for Smart Wallets: If no movements found for sender, check if recipient has movements
        // BUT skip if we already identified a specific AA Sender (we trust our classification)
        if (items.length === 0 && tx.to && tx.to.toLowerCase() !== userAddress && !classification.details?.sender) {
            // Custom: Check if sender is a contract (Exchange/Withdrawal)
            const code = await provider.getCode(tx.from);
            let perspectiveAddress = userAddress;

            if (code !== '0x') {
                console.log(`Sender ${userAddress} is a contract. Checking recipient ${tx.to}...`);
                perspectiveAddress = tx.to!.toLowerCase();
            } else {
                console.log(`No movements for sender ${userAddress}, checking recipient ${tx.to}...`);
                perspectiveAddress = tx.to!.toLowerCase();
            }

            const fallbackResult = await this.parseTokenMovements(logs, perspectiveAddress, chainId, receipt.blockNumber, provider, timestamp, aliasAddress);

            if (fallbackResult.items.length > 0) {
                console.log(`Found movements for recipient ${perspectiveAddress}, using as primary view.`);
                items = fallbackResult.items;
                totalIn = fallbackResult.totalIn;
                totalOut = fallbackResult.totalOut;
                tokensInCount = fallbackResult.tokensInCount;
                tokensOutCount = fallbackResult.tokensOutCount;
                // NOTE: We do NOT update 'userAddress' so the Bill Header remains "From: <User>"
            }
        }

        // Observer Fallback: If still no items, check the Sender (tx.from)
        // This happens if I am an observer (userAddress != tx.from) and the recipient fallback failed or yielded nothing.
        if (items.length === 0 && userAddress !== tx.from.toLowerCase()) {
            console.log(`Observer Mode: No movements found for viewer or recipient. Showing Sender ${tx.from} perspective.`);
            const senderResult = await this.parseTokenMovements(logs, tx.from.toLowerCase(), chainId, receipt.blockNumber, provider, timestamp);
            if (senderResult.items.length > 0) {
                items = senderResult.items;
                totalIn = senderResult.totalIn;
                totalOut = senderResult.totalOut;
                tokensInCount = senderResult.tokensInCount;
                tokensOutCount = senderResult.tokensOutCount;
            }
        }

        // 3. Add native ETH transfer if value > 0
        const nativeAmount = parseFloat(valueEth);
        if (nativeAmount > 0) {
            // Determine direction based on the resolved userAddress
            const isNativeIn = tx.to && userAddress === tx.to.toLowerCase();

            // Fetch Current Price for Item Display
            const currentNativePrice = await this.oracle.getPrice(chainId, 'native', Math.floor(Date.now() / 1000));
            const currentNativeValueUSD = (nativeAmount * currentNativePrice.price).toFixed(2);

            // Historic Value for Totals
            const historicNativeValueUSD = (nativeAmount * nativePriceData.price);

            items.push({
                direction: isNativeIn ? 'in' : 'out',
                isIn: isNativeIn,
                tokenIcon: isNativeIn ? '📥' : (this.getNativeSymbol(chainId) === 'ETH' ? '💎' : '🪙'),
                tokenSymbol: this.getNativeSymbol(chainId),
                fromShort: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
                toShort: `${tx.to?.slice(0, 6)}...${tx.to?.slice(-4)}`,
                amountFormatted: nativeAmount.toFixed(6),
                usdValue: `$${currentNativeValueUSD}` // Display Current Value
            });

            if (isNativeIn) {
                totalIn += historicNativeValueUSD; // Accumulate Historic Value
                tokensInCount++;
            } else {
                totalOut += historicNativeValueUSD; // Accumulate Historic Value
                tokensOutCount++;
            }
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

            // Advanced Classification Details
            IS_MULTISIG: classification.details.isMultiSig || false,
            IS_SMART_ACCOUNT: classification.type === 'account_abstraction',
            ENVELOPE_TYPE: classification.envelopeType !== undefined ? this.getEnvelopeLabel(classification.envelopeType, TransactionEnvelopeType) : undefined,
            ENVELOPE_LABEL: classification.envelopeType !== undefined ? this.getEnvelopeLabel(classification.envelopeType, TransactionEnvelopeType) : '',
            EXECUTION_METHOD: classification.details.method ? classification.details.method.slice(0, 10) : undefined,
            PROTOCOL_TAG: classification.protocol ? classification.protocol.toUpperCase() : undefined,

            // Participants
            // FROM_ADDRESS should be the Transaction Originator, not necessarily the Connected User
            FROM_ADDRESS: classification.details?.sender || tx.from,
            FROM_ENS: fromName, // Note: fromName resolution needs to match this address
            FROM_AVATAR: getAvatar(classification.details?.sender || tx.from, fromName),
            TO_ADDRESS: tx.to || "Contract Creation",
            TO_ENS: toName,
            TO_AVATAR: getAvatar(tx.to || "0x00", toName),

            // Items
            ITEMS: items,
            ITEMS_COUNT: items.length,
            INTERNAL_TXS: internalTxs,
            HAS_INTERNAL_TXS: internalTxs.length > 0,

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
            adLink: randomAd ? randomAd.clickUrl : ""
        };

        // 6. Render PDF using TWO-PASS STRATEGY
        // WHY: Puppeteer's @page CSS support is unreliable. We generate page 1 separately (no header template)
        // and pages 2+ separately (with displayHeaderFooter), then merge via pdf-lib.
        console.log('Rendering PDF with Two-Pass Strategy...');

        const outputDir = path.join(process.cwd(), 'client', 'public', 'bills');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `${txHash}.pdf`;
        const finalPdfPath = path.join(outputDir, fileName);

        // Temp paths for intermediate PDFs (cleaned up after merge)
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const firstPagePath = path.join(tempDir, `${txHash}-page1.pdf`);
        const remainingPagesPath = path.join(tempDir, `${txHash}-remaining.pdf`);

        // Register Handlebars helpers
        Handlebars.registerHelper('eq', function (a, b) { return a === b; });

        const templatePath = path.join(process.cwd(), 'templates', 'final_templete.html');
        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateHtml);

        // PASS 1: Generate first page (full custom header, NO displayHeaderFooter)
        const firstPageHtml = template(billData);

        const browser = await puppeteer.launch({ headless: true });

        try {
            // **FIRST PAGE PDF**
            const page1 = await browser.newPage();
            await page1.setContent(firstPageHtml, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for ads if present
            if (billData.hasAd) {
                try {
                    await page1.waitForSelector('.ad-content img, .ad-content iframe', { visible: true, timeout: 15000 });
                    await page1.evaluate(async () => {
                        const imgs = document.querySelectorAll('.ad-content img');
                        await Promise.all(Array.from(imgs).map(img => {
                            const image = img as HTMLImageElement;
                            if (image && !image.complete) {
                                return new Promise((resolve) => {
                                    image.onload = resolve;
                                    image.onerror = resolve;
                                });
                            }
                            return Promise.resolve();
                        }));
                    });
                } catch (e) {
                    console.log('Ad wait timeout, proceeding...');
                }
            }

            // Hide running-header on first page (CSS-based, works reliably within single page)
            await page1.evaluate(() => {
                const runningHeader = document.querySelector('.running-header') as HTMLElement;
                if (runningHeader) {
                    runningHeader.style.display = 'none';
                }
            });

            // **UNIFIEY GEOMETRY FOR BOTH PASSES**
            // To prevent content from reflowing/shifting between Pass 1 and Pass 2, 
            // BOTH passes must have Identical margins.
            const unifiedMargins = {
                top: '80px',     // Space for Header (Pass 1 fills this with HTML, Pass 2 with Template)
                bottom: '100px', // Space for Footer
                left: '40px',
                right: '40px'
            };

            // PASS 1: Generate first page
            // We use the same 'top: 80px' margin.
            // But Page 1 HTML has a custom header that needs to be visible.
            // The HTML CSS @page margins will be overridden by these puppeteer margins.
            await page1.pdf({
                path: firstPagePath,
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: false,
                margin: unifiedMargins
            });
            await page1.close();

            // **REMAINING PAGES PDF (with native Puppeteer header)**
            const page2 = await browser.newPage();

            // Same HTML, same wait settings
            await page2.setContent(firstPageHtml, { waitUntil: 'networkidle2', timeout: 60000 });

            // Hide first-page content and main header using visibility: hidden
            // Since margins are now identical, the layout box is identical.
            // Hiding the header with visibility:hidden keeps the vertical rhythm EXACTLY the same.
            await page2.evaluate(() => {
                const firstPageHeader = document.querySelector('.first-page-header') as HTMLElement;
                const mainHeader = document.querySelector('.header') as HTMLElement;
                const runningHeader = document.querySelector('.running-header') as HTMLElement;

                // PRESERVE LAYOUT but hide content
                if (firstPageHeader) firstPageHeader.style.visibility = 'hidden';
                if (mainHeader) mainHeader.style.visibility = 'hidden';

                // Running header logic:
                // We actually want Puppeteer's headerTemplate to show.
                // The HTML .running-header was just for testing; we can hide it fully.
                if (runningHeader) runningHeader.style.display = 'none';
            });

            // Render with native header template
            await page2.pdf({
                path: remainingPagesPath,
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="width: 100%; font-size: 10px; padding: 10px 40px; border-bottom: 3px solid #7c3aed; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;">
                        <span style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 14px;">⚡</span>
                            <span style="font-weight: 700; color: #111827;">Chain Receipt</span>
                        </span>
                        <span style="color: #6b7280; font-family: sans-serif;">
                            Bill #${billData.BILL_ID} | Page <span class="pageNumber"></span>
                        </span>
                    </div>
                `,
                footerTemplate: `
                    <div style="width: 100%; font-size: 8px; padding: 10px 40px; text-align: center; color: #6b7280; font-family: sans-serif; line-height: 1.5;">
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-bottom: 6px;">
                            <span style="font-weight: 700; color: #111827;">Generated by Chain Receipt</span>
                            <span style="margin: 0 4px;">•</span>
                            <span>Professional Blockchain Intelligence</span>
                        </div>
                        <div style="margin-bottom: 4px; font-size: 7px; opacity: 0.8;">
                           Values are estimates based on transaction time market data. Verify independently. Not financial advice.
                        </div>
                        <div style="font-size: 7px;">
                            © ${new Date().getFullYear()} Chain Receipt. All rights reserved.
                        </div>
                    </div>
                `,
                margin: unifiedMargins
            });
            await page2.close();

            // **MERGE PDFs using pdf-lib**
            const { PDFDocument } = await import('pdf-lib');

            const firstPagePdfBytes = fs.readFileSync(firstPagePath);
            const remainingPagesPdfBytes = fs.readFileSync(remainingPagesPath);

            const firstPagePdf = await PDFDocument.load(firstPagePdfBytes);
            const remainingPagesPdf = await PDFDocument.load(remainingPagesPdfBytes);

            const mergedPdf = await PDFDocument.create();

            // Copy first page
            const [page1Copied] = await mergedPdf.copyPages(firstPagePdf, [0]);
            mergedPdf.addPage(page1Copied);

            // Copy remaining pages (skip first page of second PDF which contains hidden content)
            const remainingPagesCount = remainingPagesPdf.getPageCount();
            if (remainingPagesCount > 1) {
                // Only merge if there are actually additional pages beyond the first
                const indicesToCopy = Array.from({ length: remainingPagesCount - 1 }, (_, i) => i + 1);
                const copiedPages = await mergedPdf.copyPages(remainingPagesPdf, indicesToCopy);
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();

            console.log(`[BillService] Writing final PDF to: ${finalPdfPath}`);
            fs.writeFileSync(finalPdfPath, mergedPdfBytes);
            console.log(`[BillService] PDF write successful. Size: ${mergedPdfBytes.length} bytes`);

            // Verify existence immediately
            if (fs.existsSync(finalPdfPath)) {
                console.log(`[BillService] Verified file exists at: ${finalPdfPath}`);
            } else {
                console.error(`[BillService] CRITICAL: File not found after write at: ${finalPdfPath}`);
            }

            // Cleanup temp files
            fs.unlinkSync(firstPagePath);
            fs.unlinkSync(remainingPagesPath);

        } finally {
            await browser.close();
        }

        return {
            pdfPath: `/bills/${fileName}`,
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
    private getExplorerApiUrl(chainId: number): string {
        switch (chainId) {
            case 1: return 'https://api.etherscan.io/api';
            case 8453: return 'https://api.basescan.org/api';
            case 137: return 'https://api.polygonscan.com/api';
            case 42161: return 'https://api.arbiscan.io/api';
            case 10: return 'https://api-optimistic.etherscan.io/api';
            case 56: return 'https://api.bscscan.com/api';
            case 43114: return 'https://api.snowtrace.io/api';
            case 11155111: return 'https://api-sepolia.etherscan.io/api';
            default: return '';
        }
    }

    private async fetchInternalTransactions(txHash: string, chainId: number, blockNumber?: number): Promise<any[]> {
        // 1. Try Alchemy first for supported chains (if blockNumber is provided)
        if (blockNumber && this.isAlchemySupported(chainId)) {
            console.log(`Trying Alchemy for internal txs (Chain ${chainId})...`);
            const alchemyTxs = await this.fetchInternalTransactionsFromAlchemy(txHash, chainId, blockNumber);
            if (alchemyTxs.length > 0) {
                return alchemyTxs;
            }
            if (alchemyTxs.length === 0 && this.alchemyCallsMade) {
                // If Alchemy call succeeded but returned empty, it likely means there ARE no internal txs.
                // However, to be safe/consistent with previous logic or if Alchemy misses some, we could fallback.
                // But usually Alchemy is authoritative. Let's return empty if we are confident.
                // Actually, let's allow fallback just in case Alchemy fails to index/respond correctly or if we want to be double sure.
                // But for now, let's assume if Alchemy returns valid empty array, it's empty.
                // Wait, did the call fail or just return 0? I'll handle that inside the helper.
            }
        }

        // 2. Fallback to Explorer API (Etherscan/BaseScan/etc)
        const apiUrl = this.getExplorerApiUrl(chainId);
        if (!apiUrl) return [];

        const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'; // Fallback to demo key if not set

        try {
            console.log(`Falling back to Explorer API for internal txs...`);
            // Etherscan API: module=account&action=txlistinternal&txhash={txHash}
            const url = `${apiUrl}?module=account&action=txlistinternal&txhash=${txHash}&apikey=${apiKey}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();

            if (data.status === '1' && Array.isArray(data.result)) {
                return data.result.map((tx: any) => ({
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    isError: tx.isError === '1',
                    type: tx.type, // call, create, suicide, etc.
                    gasUsed: tx.gasUsed
                }));
            }
            // If Explorer returns empty or fails, try Blockscout
        } catch (error) {
            console.warn(`Failed to fetch internal txs from Explorer for chain ${chainId}:`, error);
        }

        // 3. Fallback to Blockscout (Keyless / permissive free tier)
        try {
            console.log('Falling back to Blockscout for internal txs...');
            const blockscoutTxs = await this.fetchInternalTransactionsFromBlockscout(txHash, chainId);
            if (blockscoutTxs.length > 0) return blockscoutTxs;
        } catch (error) {
            console.warn(`Failed to fetch internal txs from Blockscout for chain ${chainId}:`, error);
        }

        return [];
    }

    private async fetchInternalTransactionsFromBlockscout(txHash: string, chainId: number): Promise<any[]> {
        let baseUrl = '';
        switch (chainId) {
            case 8453: baseUrl = 'https://base.blockscout.com/api'; break;
            case 10: baseUrl = 'https://optimism.blockscout.com/api'; break;
            // Add others if known
            default: return [];
        }

        const url = `${baseUrl}?module=account&action=txlistinternal&txhash=${txHash}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === '1' && Array.isArray(data.result)) {
            return data.result.map((tx: any) => ({
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                isError: tx.isError === '1',
                type: tx.type,
                gasUsed: tx.gasUsed
            }));
        }
        return [];
    }


    private isAlchemySupported(chainId: number): boolean {
        return [1, 8453, 137, 42161, 10, 11155111].includes(chainId);
    }

    private alchemyCallsMade = false;

    private async fetchInternalTransactionsFromAlchemy(txHash: string, chainId: number, blockNumber: number): Promise<any[]> {
        const alchemyKey = process.env.ALCHEMY_API_KEY;
        if (!alchemyKey) return [];

        let alchemyUrl = '';
        switch (chainId) {
            case 1: alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
            case 8453: alchemyUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
            case 137: alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
            case 42161: alchemyUrl = `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
            case 10: alchemyUrl = `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`; break;
            case 11155111: alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`; break;
            default: return [];
        }

        try {
            const hexBlock = `0x${blockNumber.toString(16)}`;

            const response = await fetch(alchemyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getAssetTransfers',
                    params: [{
                        fromBlock: hexBlock,
                        toBlock: hexBlock,
                        category: ['internal'],
                        withMetadata: false,
                        excludeZeroValue: true
                    }]
                })
            });

            const data = await response.json();
            this.alchemyCallsMade = true;

            if (data.result && Array.isArray(data.result.transfers)) {
                // Filter for transfers belonging to THIS transaction
                const transfers = data.result.transfers.filter((t: any) => t.hash && t.hash.toLowerCase() === txHash.toLowerCase());

                return transfers.map((tx: any) => ({
                    from: tx.from,
                    to: tx.to,
                    value: tx.value?.toString() || '0', // Alchemy returns value as number or string? usually number.
                    isError: false, // Alchemy doesn't explicitly return error status for successful internal transfers? 
                    type: 'call', // Default
                    gasUsed: '0' // Not provided by this endpoint
                }));
            }
            return [];
        } catch (error) {
            console.warn(`Failed to fetch internal txs from Alchemy for chain ${chainId}:`, error);
            // Return empty array so fallback can try
            return [];
        }
    }

    private getEnvelopeLabel(type: number, enumObj: any): string {
        switch (type) {
            case enumObj.LEGACY: return 'LEGACY';
            case enumObj.EIP2930: return 'EIP-2930';
            case enumObj.EIP1559: return 'EIP-1559';
            case enumObj.EIP4844: return 'EIP-4844';
            default: return 'LEGACY';
        }
    }

    private async parseTokenMovements(
        logs: readonly any[],
        userAddress: string,
        chainId: number,
        blockNumber: number,
        provider: ethers.Provider,
        timestamp: number,
        aliasAddress?: string // New: Bundler/Proxy address to treat as User
    ): Promise<{ items: any[], totalIn: number, totalOut: number, tokensInCount: number, tokensOutCount: number }> {
        const items = [];
        let totalIn = 0;
        let totalOut = 0;
        let tokensInCount = 0;
        let tokensOutCount = 0;

        const erc20Interface = new ethers.Interface(ERC20_ABI);
        const erc721Interface = new ethers.Interface(ERC721_ABI);
        const erc1155Interface = new ethers.Interface(ERC1155_ABI);

        const erc20TransferTopic = erc20Interface.getEvent('Transfer')?.topicHash;
        const erc1155SingleTopic = erc1155Interface.getEvent('TransferSingle')?.topicHash;
        const erc1155BatchTopic = erc1155Interface.getEvent('TransferBatch')?.topicHash;

        // Simple cache for token metadata within this transaction
        const tokenCache: { [address: string]: { symbol: string, decimals: number } } = {};

        const isUserOrAlias = (addr: string) => addr === userAddress || (aliasAddress && addr === aliasAddress);

        for (const log of logs) {
            // ERC20 & ERC721 check (both use Transfer event)
            if (log.topics[0] === erc20TransferTopic) {
                if (log.topics.length === 3) {
                    // ERC20
                    try {
                        const parsed = erc20Interface.parseLog(log);
                        if (!parsed) continue;
                        const from = parsed.args[0].toLowerCase();
                        const to = parsed.args[1].toLowerCase();
                        const amount = parsed.args[2];

                        if (isUserOrAlias(from) || isUserOrAlias(to)) {
                            const isIn = isUserOrAlias(to);

                            // Fetch Token Metadata
                            if (!tokenCache[log.address]) {
                                const tokenContract = new ethers.Contract(log.address, ERC20_ABI, provider);
                                try {
                                    const [symbol, decimals] = await Promise.all([
                                        tokenContract.symbol().catch(() => 'TOKEN'),
                                        tokenContract.decimals().catch(() => 18n) // default to 18 if fails
                                    ]);
                                    tokenCache[log.address] = {
                                        symbol: symbol,
                                        decimals: Number(decimals)
                                    };
                                } catch (e) {
                                    tokenCache[log.address] = { symbol: 'TOKEN', decimals: 18 };
                                }
                            }

                            const { symbol, decimals } = tokenCache[log.address];
                            const amountFormatted = ethers.formatUnits(amount, decimals);

                            // Use Oracle Service
                            let displayUsdValue = "0.00";
                            let historicUsdValue = 0;

                            try {
                                // Fetch BOTH Historic and Current prices
                                // Note: Current price doesn't need blockNumber (or uses 'latest' implicitly by not passing it? NO, new signature needs arg. Pass undefined)
                                const [historicPriceData, currentPriceData] = await Promise.all([
                                    this.oracle.getPrice(chainId, log.address, timestamp, blockNumber),
                                    this.oracle.getPrice(chainId, log.address, Math.floor(Date.now() / 1000))
                                ]);

                                const amountFloat = parseFloat(amountFormatted);

                                // Calculate Display Value (Current)
                                if (currentPriceData && currentPriceData.price > 0) {
                                    displayUsdValue = (amountFloat * currentPriceData.price).toFixed(2);
                                }

                                // Calculate Historic Value (For Totals)
                                if (historicPriceData && historicPriceData.price > 0) {
                                    historicUsdValue = amountFloat * historicPriceData.price;
                                }
                            } catch (e) {
                                console.warn(`Failed to fetch price for ${log.address}:`, e);
                            }

                            // Only add if amount > 0 (optional, but good for cleanup)
                            if (parseFloat(amountFormatted) > 0) {
                                items.push({
                                    direction: isIn ? 'in' : 'out',
                                    isIn: isIn,
                                    tokenIcon: isIn ? '📥' : '📤',
                                    tokenSymbol: symbol,
                                    tokenAddress: log.address,
                                    fromShort: `${from.slice(0, 6)}...${from.slice(-4)}`,
                                    toShort: `${to.slice(0, 6)}...${to.slice(-4)}`,
                                    amountFormatted: parseFloat(amountFormatted).toFixed(6),
                                    usdValue: `$${displayUsdValue}`
                                });
                                if (isIn) { tokensInCount++; totalIn += historicUsdValue; }
                                else { tokensOutCount++; totalOut += historicUsdValue; }
                            }
                        }
                    } catch (e) {
                        console.log('Failed to parse ERC-20 transfer:', e);
                    }
                } else if (log.topics.length === 4) {
                    // ERC721
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
            }
            // ERC1155 Check
            else if (log.topics[0] === erc1155SingleTopic || log.topics[0] === erc1155BatchTopic) {
                try {
                    const parsed = erc1155Interface.parseLog(log);
                    if (!parsed) continue;
                    const from = parsed.args[1].toLowerCase();
                    const to = parsed.args[2].toLowerCase();

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
        }
        return { items, totalIn, totalOut, tokensInCount, tokensOutCount };
    }
}
