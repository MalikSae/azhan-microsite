import { headers } from 'next/headers';

export default async function robots() {
  const headersList = await headers();
  const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || 'azhan.test';
  const host = rawHost.split(':')[0].trim();
  const proto = headersList.get('x-forwarded-proto') || 'https';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/portal/',
          '/brand-not-found',
          '/api/',
          '/brand-icon/',
          '/_next/',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-Web',
          'Google-Extended',
          'Applebot-Extended',
          'Amazonbot',
          'cohere-ai',
        ],
        allow: '/',
        disallow: [
          '/portal/',
          '/brand-not-found',
          '/api/',
        ],
      },
    ],
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}
