import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from '@/components/Providers';
import { FooterWrapper } from '@/components/FooterWrapper';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ConsentBanner } from '@/components/analytics/ConsentBanner';
import { ShareAttribution } from '@/components/analytics/ShareAttribution';
import { RealUserMonitoring } from '@/components/analytics/RealUserMonitoring';
import { generateOrganizationSchema, generateWebSiteSchema, constructCanonical } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap', // [Enterprise] Ensure swap to avoid invisible text
  preload: true, // [Enterprise] Preload critical LCP font
});

// [Enterprise] Strict Preloading: Only LCP assets (Fonts in this case)
// No random preloads for non-critical scripts

export const metadata: Metadata = {
  metadataBase: new URL('https://txproof.xyz'),
  verification: {
    google: 'qqKLsD62JCrHlaIcPeLmWB3jUJIZ1GiMY5-N1bN-cOM',
  },
  title: {
    default: 'TxProof | Professional Blockchain Intelligence',
    template: '%s | TxProof',
  },
  description: 'Enterprise-grade blockchain documentation. Generate audit-ready receipts for transactions on Base, Ethereum, and more. Zero data retention.',
  keywords: ['blockchain receipt', 'crypto tax tool', 'on-chain invoice', 'web3 accounting', 'base chain receipt', 'transaction semantics', 'audit transparency'],
  openGraph: {
    title: 'TxProof | Professional Blockchain Intelligence',
    description: 'Transform on-chain data into audit-grade documentation.',
    type: 'website',
    siteName: 'TxProof',
    images: [
      {
        url: '/og/chain-receipt.png', // Keep old image filename if not replacing assets yet, or update if exists. Assuming keep for now.
        width: 1200,
        height: 630,
        alt: 'TxProof - Professional Blockchain Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TxProof | Professional Blockchain Intelligence',
    description: 'Transform on-chain data into audit-grade documentation.',
    images: ['/og/chain-receipt.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  alternates: {
    canonical: constructCanonical('/'),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0a0a0a] min-h-screen text-white antialiased selection:bg-violet-500/30 font-sans flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] px-4 py-2 bg-violet-600 text-white font-bold rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-white">
          Skip to content
        </a>
        <Providers>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteSchema()) }}
          />
          <GoogleAnalytics />
          <ConsentBanner />
          <Suspense fallback={null}>
            <ShareAttribution />
          </Suspense>
          <RealUserMonitoring /> {/* [Enterprise] RUM */}
          {children}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
