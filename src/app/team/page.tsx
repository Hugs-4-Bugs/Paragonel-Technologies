
import { TeamSection } from '@/components/sections/team-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team | QuantumLeap',
  description: 'Meet the talented individuals driving innovation at QuantumLeap.',
};

export default function TeamPage() {
  return (
    <>
      <TeamSection />
    </>
  );
}
