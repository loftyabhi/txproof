import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import React from 'react';

interface DocsLayoutProps {
    children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background text-foreground flex-col lg:flex-row">
            <MobileNav />
            <Sidebar />
            <main className="flex-1 min-w-0">
                <div className="max-w-5xl px-6 py-8 lg:px-12 lg:py-12 mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
