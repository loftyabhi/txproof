import { MetadataRoute } from 'next';
import { DOMAIN } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/print/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'Amazonbot',
          'Applebot',
        ],
        allow: ['/'],
        disallow: ['/api/', '/print/'],
      },
    ],
    sitemap: [
      `${DOMAIN}/sitemap.xml`,
      `${DOMAIN}/llm-sitemap.xml`,
    ],
  };
}
