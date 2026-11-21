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

export default function HomePage() {
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
      <HomeProducts />
      <HomePositioning />
      <HomeBlog />
      <div className="pt-shell"><div className="pt-hair" /></div>
      <HomeApproach />
      <HomeEngagement />
      <HomeConversion />
    </>
  );
}
