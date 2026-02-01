import { Endpoint } from "@/components/ui/Endpoint";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Tabs } from "@/components/ui/Tabs";

export default function Reference() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
                <p className="text-lg text-muted-foreground">
                    Complete reference for the TxProof API endpoints.
                    <br />Base URL: <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">https://api.txproof.xyz</code>
                </p>
            </div>

            {/* POST /bills/resolve */}
            <Endpoint method="POST" path="/api/v1/bills/resolve">
                <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                        Starts a background job to generate a receipt for a specific transaction.
                        This is an idempotent operation; requesting the same txHash multiple times returns the same job/receipt.
                    </p>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-4 tracking-wider">Request Body</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border pt-4">
                            <div className="md:col-span-1 font-mono text-sm text-primary font-semibold">txHash <span className="text-red-500">*</span></div>
                            <div className="md:col-span-1 text-sm text-muted-foreground font-mono">string</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground">
                                The transaction hash to resolve.
                            </div>

                            <div className="md:col-span-1 font-mono text-sm text-primary font-semibold">chainId <span className="text-red-500">*</span></div>
                            <div className="md:col-span-1 text-sm text-muted-foreground font-mono">number</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground">
                                The chain ID (e.g. 1 for Ethereum, 137 for Polygon).
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-3 tracking-wider">Example Request</h4>
                        <CodeBlock language="json" code={`{
  "txHash": "0x5d962...",
  "chainId": 1
}`} />
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-3 tracking-wider">Response Scenarios</h4>
                        <Tabs items={[
                            {
                                label: '201 Created',
                                value: '201',
                                content: <CodeBlock language="json" code={`{
  "jobId": "job_987654",
  "status": "pending",
  "createdAt": "2024-03-20T10:00:00Z"
}`} />
                            },
                            {
                                label: '400 Bad Request',
                                value: '400',
                                content: <CodeBlock language="json" code={`{
  "error": "Invalid transaction hash format",
  "code": "INVALID_HASH"
}`} />
                            }
                        ]} />
                    </div>
                </div>
            </Endpoint>

            {/* GET /bills/job/:jobId */}
            <Endpoint method="GET" path="/api/v1/bills/job/:jobId">
                <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                        Checks the status of a specific job. Use this endpoint for polling until the status is <span className="font-mono text-xs">completed</span> or <span className="font-mono text-xs">failed</span>.
                    </p>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-4 tracking-wider">Path Parameters</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border pt-4">
                            <div className="md:col-span-1 font-mono text-sm text-primary font-semibold">jobId <span className="text-red-500">*</span></div>
                            <div className="md:col-span-1 text-sm text-muted-foreground font-mono">string</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground">
                                The ID of the job returned by the resolve endpoint.
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-3 tracking-wider">Response Scenarios</h4>
                        <Tabs items={[
                            {
                                label: 'Completed',
                                value: 'completed',
                                content: <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Job finished successfully.</p>
                                    <CodeBlock language="json" code={`{
  "jobId": "job_987654",
  "status": "completed",
  "data": {
     "pdfUrl": "https://cdn.txproof.xyz/receipts/r_123.pdf",
     "bill": {
        "amount": "100.00",
        "currency": "USDC",
        "sender": "0x...",
        "receiver": "0x..."
     }
  }
}`} />
                                </div>
                            },
                            {
                                label: 'Processing',
                                value: 'processing',
                                content: <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Job is still running. Retry later.</p>
                                    <CodeBlock language="json" code={`{
  "jobId": "job_987654",
  "status": "processing"
}`} />
                                </div>
                            },
                            {
                                label: 'Failed',
                                value: 'failed',
                                content: <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Job failed with error details.</p>
                                    <CodeBlock language="json" code={`{
  "jobId": "job_987654",
  "status": "failed",
  "error": "Transaction execution reverted",
  "code": "TX_REVERTED"
}`} />
                                </div>
                            }
                        ]} />
                    </div>
                </div>
            </Endpoint>

            {/* GET /bills/:billId/data */}
            <Endpoint method="GET" path="/api/v1/bills/:billId/data">
                <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                        Retrieves the raw JSON data for a generated receipt (bill) using the Bill ID.
                        This is useful if you want to store just the ID and fetch details dynamically.
                    </p>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-4 tracking-wider">Path Parameters</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border pt-4">
                            <div className="md:col-span-1 font-mono text-sm text-primary font-semibold">billId <span className="text-red-500">*</span></div>
                            <div className="md:col-span-1 text-sm text-muted-foreground font-mono">string</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground">
                                The unique identifier of the generated bill/receipt.
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm uppercase text-foreground/70 mb-3 tracking-wider">Example Response</h4>
                        <CodeBlock language="json" code={`{
  "id": "bill_123456",
  "chainId": 1,
  "txHash": "0x5d962...",
  "timestamp": 1234567890,
  "metadata": {
      "items": [...],
      "total": "100.00"
  }
}`} />
                    </div>
                </div>
            </Endpoint>
        </div>
    )
}
