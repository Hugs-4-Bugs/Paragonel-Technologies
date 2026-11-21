import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// metadataBase resolves relative Open Graph / canonical URLs site-wide.
// The verified live deployment origin is paragonel.vercel.app (Phase 0 audit).
// Override per-environment with NEXT_PUBLIC_SITE_URL if a custom domain ships.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Paragonel Technologies — Engineering Digital Products That Move Businesses Forward',
    template: '%s | Paragonel Technologies',
  },
  description:
    'Paragonel Technologies designs and engineers AI-powered systems, intelligent automation, scalable SaaS platforms and cloud-native applications that turn complex business challenges into practical digital products.',
  applicationName: 'Paragonel Technologies',
  keywords: [
    'Paragonel',
    'Paragonel Technologies',
    'AI engineering',
    'custom software development',
    'cloud and DevOps',
    'data and analytics',
    'AcquisitionOS',
    'SaaS product engineering',
    'India software company',
  ],
  authors: [{ name: 'Prabhat Kumar', url: siteUrl + '/about' }],
  creator: 'Paragonel Technologies Pvt. Ltd.',
  publisher: 'Paragonel Technologies Pvt. Ltd.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Paragonel Technologies',
    title: 'Paragonel Technologies — Engineering Digital Products That Move Businesses Forward',
    description:
      'AI-powered systems, intelligent automation, scalable SaaS platforms and cloud-native applications — engineered by Paragonel Technologies.',
    // Fallback social image: the brand app icon (real, served at /icon.png).
    // A dedicated 1200x630 Open Graph image is recommended (MANUAL — design).
    images: [{ url: '/icon.png', alt: 'Paragonel Technologies' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paragonel Technologies — Shaping the Future',
    description:
      'AI-powered systems, intelligent automation, scalable SaaS platforms and cloud-native applications — engineered by Paragonel Technologies.',
    images: ['/icon.png'],
  },
  // Declared explicitly (not just relying on Next.js file-convention auto-
  // detection) so the icon/manifest links survive file renames. All assets
  // exist: src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico,
  // src/app/manifest.webmanifest (+ public/icon-192.png etc.).
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#0f172a',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

// JSON-LD Organization structured data (SEO gap G9 / PART N). Verified facts
// only — no invented awards, team size, founding-year metrics, or members.
// `sameAs` is intentionally empty until the founder provides verified social
// profile URLs (LinkedIn / X / GitHub / Crunchbase) — MANUAL, do not invent.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Paragonel Technologies',
  legalName: 'Paragonel Technologies Pvt. Ltd.',
  url: siteUrl,
  slogan: 'Shaping the Future',
  description:
    'Paragonel Technologies designs and engineers AI-powered systems, intelligent automation, scalable SaaS platforms and cloud-native applications.',
  email: 'contact@paragonel.com',
  telephone: '+91 9663076023',
  founder: {
    '@type': 'Person',
    name: 'Prabhat Kumar',
    jobTitle: 'Founder & CEO',
  },
  sameAs: [] as string[],
};

// JSON-LD WebSite entity (Prompt 05I §5.5). Site-wide, alongside Organization.
// Communicates the site name to search engines for Knowledge Graph + rich
// results. `potentialAction` SearchAction is omitted because the site has no
// search feature — do not declare a target the site cannot fulfil.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Paragonel Technologies',
  url: siteUrl,
  publisher: { '@type': 'Organization', name: 'Paragonel Technologies' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell fontClass={`${geistSans.variable} ${geistMono.variable}`}>
          {children}
        </AppShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </body>
    </html>
  );
}
