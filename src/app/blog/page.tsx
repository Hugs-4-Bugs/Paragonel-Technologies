"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, Rss, User, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const firestore = useFirestore();

  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'blogPosts'), 
      where('status', '==', 'Published'),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const { data: posts, loading } = useCollection(postsQuery);

  const categories = useMemo(() => {
    if (!posts) return ['All'];
    const cats = new Set(posts.map((p: any) => p.category));
    return ['All', ...Array.from(cats)].filter(Boolean).sort() as string[];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((post: any) => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, activeCategory]);

  return (
    <section className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Rss className="h-8 w-8 text-primary neon-icon" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-foreground">
            Quantum<span className="text-primary">Insights</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Intelligence and trends from the cutting edge of AI, Cloud, and Software Engineering.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn className="mb-16 max-w-4xl mx-auto">
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search articles..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 border-none focus-visible:ring-0 bg-transparent" 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto px-2 no-scrollbar">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-2 whitespace-nowrap">Topics:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                    activeCategory === cat 
                      ? "bg-primary text-white border-primary shadow-md" 
                      : "bg-background text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </ScrollFadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[450px] rounded-3xl" />)}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPosts.map((post: any, index: number) => (
              <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
                <Card className="h-full flex flex-col overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-zinc-200 dark:border-zinc-800 group">
                  <Link href={`/blog/${post.slug}`}>
                    <CardHeader className="p-0">
                      <div className="relative h-56 w-full overflow-hidden">
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
                          <Badge className="bg-primary text-white shadow-lg border-none">{post.category}</Badge>
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
                    <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 leading-relaxed">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex items-center text-xs font-bold text-zinc-400 space-x-6 mt-auto">
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        {post.author}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                    <Button asChild variant="link" className="p-0 text-lg font-bold text-primary group-hover:translate-x-1 transition-transform">
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
          <div className="text-center py-24 bg-zinc-50/50 dark:bg-zinc-900/40 border rounded-[2.5rem] max-w-4xl mx-auto shadow-sm">
             <Rss className="h-20 w-20 text-zinc-200 dark:text-zinc-800 mx-auto mb-6" />
             <h2 className="text-2xl font-bold">No articles found</h2>
             <p className="text-zinc-400 mb-8">Try adjusting your filters or search term.</p>
             <Button variant="outline" className="rounded-full px-8" onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}>
               Reset All Filters
             </Button>
          </div>
        )}
      </div>
    </section>
  );
}
