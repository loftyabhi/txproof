import { CodeBlock } from "@/components/ui/CodeBlock";
import Link from "next/link";
import { Metadata } from 'next';
import { constructCanonical, generateBreadcrumbSchema, generateTechArticleSchema } from "@/lib/seo";

export const metadata: Metadata = {
    title: 'Authentication',
    description: 'Learn how to secure your TxProof API requests using API Keys and JWT tokens. Security best practices for backend integrations.',
    alternates: {
        canonical: constructCanonical('/authentication'),
    },
};

const breadcrumbs = [
    { name: "Docs", item: "/" },
    { name: "Authentication", item: "/authentication" },
];

const schema = generateTechArticleSchema(
    'TxProof API Authentication Guide',
    'Technical guide on securing API communication with TxProof using hybrid authentication.',
    '/authentication'
);

export default function Authentication() {
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
                <h1 className="text-4xl font-bold tracking-tight">Authentication</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    TxProof employs a <strong>Hybrid Authentication Model</strong> to secure the API while allowing flexibility for different use cases.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <section className="p-6 border border-border rounded-xl bg-card space-y-3">
                    <h3 className="font-semibold text-xl">API Keys (Machine)</h3>
                    <p className="text-sm text-muted-foreground">
                        Standard method for backend integrations. Long-lived, revokable keys with specific permissions and quotas.
                    </p>
                    <div className="flex gap-2 text-xs font-mono">
                        <span className="bg-muted px-2 py-1 rounded">X-API-Key</span>
                        <span className="bg-muted px-2 py-1 rounded">Bearer sk_...</span>
                    </div>
                </section>
                <section className="p-6 border border-border rounded-xl bg-card space-y-3">
                    <h3 className="font-semibold text-xl">User JWT (Dashboard)</h3>
                    <p className="text-sm text-muted-foreground">
                        Short-lived tokens for frontend/dashboard access. Generated via SIWE (Sign-In with Ethereum).
                    </p>
                    <div className="flex gap-2 text-xs font-mono">
                        <span className="bg-muted px-2 py-1 rounded">Bearer eyJ...</span>
                    </div>
                </section>
            </div>

            <section id="api-keys" className="space-y-6 pt-8">
                <h2 className="text-2xl font-semibold tracking-tight">Using API Keys</h2>
                <p className="text-muted-foreground">
                    API Keys are the primary way to interact with the TxProof API. You can create and manage keys in the <Link href="https://txproof.xyz/dashboard/settings" className="text-primary hover:underline">Dashboard Settings</Link>.
                </p>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Header Format</h3>
                    <p className="text-sm text-muted-foreground">
                        You can pass your API key in one of two ways. The <code>X-API-Key</code> header is preferred for clarity.
                    </p>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Option 1: Custom Header (Preferred)</p>
                        <CodeBlock language="bash" code={`X-API-Key: sk_live_59...`} />
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Option 2: Authorization Bearer (Legacy)</p>
                        <CodeBlock language="bash" code={`Authorization: Bearer sk_live_59...`} />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium">Example Request</h3>
                    <CodeBlock
                        language="bash"
                        code={`curl https://api.txproof.xyz/api/v1/bills/resolve \\
  -X POST \\
  -H "X-API-Key: sk_live_59..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "txHash": "0x5d962...",
    "chainId": 1
  }'`}
                    />
                </div>
            </section>

            <section id="security" className="space-y-4 border-l-4 border-amber-500/50 pl-6 py-4 bg-amber-500/5 rounded-r-lg">
                <h3 className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2">
                    Security Rules
                </h3>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2">
                    <li><strong>Secret Keys:</strong> Keys starting with <code>sk_</code> are secret. Never expose them in client-side code (browsers, mobile apps).</li>
                    <li><strong>Rotation:</strong> If a key is compromised, immediately revoke it in the dashboard and generate a new one.</li>
                    <li><strong>Permissions:</strong> Provide only necessary scopes when creating keys (e.g. Read-Only for monitoring).</li>
                </ul>
            </section>
        </div>
    )
}
