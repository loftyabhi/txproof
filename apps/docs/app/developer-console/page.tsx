import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "lucide-react";

export default function DeveloperConsoleGuide() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Developer Console</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    The Developer Console is your central hub for managing your TxProof account, API keys, and enterprise features.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
                <p className="text-muted-foreground">
                    Access the console at <a href="https://txproof.xyz/developers" className="text-primary hover:underline" target="_blank">txproof.xyz/developers</a>.
                    Authentication is handled via <strong>Sign-In with Ethereum (SIWE)</strong> for maximum security and identity sovereignty.
                </p>

                <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                    <h4 className="font-medium mb-2">Login Flow</h4>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                        <li>Connect your Ethereum wallet (MetaMask, Coinbase Wallet, etc.).</li>
                        <li>Sign a cryptographic nonce to verify ownership.</li>
                        <li>Receive a secure JWT session token.</li>
                    </ol>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Identity & Verification</h2>
                <p className="text-muted-foreground">
                    To access Pro and Enterprise features, including API key generation, you must verify your contact email.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <h3 className="font-semibold mb-2">Account Profile</h3>
                        <p className="text-sm text-muted-foreground">Set your display name and link social accounts (Twitter, GitHub, Telegram) for better support and visibility.</p>
                    </div>
                    <div className="p-6 border border-border rounded-lg bg-card">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            Email Verification
                            <StatusBadge status="completed" />
                        </h3>
                        <p className="text-sm text-muted-foreground">Verify your email to unlock production API access. Verification links expire after 15 minutes for your security.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6 text-sm">
                <h2 className="text-2xl font-semibold tracking-tight">API Key Management</h2>
                <p className="text-muted-foreground text-base">
                    Once verified, you can issue and manage your API keys. Every key is SHA-256 hashed before storage; we never store your raw keys.
                </p>

                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="py-2 pr-4 font-semibold">Feature</th>
                            <th className="py-2 pr-4 font-semibold">Control</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">Usage Quotas</td>
                            <td className="py-3 pr-4">Monitor your monthly request consumption in real-time.</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">IP Allowlisting</td>
                            <td className="py-3 pr-4">Restrict key usage to specific server IP addresses for enhanced security.</td>
                        </tr>
                        <tr className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">Revocation</td>
                            <td className="py-3 pr-4">Instantly rotate or revoke keys if they are compromised.</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
}
