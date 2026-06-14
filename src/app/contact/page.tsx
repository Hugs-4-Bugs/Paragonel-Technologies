
import { ContactSection } from '@/components/sections/contact-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | QuantumFusion Solutions',
  description: 'Get in touch with the QuantumFusion Solutions team. Let\'s build the future together.',
};

export default function ContactPage() {
  return (
    <>
      <ContactSection />
    </>
  );
}
