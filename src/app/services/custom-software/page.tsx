import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/services/service-detail';
import { servicesContent } from '@/lib/services-content';

const service = servicesContent.find((s) => s.key === 'custom-software')!;

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: { canonical: `/services/${service.slug}` },
};

export default function CustomSoftwarePage() {
  return <ServiceDetail service={service} />;
}
