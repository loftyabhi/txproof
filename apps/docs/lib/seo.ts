import { Metadata } from 'next';

export const BRAND = "TxProof Docs";
export const DOMAIN = "https://docs.txproof.xyz";

// --- Canonical URL Construction ---

/**
 * Constructs a canonical URL for the documentation.
 * @param path The relative path (e.g., '/quick-start')
 * @param version Optional versioning (e.g., 'v1', 'latest'). If provided, inserts into path.
 */
export function constructCanonical(path: string = '', version?: string): string {
    const baseUrl = DOMAIN;
    let cleanPath = path.toLowerCase().replace(/\/$/, '');

    // Handle versioning
    if (version) {
        const vPrefix = version.startsWith('/') ? version : `/${version}`;
        cleanPath = `${vPrefix}${cleanPath}`;
    }

    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}

// --- Structured Data Generators (JSON-LD) ---

export type BreadcrumbItem = {
    name: string;
    item: string;
    version?: string;
};

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: constructCanonical(item.item, item.version),
        })),
    };
}

export function generateTechArticleSchema(
    title: string,
    description: string,
    path: string,
    version?: string
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: title,
        description: description,
        author: {
            '@type': 'Organization',
            name: "TxProof",
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': constructCanonical(path, version),
        },
    };
}
