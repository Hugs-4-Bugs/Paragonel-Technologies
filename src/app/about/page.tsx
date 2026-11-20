
import { AboutSection } from '@/components/sections/about-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Paragonel',
  description: 'Paragonel Technologies is an AI-native product-engineering company. Meet founder & CEO Prabhat Kumar and the Precision Engineering philosophy behind our products and services.',
};

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  );
}
