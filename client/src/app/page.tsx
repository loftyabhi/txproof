'use client';

import { Navbar } from '@/components/Navbar';
import { ArrowRight, Search, Sparkles, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

export default function Home() {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const { isConnected } = useAccount();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash) return;

    setLoading(true);
    setError('');
    setBillData(null);
    setPdfUrl('');

    try {
      // Detect Chain (Simple heuristic or User Input in future)
      // For MVP, if it starts with 0x, default to Base (8453) or try to auto-detect
      // We'll hardcode Base (8453) for the demo unless user specifies
      const chainId = 8453;

      const response = await fetch('http://localhost:3000/api/v1/bills/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, chainId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bill');
      }

      if (data.success) {
        setBillData(data.data);
        // The backend returns a relative path like /bills/hash.pdf
        // Since we save it to client/public/bills, it's served at root /bills/hash.pdf by Next.js logic
        setPdfUrl(data.pdfUrl);
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30">
      <Navbar />

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-violet-300 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-violet-400" />
          <span>Now supporting Base Mainnet</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent"
        >
          Blockchain Receipts <br /> Made Beautiful.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 max-w-2xl text-lg text-gray-400"
        >
          Turn complex transaction hashes into professional, audit-ready PDF receipts in seconds. Perfect for accounting, tax compliance, and business records.
        </motion.p>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-xl"
        >
          <form onSubmit={handleGenerate} className="group relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-2xl transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-violet-500/10 hover:ring-1 hover:ring-white/20">
            <div className="pl-4 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Paste Transaction Hash (0x...)"
              className="flex-1 bg-transparent px-2 py-4 text-lg outline-none placeholder:text-gray-500"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-transform active:scale-95 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Generate'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-white" onClick={() => setTxHash('0x71c2656919db4521bc775871216b245084931a2986f376483b4c905335198971')}>Try: 0x71c2...198971</span>
            <span>•</span>
            <span>Supports: ETH, Base, Polygon</span>
          </div>
        </motion.div>

        {/* Results Section */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200"
          >
            Error: {error}
          </motion.div>
        )}

        {billData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-3xl"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 text-left space-y-4">
                <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  Status: {billData.status}
                </div>
                <h3 className="text-2xl font-bold">Receipt Ready</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <div className="text-gray-500">Type</div>
                    <div className="text-white font-mono">{billData.type}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Fee (USD)</div>
                    <div className="text-white font-mono">${billData.feeUSD}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div className="text-white">{billData.date}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Chain</div>
                    <div className="text-white">{billData.chainName}</div>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-700"
                  >
                    <FileText size={18} />
                    Download PDF
                  </a>
                </div>
              </div>
              {/* Preview (If we had an image preview, simpler to just link PDF for now) */}
              <div className="w-full md:w-1/3 aspect-[210/297] bg-white rounded-lg shadow-2xl opacity-90 relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center text-black/50 bg-black/5">
                  <FileText size={48} />
                </div>
                <iframe src={pdfUrl} className="w-full h-full pointer-events-none scale-[0.4] origin-top-left w-[250%] h-[250%]" />
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
