import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

/**
 * Public sitemap (SEO gap G9 / PART N). Only public, indexable routes are
 * listed. Admin, auth, api, profile and dynamic draft content are excluded —
 * they must never be indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: '/', changeFrequency: 'weekly', priority: 1.0, lastModified },
    { url: '/services', changeFrequency: 'monthly', priority: 0.9, lastModified },
    { url: '/services/ai-solutions', changeFrequency: 'monthly', priority: 0.8, lastModified },
    { url: '/services/cloud-infrastructure', changeFrequency: 'monthly', priority: 0.8, lastModified },
    { url: '/services/devops-automation', changeFrequency: 'monthly', priority: 0.8, lastModified },
    { url: '/services/saas-platforms', changeFrequency: 'monthly', priority: 0.8, lastModified },
    { url: '/our-product', changeFrequency: 'monthly', priority: 0.9, lastModified },
    { url: '/our-product/acquisitionos', changeFrequency: 'weekly', priority: 0.9, lastModified },
    { url: '/about', changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: '/careers', changeFrequency: 'weekly', priority: 0.7, lastModified },
    { url: '/blog', changeFrequency: 'weekly', priority: 0.8, lastModified },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: '/testimonials', changeFrequency: 'monthly', priority: 0.6, lastModified },
    { url: '/faq', changeFrequency: 'monthly', priority: 0.5, lastModified },
    { url: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4, lastModified },
  ];

  return staticRoutes;
}
