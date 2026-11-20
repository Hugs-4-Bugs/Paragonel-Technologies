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
        hostname: 'acquisitionos.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
