"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { docsConfig } from "@/config/docs";

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <aside className={cn("hidden lg:block w-72 h-screen sticky top-0 border-r border-border bg-background", className)}>
            <div className="h-full py-6 pl-8 pr-6 overflow-y-auto">
                <div className="mb-8 pl-2">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">TX</div>
                        <span className="font-bold text-lg tracking-tight">TxProof</span>
                    </Link>
                </div>
                <nav className="space-y-8">
                    {docsConfig.nav.map((section, i) => (
                        <div key={i}>
                            <h4 className="font-semibold mb-3 px-2 text-sm text-foreground/70">
                                {section.title}
                            </h4>
                            <ul className="space-y-1">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "block px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                                pathname === item.href
                                                    ? "text-primary font-medium bg-muted/50"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {pathname === item.href && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r -ml-2" />
                                            )}
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
