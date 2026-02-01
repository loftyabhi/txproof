import { cn } from "@/lib/utils";

export function Endpoint({ method, path, children }: { method: "GET" | "POST" | "PUT" | "DELETE", path: string, children: React.ReactNode }) {
    return (
        <div className="border border-border rounded-lg overflow-hidden mb-12 bg-card">
            <div className="bg-muted/30 border-b border-border p-4 flex items-center gap-4 font-mono text-sm">
                <span className={cn(
                    "px-2.5 py-1 rounded-md font-bold text-xs border",
                    method === "GET" && "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
                    method === "POST" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900",
                    method === "DELETE" && "bg-red-500/10 text-red-600 border-red-500/20",
                    method === "PUT" && "bg-orange-500/10 text-orange-600 border-orange-500/20"
                )}>
                    {method}
                </span>
                <span className="text-foreground font-medium">{path}</span>
            </div>
            <div className="p-6 space-y-6">
                {children}
            </div>
        </div>
    )
}
