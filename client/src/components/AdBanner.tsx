'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';

interface Ad {
    id: string;
    contentHtml: string;
    clickUrl?: string;
}

export default function AdBanner() {
    const [ad, setAd] = useState<Ad | null>(null);

    useEffect(() => {
        axios.get('http://localhost:3002/api/v1/ads/random?placement=web')
            .then(res => {
                if (res.data) setAd(res.data);
            })
            .catch(err => console.error("Failed to fetch ad", err));
    }, []);

    if (!ad) return null;

    return (
        <div className="w-full max-w-4xl mx-auto my-8 relative group">
            {/* Label */}
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 backdrop-blur-md rounded text-[10px] font-bold text-purple-300 uppercase tracking-widest z-20">
                Sponsored
            </div>

            {/* Content Card */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">

                {/* Clickable Area */}
                <a href={ad.clickUrl || '#'} target="_blank" rel="noopener noreferrer" className="block relative z-10">

                    {/* Ad Content */}
                    <div
                        dangerouslySetInnerHTML={{ __html: ad.contentHtml }}
                        className="prose prose-invert prose-sm max-w-none [&_img]:w-full [&_img]:h-auto [&_img]:object-cover [&_img]:rounded-b-xl [&_iframe]:!w-full [&_iframe]:min-h-[250px] [&_iframe]:border-none block"
                    />
                </a>

                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Visit Button (shows on hover) */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                    <span className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition-colors">
                        Visit Site <ExternalLink size={12} />
                    </span>
                </div>
            </div>
        </div>
    );
}
