// ═══ FILE: rules/transfer/TransferRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';
import { EVM, isMintTransfer, isBurnTransfer } from '../../infrastructure/constants/evm';

export class TransferRule extends BaseRule {
    readonly id = 'transfer';
    readonly priority = 40;

    matches(ctx: ClassificationContext): boolean {
        const flow = this.getMeaningfulFlow(ctx);
        const isBidirectional = flow && flow.netIn.length > 0 && flow.netOut.length > 0;

        return (BigInt(ctx.tx.value) > 0 || ctx.receipt.logs.length > 0) &&
            !isBidirectional &&
            ctx.receipt.logs.length <= 5;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const flow = this.getMeaningfulFlow(ctx);
        const builder = new ConfidenceBuilder();

        // 1. NATIVE Transfer
        if (ctx.tx.data === '0x' && BigInt(ctx.tx.value) > 0 && ctx.receipt.logs.length === 0) {
            if (flow && flow.netOut.length === 1 && flow.netOut[0].type === 'NATIVE') {
                builder.setBase(0.95, 'Simple native transfer, no logs, no calldata');
                return {
                    functionalType: TransactionType.NATIVE_TRANSFER,
                    confidence: builder.getScore(),
                    reasons: builder.getReasons(),
                    details: {}
                };
            }
        }

        // 2. Token Mint / Burn (check exact logs)
        if (ctx.receipt.logs.length === 1) {
            const log = ctx.receipt.logs[0];
            if (isMintTransfer(log)) {
                builder.setBase(0.90, 'ERC20 Mint event detected');
                return {
                    functionalType: TransactionType.TOKEN_MINT,
                    confidence: builder.getScore(),
                    reasons: builder.getReasons(),
                    details: { asset: log.address.toLowerCase() }
                };
            }
            if (isBurnTransfer(log)) {
                builder.setBase(0.90, 'ERC20 Burn event detected');
                return {
                    functionalType: TransactionType.TOKEN_BURN,
                    confidence: builder.getScore(),
                    reasons: builder.getReasons(),
                    details: { asset: log.address.toLowerCase() }
                };
            }
        }

        // 3. ERC20 Transfer
        if (flow) {
            const erc20Out = flow.netOut.filter(m => m.type === 'ERC20');
            const erc20In = flow.netIn.filter(m => m.type === 'ERC20');
            const hasOtherOut = flow.netOut.length > erc20Out.length;
            const hasOtherIn = flow.netIn.length > erc20In.length;

            if (!hasOtherOut && !hasOtherIn) {
                if ((erc20Out.length === 1 && erc20In.length === 0) ||
                    (erc20In.length === 1 && erc20Out.length === 0)) {
                    builder.setBase(0.85, 'Exactly 1 ERC20 transfer, no other movements');
                    return {
                        functionalType: TransactionType.TOKEN_TRANSFER,
                        confidence: builder.getScore(),
                        reasons: builder.getReasons(),
                        details: {}
                    };
                }
            }
        }

        // 4. NFT Transfer
        if (flow) {
            const nftOut = flow.nftOut;
            const nftIn = flow.nftIn;
            const hasPayment = flow.netOut.some(m => m.type === 'ERC20' || m.type === 'NATIVE') ||
                flow.netIn.some(m => m.type === 'ERC20' || m.type === 'NATIVE');

            if (!hasPayment) {
                if ((nftOut.length === 1 && nftIn.length === 0) ||
                    (nftIn.length === 1 && nftOut.length === 0)) {
                    builder.setBase(0.85, 'Exactly 1 NFT transfer, no payment correlation');
                    return {
                        functionalType: TransactionType.NFT_TRANSFER,
                        confidence: builder.getScore(),
                        reasons: builder.getReasons(),
                        details: {}
                    };
                }
            }
        }

        return this.noMatch();
    }
}
