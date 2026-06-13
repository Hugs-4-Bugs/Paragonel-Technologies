"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, ArrowRight, Rss, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BlogPage() {
  const postsQuery = useMemo(() => 
    query(
      collection(db, 'blogPosts'), 
      where('status', '==', 'Published'),
      orderBy('createdAt', 'desc')
    ), 
  []);
  
  const { data: posts, loading } = useCollection(postsQuery);

  return (
    <section className="section-padding bg-zinc-50/50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-20">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Rss className="h-10 w-10 text-primary neon-icon" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Quantum<span className="text-primary">Insights</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-3xl mx-auto font-medium">
            Intelligence gathered from the cutting edge of AI, Cloud, and Software Engineering.
          </p>
        </ScrollFadeIn>

        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-zinc-500 animate-pulse font-bold">Synchronizing articles...</p>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post: any, index: number) => (
              <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
                <Card className="h-full flex flex-col overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-zinc-200 dark:border-zinc-800 group">
                  <Link href={`/blog/${post.slug}`}>
                    <CardHeader className="p-0">
                      <div className="relative h-60 w-full overflow-hidden">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-300">
                             <Rss className="h-12 w-12 opacity-20" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary shadow-lg">{post.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Link>
                  <CardContent className="flex-grow p-8">
                    <Link href={`/blog/${post.slug}`}>
                      <CardTitle className="text-2xl font-extrabold mb-4 group-hover:text-primary transition-colors leading-tight">
                        {post.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6">
                      {post.summary}
                    </CardDescription>
                    <div className="flex items-center text-sm font-bold text-zinc-400 space-x-6">
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <span className="text-primary mr-1">By</span> {post.author}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild variant="link" className="p-0 text-lg font-bold text-primary group-hover:gap-2 transition-all">
                      <Link href={`/blog/${post.slug}`}>
                        Read Full Story <ArrowRight className="ml-1 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border rounded-3xl">
             <Rss className="h-20 w-20 text-zinc-100 mx-auto mb-6" />
             <h2 className="text-2xl font-bold">No articles yet</h2>
             <p className="text-zinc-400">Our writers are busy crafting new insights. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
