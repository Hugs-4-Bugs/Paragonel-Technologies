import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedPostBySlug, getPublishedPosts, getPublishedSlugs } from '@/lib/public-data';
import { ArticleReader } from '@/components/blog/article-reader';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

/**
 * /blog/[slug] — server-rendered article page (Prompt 05F redesign).
 *
 * Server-side data fetching preserved (Admin SDK, filters status=='Published'
 * && deletedAt==null). Drafts/unpublished never resolve publicly. The previous
 * client `useCollection` version blanked every article in production; this
 * server approach is the fix (Phase 1A/1D). Timestamps are ISO-serialized
 * server-side.
 *
 * 05F: the article is rendered by the ArticleReader client component (TOC,
 * reading progress, share, prev/next, related). Prev/next/related are computed
 * server-side from the full published set — never fabricated.
 */

/** Per-article metadata + OpenGraph/Twitter + canonical. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: 'Post not found — Paragonel' };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || '';
  const url = `/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      images: post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : undefined,
      publishedTime: post.publishedAt || post.createdAt || undefined,
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    },
  };
}

/** Pre-render known published slugs at build; others resolve at request time. */
export async function generateStaticParams() {
  return getPublishedSlugs();
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Compute prev/next + related from the full published set (server-side).
  // Sort by published date desc; newer = previous neighbour, older = next.
  const all = await getPublishedPosts(100);
  const sorted = [...all].sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt || 0).getTime() -
      new Date(a.publishedAt || a.createdAt || 0).getTime(),
  );
  const idx = sorted.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? sorted[idx - 1] : null;
  const older = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  // Related: same category (excluding self), then same tag, then nothing.
  const related = sorted
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score:
        (p.category && p.category === post.category ? 2 : 0) +
        (p.tags?.some?.((t: string) => post.tags?.includes(t)) ? 1 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.p);

  // JSON-LD Article structured data (accurate fields only — no fabricated
  // ratings/reviewCounts/interactions).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    datePublished: post.publishedAt || post.createdAt || undefined,
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    image: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `/blog/${post.slug}` },
  };

  // JSON-LD BreadcrumbList (Prompt 05I §5.5) — Home > Blog > article.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ArticleReader post={post} newer={newer} older={older} related={related} />
    </>
  );
}
