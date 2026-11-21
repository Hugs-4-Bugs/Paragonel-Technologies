import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

// Private paths blocked for EVERY crawler. Defence-in-depth: these are also
// gated by auth + carry an `X-Robots-Tag: noindex,nofollow` header set in
// next.config.ts headers(). robots.txt is NOT access control — the app
// enforces authorization server-side on every admin/auth/API route.
const privatePaths = ['/admin/', '/api/', '/auth/', '/profile'];

/**
 * robots.txt (SEO gap G9 / PART N). Public content is crawlable; admin, auth,
 * API and account routes are disallowed so private/draft content is never
 * crawled.
 *
 * AI crawler policy (Prompt 05I §5.4): reputable AI search + retrieval
 * crawlers are explicitly ALLOWED on public content, per user-agent — not a
 * broad wildcard. This is a deliberate decision to permit indexing/retrieval
 * by Google (Googlebot + Google-Extended), Bing, OpenAI (OAI-SearchBot +
 * GPTBot) and Anthropic (ClaudeBot + anthropic-ai). Allowing a crawler does
 * NOT guarantee inclusion in its answers or search results. Private paths
 * remain disallowed for every agent. Search-indexing crawlers are not confused
 * with model-training crawlers — each user-agent is named explicitly so the
 * policy can be revised per-agent without side effects.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'Googlebot', allow: '/', disallow: privatePaths },
      { userAgent: 'Google-Extended', allow: '/', disallow: privatePaths },
      { userAgent: 'Bingbot', allow: '/', disallow: privatePaths },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: privatePaths },
      { userAgent: 'GPTBot', allow: '/', disallow: privatePaths },
      { userAgent: 'ClaudeBot', allow: '/', disallow: privatePaths },
      { userAgent: 'anthropic-ai', allow: '/', disallow: privatePaths },
      { userAgent: '*', allow: '/', disallow: privatePaths },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
