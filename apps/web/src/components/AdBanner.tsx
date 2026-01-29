import { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Ad {
    id: string;
    contentHtml: string;
    clickUrl?: string;
    imageUrl?: string;
}

// Helper: Extract Supabase Image URL from HTML
function extractSupabaseImg(html: string): string | null {
    const imgMatch = html.match(/<img[^>]+src=["'](https:\/\/[^"']+\.supabase\.co[^"']*)["'][^>]*>/i);
    return imgMatch ? imgMatch[1] : null;
}

// Helper: Extract Href Link from HTML
function extractHref(html: string): string | null {
    const linkMatch = html.match(/<a[^>]+href=["'](.*?)["'][^>]*>/i);
    return linkMatch ? linkMatch[1] : null;
}

export default function AdBanner() {
    const [ad, setAd] = useState<Ad | null>(null);

    useEffect(() => {
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/random?placement=web`)
            .then(res => {
                if (res.data) setAd(res.data);
            })
            .catch(err => console.error("Failed to fetch ad", err));
    }, []);

    // Fallback: Show a-ads if no ad is returned from backend
    if (!ad) {
        return (
            <div className="w-full flex justify-center my-8">
                <div className="relative w-[320px] h-[50px] md:w-[728px] md:h-[90px] overflow-hidden">
                    <iframe
                        data-aa='2423044'
                        src='//acceptable.a-ads.com/2423044/?size=Adaptive'
                        style={{ border: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden', display: 'block', margin: 'auto' }}
                    />
                </div>
            </div>
        );
    }

    // Determine Render Strategy
    // 1. Explicit Internal Ad Check (DB field)
    // 2. Implicit Detection: Check properly for Supabase assets in HTML
    const detectedImage = ad.imageUrl || extractSupabaseImg(ad.contentHtml);
    const detectedLink = ad.clickUrl || extractHref(ad.contentHtml) || '#';

    // Promote to Internal if we have a valid Supabase image
    const isInternal = !!detectedImage;

    // Responsive Logic: 
    // - Internal: Auto height to fit custom aspect ratios
    // - External: Fixed height (Standard Leaderboard)
    const containerClasses = isInternal
        ? "relative w-full max-w-[320px] md:max-w-[728px] h-auto group transition-all duration-300"
        : "relative w-full max-w-[320px] h-[50px] md:max-w-[728px] md:h-[90px] group transition-all duration-300";

    return (
        <div className="w-full flex justify-center my-8 px-4">
            {/* Conditional Container */}
            <div className={containerClasses}>
                {/* Label */}
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 backdrop-blur-md rounded text-[10px] font-bold text-purple-300 uppercase tracking-widest z-20">
                    Advertisement
                </div>

                {/* Content Card */}
                <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 w-full ${isInternal ? 'h-auto' : 'h-full'}`}>

                    {/* Check Strategy */}
                    {isInternal ? (
                        // [Strategy 1] Internal / Supabase Ads (Explicit or Detected)
                        <a href={detectedLink} target="_blank" rel="noopener noreferrer" className="block relative z-10 w-full">
                            <img
                                src={detectedImage!}
                                alt="Sponsored Content"
                                style={{ width: '100%', height: 'auto' }}
                                loading="lazy"
                                decoding="async"
                                className="block w-full"
                            />
                        </a>
                    ) : (
                        // [Strategy 2] Standard Third-Party / HTML / Iframe Ads (Render Normally)
                        <div className="h-full w-full bg-black/60 flex items-center justify-center">
                            <iframe
                                srcDoc={`<style>body{margin:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;width:100vw;} iframe, img { width: 100% !important; height: 100% !important; border: none !important; object-fit: contain; }</style>${ad.contentHtml}`}
                                title="Ad Content"
                                className="w-full h-full border-none"
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* Hover Overlay Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Visit Button (shows on hover) */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                        <span className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-colors">
                            Visit Site <ExternalLink size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
