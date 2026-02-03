import { CodeBlock } from "@/components/ui/CodeBlock";
import Link from "next/link";

export default function Authentication() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Authentication</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    TxProof supports two distinct authentication methods depending on your integration needs:
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <section className="p-6 border border-border rounded-xl bg-card space-y-3">
                    <h3 className="font-semibold text-xl">API Keys</h3>
                    <p className="text-sm text-muted-foreground">Used for <strong>Machine-to-Machine</strong> communication and programmatic receipt generation via our REST API.</p>
                    <Link href="#passing-api-key" className="text-sm text-primary hover:underline">View implementation &rarr;</Link>
                </section>
                <section className="p-6 border border-border rounded-xl bg-card space-y-3">
                    <h3 className="font-semibold text-xl">Wallet Login (SIWE)</h3>
                    <p className="text-sm text-muted-foreground">Used for <strong>Human-to-Machine</strong> interactions via the <Link href="/developer-console" className="text-primary hover:underline">Developer Console</Link>.</p>
                    <Link href="/developer-console" className="text-sm text-primary hover:underline">Learn about SIWE &rarr;</Link>
                </section>
            </div>

            <section id="passing-api-key" className="space-y-4 pt-8">
                <h2 className="text-2xl font-semibold tracking-tight">Programmatic Access (API Keys)</h2>
                <p className="text-muted-foreground">
                    Include your API key in the <code className="text-sm bg-muted px-1.5 py-0.5 rounded border border-border">x-api-key</code> header of every request.
                </p>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Example Request:</p>
                    <CodeBlock
                        language="bash"
                        code={`curl https://api.txproof.xyz/api/v1/bills/resolve \\
  -H "x-api-key: your_sk_live_..." \\
  -d '{ "txHash": "0x...", "chainId": 8453 }'`}
                    />
                </div>
            </section>

            <section className="space-y-4 border-l-4 border-amber-500/50 pl-6 py-4 bg-amber-500/5 rounded-r-lg">
                <h3 className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2">
                    Security Best Practices
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    API keys carry significant privileges. **Never** expose them in client-side code, public repositories (like GitHub), or unencrypted logging systems.
                    If a key is compromised, revoke it immediately in the <a href="https://txproof.xyz/developers" className="text-primary hover:underline" target="_blank">Developer Console</a>.
                </p>
            </section>
        </div>
    )
}
