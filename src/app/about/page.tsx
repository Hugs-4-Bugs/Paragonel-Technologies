
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Paragonel',
  description: 'Pioneering the future of IT with intelligent solutions in AI, Cloud Computing, DevOps, and SaaS Platforms.',
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
