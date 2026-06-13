
"use client";

import React from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
            Client <span className="text-primary">Success Stories</span>
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn className="text-center py-20 px-6 rounded-[3rem] bg-secondary/10 border border-primary/10 max-w-3xl mx-auto">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Be our first featured success story</h3>
          <p className="text-muted-foreground text-lg mb-10">
            We're in early stage. Our first client projects are currently in development. Work with us to build something worth talking about.
          </p>
          <Button asChild size="lg" className="rounded-full px-12 group">
            <Link href="/contact" className="flex items-center gap-2">
              Get in touch <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
