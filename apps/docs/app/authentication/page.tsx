import { CodeBlock } from "@/components/ui/CodeBlock";

export default function Authentication() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Authentication</h1>
                <p className="text-lg text-muted-foreground">
                    The TxProof API uses API keys to authenticate requests.
                    You can view and manage your API keys in the <a href="#" className="underline decoration-primary underline-offset-4">Dashboard</a>.
                </p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Passing the API Key</h2>
                <p className="text-muted-foreground">
                    Include your API key in the <code className="text-sm bg-muted px-1.5 py-0.5 rounded border border-border">x-api-key</code> header of every request.
                </p>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Example Request:</p>
                    <CodeBlock
                        language="bash"
                        code={`curl https://api.txproof.xyz/api/v1/bills/resolve \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '...'`}
                    />
                </div>
            </section>

            <section className="space-y-4 border-l-4 border-amber-500/50 pl-6 py-4 bg-amber-500/5 rounded-r-lg">
                <h3 className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2">
                    Security Note
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Your API keys carry many privileges, so be sure to keep them secure!
                    Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                    If you suspect a key has been compromised, roll it immediately in the Dashboard.
                </p>
            </section>
        </div>
    )
}
