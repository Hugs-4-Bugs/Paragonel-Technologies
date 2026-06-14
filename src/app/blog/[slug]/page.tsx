
"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, User, Loader2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { blogPosts as basePosts } from '@/lib/data';

export default function BlogPostPage() {
  const { slug } = useParams();

  // Find in base posts first
  const basePost = useMemo(() => basePosts.find(p => p.slug === slug), [slug]);

  const postQuery = useMemo(() => 
    query(
      collection(db, 'blogPosts'), 
      where('slug', '==', slug),
      limit(1)
    ), 
  [slug]);
  
  const { data: dynamicPosts, loading } = useCollection(postQuery);
  const post = basePost || dynamicPosts?.[0];

  if (loading && !basePost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-zinc-500">Retrieving article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-zinc-500 mb-8">The article you're looking for doesn't exist or has been moved.</p>
        <Button asChild>
          <Link href="/blog">Return to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-6 pt-10">
        <ScrollFadeIn className="mb-12">
          <Button variant="ghost" asChild className="hover:bg-zinc-100">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Insights
            </Link>
          </Button>
        </ScrollFadeIn>

        <article className="space-y-10">
          <ScrollFadeIn>
            <header className="space-y-6">
              <Badge variant="default" className="text-base px-4 py-1">{post.category}</Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-8 text-zinc-500 font-bold">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                  <span>{post.date || new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  <span>By {post.author}</span>
                </div>
              </div>
            </header>
          </ScrollFadeIn>

          <ScrollFadeIn delay="100ms">
            <div className="relative w-full aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
              <Image
                src={post.thumbnailUrl || 'https://picsum.photos/seed/blog-default/1200/600'}
                alt=""
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay="200ms">
            <div className="prose prose-xl dark:prose-invert max-w-none prose-zinc prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed text-zinc-800 dark:text-zinc-200">
              <div className="text-2xl font-medium text-zinc-500 italic border-l-4 border-primary pl-6 py-2 mb-12">
                {post.excerpt}
              </div>
              
              <div className="whitespace-pre-wrap">
                {post.body}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-16 flex flex-wrap gap-3 items-center pt-8 border-t">
                  <Tag className="h-5 w-5 text-zinc-400 mr-2" />
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1 font-bold">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay="300ms" className="pt-16">
             <div className="bg-zinc-900 text-white rounded-[3rem] p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px]"></div>
               <div className="space-y-2 text-center md:text-left relative z-10">
                  <h3 className="text-3xl font-black">Stay Ahead of the Curve</h3>
                  <p className="text-zinc-400 text-lg font-medium">Join 2,000+ leaders receiving our weekly engineering notes.</p>
               </div>
               <Button asChild size="lg" className="rounded-full px-8 shadow-xl font-bold h-14 relative z-10">
                  <Link href="/contact">Subscribe to Newsletter</Link>
               </Button>
             </div>
          </ScrollFadeIn>
        </article>
      </div>
    </div>
  );
}
