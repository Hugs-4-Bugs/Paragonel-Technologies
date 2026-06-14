
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Rocket, Target, Award, Milestone, Brain, Cloud, GitFork, Linkedin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 text-foreground">
            About <span className="text-primary">QuantumFusion</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Building the next generation of AI-native software and scalable cloud platforms.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <ScrollFadeIn className="relative aspect-square md:aspect-auto md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl bg-primary/5 flex items-center justify-center border-2 border-primary/10">
            <div className="text-center p-12">
               <ShieldCheck className="h-32 w-32 text-primary mx-auto mb-6 neon-icon" />
               <h3 className="text-3xl font-black text-primary mb-2">Precision Engineering</h3>
               <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">A QuantumFusion Brand Identity</p>
            </div>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Our Story</span>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Eliminating the gap between problems and solutions.</h2>
            <p className="text-xl font-medium mb-8 italic border-l-4 border-primary pl-6 py-2 text-foreground/80 leading-relaxed">
              "We don't build software to check a box. We build it to solve real business pain, with precision and speed that traditional firms can't match."
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Founded in 2024 by Prabhat Sharma, QuantumFusion Solutions was born from a desire to escape the slow, bureaucratic world of traditional IT services. We believe in lean teams, direct communication, and building AI-native tools that actually work.
            </p>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn className="mb-24">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-12 tracking-tight">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "AI-Native Thinking", text: "We don't just 'add' AI; we architect it into the core of every solution.", icon: Brain },
              { title: "Product Mindset", text: "We build our own SaaS products, so we know exactly what it takes to scale.", icon: Rocket },
              { title: "Radical Transparency", text: "Fixed-scope, milestone-based delivery. No hourly billings, no surprises.", icon: Target }
            ].map((value, i) => (
              <Card key={i} className="p-8 rounded-[2.5rem] border-zinc-100 dark:border-zinc-800 shadow-xl bg-card hover:border-primary/30 transition-all group">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-2xl font-black mb-4 tracking-tight">{value.title}</h4>
                <p className="text-zinc-500 font-medium leading-relaxed">{value.text}</p>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn className="mb-24">
          <div className="bg-zinc-900 text-white rounded-[3rem] p-12 md:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[120px]"></div>
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-5xl font-black mb-6">Built for the next generation.</h3>
                <p className="text-zinc-400 text-lg mb-10 font-medium leading-relaxed">
                  Whether you're a pre-seed startup needing a technical co-founder or an enterprise modernizing legacy systems, we fusion your vision with our engineering expertise.
                </p>
                <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black shadow-2xl shadow-primary/20">
                  <Link href="/portfolio">Explore Our Work</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Products Built", val: "4+" },
                  { label: "Tech Stack", val: "12+" },
                  { label: "Global Reach", val: "3 Countries" },
                  { label: "Core Team", val: "Lean & Fast" }
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <p className="text-3xl font-black text-primary mb-1">{stat.val}</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollFadeIn>

      </div>
    </section>
  );
}
