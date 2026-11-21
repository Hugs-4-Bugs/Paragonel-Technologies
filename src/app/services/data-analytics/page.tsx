import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/services/service-detail';
import { servicesContent } from '@/lib/services-content';

const service = servicesContent.find((s) => s.key === 'data-analytics')!;

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: { canonical: `/services/${service.slug}` },
};

export default function DataAnalyticsPage() {
  return <ServiceDetail service={service} />;
}
