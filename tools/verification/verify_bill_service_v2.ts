
import { BillService } from '../../apps/api/src/services/BillService';

async function verify() {
    // process.env.ALCHEMY_API_KEY = 'demo';
    // Mock ENV if needed or rely on fallback

    console.log('--- Verifying BillService V2 ---');
    const service = new BillService();

    // Use a known simple TX (or the one from reproduction)
    // Tx: 0x0833adaf46b6f6eb5084e7b2b3d6d0c10a1a7ff9a6416ee6fbe4298f60f253fe (Base)
    const req = {
        txHash: '0x0833adaf46b6f6eb5084e7b2b3d6d0c10a1a7ff9a6416ee6fbe4298f60f253fe',
        chainId: 8453,
        connectedWallet: '0x264993f94caca69b6261c32757279148560ded7e'
    };

    try {
        const result = await service.generateBill(req);
        console.log('✅ Bill Generated Successfully');
        console.log('PDF Path:', result.pdfPath);
        console.log('Bill ID:', result.billData.BILL_ID);
        console.log('Type:', result.billData.TYPE);
        console.log('Items Count:', result.billData.ITEMS_COUNT);
        console.log('Total In:', result.billData.TOTAL_IN_USD);

        // Strict checks
        if (result.billData.BILL_VERSION.includes('Enterprise')) {
            console.log('✅ Enterprise Version Verified');
        } else {
            console.error('❌ Version Validation Failed');
        }

        if (result.billData.ITEMS.length > 0) {
            console.log('✅ Items Parsed');
        } else {
            console.warn('⚠️ No Items Found (might be expected for this tx if filter applies)');
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    }
}

verify();
