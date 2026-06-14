
"use client";

import React from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { TeamSection } from '@/components/sections/team-section';
import { Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamPage() {
  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding">
        <div className="container mx-auto px-4 md:px-6 text-center mb-24">
          <ScrollFadeIn>
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <Users className="h-10 w-10 text-primary neon-icon" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Our <span className="text-primary">Innovators</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              A lean team of high-performance engineers and researchers obsessed with bridging the gap between business pain and precision solutions.
            </p>
          </ScrollFadeIn>
        </div>

        <div className="container mx-auto px-4 md:px-6 mb-24">
          <TeamSection />
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center p-12 md:p-20 rounded-[4rem] bg-secondary/10 border border-primary/10 max-w-5xl mx-auto relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors duration-700"></div>
            <Rocket className="h-16 w-16 text-primary/30 mx-auto mb-8" />
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">We're Growing the Core</h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              QuantumFusion is in a high-growth phase. We are looking for first-principles thinkers who want to build the future of AI-native software.
            </p>
            <Button asChild size="lg" className="rounded-full px-12 text-lg h-16 font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/careers">Join the Mission</Link>
            </Button>
          </ScrollFadeIn>
        </div>
      </section>
    </div>
  );
}
