import { MetadataRoute } from 'next';

const BASE_URL = 'https://docs.txproof.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/quick-start',
        '/authentication',
        '/developer-console',
        '/reference',
        '/status-lifecycle',
        '/errors',
        '/rate-limits',
        '/best-practices',
        '/playground',
    ];

    return routes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
    }));
}
