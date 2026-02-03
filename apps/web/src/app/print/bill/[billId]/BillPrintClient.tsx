'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ShieldCheck, Copy, CheckCircle, Printer } from "lucide-react"; // Only standard icons
import { toast } from "sonner";
import './print.css';
import { BillViewModel } from './types'; // Ensure types is valid

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Simple Modal Component since Shadcn is apparently missing
function VerificationModal({ hash, onClose }: { hash: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                <div className="flex items-center gap-2 text-emerald-400 text-lg font-bold mb-2">
                    <ShieldCheck className="w-5 h-5" />
                    Cryptographically Verified
                </div>
                <p className="text-gray-400 text-sm mb-6">
                    This receipt includes a cryptographic proof of integrity.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-mono">Receipt Hash (Keccak-256)</label>
                        <div
                            className="p-3 bg-black/50 rounded border border-gray-800 font-mono text-xs break-all cursor-pointer hover:border-gray-600 transition-colors flex items-center justify-between group"
                            onClick={() => {
                                navigator.clipboard.writeText(hash);
                                toast.success("Hash copied to clipboard");
                            }}
                        >
                            {hash}
                            <Copy className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-emerald-900/20 p-4 rounded border border-emerald-900/50 text-sm text-emerald-200/80">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                            <div>
                                <strong>Tamper Proof.</strong> The content of this receipt is hashed and logged. Any modification to the data will result in a invalid hash verification.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">Close</button>
                </div>
            </div>
        </div>
    );
}

