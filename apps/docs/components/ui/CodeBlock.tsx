"use client";

import React, { useState } from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
    code: string;
    language: string;
    filename?: string;
    showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, filename, showLineNumbers }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const onCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-border bg-[#1e1e1e] my-4 text-sm w-full shadow-sm">
            {filename && (
                <div className="px-4 py-2 border-b border-border/10 bg-white/5 text-xs text-muted-foreground font-mono flex items-center justify-between">
                    <span>{filename}</span>
                </div>
            )}
            <div className="relative group">
                <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onCopy}
                        className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
                        aria-label="Copy code"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

                <Highlight
                    theme={themes.vsDark}
                    code={code.trim()}
                    language={language as Language}
                >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre style={{ ...style, backgroundColor: "transparent" }} className={cn(className, "p-4 overflow-x-auto font-mono text-sm leading-relaxed")}>
                            {tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line })} className="table-row">
                                    {showLineNumbers && (
                                        <span className="table-cell select-none opacity-30 text-right pr-4 w-8 border-r border-white/10 mr-4">
                                            {i + 1}
                                        </span>
                                    )}
                                    <span className="table-cell">
                                        {line.map((token, key) => (
                                            <span key={key} {...getTokenProps({ token })} />
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </pre>
                    )}
                </Highlight>
            </div>
        </div>
    );
}
