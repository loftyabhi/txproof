"use client";

import { useState, useEffect, useRef } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { StatusBadge, Status } from "@/components/ui/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Play, RotateCw, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DELAY = 1500;

export default function PlaygroundPage() {
    const [txHash, setTxHash] = useState("0x71c6d98c...example");
    const [chainId, setChainId] = useState("1");
    const [isSimulated, setIsSimulated] = useState(true);

    const [status, setStatus] = useState<Status | "idle">("idle");
    const [jobId, setJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`]);
    };

    const runSimulation = async () => {
        setStatus("pending");
        setLogs([]);
        setResult(null);
        setJobId(null);

        addLog(`Sending POST /resolve for Chain ${chainId}...`);
        await new Promise(r => setTimeout(r, 800));

        const newJobId = `job_${Math.random().toString(36).substring(7)}`;
        setJobId(newJobId);
        setStatus("pending");
        addLog(`Success: 201 Created. Job ID: ${newJobId}`);
        addLog(`Status: pending`);

        await new Promise(r => setTimeout(r, MOCK_DELAY));
        setStatus("processing");
        addLog(`Polling job/${newJobId}... Status: processing`);

        await new Promise(r => setTimeout(r, MOCK_DELAY));
        addLog(`Polling job/${newJobId}... Status: processing`);

        await new Promise(r => setTimeout(r, MOCK_DELAY));
        setStatus("completed");
        addLog(`Polling job/${newJobId}... Status: completed`);
        addLog(`Usage quota remaining: 98/100`);

        setResult({
            pdfUrl: "https://example.com/receipt.pdf",
            bill: {
                amount: "145.50",
                currency: "USDC",
                from: txHash.substring(0, 8) + "...",
                date: new Date().toISOString()
            }
        });
    };

    const handleRun = () => {
        if (isSimulated) {
            runSimulation();
        } else {
            // Implement real fetch here
            alert("Real API call not configured in this demo.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">API Playground</h1>
                <p className="text-lg text-muted-foreground">
                    Test the receipt generation flow interactively.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 border border-border rounded-xl bg-card space-y-6 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Transaction Hash</label>
                            <input
                                type="text"
                                value={txHash}
                                onChange={(e) => setTxHash(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="0x..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chain</label>
                            <select
                                value={chainId}
                                onChange={(e) => setChainId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm outline-none"
                            >
                                <option value="1">Ethereum Mainnet (1)</option>
                                <option value="137">Polygon (137)</option>
                                <option value="8453">Base (8453)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="sim"
                                checked={isSimulated}
                                onChange={e => setIsSimulated(e.target.checked)}
                                className="rounded border-border bg-background"
                            />
                            <label htmlFor="sim" className="text-sm text-muted-foreground select-none">Mock Responses (Simulation)</label>
                        </div>

                        <button
                            onClick={handleRun}
                            disabled={status === "processing" || status === "pending"}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {status === "processing" || status === "pending" ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Generate Receipt
                        </button>
                    </div>

                    {jobId && (
                        <div className="p-4 border border-border rounded-xl bg-card space-y-2">
                            <div className="text-sm text-muted-foreground">Current Job ID</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded break-all">{jobId}</div>
                        </div>
                    )}
                </div>

                {/* Console / Output */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border border-border rounded-xl bg-[#1e1e1e] text-zinc-300 overflow-hidden flex flex-col h-[400px] shadow-sm">
                        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-blue-400" />
                                <span>Event Log</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {status !== "idle" && <StatusBadge status={status} />}
                            </div>
                        </div>
                        <div className="p-4 font-mono text-sm space-y-1 overflow-y-auto flex-1">
                            {logs.length === 0 && <span className="text-zinc-600 italic">Waiting to start...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="border-l-2 border-transparent hover:border-blue-500/50 pl-2 transition-colors">
                                    <span className="opacity-50 mr-2">{log.split(']')[0]}]</span>
                                    <span>{log.split(']')[1]}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {status === "completed" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900 rounded-xl"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-green-800 dark:text-green-300">Receipt Generated</h3>
                                    <p className="text-green-700 dark:text-green-400 text-sm mb-4">
                                        Your standardized receipt is ready for download.
                                    </p>
                                    <div className="flex gap-3">
                                        <button onClick={() => window.alert('This would open the PDF.')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">
                                            Download PDF
                                        </button>
                                        <button className="px-4 py-2 bg-white dark:bg-black border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm font-medium transition-colors">
                                            View JSON Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
