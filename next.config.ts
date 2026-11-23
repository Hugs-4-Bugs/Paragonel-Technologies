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
  //
  // Security headers (Prompt 05N §5): applied to ALL routes via the `/:path*`
  // base entry. HSTS, nosniff, Referrer-Policy, Permissions-Policy + X-Frame-
  // Options are unambiguous hardening with no breakage. The CSP is conservative:
  //   - script-src allows 'unsafe-inline' because Next.js emits inline hydration
  //     scripts + GA4 uses an inline init (the app is not nonce-instrumented).
  //     A nonce-based CSP removing 'unsafe-inline' is the documented follow-up
  //     for full XSS protection; the CSP here still adds value via connect-src
  //     (blocks exfiltration to attacker domains even on XSS), frame-ancestors
  //     (clickjacking), base-uri, form-action, and object-src.
  //   - 'unsafe-eval' is included ONLY in dev (Next.js dev/HMR needs it);
  //     production builds do not require eval.
  //   - connect-src whitelists the Firebase client SDK endpoints
  //     (identitytoolkit / securetoken / firestore / storage) + GA4. Firebase
  //     realtime uses wss://<project>.firebaseio.com.
  //   - img-src allows any https image (next/image remotePatterns + Firebase
  //     storage URLs); images are not an XSS vector.
  async headers() {
    const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Cloudflare Turnstile (CAPTCHA, Prompt 05Q §3) — script + iframe + fetch.
      "frame-src 'self' https://challenges.cloudflare.com",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://challenges.cloudflare.com"
        : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.google-analytics.com https://*.google-analytics.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join('; ');
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: csp },
    ];
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [noindex] },
      { source: '/auth/:path*', headers: [noindex] },
      { source: '/profile/:path*', headers: [noindex] },
      { source: '/candidate/:path*', headers: [noindex] },
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
