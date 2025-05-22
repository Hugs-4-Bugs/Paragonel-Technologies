
import { FaqSection } from '@/components/sections/faq-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | QuantumLeap',
  description: 'Find answers to frequently asked questions about QuantumLeap.',
};

export default function FaqPage() {
  return (
    <>
      <FaqSection />
    </>
  );
}
