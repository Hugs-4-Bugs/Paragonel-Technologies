
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team | QuantumFusion Solutions',
  description: 'Meet the innovators at QuantumFusion Solutions. A lean team of engineers obsessed with building software that works.',
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
