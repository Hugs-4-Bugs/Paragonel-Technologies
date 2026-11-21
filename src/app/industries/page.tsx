import type { Metadata } from 'next';
import { IndustriesSection } from '@/components/industries/industries-section';

/**
 * /industries — Paragonel industry solution patterns (Prompt 05E §6).
 *
 * Communicates problem-solving range across verticals. Every entry is a
 * conceptual solution pattern — no fake customers, case studies, metrics, or
 * endorsements. Grounded in docs/MARKET_OPPORTUNITY_RESEARCH.md.
 */
export const metadata: Metadata = {
  title: 'Industry Solutions — Paragonel',
  description:
    'How Paragonel engineers systems for different industries — B2B SaaS, developer tooling, India SMB, fintech, healthcare, logistics, enterprise IT and government. Conceptual solution patterns, not fabricated case studies.',
  alternates: { canonical: '/industries' },
};

export default function IndustriesPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 7rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)' }}>
          <span className="pt-eyebrow">Industry solutions</span>
          <h1 className="pt-display mt-6 text-foreground">Systems for real workflow gaps.</h1>
          <p className="pt-lead mt-7 max-w-2xl">
            Paragonel engineers both small focused tools that remove a recurring headache and
            complex multi-module platforms. The patterns below show the problem-solving range by
            industry — conceptual examples, not delivered case studies.
          </p>
        </div>
      </header>
      <IndustriesSection compact />
    </div>
  );
}
