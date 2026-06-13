
"use client";

import React from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';

export default function TestimonialsPage() {
  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Client <span className="text-primary">Success</span>
          </h1>
        </ScrollFadeIn>

        <ScrollFadeIn className="text-center py-32 px-6 rounded-[3rem] bg-secondary/10 border border-primary/10 max-w-3xl mx-auto shadow-2xl shadow-primary/5">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-10">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-3xl font-black mb-6">Early Stage Growth</h3>
          <p className="text-muted-foreground text-xl mb-12 leading-relaxed">
            QuantumFusion Solutions is in its early stage. We are currently working with our first batch of client partners to deliver AI-native solutions. Testimonials will appear here as we complete these engagements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-12 h-16 text-lg shadow-xl shadow-primary/20">
              <Link href="/contact">Partner with us</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full h-16 text-lg">
              <Link href="/portfolio">See our products</Link>
            </Button>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
