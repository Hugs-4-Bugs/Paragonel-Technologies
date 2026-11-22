import { SelectedWorkSection } from '@/components/sections/selected-work-section';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import type { Metadata } from 'next';

// ISR so published client projects (CMS) appear within 60s of an admin
// mutation (revalidatePublicContent('clientProjects') also purges this route).
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Selected Work — Paragonel',
  description: 'Factual project engagements delivered by Paragonel Technologies.',
  alternates: { canonical: '/testimonials' },
};

/**
 * Server Component (Phase 1 §7 credibility). Previously this was a Client
 * Component reading the `testimonials` Firestore collection (which had no
 * rule → default-denied in production) and displaying a fabricated,
 * unapproved quote. Per the Content Truth Register §5, NO testimonials are
 * approved. This page now presents a factual Selected Work case study — no
 * fabricated quotes, metrics, or endorsements.
 */
export default function TestimonialsPage() {
  return (
    <>
      <section className="section-padding bg-background text-center">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Selected <span className="text-primary">Work</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Real engagements, presented factually. We do not publish client quotes or outcome metrics without evidence.
            </p>
          </ScrollFadeIn>
        </div>
      </section>
      <SelectedWorkSection />
    </>
  );
}
