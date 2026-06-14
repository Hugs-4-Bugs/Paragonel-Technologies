
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | QuantumFusion Solutions',
  description: 'Learn more about QuantumFusion Solutions, founded by Prabhat Sharma. Our mission is to build AI-native software that solves real business pain.',
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
