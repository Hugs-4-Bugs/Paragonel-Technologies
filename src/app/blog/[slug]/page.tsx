import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';
import { ArrowLeft, CalendarDays, Tag, Clock, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPostBySlug, getPublishedSlugs } from '@/lib/public-data';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

/** Per-article metadata — fixes the missing per-post metadata gap (R-K1/G9). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: 'Post Not Found — Paragonel' };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || '';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

/** Pre-render known published slugs at build; others resolve at request time. */
export async function generateStaticParams() {
  return getPublishedSlugs();
}

/**
 * Server Component (Phase 1A/1D). Fetches the published post by slug via the
 * Admin SDK (filters status=='Published' && deletedAt==null). The previous
 * client version used `useCollection` against the `blogPosts` read rule that
 * denied ALL reads in production → `post` was always undefined → "Post Not
 * Found" for every article, including /blog/engineering-logic-acquisition-os.
 * Drafts/unpublished never resolve publicly. Timestamps are ISO-serialized
 * server-side so `new Date(post.createdAt)` works (the old code received a
 * Firestore Timestamp object and produced Invalid Date).
 */
export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-zinc-500 mb-8">The article you&apos;re looking for doesn&apos;t exist, isn&apos;t published yet, or has been moved.</p>
        <Button asChild>
          <Link href="/blog">Return to Blog</Link>
        </Button>
      </div>
    );
  }

  const readingTime = Math.max(1, Math.ceil((post.body?.split(/\s+/).length || 0) / 200));
  const publishedDate = post.publishedAt || post.createdAt;

  return (
    <div className="bg-background pb-32">
      <div className="container mx-auto max-w-5xl px-4 md:px-6 pt-10">
        <ScrollFadeIn className="mb-12">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="hover:bg-zinc-100 rounded-full font-bold">
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Insights
              </Link>
            </Button>
            <div className="flex items-center gap-4 text-zinc-400">
               <span className="flex items-center text-xs font-bold uppercase tracking-widest">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {readingTime} min read
               </span>
               <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" aria-label="Share">
                  <Share2 className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </ScrollFadeIn>

        <article className="space-y-12">
          <ScrollFadeIn>
            <header className="space-y-8 text-center max-w-4xl mx-auto">
              <Badge variant="default" className="text-sm px-5 py-1.5 rounded-full shadow-lg shadow-primary/20">
                {post.category}
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.05] text-foreground">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 font-bold border-y py-6 border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center">
                  <CalendarDays className="mr-2.5 h-5 w-5 text-primary" />
                  <span>{publishedDate ? new Date(publishedDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : ''}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs mr-3">
                    {post.author?.charAt(0)}
                  </div>
                  <span>By {post.author}</span>
                </div>
              </div>
            </header>
          </ScrollFadeIn>

          <ScrollFadeIn delay="100ms">
            <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50">
              <Image
                src={post.thumbnailUrl || 'https://picsum.photos/seed/blog-default-v2/1200/600'}
                alt=""
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
            <aside className="lg:col-span-3 space-y-10 hidden lg:block">
               <div className="sticky top-32 space-y-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Core Topics</h4>
                    <div className="flex flex-wrap gap-2">
                       {post.tags?.map((tag: string) => (
                         <Badge key={tag} variant="secondary" className="px-3 py-1 font-bold rounded-lg text-[10px]">
                           #{tag}
                         </Badge>
                       ))}
                    </div>
                  </div>
               </div>
            </aside>

            <div className="lg:col-span-9">
              <ScrollFadeIn delay="200ms">
                <div className="max-w-none
                  prose-headings:font-black prose-headings:tracking-tight
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                  prose-p:text-lg prose-p:leading-[1.8] prose-p:text-zinc-700 dark:prose-p:text-zinc-300
                  prose-li:text-lg prose-li:text-zinc-700 dark:prose-li:text-zinc-300
                  prose-strong:text-foreground prose-strong:font-black
                  prose-img:rounded-[2rem] prose-img:shadow-xl
                ">
                  {post.excerpt && (
                    <div className="text-2xl md:text-3xl font-bold text-primary italic mb-16 leading-relaxed border-l-8 border-primary pl-8 py-4 bg-primary/5 rounded-r-3xl">
                      {post.excerpt}
                    </div>
                  )}

                  {/* Safe Markdown rendering — never raw `**` markers (Phase 1 §9) */}
                  <Markdown className="prose prose-zinc dark:prose-invert max-w-none
                    prose-headings:font-black prose-headings:tracking-tight
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:text-lg prose-p:leading-[1.8] prose-p:text-zinc-700 dark:prose-p:text-zinc-300
                    prose-li:text-lg prose-li:text-zinc-700 dark:prose-li:text-zinc-300
                    prose-strong:text-foreground prose-strong:font-black
                    prose-img:rounded-[2rem] prose-img:shadow-xl
                  ">
                    {post.body}
                  </Markdown>

                  <div className="lg:hidden mt-16 flex flex-wrap gap-3 items-center pt-8 border-t">
                    <Tag className="h-5 w-5 text-zinc-400 mr-2" />
                    {post.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1 font-bold">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollFadeIn>

              <ScrollFadeIn delay="300ms" className="pt-24">
                 <div className="bg-zinc-900 text-white rounded-[4rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-colors duration-700"></div>
                   <div className="space-y-4 text-center md:text-left relative z-10 max-w-xl">
                      <h3 className="text-4xl font-black tracking-tight">Stay ahead of the curve</h3>
                      <p className="text-zinc-400 text-lg font-medium">Join engineers receiving our breakdown of AI engineering and cloud strategy.</p>
                   </div>
                   <div className="relative z-10 shrink-0">
                    <Button asChild size="lg" className="rounded-full px-12 shadow-2xl font-black h-16 text-lg hover:scale-105 transition-transform bg-white text-zinc-900 hover:bg-zinc-200">
                      <Link href="/contact">Get In Touch</Link>
                    </Button>
                   </div>
                 </div>
              </ScrollFadeIn>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
