import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { DevelopersClient } from '@/components/console/DevelopersClient';
import { DashboardLoader } from '@/components/console/DashboardLoader';
import { constructCanonical, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Developer Console | API Management',
    description: 'Manage your TxProof API keys, monitor usage, and integrate semantic blockchain analysis into your application.',
    alternates: {
        canonical: constructCanonical('/developers'),
    },
    robots: {
        index: false,
        follow: true,
    }
};

const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Developers', item: '/developers' },
];

export default function DevelopersPage() {
    return (
        <div className="min-h-screen bg-black">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)) }}
            />
            <Suspense fallback={
                <div className="min-h-screen bg-black text-white p-8">
                    <div className="max-w-6xl mx-auto mt-20">
                        <DashboardLoader />
                    </div>
                </div>
            }>
                <DevelopersClient />
            </Suspense>
        </div>
    );
}
