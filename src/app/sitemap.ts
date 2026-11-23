import type { MetadataRoute } from 'next';
import { OFFERINGS } from '@/lib/services-catalogue';
import { getPublishedPosts, getPublicJobs } from '@/lib/public-data';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

// Revalidate hourly so newly published/removed blog articles (and future
// dynamic content) appear in the sitemap without a full rebuild.
export const revalidate = 3600;

/**
 * Public sitemap (SEO gap G9 / PART N). Only public, indexable routes are
 * listed. Admin, auth, api, profile and draft/unpublished content are excluded.
 *
 * - Static marketing routes are listed explicitly.
 * - The 13-domain / 23-offering catalogue detail pages (`/services/[slug]`)
 *   are generated from OFFERINGS (matches `generateStaticParams`).
 * - Published blog articles (`/blog/[slug]`) are pulled from Firestore via
 *   getPublishedPosts, with `lastModified` from each post's updatedAt /
 *   publishedAt / createdAt. Falls back to static seed posts when the Admin
 *   SDK is not configured at build time — never crashes.
 * - Legacy redirect URLs (e.g. /services/cloud-infrastructure) are NOT listed —
 *   a sitemap must contain only canonical, non-redirecting URLs.
 * - URLs are absolute, pinned to the verified canonical origin
 *   (paragonel.vercel.app, overridable via NEXT_PUBLIC_SITE_URL).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1.0, lastModified },
    { url: `${siteUrl}/services`, changeFrequency: 'monthly', priority: 0.9, lastModified },
    { url: `${siteUrl}/industries`, changeFrequency: 'monthly', priority: 0.8, lastModified },
    { url: `${siteUrl}/our-product`, changeFrequency: 'monthly', priority: 0.9, lastModified },
    { url: `${siteUrl}/our-product/acquisitionos`, changeFrequency: 'weekly', priority: 0.9, lastModified },
    { url: `${siteUrl}/our-product/systemfoundry`, changeFrequency: 'monthly', priority: 0.6, lastModified },
    { url: `${siteUrl}/our-product/codeguard-ai`, changeFrequency: 'monthly', priority: 0.6, lastModified },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: `${siteUrl}/careers`, changeFrequency: 'weekly', priority: 0.7, lastModified },
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.8, lastModified },
    { url: `${siteUrl}/portfolio`, changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.7, lastModified },
    { url: `${siteUrl}/testimonials`, changeFrequency: 'monthly', priority: 0.6, lastModified },
    { url: `${siteUrl}/faq`, changeFrequency: 'monthly', priority: 0.5, lastModified },
    { url: `${siteUrl}/privacy-policy`, changeFrequency: 'yearly', priority: 0.4, lastModified },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.4, lastModified },
    { url: `${siteUrl}/cookie-policy`, changeFrequency: 'yearly', priority: 0.4, lastModified },
  ];

  // Catalogue offering detail pages (/services/[slug]).
  const offeringRoutes: MetadataRoute.Sitemap = OFFERINGS.map((o) => ({
    url: `${siteUrl}/services/${o.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified,
  }));

  // Published blog articles (/blog/[slug]).
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts(100);
    blogRoutes = posts
      .filter((p: any) => p && p.slug)
      .map((p: any) => {
        const v = p.updatedAt || p.publishedAt || p.createdAt;
        const d = v ? new Date(v) : null;
        return {
          url: `${siteUrl}/blog/${p.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          lastModified: d && !isNaN(d.getTime()) ? d : lastModified,
        };
      });
  } catch {
    // Fall back silently — static + offering routes still ship.
  }

  // Active public job detail pages (/careers/[id]).
  let careersRoutes: MetadataRoute.Sitemap = [];
  try {
    const jobs = await getPublicJobs(100);
    careersRoutes = jobs
      .filter((j: any) => j && j.id)
      .map((j: any) => {
        const v = j.updatedAt || j.createdAt;
        const d = v ? new Date(v) : null;
        return {
          url: `${siteUrl}/careers/${j.id}`,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          lastModified: d && !isNaN(d.getTime()) ? d : lastModified,
        };
      });
  } catch {
    // Fall back silently.
  }

  return [...staticRoutes, ...offeringRoutes, ...blogRoutes, ...careersRoutes];
}
