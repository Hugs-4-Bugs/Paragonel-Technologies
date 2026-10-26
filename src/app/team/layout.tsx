
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team | Paragonel',
  description: 'Meet the innovators at Paragonel. A lean team of engineers obsessed with building software that works.',
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
