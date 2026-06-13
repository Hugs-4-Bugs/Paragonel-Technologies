
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
    const dynamicItems = dynamicTestimonials || [];
    const combined = [...baseTestimonials, ...dynamicItems];
    // Duplicate for seamless infinite loop
    return [...combined, ...combined];
  }, [dynamicTestimonials]);

  return (
    <section className="section-padding bg-background overflow-hidden relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 mb-16 relative z-10">
        <ScrollFadeIn className="text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Client <span className="text-primary">Success Stories</span>
          </h2>
          <p className="mt-4 text-zinc-500 font-medium max-w-2xl mx-auto">
            Trusted by industry leaders and innovative startups worldwide.
          </p>
        </ScrollFadeIn>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative w-full flex overflow-hidden py-10">
        <div className="flex animate-marquee-slow hover:[animation-play-state:paused] gap-8 whitespace-nowrap">
          {displayedTestimonials.map((t: any, index: number) => (
            <div 
              key={`${t.id}-${index}`} 
              className="inline-block w-[350px] md:w-[450px] shrink-0"
            >
              <Card className="h-full rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-xl p-8 relative overflow-hidden bg-card/50 backdrop-blur-sm group hover:border-primary/30 transition-colors duration-500">
                <Quote className="absolute top-6 right-8 h-12 w-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
                <CardContent className="p-0 space-y-6">
                  {/* Rating */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-4 w-4", 
                          i < (t.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"
                        )} 
                      />
                    ))}
                  </div>

                  {/* Feedback */}
                  <p className="text-base md:text-lg font-bold leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-normal line-clamp-4 italic">
                    "{t.content}"
                  </p>

                  {/* User Profile */}
                  <div className="flex items-center gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner overflow-hidden border border-primary/20">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        t.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black tracking-tight truncate">{t.name}</h4>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                        {t.role} <span className="text-primary mx-1">•</span> {t.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
