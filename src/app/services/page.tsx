import type { Metadata } from 'next';
import { getPublicServices } from '@/lib/public-data';
import { CatalogueLanding } from '@/components/services/catalogue-landing';

// Revalidate every 60s so admin publish/activate/deactivate reflects on the
// public site without a full rebuild, while keeping SSR speed. (Preserved from
// Phase 1A — the admin CMS continues to drive the "From the live catalogue"
// section via getPublicServices.)
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Services — Paragonel',
  description:
    'Thirteen capability families engineering AI-native systems end-to-end — product, AI, automation, cloud, data, integration, UX, advisory, security, quality, industry solutions, IoT and emerging tech. Each with an honest delivery status: Deliver Now, Specialist Support, or Research & Emerging.',
  alternates: { canonical: '/services' },
};

/**
 * Services landing (Prompt 05B). Replaces the four-category card layout with a
 * structured five-domain / thirteen-offering catalogue built on the Prompt 05A
 * editorial design system. Admin-published dynamic services are still fetched
 * server-side via getPublicServices (no client SDK shipped) and surfaced in a
 * dedicated section — the CMS integration is preserved.
 */
export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <div className="bg-background min-h-screen">
      <CatalogueLanding dynamicServices={services} />
    </div>
  );
}
