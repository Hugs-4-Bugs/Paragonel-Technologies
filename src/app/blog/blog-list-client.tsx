"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, ArrowRight, ArrowUpRight, Clock, CalendarDays, Rss } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogListClientProps {
  /** Pre-fetched published posts (server-side via getPublishedPosts, ISO dates). */
  posts: any[];
}

/** Read-time estimate from body word count (~200 wpm). */
function readTime(body?: string): number {
  return Math.max(1, Math.ceil((body?.split(/\s+/).filter(Boolean).length || 0) / 200));
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'long' });
}

/**
 * BlogListClient — editorial publication experience (Prompt 05F redesign).
 *
 * Receives already-fetched PUBLISHED posts as props (SSR'd in the initial HTML
 * — no blank list, no Firestore client read, no draft/unpublished leakage).
 * Only the search/category filter state is client-side. The two filters work
 * together; an empty result shows a useful reset state. No fake articles, no
 * fabricated authors/metrics. When no posts exist, a graceful editorial
 * introduction is shown instead of fabricated content.
 *
 * Built on the 05A–05E editorial system (pt-* tokens), distinct from the
 * homepage hero: a publication masthead, not a product hero.
 */
export function BlogListClient({ posts }: BlogListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)].sort() as string[];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        post.title?.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q) ||
        post.tags?.some?.((t: string) => t.toLowerCase().includes(q));
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, activeCategory]);

  const featured = posts[0];
  const hasPosts = posts.length > 0;
  const reset = () => {
    setSearchTerm('');
    setActiveCategory('All');
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ── Editorial masthead (distinct from the homepage hero) ── */}
      <header className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 9vw, 7rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="flex items-center justify-between border-b border-border pb-5">
            <span className="pt-eyebrow">Publication</span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Rss className="h-3.5 w-3.5" /> Engineering &amp; research
            </span>
          </div>
          <h1 className="pt-display mt-8 text-foreground">Insights</h1>
          <p className="pt-lead mt-6 max-w-2xl text-muted-foreground">
            Engineering notes, architecture thinking and lessons from building Paragonel products —
            AI-native systems, platform engineering, security and applied research. Written by the
            people who ship the software.
          </p>
        </div>
      </header>

      {!hasPosts ? (
        /* Graceful editorial introduction when no published posts exist (no fake content). */
        <section className="pt-section">
          <div className="pt-shell">
            <div className="pt-surface rounded-[var(--pt-radius-md)] p-8 md:p-10 max-w-2xl">
              <span className="pt-eyebrow">Coming soon</span>
              <h2 className="pt-h2 mt-4 text-foreground">The publication is being prepared.</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Paragonel publishes engineering and research writing here. No articles are published
                yet — when they are, they will appear on this page. There are no fabricated posts,
                authors or metrics on this site.
              </p>
              <div className="mt-6">
                <Link href="/contact" className="pt-btn pt-btn-primary">
                  Talk to engineering <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* ── Featured article (real first published post) ── */}
          {featured && activeCategory === 'All' && !searchTerm && (
            <section className="pt-section">
              <div className="pt-shell">
                <span className="pt-eyebrow">Featured</span>
                <article className="mt-6 grid gap-8 border-t border-border pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                  <div className="order-2 lg:order-1">
                    {featured.category && (
                      <span className="inline-block text-xs font-medium uppercase tracking-widest text-primary">
                        {featured.category}
                      </span>
                    )}
                    <h2 className="pt-h1 mt-3 text-foreground">{featured.title}</h2>
                    {featured.excerpt && (
                      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                    )}
                    <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      {featured.author && (
                        <div className="flex items-center gap-1.5">
                          <dt className="sr-only">Author</dt>
                          <dd><span className="font-medium text-foreground">{featured.author}</span></dd>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <dt className="sr-only">Published</dt>
                        <dd>{fmtDate(featured.publishedAt || featured.createdAt)}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <dt className="sr-only">Reading time</dt>
                        <dd>{readTime(featured.body)} min read</dd>
                      </div>
                    </dl>
                    <div className="mt-7">
                      <Link href={`/blog/${featured.slug}`} className="pt-btn pt-btn-primary">
                        Read the article <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  {featured.thumbnailUrl && (
                    <div className="order-1 lg:order-2 relative aspect-[16/10] overflow-hidden rounded-[var(--pt-radius-md)] border border-border bg-secondary/30">
                      <Image
                        src={featured.thumbnailUrl}
                        alt={featured.title || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        priority
                        unoptimized
                      />
                    </div>
                  )}
                </article>
              </div>
            </section>
          )}

          {/* ── Discovery: category nav + search (work together) ── */}
          <section className="pt-section">
            <div className="pt-shell">
              <div className="border-t border-border pt-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <nav aria-label="Article categories" className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveCategory(c)}
                        aria-pressed={activeCategory === c}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          activeCategory === c
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </nav>
                  <div className="relative w-full lg:w-72">
                    <label htmlFor="blog-search" className="sr-only">Search articles</label>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="blog-search"
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search articles"
                      className="w-full rounded-[var(--pt-radius-sm)] border border-border bg-background py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Latest articles — editorial list (not a card grid) ── */}
                <div className="mt-10">
                  <h2 className="pt-eyebrow mb-2">
                    {activeCategory === 'All' && !searchTerm ? 'Latest' : 'Results'}
                    <span className="ml-2 text-muted-foreground">({filteredPosts.length})</span>
                  </h2>

                  {filteredPosts.length === 0 ? (
                    /* Useful empty state with reset */
                    <div className="border-t border-border py-12 text-center">
                      <p className="text-muted-foreground">No articles match your search or category.</p>
                      <button type="button" onClick={reset} className="pt-btn pt-btn-ghost mt-4">
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {filteredPosts.map((post, idx) => (
                        <li key={post.slug}>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="group grid gap-5 py-6 transition-colors hover:bg-secondary/20 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8"
                          >
                            <span className="pt-index text-xs">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {post.category && (
                                  <span className="text-[0.65rem] font-medium uppercase tracking-widest text-primary">{post.category}</span>
                                )}
                                <span className="text-[0.65rem] text-muted-foreground">·</span>
                                <span className="text-[0.65rem] text-muted-foreground">{readTime(post.body)} min read</span>
                              </div>
                              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {post.author && <span>{post.author}</span>}
                                <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
                              </div>
                            </div>
                            {post.thumbnailUrl ? (
                              <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-[var(--pt-radius-sm)] border border-border bg-secondary/30 md:block">
                                <Image
                                  src={post.thumbnailUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="96px"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary md:block" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
