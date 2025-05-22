"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden animated-gradient-background">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div> {/* Overlay for better text contrast */}
      <div className="relative z-10 container px-4 md:px-6 text-center">
        <ScrollFadeIn>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-primary-foreground mb-6">
            Ignite Your <span className="text-primary">Quantum Leap</span>
          </h1>
        </ScrollFadeIn>
        <ScrollFadeIn delay="200ms">
          <p className="max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl text-primary-foreground/90 mb-10">
            Discover groundbreaking career opportunities and personalized insights.
            QuantumLeap connects talent with innovation, shaping the future, one career at a time.
          </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay="400ms">
          <Button 
            size="lg" 
            className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              const jobSection = document.getElementById('job-listings');
              if (jobSection) {
                jobSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Explore Opportunities <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </ScrollFadeIn>
      </div>
       {/* Optional: Subtle particle/geometric animation layer can be added here */}
    </section>
  );
}
