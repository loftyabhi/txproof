import { MetadataRoute } from 'next';

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
      'https://txproof.xyz/sitemap.xml',
      'https://txproof.xyz/llm-sitemap.xml',
    ],
  };
}
