import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { getPublishedPosts } from '@/lib/public-data';

/**
 * HomeBlog — homepage Insights section (Prompt 05F §5).
 *
 * Server Component. Fetches PUBLISHED posts via the SAME verified source as
 * /blog (getPublishedPosts — Admin SDK, status=='Published' && deletedAt==null).
 * No second conflicting source, no hardcoded blogPosts, no fake articles, no
 * draft content. When no posts are published, a graceful editorial intro links
 * to /blog (no fabricated content). Section order + design system preserved.
 */

function readTime(body?: string): number {
  return Math.max(1, Math.ceil((body?.split(/\s+/).filter(Boolean).length || 0) / 200));
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export async function HomeBlog() {
  let posts: any[] = [];
  try {
    posts = await getPublishedPosts(3);
  } catch {
    /* CMS unavailable (e.g. no emulator during build) — graceful empty below */
    posts = [];
  }
  const latest = posts.slice(0, 3);
  const hasPosts = latest.length > 0;

  return (
    <section className="pt-section">
      <div className="pt-shell">
        <Reveal>
          <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="pt-eyebrow">Publication</span>
              <h2 className="pt-h1 mt-5 text-foreground">Insights</h2>
              <p className="pt-lead mt-4 max-w-xl text-muted-foreground">
                Engineering notes, architecture thinking and lessons from building Paragonel products.
              </p>
            </div>
            <Link href="/blog" className="pt-btn pt-btn-ghost shrink-0">
              Read the publication <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        {hasPosts ? (
          <RevealGroup stagger={0.07} className="mt-8 grid gap-px bg-border md:grid-cols-3">
            {latest.map((post) => (
              <RevealItem key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col bg-background p-6 transition-colors hover:bg-secondary/20"
                >
                  {post.category && (
                    <span className="text-[0.65rem] font-medium uppercase tracking-widest text-primary">{post.category}</span>
                  )}
                  <h3 className="mt-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                  <div className="mt-auto flex items-center gap-3 pt-5 text-xs text-muted-foreground">
                    {post.author && <span>{post.author}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {readTime(post.body)} min
                    </span>
                    <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <Reveal>
            <div className="mt-8 border-t border-border pt-8">
              <p className="text-sm text-muted-foreground">
                No articles are published yet. The publication will appear here and on{' '}
                <Link href="/blog" className="pt-link inline-flex items-center gap-0.5">
                  the Insights page <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>{' '}
                when engineering writing is ready. There are no fabricated posts on this site.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
