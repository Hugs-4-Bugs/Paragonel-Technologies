
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials | QuantumLeap',
  description: 'Hear what our users and partners say about QuantumLeap.',
};

export default function TestimonialsPage() {
  return (
    <>
      <TestimonialsSection />
    </>
  );
}
