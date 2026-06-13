
"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, Rss, Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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
    <section className="section-padding bg-zinc-50/50 dark:bg-zinc-950 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-20">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Rss className="h-10 w-10 text-primary neon-icon" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Quantum<span className="text-primary">Insights</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
            Intelligence and trends from the cutting edge of AI, Cloud, and Software Engineering.
          </p>
        </ScrollFadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[450px] rounded-3xl" />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post: any, index: number) => (
              <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
                <Card className="h-full flex flex-col overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-zinc-200 dark:border-zinc-800 group">
                  <Link href={`/blog/${post.slug}`}>
                    <CardHeader className="p-0">
                      <div className="relative h-60 w-full overflow-hidden">
                        {post.thumbnailUrl ? (
                          <Image
                            src={post.thumbnailUrl}
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
                      <CardTitle className="text-2xl font-extrabold mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex items-center text-xs font-bold text-zinc-400 space-x-6 mt-auto">
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        {post.author}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild variant="link" className="p-0 text-lg font-bold text-primary">
                      <Link href={`/blog/${post.slug}`}>
                        Read Article <ArrowRight className="ml-1 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 border rounded-3xl">
             <Rss className="h-20 w-20 text-zinc-100 mx-auto mb-6" />
             <h2 className="text-2xl font-bold">No articles published yet</h2>
             <p className="text-zinc-400">Our writers are crafting new insights. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
