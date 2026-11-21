import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OFFERINGS, getOfferingBySlug } from '@/lib/services-catalogue';
import { OfferingDetail } from '@/components/services/offering-detail';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

// Revalidate so admin/CMS changes reflect without a full rebuild.
export const revalidate = 60;

// Pre-render the 13 catalogue offerings. The four legacy static routes
// (ai-solutions, custom-software, cloud-devops, data-analytics) resolve to
// their own static pages first — no collision, no breakage.
export function generateStaticParams() {
  return OFFERINGS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const offering = getOfferingBySlug(slug);
  if (!offering) return { title: 'Service not found — Paragonel' };
  return {
    title: offering.metaTitle,
    description: offering.metaDescription,
    alternates: { canonical: `/services/${offering.slug}` },
    openGraph: {
      title: offering.metaTitle,
      description: offering.metaDescription,
      type: 'website',
    },
  };
}

export default async function OfferingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = getOfferingBySlug(slug);
  if (!offering) notFound();

  // JSON-LD BreadcrumbList (Prompt 05I §5.5) — Home > Services > offering.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: offering.name, item: `${siteUrl}/services/${offering.slug}` },
    ],
  };

  return (
    <>
      <OfferingDetail offering={offering} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

