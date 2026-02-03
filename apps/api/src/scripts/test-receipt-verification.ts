/**
 * TEST SCRIPT: Verify Receipt Hash Integrity
 * 
 * This script:
 * 1. Fetches a sample bill from the database
 * 2. Recomputes its receipt hash using canonical JSON
 * 3. Compares with stored hash to verify integrity
 * 4. Tests the verification endpoint
 */

import { supabase } from '../lib/supabase';
import { computeReceiptHash, verifyReceiptHash } from '../lib/cryptography';
import { logger } from '../lib/logger';

async function testReceiptVerification() {
    logger.info('Starting receipt verification test');

    try {
        // 1. Fetch a sample bill from database
        const { data: bills, error } = await supabase
            .from('bills')
            .select('bill_id, bill_json, receipt_hash, hash_algo')
            .not('receipt_hash', 'is', null)
            .limit(5);

        if (error || !bills || bills.length === 0) {
            logger.error('No bills found with receipt hashes', { error: error?.message });
            process.exit(1);
        }

        logger.info(`Found ${bills.length} bills with receipt hashes`);

        let passCount = 0;
        let failCount = 0;

        //2. Verify each bill
        for (const bill of bills) {
            logger.info(`\n--- Verifying bill: ${bill.bill_id} ---`);

            if (!bill.bill_json) {
                logger.warn('Bill missing JSON data', { billId: bill.bill_id });
                failCount++;
                continue;
            }

            try {
                // Recompute hash
                const computedHash = computeReceiptHash(bill.bill_json);
                const storedHash = bill.receipt_hash;

                const match = computedHash === storedHash;

                if (match) {
                    logger.info('✅ PASS: Hash verification successful', {
                        billId: bill.bill_id,
                        algorithm: bill.hash_algo || 'keccak256',
                        hash: computedHash.substring(0, 16) + '...'
                    });
                    passCount++;
                } else {
                    logger.error('❌ FAIL: Hash mismatch', {
                        billId: bill.bill_id,
                        computed: computedHash,
                        stored: storedHash
                    });
                    failCount++;
                }

                // Also test using verifyReceiptHash function
                const verificationResult = verifyReceiptHash(bill.bill_json, storedHash);
                if (verificationResult.valid !== match) {
                    logger.error('Verification function inconsistency detected!');
                }

            } catch (error: any) {
                logger.error('Verification error', {
                    billId: bill.bill_id,
                    error: error.message
                });
                failCount++;
            }
        }

        logger.info('\n=== Verification Results ===');
        logger.info(`Total bills tested: ${bills.length}`);
        logger.info(`Passed: ${passCount}`);
        logger.info(`Failed: ${failCount}`);
        logger.info(`Success rate: ${((passCount / bills.length) * 100).toFixed(2)}%`);

        if (failCount > 0) {
            logger.error('Some receipts failed verification. Hashes may need recalculation.');
            process.exit(1);
        } else {
            logger.info('✅ All receipts verified successfully!');
            process.exit(0);
        }

    } catch (error: any) {
        logger.error('Test failed with error', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testReceiptVerification();
