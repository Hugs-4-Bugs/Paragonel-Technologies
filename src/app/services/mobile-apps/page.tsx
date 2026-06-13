
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { AppWindow, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MobileAppsPage() {
  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <Button asChild variant="ghost" className="mb-8">
            <Link href="/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <AppWindow className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Mobile App Development</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mb-12">
            Cross-platform Android and iOS apps built with Flutter, connected to robust enterprise-grade backends.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <ScrollFadeIn delay="200ms" className="space-y-6">
            <h2 className="text-2xl font-bold">Native Performance, Hybrid Efficiency</h2>
            <p className="text-muted-foreground">
              We leverage Flutter to deliver beautiful, high-performance apps from a single codebase. This reduces development time and cost without compromising on the user experience.
            </p>
            <ul className="space-y-4">
              {[
                "Secure Firebase & Custom Authentication",
                "Push Notifications & Real-time Updates",
                "Offline Support & Local Data Sync",
                "Seamless Native Integration (Camera, GPS, Biometrics)"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms" className="bg-secondary/10 p-8 rounded-3xl border border-primary/10">
            <h3 className="text-xl font-bold mb-4 text-primary">Technical Excellence</h3>
            <p className="text-muted-foreground mb-6 italic">"Our mobile apps are built to handle real-world scenarios, from spotty connectivity to massive user growth."</p>
            <div className="space-y-4">
              <p className="text-sm font-medium">Core Stack:</p>
              <div className="flex flex-wrap gap-2">
                {["Flutter", "Spring Boot", "Firebase", "GCP", "SQLite"].map(d => (
                  <span key={d} className="px-3 py-1 bg-background rounded-full text-xs border border-primary/20">{d}</span>
                ))}
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </div>
  );
}
