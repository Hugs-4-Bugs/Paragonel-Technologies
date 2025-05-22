
import { PortfolioSection } from '@/components/sections/portfolio-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Portfolio | QuantumLeap',
  description: 'See a showcase of successful projects and collaborations by QuantumLeap.',
};

export default function PortfolioPage() {
  return (
    <>
      <PortfolioSection />
    </>
  );
}
