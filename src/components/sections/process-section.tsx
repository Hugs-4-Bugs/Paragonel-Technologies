
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

const steps = [
  {
    num: "01",
    title: "Discovery Call",
    description: "We understand your goals, constraints, and what success looks like."
  },
  {
    num: "02",
    title: "Scope & Quote",
    description: "Fixed-scope proposal with milestone-based payment. No surprises."
  },
  {
    num: "03",
    title: "Build & Iterate",
    description: "Agile delivery with weekly demos. See progress every week."
  },
  {
    num: "04",
    title: "Launch & Support",
    description: "Deployment, monitoring, and post-launch retainer options available."
  }
];

export function ProcessSection() {
  return (
    <section className="section-padding bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How We <span className="text-primary">Work</span></h2>
        </ScrollFadeIn>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {steps.map((step, i) => (
            <ScrollFadeIn key={i} delay={`${i * 100}ms`} className="relative">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-5xl font-black text-primary/20 mb-4">{step.num}</span>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm text-center md:text-left">{step.description}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
