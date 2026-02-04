import { Metadata } from 'next';
import { constructCanonical, generateBreadcrumbSchema, generateTechArticleSchema } from "@/lib/seo";

export const metadata: Metadata = {
    title: 'Rate Limits & Quotas',
    description: 'Understand the TxProof API rate limits and monthly quotas. Details on Token Bucket limits and RPS enforcement.',
    alternates: {
        canonical: constructCanonical('/rate-limits'),
    },
};

const breadcrumbs = [
    { name: "Docs", item: "/" },
    { name: "Rate Limits", item: "/rate-limits" },
];

const schema = generateTechArticleSchema(
    'TxProof API Rate Limits & Quotas',
    'Technical specification of rate limiting algorithms and usage quotas for TxProof developers.',
    '/rate-limits'
);

export default function Quotas() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Quotas & Plans</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    TxProof enforces limits to ensure fair usage and stability. Limits apply at two levels: <strong>Real-time Rate Limits (RPS)</strong> and <strong>Monthly Usage Quotas</strong>.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Limit Types</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <h3 className="font-semibold text-lg mb-2">Rate Limit (RPS)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Protects the system from bursts.
                            <br />Enforced via Token Bucket algorithm.
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono">50 - 100</span>
                            <span className="text-xs text-muted-foreground uppercase">req / sec</span>
                        </div>
                    </div>
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <h3 className="font-semibold text-lg mb-2">Monthly Quota</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Total requests allowed per billing cycle.
                            <br />Based on your subscription plan.
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono">1k - 100k+</span>
                            <span className="text-xs text-muted-foreground uppercase">req / month</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6 pt-6">
                <h2 className="text-2xl font-semibold">Response Headers</h2>
                <p className="text-muted-foreground">
                    Every API response includes headers indicating your current quota status.
                </p>
                <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-4 py-3">Header</th>
                                <th className="px-4 py-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="bg-card">
                                <td className="px-4 py-3 font-mono text-primary">X-Quota-Limit</td>
                                <td className="px-4 py-3 text-muted-foreground">Total monthly request limit for your plan.</td>
                            </tr>
                            <tr className="bg-card">
                                <td className="px-4 py-3 font-mono text-primary">X-Quota-Used</td>
                                <td className="px-4 py-3 text-muted-foreground">Requests consumed in the current period.</td>
                            </tr>
                            <tr className="bg-card">
                                <td className="px-4 py-3 font-mono text-primary">X-Quota-Remaining</td>
                                <td className="px-4 py-3 text-muted-foreground">Requests remaining before overage/blocking.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-6 pt-6">
                <h2 className="text-2xl font-semibold">Error Codes</h2>
                <div className="space-y-4">
                    <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold font-mono">429</span>
                            <h4 className="font-semibold text-red-900 dark:text-red-300">Rate Limit Exceeded</h4>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-400 mb-2">
                            You are sending requests too fast (RPS limit hit).
                        </p>
                        <p className="text-xs text-muted-foreground">
                            <strong>Action:</strong> Implement exponential backoff. Wait 1-2 seconds before retrying.
                        </p>
                    </div>

                    <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-bold font-mono">402</span>
                            <h4 className="font-semibold text-orange-900 dark:text-orange-300">Payment Required (Quota Exceeded)</h4>
                        </div>
                        <p className="text-sm text-orange-800 dark:text-orange-400 mb-2">
                            You have used all requests in your monthly quota.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            <strong>Action:</strong> Upgrade your plan in the dashboard to increase limits.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
