"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, User, Rss, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogPostPage() {
  const { slug } = useParams();

  const postQuery = useMemo(() => 
    query(
      collection(db, 'blogPosts'), 
      where('slug', '==', slug),
      limit(1)
    ), 
  [slug]);
  
  const { data: posts, loading } = useCollection(postQuery);
  const post = posts?.[0];

  if (loading) {
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
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  <span>By {post.author}</span>
                </div>
              </div>
            </header>
          </ScrollFadeIn>

          <ScrollFadeIn delay="100ms">
            {post.coverImageUrl && (
              <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <Image
                  src={post.coverImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}
          </ScrollFadeIn>

          <ScrollFadeIn delay="200ms">
            <div className="prose prose-xl dark:prose-invert max-w-none prose-zinc prose-headings:font-black prose-p:leading-relaxed text-zinc-800 dark:text-zinc-200">
              <p className="text-2xl font-medium text-zinc-500 italic border-l-4 border-primary pl-6 py-2 mb-10">
                {post.summary}
              </p>
              <div className="whitespace-pre-wrap">
                {post.body}
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay="300ms" className="pt-16 border-t">
             <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-3xl font-bold">Never miss an update</h3>
                  <p className="text-zinc-500 text-lg">Join our community for the latest in AI and tech.</p>
               </div>
               <Button asChild size="lg" className="rounded-full px-8 shadow-xl">
                  <Link href="/#contact-snippet">Subscribe to Newsletter</Link>
               </Button>
             </div>
          </ScrollFadeIn>
        </article>
      </div>
    </div>
  );
}
