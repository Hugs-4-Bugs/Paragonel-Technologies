
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

  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-24">
           <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
            <MessageSquare className="h-10 w-10 text-primary neon-icon" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            Client <span className="text-primary">Impact</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Direct feedback from the visionaries we partner with to build the future of work.
          </p>
        </ScrollFadeIn>

        {loading && !displayedTestimonials.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-[3rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {displayedTestimonials.map((t: any, index: number) => (
                <ScrollFadeIn key={t.id} delay={`${index * 100}ms`}>
                  <Card className="h-full rounded-[3rem] border-zinc-200 dark:border-zinc-800 shadow-xl p-10 relative overflow-hidden bg-card group">
                    <Quote className="absolute top-8 right-10 h-20 w-20 text-primary/5 -z-0" />
                    <CardContent className="p-0 relative z-10">
                      <div className="flex gap-1 mb-8">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-5 w-5", i < (t.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-zinc-200")} />
                        ))}
                      </div>
                      <p className="text-xl md:text-2xl font-bold leading-relaxed mb-10 text-zinc-800 dark:text-zinc-200">
                        "{t.content}"
                      </p>
                      <div className="flex items-center gap-5 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-primary font-black text-2xl shadow-inner overflow-hidden">
                          {t.avatarUrl ? <img src={t.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : t.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-lg font-black tracking-tight">{t.name}</h4>
                          <p className="text-sm text-muted-foreground font-bold">{t.role} • <span className="text-primary">{t.company}</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollFadeIn>
             ))}
          </div>
        )}

        <ScrollFadeIn className="text-center mt-20">
          <p className="text-zinc-500 font-bold mb-6">Want to see more client success?</p>
          <Button asChild size="lg" className="rounded-full px-12 h-16 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
            <Link href="/contact">Partner with us</Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
