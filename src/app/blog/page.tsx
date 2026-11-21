import { getPublishedPosts } from '@/lib/public-data';
import { BlogListClient } from './blog-list-client';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Insights — Paragonel',
  description: 'Engineering notes and strategies from our internal product development journey.',
  alternates: { canonical: '/blog' },
};

/**
 * Server Component (Phase 1A). Fetches published posts on the server via the
 * Admin SDK (filters status=='Published' && deletedAt==null, limit 50). The
 * previous client version used `useCollection` against the `blogPosts` read
 * rule that denied ALL reads in production → blank blog listing. Now SSR with
 * data; only the search/filter is client-side (BlogListClient). Drafts and
 * unpublished posts can never leak publicly.
 */
export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <BlogListClient posts={posts} />;
}
