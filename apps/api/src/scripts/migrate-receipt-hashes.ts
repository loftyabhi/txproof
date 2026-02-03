/**
 * MIGRATION SCRIPT: Recalculate Receipt Hashes
 * 
 * This script recalculates receipt hashes for all existing bills using
 * the new canonical JSON serialization method.
 * 
 * IMPORTANT: This should only be run once during the hardening migration.
 * Existing hashes were generated with non-canonical JSON.stringify.
 * This script regenerates them with RFC-8785 canonical JSON.
 */

import { supabase } from '../lib/supabase';
import { computeReceiptHash } from '../lib/cryptography';
import { logger, createComponentLogger } from '../lib/logger';

const migrationLogger = createComponentLogger('HashMigration');

async function recalculateAllHashes(dryRun: boolean = true) {
    migrationLogger.info('Starting receipt hash recalculation', { dryRun });

    try {
        // 1. Fetch all bills with JSON data
        let offset = 0;
        const limit = 100;
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        while (true) {
            const { data: bills, error } = await supabase
                .from('bills')
                .select('id, bill_id, bill_json, receipt_hash, tx_hash, chain_id')
                .not('bill_json', 'is', null)
                .range(offset, offset + limit - 1);

            if (error) {
                migrationLogger.error('Failed to fetch bills', { offset, error: error.message });
                break;
            }

            if (!bills || bills.length === 0) {
                migrationLogger.info('No more bills to process');
                break;
            }

            migrationLogger.info(`Processing batch`, { offset, count: bills.length });

            for (const bill of bills) {
                totalProcessed++;

                try {
                    // Recompute hash using canonical JSON
                    const newHash = computeReceiptHash(bill.bill_json);
                    const oldHash = bill.receipt_hash;

                    const changed = newHash !== oldHash;

                    if (changed || !oldHash) {
                        if (dryRun) {
                            migrationLogger.info('Would update hash', {
                                billId: bill.bill_id,
                                oldHash: oldHash?.substring(0, 16) + '...' || 'null',
                                newHash: newHash.substring(0, 16) + '...',
                                changed: !!oldHash
                            });
                        } else {
                            // Actually update
                            const { error: updateError } = await supabase
                                .from('bills')
                                .update({
                                    receipt_hash: newHash,
                                    hash_algo: 'keccak256',
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', bill.id);

                            if (updateError) {
                                migrationLogger.error('Failed to update hash', {
                                    billId: bill.bill_id,
                                    error: updateError.message
                                });
                                totalErrors++;
                            } else {
                                migrationLogger.info('✅ Hash updated', {
                                    billId: bill.bill_id,
                                    newHash: newHash.substring(0, 16) + '...'
                                });
                                totalUpdated++;
                            }
                        }
                    }

                } catch (error: any) {
                    migrationLogger.error('Error processing bill', {
                        billId: bill.bill_id,
                        error: error.message
                    });
                    totalErrors++;
                }
            }

            if (bills.length < limit) {
                break; // Last batch
            }

            offset += limit;
        }

        migrationLogger.info('=== Migration Complete ===');
        migrationLogger.info(`Total bills processed: ${totalProcessed}`);
        migrationLogger.info(`Total updated: ${totalUpdated}`);
        migrationLogger.info(`Total errors: ${totalErrors}`);
        migrationLogger.info(`Dry run: ${dryRun}`);

        if (dryRun) {
            migrationLogger.info('This was a DRY RUN. No changes were made.');
            migrationLogger.info('Run with --apply flag to apply changes.');
        }

    } catch (error: any) {
        migrationLogger.error('Migration failed', { error: error.message });
        process.exit(1);
    }
}

// Parse command line args
const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');

if (!applyChanges) {
    migrationLogger.warn('Running in DRY RUN mode. Use --apply to make actual changes.');
}

recalculateAllHashes(!applyChanges)
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        logger.error('Uncaught error', { error: err.message });
        process.exit(1);
    });
