export default function RateLimits() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Rate Limits</h1>
                <p className="text-lg text-muted-foreground">
                    Fair use policies and API limits to ensure stability for all users.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Limits by Plan</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <h3 className="font-semibold text-lg mb-4 text-foreground">Public / Unauthenticated</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold tracking-tight">10</span>
                            <span className="text-sm text-muted-foreground">requests / min</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Good for testing and development usage.</p>
                    </div>
                    <div className="p-6 border border-primary/20 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-foreground">Authenticated</h3>
                            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded font-bold">PRO</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold tracking-tight text-primary">1,000</span>
                            <span className="text-sm text-muted-foreground">requests / min</span>
                        </div>
                        <p className="text-sm text-foreground/80">Standard limits for production API keys. Custom limits available.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Handling Rate Limits</h2>
                <p className="text-muted-foreground">
                    If you exceed the rate limit, the API will return a <code className="text-red-600 bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded">429 Too Many Requests</code> response.
                </p>
                <div className="p-4 border border-border rounded bg-muted/20 text-sm">
                    <strong className="block mb-2 text-foreground">Recommendation: Exponential Backoff</strong>
                    <p className="text-muted-foreground">
                        When you receive a 429, pause your requests for 1 second, then retry.
                        If it fails again, pause for 2 seconds, then 4 seconds, etc.
                        Check the <code>Retry-After</code> header for precise wait times.
                    </p>
                </div>
            </section>
        </div>
    )
}
