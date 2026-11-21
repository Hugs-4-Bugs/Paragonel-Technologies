'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, Share2, Link2, Check, ChevronDown, List } from 'lucide-react';
import { Markdown, extractHeadings } from '@/components/markdown';
import { cn } from '@/lib/utils';

interface ArticleData {
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

interface ArticleReaderProps {
  post: ArticleData;
  newer: ArticleData | null;
  older: ArticleData | null;
  related: ArticleData[];
}

function readTime(body?: string): number {
  return Math.max(1, Math.ceil((body?.split(/\s+/).filter(Boolean).length || 0) / 200));
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'long' });
}

/**
 * ArticleReader — the long-form reading experience (Prompt 05F §4).
 *
 *  - Reading-progress bar (fixed top), disabled under reduced-motion.
 *  - Editorial header: breadcrumb, category, title, excerpt, author, date,
 *    read-time, featured image.
 *  - Reading-width layout with a sticky TOC on desktop (built from the ACTUAL
 *    rendered headings via extractHeadings); a collapsible TOC on mobile.
 *    Active-section highlight via IntersectionObserver. No empty/broken TOC
 *    (rendered only when ≥3 eligible headings exist).
 *  - Markdown body via the safe Markdown renderer (tables, code copy, heading
 *    IDs).
 *  - Share via Web Share API with a copy-link fallback.
 *  - Prev/next + related (computed server-side from real published posts).
 *  - Built on the 05A–05E editorial system (pt-* tokens). No fake newsletter
 *    CTA, no fabricated metrics/avatars.
 */
