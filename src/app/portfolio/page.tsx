import type { Metadata } from 'next';
import { SelectedWorkSection } from '@/components/sections/selected-work-section';

/**
 * /portfolio — Paragonel's Selected Work page (Prompt 05D §5).
 *
 * Previously this route redirected to /our-product. That was not an appropriate
 * permanent destination for a company Selected Work experience, so /portfolio is
 * now a real, meaningful page rendering the same verified project inventory that
 * drives the homepage work index and the /testimonials page.
 *
 * /our-product is preserved unchanged as the product index/catalogue.
 */
export const metadata: Metadata = {
  title: 'Selected Work | Paragonel',
  description:
    'Verified engineering work from Paragonel Technologies: AcquisitionOS (private beta), CodeGuard AI (published VS Code extension), SystemFoundry (internal tool), and the Maa Arogyam website engagement. No fabricated case studies or metrics.',
  alternates: { canonical: '/portfolio' },
};

export default function PortfolioPage() {
  return (
    <>
      <header className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(2rem, 5vw, 4rem)' }}>
          <span className="pt-eyebrow">Selected work</span>
          <h1 className="pt-display mt-6 text-foreground">Verified engineering work.</h1>
          <p className="pt-lead mt-7 max-w-2xl">
            Our own products and a delivered client engagement — presented factually, with
            honest status labels. No fabricated case studies, metrics, testimonials, or stock
            images presented as real product screenshots.
          </p>
        </div>
      </header>
      <SelectedWorkSection compact />
    </>
  );
}
