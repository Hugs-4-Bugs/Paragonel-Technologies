import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/services/service-detail';
import { servicesContent } from '@/lib/services-content';

const service = servicesContent.find((s) => s.key === 'cloud-devops')!;

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: { canonical: `/services/${service.slug}` },
};

export default function CloudDevopsPage() {
  return <ServiceDetail service={service} />;
}
