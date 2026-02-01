import { CodeBlock } from "@/components/ui/CodeBlock";

export default function Errors() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Error Codes</h1>
                <p className="text-lg text-muted-foreground">
                    Standard HTTP error codes and internal application codes returned by the API.
                </p>
            </div>

            <section>
                <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900 rounded-lg text-sm text-red-900 dark:text-red-200 mb-8">
                    All errors return a standard JSON format to help you handle them programmatically.
                </div>

                <h3 className="text-xl font-semibold mb-4">Error Response Format</h3>
                <CodeBlock language="json" code={`{
  "error": "Unsupported chain ID",
  "code": "UNSUPPORTED_CHAIN",
  "details": { "chainId": 9999 }
}`} />
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Common HTTP Statuses</h2>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4 w-32 border-b border-border">Status</th>
                                <th className="p-4 border-b border-border">Meaning</th>
                                <th className="p-4 border-b border-border">Recommended Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="p-4 font-mono text-primary">400</td>
                                <td className="p-4 text-muted-foreground">Bad Request. Invalid parameters or input format.</td>
                                <td className="p-4 text-foreground">Check your payload (txHash, chainId).</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">401</td>
                                <td className="p-4 text-muted-foreground">Unauthorized. Missing or invalid API Key.</td>
                                <td className="p-4 text-foreground">Verify <code className="text-xs">x-api-key</code> header.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">403</td>
                                <td className="p-4 text-muted-foreground">Forbidden. Quota exceeded or restricted.</td>
                                <td className="p-4 text-foreground">Check usage limits in dashboard.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">429</td>
                                <td className="p-4 text-muted-foreground">Rate Limit Exceeded.</td>
                                <td className="p-4 text-foreground">Implement exponential backoff.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">500</td>
                                <td className="p-4 text-muted-foreground">Internal Server Error.</td>
                                <td className="p-4 text-foreground">Retry later. Contact support if persistent.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Application Error Codes</h2>
                <p className="text-muted-foreground">Detailed codes returned in the <code>code</code> field.</p>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4 w-48 border-b border-border">Code</th>
                                <th className="p-4 border-b border-border">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="p-4 font-mono text-primary">INVALID_HASH</td>
                                <td className="p-4 text-muted-foreground">The transaction hash format is incorrect (e.g. invalid length).</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">UNSUPPORTED_CHAIN</td>
                                <td className="p-4 text-muted-foreground">The requested chain ID is not supported by our node providers.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">QUOTA_EXCEEDED</td>
                                <td className="p-4 text-muted-foreground">You have exceeded your monthly generation quota. Upgrade plan.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">JOB_TIMEOUT</td>
                                <td className="p-4 text-muted-foreground">The worker could not fetch data in time. Usually chain congestion.</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-primary">SERVER_FAILURE</td>
                                <td className="p-4 text-muted-foreground">An unexpected error occurred during PDF generation.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
