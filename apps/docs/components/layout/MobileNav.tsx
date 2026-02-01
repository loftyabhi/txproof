"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    return (
        <>
            <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">CR</div>
                        Docs
                    </span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle Menu"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 top-[53px] z-40 bg-background lg:hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto pb-10">
                        {/* Force display block and remove border params that might conflict */}
                        <Sidebar className="block w-full h-auto border-none static bg-transparent" />
                    </div>
                </div>
            )}
        </>
    );
}
