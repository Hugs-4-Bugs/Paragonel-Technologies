
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden animated-gradient-background">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div> {/* Overlay for better text contrast */}
      <div className="relative z-10 container px-4 md:px-6 text-center">
        <ScrollFadeIn>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-primary-foreground mb-6">
            QuantumFusion <span className="text-primary">Solutions</span>
          </h1>
        </ScrollFadeIn>
        <ScrollFadeIn delay="200ms">
          <p className="max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl text-primary-foreground/90 mb-10">
            Shaping the Future for Tomorrow.
            <br className="hidden sm:block" />
            Innovative IT solutions in AI, Cloud Computing, DevOps, and SaaS Platforms.
          </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay="400ms" className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            asChild
            size="lg" 
            className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
          >
            <Link href="/services">
              Explore Our Services <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            size="lg" 
            className="rounded-full px-8 py-6 text-lg border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
          >
             <Link href="/contact">
              Get In Touch
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
       {/* Optional: Subtle particle/geometric animation layer can be added here */}
    </section>
  );
}
