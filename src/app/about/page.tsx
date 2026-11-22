
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Paragonel Technologies',
  description:
    'Paragonel Technologies Pvt. Ltd. is an AI-native product-engineering company. The engineering philosophy, the five disciplines behind a complete product, founder & CEO Prabhat Kumar, and how clients engage.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
