"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TabsProps {
    items: { label: string; value: string; content: React.ReactNode }[];
    defaultValue?: string;
    className?: string;
}

export function Tabs({ items, defaultValue, className }: TabsProps) {
    const [activeTab, setActiveTab] = React.useState(defaultValue || items[0].value);

    return (
        <div className={cn("w-full my-6", className)}>
            <div className="flex border-b border-border">
                {items.map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setActiveTab(item.value)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === item.value
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {item.label}
                        {activeTab === item.value && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>
            <div className="mt-4">
                {items.find((item) => item.value === activeTab)?.content}
            </div>
        </div>
    );
}
