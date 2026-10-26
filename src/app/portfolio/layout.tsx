
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio | Paragonel',
  description: 'Explore our portfolio of AI-native products and custom platforms including AcquisitionOS, SystemFoundry, and CodeGuard AI.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
