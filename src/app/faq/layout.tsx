
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | QuantumFusion Solutions',
  description: 'Find answers to common questions about QuantumFusion Solutions pricing, services, and engineering process.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
