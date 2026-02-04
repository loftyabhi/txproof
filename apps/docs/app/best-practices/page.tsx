import { Metadata } from 'next';
import { constructCanonical, generateBreadcrumbSchema, generateTechArticleSchema } from "@/lib/seo";

export const metadata: Metadata = {
    title: 'Best Practices',
    description: 'Expert recommendations for building reliable and efficient TxProof API integrations. Learn polling optimization and caching strategies.',
    alternates: {
        canonical: constructCanonical('/best-practices'),
    },
};

const breadcrumbs = [
    { name: "Docs", item: "/" },
    { name: "Best Practices", item: "/best-practices" },
];

const schema = generateTechArticleSchema(
    'TxProof API Best Practices',
    'Production-ready integration patterns and optimization techniques for TxProof developers.',
    '/best-practices'
);

export default function BestPractices() {
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
                <h1 className="text-4xl font-bold tracking-tight">Best Practices</h1>
                <p className="text-lg text-muted-foreground">
                    Tips for building reliable and efficient integrations.
                </p>
            </div>

            <div className="grid gap-8">
                <section className="space-y-4 p-6 border border-border rounded-xl bg-card">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground text-sm font-bold">1</span>
                        Optimize Polling
                    </h2>
                    <div className="pl-10 space-y-4">
                        <p className="text-muted-foreground">
                            Do not poll continuously in a tight loop without a delay.
                            We recommend a <strong>2000ms (2s)</strong> interval between checks.
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Use a linear backoff if the job is still <code className="text-xs">processing</code> after 10s.</li>
                            <li>Stop polling if you receive a <code className="text-xs">completed</code> or <code className="text-xs">failed</code> status.</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-4 p-6 border border-border rounded-xl bg-card">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground text-sm font-bold">2</span>
                        Cache Results
                    </h2>
                    <div className="pl-10 space-y-4">
                        <p className="text-muted-foreground">
                            Receipt PDFs are immutable for a given transaction. Once you have the `pdfUrl`,
                            store it in your database. <strong>Do not regenerate receipts</strong> for every user view.
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 p-4 rounded text-sm text-yellow-800 dark:text-yellow-200">
                            Receipt generation costs compute resources. Redundant requests may eat into your rate limits.
                        </div>
                    </div>
                </section>

                <section className="space-y-4 p-6 border border-border rounded-xl bg-card">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground text-sm font-bold">3</span>
                        Handle Async Flows UI
                    </h2>
                    <div className="pl-10 space-y-4">
                        <p className="text-muted-foreground">
                            Since generation is not instant, provide feedback to your users.
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Show a "Generating Receipt..." spinner.</li>
                            <li>Use optimistic UI updates if possible (though difficult for receipts).</li>
                            <li>Implement a webhook listener (if available) for large batch processing instead of polling.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
