"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden animated-gradient-background">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
      <div className="relative z-10 container px-4 md:px-6 text-center">
        <ScrollFadeIn>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5" /> AI-Native Product Engineering
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-primary-foreground mb-6">
            Paragonel <span className="text-primary">Technologies</span>
          </h1>
        </ScrollFadeIn>
        <ScrollFadeIn delay="200ms">
          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-primary-foreground tracking-normal mb-4">
            Shaping the Future
          </p>
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-lg text-primary-foreground/80 mb-10 leading-relaxed">
            Paragonel is an AI-native product-engineering company. We build our own software — including AcquisitionOS,
            an AI-native client acquisition platform now in private beta — and deliver the cloud, DevOps, AI, and
            product-engineering services that stand it up. Precision engineering for real business pain, not feature
            checkboxes.
          </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay="400ms" className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
          >
            <Link href="/our-product/acquisitionos">
              Explore AcquisitionOS <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 text-lg border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto bg-white/80 dark:bg-transparent dark:border-primary-foreground/80 text-slate-900 dark:text-primary-foreground"
          >
            <Link href="/services">
              Explore Our Services
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
