
"use client";

import React from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Linkedin, Twitter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamPage() {
  return (
    <>
      <title>Our Team | QuantumFusion Solutions</title>
      <meta name="description" content="Meet the innovators at QuantumFusion Solutions. A lean team of engineers obsessed with building software that works." />
      <div className="bg-background min-h-screen">
        <section className="section-padding">
          <div className="container mx-auto px-4 md:px-6 text-center mb-20">
            <ScrollFadeIn>
              <Users className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Our <span className="text-primary">Team</span></h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Small, lean, and obsessed with building software that works.</p>
            </ScrollFadeIn>
          </div>

          <div className="container mx-auto px-4 md:px-6 mb-20">
            <ScrollFadeIn className="max-w-4xl mx-auto">
              <Card className="overflow-hidden border-none shadow-2xl bg-secondary/10">
                <div className="grid md:grid-cols-3 gap-0">
                  <div className="bg-primary flex items-center justify-center py-20 text-white">
                    <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-6xl font-black shadow-2xl border-4 border-white/40">PS</div>
                  </div>
                  <div className="md:col-span-2 p-10">
                    <h2 className="text-3xl font-black mb-1">Prabhat Sharma</h2>
                    <p className="text-primary font-bold mb-6 text-lg tracking-tight">Founder & Principal Engineer</p>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                      Java backend developer and solo founder building QuantumFusion Solutions. Specializes in AI systems, cloud infrastructure (AWS/GCP), Spring Boot, and full-stack development. Former Netcore Cloud engineer with a mission to build AI-native software that solves real pain.
                    </p>
                    <div className="flex gap-4">
                      <Button asChild size="lg" className="rounded-full shadow-lg">
                        <Link href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/" target="_blank" className="flex items-center gap-2">
                          <Linkedin className="h-5 w-5" /> LinkedIn
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="rounded-full">
                        <Link href="https://x.com/kattyPrabhat" target="_blank" className="flex items-center gap-2">
                          <Twitter className="h-5 w-5" /> Twitter
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </ScrollFadeIn>
          </div>

          <div className="container mx-auto px-4 md:px-6">
            <ScrollFadeIn className="text-center p-12 rounded-[3rem] bg-primary/5 border border-primary/10 max-w-4xl mx-auto">
              <h2 className="text-3xl font-black mb-4">We're Growing</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                QuantumFusion is in early growth stage. Our core team is small and lean. Join us as one of our first core contributors.
              </p>
              <Button asChild size="lg" className="rounded-full px-12 text-lg h-16 shadow-xl shadow-primary/20">
                <Link href="/careers">See Open Roles</Link>
              </Button>
            </ScrollFadeIn>
          </div>
        </section>
      </div>
    </>
  );
}
