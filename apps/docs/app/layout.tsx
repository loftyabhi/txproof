import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { constructCanonical } from "@/lib/seo";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "TxProof API Docs | Professional Blockchain Intelligence",
    template: "%s | TxProof API Docs"
  },
  description: "Detailed developer documentation for the TxProof API. Learn how to generate verifiable on-chain receipts.",
  alternates: {
    canonical: constructCanonical("/"),
  },
  openGraph: {
    title: "TxProof API Documentation",
    description: "The standard for verifiable on-chain receipts.",
    url: "https://docs.txproof.xyz",
    siteName: "TxProof",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TxProof API Docs",
    description: "Developer Documentation for TxProof API",
  },
};

import { DocsLayout } from "@/components/layout/DocsLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <DocsLayout>{children}</DocsLayout>
      </body>
    </html>
  );
}
