
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

const stats = [
  { label: "Products Built", value: "4+" },
  { label: "Years Experience", value: "3+" },
  { label: "Technologies", value: "10+" },
  { label: "Global Delivery", value: "India-Based" },
];

export function StatsBar() {
  return (
    <div className="bg-primary py-8 text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <ScrollFadeIn key={i} delay={`${i * 100}ms`}>
              <div className="flex flex-col">
                <span className="text-3xl md:text-4xl font-bold">{stat.value}</span>
                <span className="text-sm md:text-base opacity-80">{stat.label}</span>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
