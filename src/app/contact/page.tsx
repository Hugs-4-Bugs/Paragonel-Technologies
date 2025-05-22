
import { ContactSection } from '@/components/sections/contact-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | QuantumLeap',
  description: 'Get in touch with the QuantumLeap team. We are here to help!',
};

export default function ContactPage() {
  return (
    <>
      <ContactSection />
    </>
  );
}
