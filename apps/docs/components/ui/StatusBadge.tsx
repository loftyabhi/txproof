import { cn } from "@/lib/utils";

export type Status = "pending" | "processing" | "completed" | "failed";

export function StatusBadge({ status }: { status: Status | string }) {
    const styles: Record<string, string> = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-900/50",
        processing: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/50",
        completed: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-900/50",
        failed: "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-900/50",
    };

    const defaultStyle = "bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-800";

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize inline-flex items-center",
            styles[status as string] || defaultStyle
        )}>
            {status}
        </span>
    );
}
