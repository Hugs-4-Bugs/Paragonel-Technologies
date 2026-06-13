
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Brain, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CustomPlatformPage() {
  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <Button asChild variant="ghost" className="mb-8">
            <Link href="/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Custom Platform Development</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mb-12">
            We build full-stack digital platforms for any domain — healthcare, fintech, e-commerce, restaurant tech, or anything else.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <ScrollFadeIn delay="200ms" className="space-y-6">
            <h2 className="text-2xl font-bold">End-to-End Execution</h2>
            <p className="text-muted-foreground">
              From initial scope and wireframing to production deployment, we handle every aspect of your platform. No messy handoffs between design and development teams, and no vendor blame. We take full responsibility for the entire technology stack.
            </p>
            <ul className="space-y-4">
              {[
                "Modern design and intuitive UX",
                "Scalable backend architectures (Spring Boot / FastAPI)",
                "Secure payments integration (Stripe / Razorpay)",
                "Robust cloud hosting and automated deployments"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms" className="bg-secondary/10 p-8 rounded-3xl border border-primary/10">
            <h3 className="text-xl font-bold mb-4 text-primary">Why Choose Our Custom Platforms?</h3>
            <p className="text-muted-foreground mb-6 italic">"We build for longevity and scale. Your platform isn't just a project; it's the foundation of your business."</p>
            <div className="space-y-4">
              <p className="text-sm font-medium">Domain expertise including:</p>
              <div className="flex flex-wrap gap-2">
                {["Healthcare", "Fintech", "E-commerce", "EdTech", "Logistics"].map(d => (
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
