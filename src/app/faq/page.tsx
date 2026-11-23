import type { Metadata } from 'next';
import { FaqContent } from './faq-content';

/**
 * /faq — Frequently Asked Questions (Server Component).
 *
 * Refactored so the page can export Next.js `metadata` (the accordion +
 * ScrollFadeIn interactivity live in the client `FaqContent` component). The
 * FAQPage JSON-LD is emitted from FaqContent (still server-rendered into the
 * initial HTML).
 */
export const metadata: Metadata = {
  title: 'FAQ — Paragonel',
  description:
    'Answers to common questions about how Paragonel Technologies engages, pricing, timelines, the tech stack, and its own products (AcquisitionOS, SystemFoundry, CodeGuard AI).',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ — Paragonel Technologies',
    description:
      'Common questions about Paragonel’s engagement model, pricing, timelines, tech stack, and products.',
    type: 'website',
  },
};

export default function FaqPage() {
  return <FaqContent />;
}
