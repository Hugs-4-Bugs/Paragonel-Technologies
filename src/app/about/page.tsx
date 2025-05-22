
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | QuantumLeap',
  description: 'Learn more about QuantumLeap, our mission, vision, and story.',
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
