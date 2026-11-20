import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials | Paragonel',
  description:
    'Verified client feedback from real Paragonel engagements, in the client\'s own words. No invented quotes or names.',
};

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