export default function BillPrintClient() {
    const params = useParams();
    const searchParams = useSearchParams();
    const billId = params?.billId as string;
    const isPreview = searchParams?.get('mode') === 'preview';

    const [data, setData] = useState<BillViewModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        if (!billId) return;

        const fetchData = async () => {
            try {
                // Fetch the Bill JSON data
                const res = await fetch(`${API_URL}/api/v1/bills/${billId}/data`);

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Bill not found');
                    throw new Error('Failed to fetch bill data');
                }

                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [billId]);

    // Set document title for PDF filename to match URL ID
    useEffect(() => {
        if (billId) {
            document.title = `TxProof - ${billId}`;
        }
    }, [billId]);

    useEffect(() => {
        if (!data || loading || isPreview) return; // Skip print in preview mode

        // Deterministic Print Readiness Check
        const checkReadiness = async () => {
            try {
                // 1. Wait for Fonts
                await document.fonts.ready;

                // 2. Wait for Images
                const images = Array.from(document.images);
                await Promise.all(images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve; // Don't block on broken images
                    });
                }));

                // 3. Robust double-buffering check
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            window.print();
                        }, 1500);
                    });
                });

            } catch (e) {
                console.error("Print readiness check failed", e);
                // Fallback
                window.print();
            }
        };

        checkReadiness();
    }, [data, loading, isPreview]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Bill Data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="page">
            {/* SCREEN ONLY: Print Hint & Button */}
            <div className="no-print" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#eff6ff',
                color: '#1e40af',
                padding: '12px 20px',
                fontSize: '13px',
                borderBottom: '1px solid #dbeafe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <span>
                    <strong>Legacy Print Mode:</strong> For best results, enable <em>Background graphics</em> in your browser's print settings.
                </span>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                    {/* Verified Badge */}
                    {data && data.RECEIPT_HASH && (
                        <button
                            onClick={() => setShowVerification(true)}
                            style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <ShieldCheck size={14} />
                            Verified
                        </button>
                    )}

                    <button
                        onClick={() => window.print()}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Printer size={14} />
                        Print Now
                    </button>
                </div>
            </div>

            {/* Modal Portal */}
            {showVerification && data && data.RECEIPT_HASH && (
                <VerificationModal
                    hash={data.RECEIPT_HASH}
                    onClose={() => setShowVerification(false)}
                />
            )}

            {/* HEADER */}
            <main className="page-content">

                {/* Fixed Running Footer */}
                <div className="running-footer">
                    <div className="flex items-center gap-2">
                        <span>⚡ TxProof</span>
                        <span className="text-gray-300">|</span>
                        <span>{data.BILL_ID}</span>
                    </div>
                    <div className="font-mono">{data.DATE}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td>
                                {/* MAIN HEADER */}
                                <div className="header">
                                    <a href={data.FRONTEND_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                        <div className="brand">
                                            <div className="brand-icon">⚡</div>
                                            <div className="brand-info">
                                                <h1>TxProof</h1>
                                                <div className="brand-tagline">Professional Blockchain Intelligence</div>
                                            </div>
                                        </div>
                                    </a>
                                    <div className="receipt-meta">
                                        <div className="receipt-title">Transaction Receipt</div>
                                        <div className="receipt-id">{data.BILL_ID}</div>
                                        <div className="text-xs text-gray-500 mt-1">{data.DATE}</div>
                                    </div>
                                </div>

                                {/* STATUS BAR */}
                                <div className="status-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="status-badge" style={{ background: '#ecfdf5', color: '#065f46', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                        <span style={{ marginRight: '4px' }}>✅</span>
                                        <span>CONFIRMED</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <span style={{ fontSize: '16px' }}>{data.CHAIN_ICON}</span>
                                        <span>{data.CHAIN_NAME} ({data.CHAIN_ID})</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`status-badge ${data.EXECUTION_TYPE_LABEL === 'Direct' ? '' :
                                            data.EXECUTION_TYPE_LABEL === 'Smart Account' ? 'info' : 'warning'
                                            }`}>
                                            <span style={{ fontSize: '12px' }}>
                                                {data.EXECUTION_TYPE_LABEL === 'Direct' ? '👤' :
                                                    data.EXECUTION_TYPE_LABEL === 'Smart Account' ? '🤖' :
                                                        data.EXECUTION_TYPE_LABEL === 'Multisig' ? '👥' : '🔄'}
                                            </span>
                                            <span>{data.EXECUTION_TYPE_LABEL}</span>
                                        </div>
                                        <div className={`status-badge ${data.CONFIDENCE_LEVEL === 'Confirmed' ? 'confirmed' :
                                            data.CONFIDENCE_LEVEL === 'High' ? 'confirmed' :
                                                data.CONFIDENCE_LEVEL === 'Likely' ? 'warning' : 'failed'
                                            }`}>
                                            <span style={{ marginRight: '4px' }}>
                                                {data.CONFIDENCE_LEVEL === 'Confirmed' ? '🛡️' :
                                                    data.CONFIDENCE_LEVEL === 'High' ? '✅' :
                                                        data.CONFIDENCE_LEVEL === 'Likely' ? '⚠️' : '❓'}
                                            </span>
                                            <span>{data.CONFIDENCE_LABEL.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>



                                {/* KEY METRICS */}
                                <div className="grid-4">
                                    <div className="data-group">
                                        <div className="uppercase-label">Timestamp</div>
                                        <div className="data-value">{data.TIMESTAMP}</div>
                                        <div className="text-xs text-secondary mt-1">{data.TIMESTAMP_RELATIVE}</div>
                                    </div>
                                    <div className="data-group">
                                        <div className="uppercase-label">Block Height</div>
                                        <div className="data-value mono text-accent">#{data.BLOCK_NUMBER}</div>
                                    </div>
                                    <div className="data-group" style={{ gridColumn: 'span 2' }}>
                                        <div className="uppercase-label">Transaction Hash</div>
                                        <div className="data-value mono text-accent break-all">{data.TRANSACTION_HASH}</div>
                                    </div>
                                </div>

                                {/* PARTICIPANTS */}
                                <div className="grid-2">
                                    <div className="participant-card">
                                        <div className="participant-header">
                                            <div className="uppercase-label flex items-center gap-2">
                                                <span className="text-accent">📥</span> Sender (From)
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">{data.FROM_AVATAR}</div>
                                            <div>
                                                <div className="font-bold text-sm">{data.FROM_ENS || 'Sender'}</div>
                                                <div className="font-mono text-xs text-secondary break-all">{data.FROM_ADDRESS}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="participant-card">
                                        <div className="participant-header">
                                            <div className="uppercase-label flex items-center gap-2">
                                                <span className="text-red-500">📤</span> Recipient (To)
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">{data.TO_AVATAR}</div>
                                            <div>
                                                <div className="font-bold text-sm">{data.TO_ENS || 'Recipient'}</div>
                                                <div className="font-mono text-xs text-secondary break-all">{data.TO_ADDRESS}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* REST OF CONTENT... (Internal TXs, Token Movements, etc.) */}
                                {data.HAS_INTERNAL_TXS && (
                                    <div className="table-container">
                                        <div className="section-title">⚙️ Internal Execution</div>
                                        <table style={{ width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40%' }}>Caller</th>
                                                    <th style={{ width: '40%' }}>Target</th>
                                                    <th className="text-right" style={{ width: '20%' }}>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.INTERNAL_TXS.map((tx, idx) => (
                                                    <tr key={idx}>
                                                        <td><span className="font-mono text-secondary">{tx.fromShort}</span></td>
                                                        <td><span className="font-mono text-secondary">{tx.toShort}</span></td>
                                                        <td className="text-right">
                                                            <span className="font-medium">{tx.amount} {tx.symbol}</span>
                                                            {tx.isError && (
                                                                <span className="direction-badge direction-out" style={{ marginLeft: '5px' }}>
                                                                    FAIL
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                                }

                                {/* LINE ITEMS */}
                                <div className="table-container">
                                    <div className="section-title">📊 Token Movements</div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '10%' }}>Type</th>
                                                <th style={{ width: '25%' }}>Asset</th>
                                                <th style={{ width: '20%' }}>From</th>
                                                <th style={{ width: '20%' }}>To</th>
                                                <th className="text-right" style={{ width: '15%' }}>Amount</th>
                                                <th className="text-right" style={{ width: '10%' }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.ITEMS.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <span className={`direction-badge ${item.isIn ? 'direction-in' : 'direction-out'}`}>
                                                            {item.isIn ? 'IN' : 'OUT'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="token-cell">
                                                            <span style={{ fontSize: '14px' }}>{item.tokenIcon}</span>
                                                            <span className="font-medium">{item.tokenSymbol}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="font-mono text-secondary">{item.fromShort}</span></td>
                                                    <td><span className="font-mono text-secondary">{item.toShort}</span></td>
                                                    <td className="text-right font-mono">{item.amountFormatted}</td>
                                                    <td className={`text-right font-mono ${item.isIn ? 'amount-positive' : ''}`}>
                                                        {item.usdValue}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* FINANCIAL SUMMARY & HISTORIC VALUE */}
                                <div className="grid-2">
                                    {/* Transaction Fees */}
                                    <div className="summary-box">
                                        <div className="summary-row total" style={{ marginTop: 0, border: 'none', paddingTop: 0 }}>
                                            Transaction Cost
                                        </div>
                                        <div className="summary-row">
                                            <span className="text-secondary">Gas Price</span>
                                            <span className="font-mono">{data.GAS_PRICE_GWEI} Gwei</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="text-secondary">Gas Used</span>
                                            <span className="font-mono">{data.GAS_USED}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="text-secondary">Total Fee</span>
                                            <span className="font-mono">{data.TOTAL_FEE} {data.CHAIN_SYMBOL}</span>
                                        </div>
                                        <div className="summary-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                            <span className="font-medium">Cost in USD</span>
                                            <span className="font-mono">${data.TOTAL_FEE_USD}</span>
                                        </div>
                                    </div>

                                    {/* Historic Value */}
                                    <div className="summary-box">
                                        <div className="summary-row total" style={{ marginTop: 0, border: 'none', paddingTop: 0, color: 'var(--color-accent-dark)' }}>
                                            Historic Value (On Tx Date)
                                        </div>
                                        <div className="summary-row">
                                            <span className="text-secondary">Total Received</span>
                                            <span className="font-mono">${data.TOTAL_IN_USD}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="text-secondary">Total Sent</span>
                                            <span className="font-mono">${data.TOTAL_OUT_USD}</span>
                                        </div>
                                        <div className="summary-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                            <span className="font-medium">Net Change</span>
                                            <span className={`font-mono ${data.NET_CHANGE_POSITIVE ? 'amount-positive' : 'amount-negative'}`}>
                                                {data.NET_CHANGE_SIGN}${data.NET_CHANGE_USD}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* AUDIT */}
                                {
                                    data.INCLUDE_AUDIT && (
                                        <div className="audit-strip">
                                            <div className="audit-title">🔒 Verification & Audit Trail</div>
                                            <div className="grid-4" style={{ marginBottom: 0, padding: 0, background: 'transparent', border: 'none' }}>
                                                <div className="data-group">
                                                    <div className="uppercase-label">Data Source</div>
                                                    <div className="data-value" style={{ fontSize: '11px' }}>{data.PRICE_SOURCE}</div>
                                                </div>
                                                <div className="data-group">
                                                    <div className="uppercase-label">AI Confidence</div>
                                                    <div className="data-value" style={{ fontSize: '11px' }}>{data.CONFIDENCE}%</div>
                                                </div>
                                                <div className="data-group">
                                                    <div className="uppercase-label">Method</div>
                                                    <div className="data-value" style={{ fontSize: '11px' }}>{data.CLASSIFICATION_METHOD}</div>
                                                </div>
                                                <div className="data-group">
                                                    <div className="uppercase-label">Reorg Check</div>
                                                    <div className="data-value" style={{ fontSize: '11px' }}>
                                                        {data.REORG_DETECTED ? '⚠️ Detected' : '✅ Passed'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* CLASSIFICATION & COMPLIANCE FOOTER */}
                                <div className="classification-section">
                                    <div className="classification-header">
                                        <div>
                                            <div className="uppercase-label" style={{ marginBottom: '4px' }}>Primary Classification</div>
                                            <div className="primary-action-hero">
                                                <span>{data.TYPE_ICON || '📝'}</span>
                                                <span>{data.TYPE_READABLE}</span>
                                            </div>
                                        </div>
                                        {/* Optional: Place Audit Badges here if desired, or keep separate. */}
                                    </div>

                                    <div className="compliance-grid">
                                        <div className="compliance-col">
                                            <div className="label">Supplementary Actions</div>
                                            {data.SECONDARY_ACTIONS.length > 0 ? (
                                                <div className="chip-container">
                                                    {data.SECONDARY_ACTIONS.map((action, idx) => (
                                                        <div key={idx} className="chip">
                                                            <span>{action}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-secondary text-xs italic">None detected</div>
                                            )}
                                        </div>
                                        <div className="compliance-col">
                                            <div className="label">Risk Factors</div>
                                            {data.RISK_WARNINGS.length > 0 ? (
                                                <div className="risk-callout" style={{ margin: 0 }}>
                                                    <div className="risk-title">⚠️ Warning</div>
                                                    <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                                                        {data.RISK_WARNINGS.map((w, i) => {
                                                            const trigger = "Verify manually";
                                                            if (w.includes(trigger)) {
                                                                const parts = w.split(trigger);
                                                                return (
                                                                    <li key={i}>
                                                                        {parts[0]}
                                                                        <a
                                                                            href={data.EXPLORER_URL}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}
                                                                        >
                                                                            {trigger}
                                                                        </a>
                                                                        {parts[1]}
                                                                    </li>
                                                                );
                                                            }
                                                            return <li key={i}>{w}</li>;
                                                        })}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="status-badge" style={{ background: '#ecfdf5', color: '#065f46', width: 'fit-content' }}>
                                                    <span>✅ Zero Risk</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}></div>

                                {/* FOOTER GROUP */}
                                <div className="document-footer">
                                    {/* AD PLACEMENT RESTORED */}
                                    <div className="ad-container" style={{ marginBottom: '24px' }}>
                                        {data.hasAd ? (
                                            <div dangerouslySetInnerHTML={{ __html: data.adContent }} />
                                        ) : (
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center' }}>
                                                <strong>Promote your project here.</strong> Contact <a href="mailto:txproof.xyz@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>txproof.xyz@gmail.com</a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Simplified Footer Layout */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                        <div className="qr-section" style={{ marginBottom: 0 }}>
                                            <img src={data.QR_CODE_DATA_URL} className="qr-image" alt="QR Validation" style={{ width: '48px', height: '48px' }} />
                                            <div>
                                                <div className="uppercase-label">Cryptographic Verification</div>
                                                <a href={data.EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', maxWidth: '200px', marginBottom: '4px' }}>
                                                    Scan To Verify On-Chain Or Click Here
                                                </a>
                                                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', maxWidth: '200px', marginBottom: '4px' }}>
                                                    Ref: {data.BILL_ID}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="footer-legal" style={{ textAlign: 'right', maxWidth: '300px' }}>
                                            <div style={{ marginBottom: '4px' }}>
                                                <a href={data.DISCLAIMER_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', marginRight: '12px', fontSize: '10px', fontWeight: '600' }}>Disclaimer</a>
                                                <a href={data.CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', marginRight: '12px', fontSize: '10px', fontWeight: '600' }}>Contact Us</a>
                                            </div>
                                            <span style={{ fontSize: '8px', color: 'var(--color-text-tertiary)' }}>
                                                © {data.CURRENT_YEAR} TxProof. Data from {data.CHAIN_NAME}.<br />
                                                USD values are estimates at time of transaction.
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                {/* Close TD, TR, TBODY, TABLE */}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </main>
        </div >
    );
}
