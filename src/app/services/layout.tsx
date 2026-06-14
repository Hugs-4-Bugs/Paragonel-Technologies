
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | QuantumFusion Solutions',
  description: 'Precision engineering and intelligent innovation for AI Solutions, Cloud Infrastructure, DevOps, and SaaS Platforms.',
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
