
import { ServicesSection } from '@/components/sections/services-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | QuantumLeap',
  description: 'Explore the innovative services offered by QuantumLeap.',
};

export default function ServicesPage() {
  return (
    <>
      <ServicesSection />
    </>
  );
}
