import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Loader2 } from 'lucide-react';
import { VerifyClient } from '@/components/verify/VerifyClient';
import { constructCanonical, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Verify Your Email',
    description: 'Complete your registration and activate your TxProof developer account to start generating audit-ready receipts.',
    alternates: {
        canonical: constructCanonical('/verify'),
    },
    robots: {
        index: false,
        follow: true,
    }
};

const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Verify', item: '/verify' },
];

export default function VerifyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)) }}
            />
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
                </div>

                <Suspense fallback={
                    <div className="flex flex-col items-center relative z-10">
                        <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                    </div>
                }>
                    <VerifyClient />
                </Suspense>
            </main>
        </div>
    );
}
