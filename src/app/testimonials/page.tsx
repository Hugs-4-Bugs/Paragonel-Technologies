"use client";

import React, { useMemo } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Star, Quote } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { baseTestimonials } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function TestimonialsPage() {
  const testimonialsQuery = useMemo(() => query(collection(db, 'testimonials'), orderBy('name', 'asc')), []);
  const { data: dynamicTestimonials, loading } = useCollection(testimonialsQuery);

  const displayedTestimonials = useMemo(() => {
    return [...baseTestimonials, ...(dynamicTestimonials || [])];
  }, [dynamicTestimonials]);

  const count = displayedTestimonials.length;
  const gridClass =
    count <= 1
      ? 'grid grid-cols-1 max-w-2xl mx-auto'
      : count === 2
        ? 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
            <MessageSquare className="h-10 w-10 text-primary neon-icon" />
          </div>
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Testimonials</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            What our <span className="text-primary">clients</span> say
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            We keep this section short on purpose. Only verified feedback from real engagements appears here — in the
            client&apos;s own words, with no invented quotes or names.
          </p>
        </ScrollFadeIn>

        {loading && !count ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {[1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-[3rem]" />)}
          </div>
        ) : (
          <div className={cn('gap-8', gridClass)}>
            {displayedTestimonials.map((t: any, index: number) => (
              <ScrollFadeIn key={t.id} delay={`${index * 100}ms`}>
                <Card className="h-full rounded-[3rem] border-zinc-200 dark:border-zinc-800 shadow-xl p-8 md:p-10 relative overflow-hidden bg-card group">
                  <Quote className="absolute top-8 right-10 h-20 w-20 text-primary/5" />
                  <CardContent className="p-0 relative z-10">
                    <div className="flex gap-1 mb-8">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn('h-5 w-5', i < (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-200')}
                        />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl font-bold leading-relaxed mb-8 text-zinc-800 dark:text-zinc-200">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-5 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-primary font-black text-2xl shadow-inner overflow-hidden shrink-0">
                        {t.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          t.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black tracking-tight truncate">{t.name}</h4>
                        <p className="text-sm text-muted-foreground font-bold truncate">
                          {t.role} <span className="text-primary">&bull;</span> {t.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        )}

        <ScrollFadeIn className="text-center mt-20 max-w-xl mx-auto">
          <p className="text-zinc-500 font-bold mb-6">Have a project that belongs here next?</p>
          <Button asChild size="lg" className="rounded-full px-12 h-16 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
            <Link href="/contact">Start a conversation</Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
