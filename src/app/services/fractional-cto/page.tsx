
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FractionalCtoPage() {
  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <Button asChild variant="ghost" className="mb-8">
            <Link href="/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Fractional CTO & Tech Advisory</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mb-12">
            Strategic technical leadership for startups and SMBs who need senior guidance without the cost of a full-time executive.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <ScrollFadeIn delay="200ms" className="space-y-6">
            <h2 className="text-2xl font-bold">Your Technical Partner</h2>
            <p className="text-muted-foreground">
              Get the technical oversight your product needs. We help with high-level architecture, technology selection, and building efficient engineering processes that scale.
            </p>
            <ul className="space-y-4">
              {[
                "Product & Technology Scoping",
                "Cloud Architecture & Scalability Planning",
                "Technical Vendor Selection & Management",
                "Engineering Team Building & Mentorship"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms" className="bg-secondary/10 p-8 rounded-3xl border border-primary/10">
            <h3 className="text-xl font-bold mb-4 text-primary">Strategic Advisor</h3>
            <p className="text-muted-foreground mb-6 italic">"Most tech debt is created in the first 3 months. We make sure you start with a foundation that won't crumble."</p>
            <div className="space-y-2 text-sm font-medium">
              <p>Engagement: Monthly Retainer</p>
              <p>Best for: Pre-seed to Series A startups</p>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </div>
  );
}
