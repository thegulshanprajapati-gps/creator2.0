import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPPORT_SITE_URL || 'http://localhost:4000';
  
  // Admin / Support site static paths
  const staticPaths = [
    '',
    '/login',
    '/analytics',
    '/blogs',
    '/cms',
    '/community',
    '/connections',
    '/courses',
    '/courses-explorer',
    '/faq',
    '/pages',
    '/privacy',
    '/realtime',
    '/refund',
    '/settings',
    '/staff',
    '/terms',
    '/tests',
    '/theme',
    '/updates',
    '/users',
  ];

  return staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.5,
  }));
}
