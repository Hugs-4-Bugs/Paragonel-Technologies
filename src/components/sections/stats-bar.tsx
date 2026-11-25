
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

/**
 * StatsBar — Phase 1 §7 credibility.
 *
 * The previous stats asserted "Products Shipped: 3", "Founded: 2024", and
 * "Technologies: 10+" — none independently verified (Content Truth Register
 * §6 flags them as "asserted, not sourced"; "2024 Founded" is medium
 * confidence pending founder confirmation). They have been removed.
 *
 * Replaced with verified, non-numeric facts from the Content Truth Register
 * §1/§8: AcquisitionOS is in private beta; CodeGuard AI is published on the
 * VS Code Marketplace; the company is India-based; the founder is Prabhat
 * Kumar (BE CS). No fabricated counts, dates, or metrics.
 */
const stats = [
  { label: "AcquisitionOS", value: "Private Beta" },
  { label: "CodeGuard AI", value: "VS Code Marketplace" },
  { label: "Based In", value: "India" },
  { label: "Founder", value: "Prabhat Kumar" },
];

export function StatsBar() {
  return (
    <div className="bg-primary py-8 text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <ScrollFadeIn key={i} delay={`${i * 100}ms`} className="h-full">
              <div className="flex h-full flex-col">
                <span className="text-xl md:text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-sm md:text-base opacity-80 mt-1">{stat.label}</span>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
