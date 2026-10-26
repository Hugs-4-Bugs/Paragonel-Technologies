
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Paragonel',
  description: 'Find answers to common questions about Paragonel pricing, services, and engineering process.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
