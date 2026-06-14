
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | QuantumFusion Solutions',
  description: 'Learn more about QuantumFusion Solutions, our mission, vision, and how we build AI-native software.',
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
