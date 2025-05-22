
import { CareersSection } from '@/components/sections/careers-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | QuantumLeap',
  description: 'Join the QuantumLeap team and help shape the future. Explore open positions.',
};

export default function CareersPage() {
  return (
    <>
      <CareersSection />
    </>
  );
}
