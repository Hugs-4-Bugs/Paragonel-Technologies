import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Phase 1 (G12): the 39 previously-masked TypeScript errors are now fixed
  // (`tsc --noEmit` is clean), so build-time type checking is re-enabled.
  // ESLint remains disabled at build time because the repo has no ESLint
  // configuration (pre-existing condition, tracked separately).
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'acquisitionosbeta.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Defence-in-depth against indexing of private routes. The admin console,
  // auth flows and account profile are blocked from crawling by robots.txt
  // Disallow AND receive an `X-Robots-Tag: noindex,nofollow` response header
  // here. robots.txt alone does NOT prevent a linked URL from being indexed
  // (Google may show a URL-only result); the header closes that gap. The admin
  // layout is a client component (cannot export `metadata`), so the header is
  // the reliable mechanism. Actual authorization is still enforced server-side
  // on every /api/admin/** route via verifyAdmin/verifyAdminPermission.
  async headers() {
    const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };
    return [
      { source: '/admin/:path*', headers: [noindex] },
      { source: '/auth/:path*', headers: [noindex] },
      { source: '/profile/:path*', headers: [noindex] },
    ];
  },
  // Permanent (308) redirects for legacy/renamed service + team URLs so link
  // equity consolidates on the canonical destination. Previously these were
  // in-route `redirect()` calls defaulting to 307 (temporary), which does not
  // consolidate equity. 308 preserves the request method + signals permanence.
  // The old in-route stub pages become unreachable (config redirects fire
  // before filesystem routing) — left in place to avoid churn, but effectively
  // superseded.
  async redirects() {
    return [
      { source: '/team', destination: '/about', permanent: true },
      { source: '/services/ai-automation', destination: '/services/ai-solutions', permanent: true },
      { source: '/services/cloud-infrastructure', destination: '/services/cloud-devops', permanent: true },
      { source: '/services/custom-platform', destination: '/services/custom-software', permanent: true },
      { source: '/services/devops-automation', destination: '/services/cloud-devops', permanent: true },
      { source: '/services/fractional-cto', destination: '/about', permanent: true },
      { source: '/services/mobile-apps', destination: '/services/custom-software', permanent: true },
      { source: '/services/saas-platforms', destination: '/services/custom-software', permanent: true },
    ];
  },
};

export default nextConfig;
