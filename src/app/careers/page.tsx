import { getPublicJobs } from '@/lib/public-data';
import { CareersClient } from './careers-client';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Careers — Paragonel',
  description: 'Open roles at Paragonel Technologies. Join our AI-native product-engineering team.',
  alternates: { canonical: '/careers' },
};

/**
 * Server Component (Phase 1A). Fetches active jobs on the server via the Admin
 * SDK (filters isActive && !deletedAt, limit 50). The previous client version
 * used `useCollection` against the `jobs` read rule that denied ALL reads in
 * production → blank Careers page on a perpetual skeleton. Now SSR with data;
 * only the filter UI is client-side (CareersClient). Archived / inactive jobs
 * never leak publicly.
 */
export default async function CareersPage() {
  const jobs = await getPublicJobs();
  return <CareersClient jobs={jobs} />;
}