export function ArticleReader({ post, newer, older, related }: ArticleReaderProps) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'unsupported'>('idle');

  const headings = useMemo(() => extractHeadings(post.body || ''), [post.body]);
  const hasToc = headings.length >= 3;

  // Reading progress (skipped under reduced-motion).
  useEffect(() => {
    if (reduce) return;
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduce]);

  // Active-section highlight via IntersectionObserver (only when TOC renders).
  useEffect(() => {
    if (!hasToc) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [hasToc, headings]);

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: post.title, text: post.excerpt || '', url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard?.writeText(url);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 1800);
      }
    } catch {
      // user cancelled or clipboard unavailable — try copy fallback
      try {
        await navigator.clipboard?.writeText(url);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 1800);
      } catch {
        setShareState('unsupported');
        setTimeout(() => setShareState('idle'), 1800);
      }
    }
  };

  return (
    <article className="bg-background min-h-screen">
      {/* Reading progress bar (reduced-motion: hidden) */}
      {!reduce && (
        <div className="fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent" aria-hidden="true">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="pt-shell pt-6">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights
        </Link>
      </div>

      {/* Header */}
      <header className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="mx-auto max-w-3xl text-center">
            {post.category && (
              <Link
                href={`/blog?cat=${encodeURIComponent(post.category)}`}
                className="inline-block text-xs font-medium uppercase tracking-widest text-primary"
              >
                {post.category}
              </Link>
            )}
            <h1 className="pt-display mt-4 text-foreground" style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)', lineHeight: 1.1 }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            )}
            <dl className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-border py-4 text-xs text-muted-foreground">
              {post.author && (
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Author</dt>
                  <dd><span className="font-medium text-foreground">{post.author}</span></dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <dt className="sr-only">Published</dt>
                <dd>{fmtDate(post.publishedAt || post.createdAt)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <dt className="sr-only">Reading time</dt>
                <dd>{readTime(post.body)} min read</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Featured image */}
      {post.thumbnailUrl && (
        <div className="pt-shell">
          <div className="relative mx-auto aspect-[16/9] max-w-4xl overflow-hidden rounded-[var(--pt-radius-md)] border border-border bg-secondary/30">
            <Image
              src={post.thumbnailUrl}
              alt={post.title || ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Body + TOC */}
      <div className="pt-shell pt-section">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_16rem] lg:gap-12">
          {/* TOC — sticky on desktop, collapsible on mobile */}
          {hasToc && (
            <aside className="order-1 lg:order-none">
              {/* Desktop sticky */}
              <nav aria-label="Table of contents" className="hidden lg:sticky lg:top-28 lg:block">
                <p className="pt-index text-[0.65rem] mb-3">CONTENTS</p>
                <ul className="space-y-2 border-l border-border">
                  {headings.map((h) => (
                    <li key={h.id} style={{ paddingLeft: h.level === 3 ? '1rem' : '0.75rem' }}>
                      <a
                        href={`#${h.id}`}
                        className={cn(
                          '-ml-px block border-l-2 py-0.5 text-sm transition-colors',
                          activeId === h.id
                            ? 'border-primary text-foreground font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Mobile collapsible */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setTocOpen((v) => !v)}
                  aria-expanded={tocOpen}
                  className="flex w-full items-center justify-between border border-border rounded-[var(--pt-radius-sm)] px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="inline-flex items-center gap-2"><List className="h-4 w-4" /> Contents</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', tocOpen && 'rotate-180')} />
                </button>
                {tocOpen && (
                  <ul className="mt-3 space-y-2 border-l border-border pl-3">
                    {headings.map((h) => (
                      <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : 0 }}>
                        <a
                          href={`#${h.id}`}
                          onClick={() => setTocOpen(false)}
                          className={cn(
                            'block py-0.5 text-sm transition-colors',
                            activeId === h.id ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          )}

          {/* Markdown body — comfortable reading width */}
          <div className="order-2 lg:order-none min-w-0">
            <Markdown>{post.body || ''}</Markdown>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
                {post.tags.map((t: string) => (
                  <span key={t} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
              <span className="text-sm font-medium text-foreground">Share</span>
              <button
                type="button"
                onClick={onShare}
                aria-label="Share this article"
                className="inline-flex items-center gap-1.5 rounded-[var(--pt-radius-sm)] border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {shareState === 'copied' ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
                {shareState === 'copied' ? 'Link copied' : shareState === 'unsupported' ? 'Copy failed' : 'Share'}
              </button>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" /> copy-link fallback
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      {(newer || older) && (
        <section className="pt-section">
          <div className="pt-shell">
            <div className="mx-auto max-w-4xl grid gap-px bg-border sm:grid-cols-2">
              {newer ? (
                <Link href={`/blog/${newer.slug}`} className="group bg-background p-5 transition-colors hover:bg-secondary/20">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Previous</span>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">{newer.title}</p>
                </Link>
              ) : (
                <div className="bg-background p-5 opacity-40">
                  <span className="text-xs text-muted-foreground">Previous</span>
                  <p className="mt-1.5 text-sm text-muted-foreground">No newer article</p>
                </div>
              )}
              {older ? (
                <Link href={`/blog/${older.slug}`} className="group bg-background p-5 text-right transition-colors hover:bg-secondary/20">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">Next <ArrowRight className="h-3 w-3" /></span>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">{older.title}</p>
                </Link>
              ) : (
                <div className="bg-background p-5 text-right opacity-40">
                  <span className="text-xs text-muted-foreground">Next</span>
                  <p className="mt-1.5 text-sm text-muted-foreground">No older article</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="pt-section">
          <div className="pt-shell">
            <div className="mx-auto max-w-4xl">
              <h2 className="pt-eyebrow mb-4">Related</h2>
              <ul className="divide-y divide-border border-t border-border">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/blog/${r.slug}`} className="group flex items-center gap-4 py-4 transition-colors hover:bg-secondary/20">
                      <div className="min-w-0 flex-1">
                        {r.category && <span className="text-[0.65rem] font-medium uppercase tracking-widest text-primary">{r.category}</span>}
                        <p className="mt-0.5 line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">{r.title}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Return */}
      <section className="pt-section pb-16">
        <div className="pt-shell text-center">
          <Link href="/blog" className="pt-btn pt-btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back to Insights
          </Link>
        </div>
      </section>
    </article>
  );
}
