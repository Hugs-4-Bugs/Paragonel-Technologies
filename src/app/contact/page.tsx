
import { ContactSection } from '@/components/sections/contact-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Paragonel',
  description: 'Get in touch with the Paragonel team. Let\'s build the future together.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <ContactSection />
    </>
  );
}
