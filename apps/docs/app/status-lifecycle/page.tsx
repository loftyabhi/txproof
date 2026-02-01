import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowDown } from "lucide-react";

export default function StatusLifecycle() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Status Lifecycle</h1>
                <p className="text-lg text-muted-foreground">
                    Understanding the lifecycle of a receipt generation job.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4 py-12 bg-muted/20 rounded-xl border border-border">
                <div className="p-6 border bg-card rounded-lg shadow-sm w-72 text-center">
                    <StatusBadge status="pending" />
                    <p className="text-xs mt-3 text-muted-foreground">Job accepted & queued</p>
                </div>
                <ArrowDown className="text-muted-foreground/50 animate-bounce" />
                <div className="p-6 border bg-card rounded-lg shadow-sm w-72 text-center">
                    <StatusBadge status="processing" />
                    <p className="text-xs mt-3 text-muted-foreground">Blockchain data fetching & PDF generation</p>
                </div>
                <ArrowDown className="text-muted-foreground/50" />
                <div className="grid grid-cols-2 gap-6 w-full max-w-lg px-4">
                    <div className="p-6 border bg-card rounded-lg shadow-sm text-center ring-1 ring-green-500/20">
                        <StatusBadge status="completed" />
                        <p className="text-xs mt-3 text-muted-foreground">Asset ready for download</p>
                    </div>
                    <div className="p-6 border bg-card rounded-lg shadow-sm text-center ring-1 ring-red-500/20">
                        <StatusBadge status="failed" />
                        <p className="text-xs mt-3 text-muted-foreground">Generation stopped</p>
                    </div>
                </div>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">States Detail</h2>
                <ul className="grid gap-4">
                    <li className="p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status="pending" />
                            <span className="font-semibold text-sm">Pending</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The job has been accepted by the API and is waiting in the queue.
                            Typically lasts for a few milliseconds to seconds depending on load.
                        </p>
                    </li>
                    <li className="p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status="processing" />
                            <span className="font-semibold text-sm">Processing</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A worker has picked up the job. It is currently fetching transaction data from the blockchain
                            (RPC calls), resolving metadata (ENS, Token names), and rendering the PDF.
                            This usually takes 2-10 seconds.
                        </p>
                    </li>
                    <li className="p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status="completed" />
                            <span className="font-semibold text-sm">Completed</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The receipt has been successfully generated. The response will contain the `pdfUrl`
                            and structured `bill` data. This is a terminal state.
                        </p>
                    </li>
                    <li className="p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status="failed" />
                            <span className="font-semibold text-sm">Failed</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Generation failed. Check the `error` description in the response.
                            Common causes include invalid transaction hashes, unsupported chains, or RPC failures.
                            This is a terminal state.
                        </p>
                    </li>
                </ul>
            </section>
        </div>
    )
}
