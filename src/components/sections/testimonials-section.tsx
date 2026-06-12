"use client";

import React from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    id: '1',
    name: 'Michael Roberts',
    role: 'Founder, GrowthForge',
    product: 'AcquisitionOS',
    review: "AcquisitionOS replaced four separate tools in our workflow. We reduced customer acquisition costs by 37% and launched campaigns three times faster. The automation capabilities alone save dozens of hours every week.",
    metric: '37% Cost Reduction',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sarah Thompson',
    role: 'Operations Director',
    product: 'Sharma AI',
    review: "Sharma AI transformed how our support team handles customer requests. Response times dropped from hours to minutes while maintaining outstanding accuracy and consistency.",
    metric: '90% Faster Responses',
    rating: 5,
  },
  {
    id: '3',
    name: 'Daniel Parker',
    role: 'Content Strategist',
    product: 'ArticleHub',
    review: "ArticleHub helped our team manage and publish large volumes of content effortlessly. Collaboration improved dramatically and publishing workflows became significantly faster.",
    metric: '3x Publishing Speed',
    rating: 5,
  },
  {
    id: '4',
    name: 'Rahul Kapoor',
    role: 'Restaurant Owner',
    product: 'Cafe Management System',
    review: "The QR ordering and integrated payment experience streamlined our entire operation. Customers loved the speed and our team handled peak hours much more efficiently.",
    metric: '50% Faster Ordering',
    rating: 5,
  },
  {
    id: '5',
    name: 'Emma Wilson',
    role: 'Fintech Consultant',
    product: 'Mobile Banking Platform',
    review: "The platform provided enterprise-grade security and an exceptional user experience. It became the backbone of our digital banking initiative.",
    metric: '99.9% Reliability',
    rating: 5,
  },
  {
    id: '6',
    name: 'James Lewis',
    role: 'Healthcare Administrator',
    product: 'Hospital Management System',
    review: "Appointment scheduling, patient records, billing, and reporting were unified into a single platform. Administrative workload decreased significantly.",
    metric: '60% Less Manual Work',
    rating: 5,
  },
  {
    id: '7',
    name: 'Alex Morgan',
    role: 'Technology Lead',
    product: 'QuantumFusion Sol',
    review: "QuantumFusion Sol modernized our backend infrastructure and improved scalability across critical business operations. Performance gains were immediately noticeable.",
    metric: '2x System Performance',
    rating: 5,
  },
  {
    id: '8',
    name: 'David Carter',
    role: 'Chief Technology Officer',
    product: 'AI Integration Platform',
    review: "The AI integration capabilities allowed us to automate complex workflows without replacing our existing infrastructure. Deployment was fast and efficient.",
    metric: '80 Hours Saved Monthly',
    rating: 5,
  },
];

// Helper to get initials
const getInitials = (name: string) => {
  const parts = name.split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
};

export function TestimonialsSection() {
  // Triple the items for a truly seamless infinite scroll
  const scrollItems = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[150px] animate-pulse-light" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Client <span className="text-primary">Success Stories</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from businesses transformed by QuantumFusion Solutions' innovative products and services.
          </p>
        </ScrollFadeIn>

        <div className="relative w-full overflow-hidden py-12">
          {/* Gradient Fades for the edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
          
          <div className="animate-marquee-slow hover:pause-marquee gap-8 px-4">
            {scrollItems.map((testimonial, index) => (
              <div key={`${testimonial.id}-${index}`} className="glass-card-3d-wrapper w-[300px] sm:w-[350px] flex-shrink-0">
                <div className="glass-card-premium p-8 h-full flex flex-col">
                  {/* Liquid Glow Orbs */}
                  <div className="liquid-glow liquid-glow-blue w-32 h-32 -top-10 -right-10 animate-[liquid-glow-move_15s_infinite]" />
                  <div className="liquid-glow liquid-glow-purple w-32 h-32 -bottom-10 -left-10 animate-[liquid-glow-move_20s_infinite_reverse]" />
                  <div className="liquid-glow liquid-glow-cyan w-24 h-24 top-1/2 left-1/2 animate-[liquid-glow-move_12s_infinite_linear]" />

                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="avatar-circle-glass text-primary-foreground">
                      <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                        {getInitials(testimonial.name)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{testimonial.name}</h4>
                      <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 opacity-70">
                        Via {testimonial.product}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow mb-6 relative z-10">
                    <Quote className="h-6 w-6 text-primary/10 absolute -top-2 -left-2 -rotate-12" />
                    <p className="text-muted-foreground italic leading-relaxed text-sm">
                      "{testimonial.review}"
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-6 border-t border-white/10 mt-auto relative z-10">
                    <div className="flex flex-col gap-3">
                      <div className="metric-pill-glass self-start">
                        {testimonial.metric}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5 star-rating-gold">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/50">VERIFIED SUCCESS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}