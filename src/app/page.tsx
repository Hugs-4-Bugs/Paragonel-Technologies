import type { Metadata } from 'next';
import { HomeHero } from '@/components/home/hero';
import { HomeProblems } from '@/components/home/problems';
import { HomeWhyParagonel } from '@/components/home/why-paragonel';
import { HomeCapabilities } from '@/components/home/capabilities';
import { HomeProducts } from '@/components/home/products';
import { HomePositioning } from '@/components/home/positioning';
import { HomeBlog } from '@/components/home/blog';
import { HomeApproach } from '@/components/home/approach';
import { HomeEngagement } from '@/components/home/engagement';
import { HomeConversion } from '@/components/home/conversion';
import { ClientShowcase } from '@/components/home/client-showcase';
import { getPublishedTestimonials, getPublishedClientProjects } from '@/lib/public-data';
import { TestimonialsMarquee } from '@/components/sections/testimonials-marquee';

// Page-specific metadata for the homepage (the root layout default is a
// fallback only). Uses title.absolute so the home page does not get the
// '%s | Paragonel Technologies' template suffix.
export const metadata: Metadata = {
  title: {
    absolute: 'Paragonel Technologies — Engineering AI-Native Systems, End-to-End',
  },
  description:
    'Paragonel Technologies Pvt. Ltd. engineers AI-native systems end-to-end — product engineering, AI & intelligent systems, cloud & platform engineering, data systems, and its own products (AcquisitionOS private beta, CodeGuard AI).',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Paragonel Technologies — Engineering AI-Native Systems, End-to-End',
    description:
      'Paragonel Technologies Pvt. Ltd. engineers AI-native systems end-to-end — product engineering, AI, cloud, data, and its own products.',
    type: 'website',
  },
};

/**
 * Paragonel homepage (Prompt 05A — reference-led visual transformation).
 *
 * Eight editorial sections, each with a distinct composition (NOT identical
 * rounded cards): hero → problems → why → capabilities → products → approach
 * → engagement → conversion. Framer Motion drives reveals/hover/parallax;
 * GSAP ScrollTrigger scrubs the approach connector + is registered site-wide
 * via SmoothScroll. Light theme is default; dark is fully readable.
 *
 * Existing routes, APIs, CMS, auth, blog, jobs, contact, AcquisitionOS and
 * services pages are untouched — only the homepage composition changed.
 */
const TICKER = [
  'Product Engineering',
  'AI & Intelligent Systems',
  'Cloud · Infrastructure · Platform',
  'Data Engineering & Analytics',
  'Experience & Interface',
];

// Revalidate so a newly published testimonial appears on the homepage within
// 60s (the admin mutation also purges '/' via revalidatePublicContent).
export const revalidate = 60;

export default async function HomePage() {
  // Published testimonials only (drafts/pending never leak). Empty until the
  // founder publishes real, approved client feedback — never fabricated.
  const testimonials = await getPublishedTestimonials();
  // Published client projects (Prompt 05L §2) — passed as raw serializable docs
  // to HomeProducts (a client component); the icon mapping happens client-side
  // so no function crosses the server→client boundary.
  const clientProjects = await getPublishedClientProjects();
  return (
    <>
      <HomeHero />

      {/* Restrained domain ticker — a motion transition, not a tech dump. */}
      <div className="border-y border-border bg-background">
        <div className="overflow-hidden py-4">
          <div className="pt-marquee">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-6 px-6">
                <span className="pt-index text-xs">{String((i % TICKER.length) + 1).padStart(2, '0')}</span>
                <span className="text-sm font-medium text-muted-foreground">{t}</span>
                <span className="text-border">/</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <HomeProblems />
      <div className="pt-shell"><div className="pt-hair" /></div>
      <HomeWhyParagonel />
      <HomeCapabilities />
      <HomeProducts clientProjects={clientProjects} />
      {testimonials.length > 0 ? (
        <TestimonialsMarquee
          testimonials={testimonials}
          heading="What clients say"
          subheading="Genuine feedback from organisations Paragonel has worked with directly."
        />
      ) : null}
      <HomePositioning />
      <HomeBlog />
      <div className="pt-shell"><div className="pt-hair" /></div>
      <HomeApproach />
      <HomeEngagement />
      <ClientShowcase />
      <HomeConversion />
    </>
  );
}
