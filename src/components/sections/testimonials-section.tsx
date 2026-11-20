"use client";

import React, { useMemo } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { baseTestimonials } from '@/lib/data';
import { cn } from '@/lib/utils';

export function TestimonialsSection() {
  const firestore = useFirestore();

  const testimonialsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'testimonials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: dynamicTestimonials } = useCollection(testimonialsQuery);

  const displayedTestimonials = useMemo(() => {
    // NOTE: never duplicate records for a marquee loop — that caused identical
    // cards to render. Render each genuine testimonial exactly once.
    return [...baseTestimonials, ...(dynamicTestimonials || [])];
  }, [dynamicTestimonials]);

  const count = displayedTestimonials.length;
  // With few testimonials, center a single column so the section looks intentional
  // instead of stretched or empty. With more, use a balanced multi-column grid.
  const gridClass =
    count <= 1
      ? 'grid grid-cols-1 max-w-2xl mx-auto'
      : count === 2
        ? 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';

  return (
    <section className="section-padding bg-background overflow-hidden relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollFadeIn className="text-center mb-14">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Client feedback</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            What our <span className="text-primary">clients</span> say
          </h2>
          <p className="mt-4 text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
            We are selective about the work we take on. Here is feedback from a real engagement, in the client&apos;s own words.
          </p>
        </ScrollFadeIn>

        <div className={cn('gap-8', gridClass)}>
          {displayedTestimonials.map((t: any, index: number) => (
            <ScrollFadeIn key={`${t.id}-${index}`} delay={`${index * 100}ms`}>
              <Card className="h-full rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-xl p-8 md:p-10 relative overflow-hidden bg-card group hover:border-primary/30 transition-colors duration-500">
                <Quote className="absolute top-6 right-8 h-16 w-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
                <CardContent className="p-0 relative z-10 space-y-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-200'
                        )}
                      />
                    ))}
                  </div>

                  <p className="text-lg md:text-xl font-bold leading-relaxed text-zinc-800 dark:text-zinc-200">
                    &ldquo;{t.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner overflow-hidden border border-primary/20 shrink-0">
                      {t.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        t.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black tracking-tight truncate">{t.name}</h4>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                        {t.role} <span className="text-primary mx-1">&bull;</span> {t.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
