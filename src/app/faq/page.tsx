
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqItems = [
  {
    q: "What types of clients do you work with?",
    a: "We work with startups, SMBs, and enterprises across any industry. If you have a software problem, we can build an AI-native solution for it."
  },
  {
    q: "How do you price your projects?",
    a: "We use fixed-scope, milestone-based pricing. Small projects start around ₹75,000. Full SaaS platforms range from ₹1.5L to ₹10L+. We do not bill by the hour for project work."
  },
  {
    q: "Do you work with international clients?",
    a: "Yes. We are India-based but work with clients globally. Payments are accepted in INR via Razorpay and USD/EUR via Stripe."
  },
  {
    q: "How long does a typical project take?",
    a: "A simple web app or MVP usually takes 6–10 weeks. A full SaaS platform takes 12–22 weeks. We provide a detailed timeline in the initial proposal."
  },
  {
    q: "Do you provide post-launch support?",
    a: "Yes. We offer monthly retainers for ongoing development, bug fixes, performance monitoring, and feature additions."
  },
  {
    q: "What tech stack do you use?",
    a: "Backend: Java Spring Boot or Python FastAPI. Frontend: Next.js / React or Flutter for mobile. Cloud: AWS or GCP. Payments: Razorpay (India) / Stripe (global)."
  },
  {
    q: "Can I see your products?",
    a: "Yes. AcquisitionOS and SystemFoundry are live. CodeGuard AI is on the VS Code Marketplace. See our Portfolio page for details."
  },
  {
    q: "Who will I be working with?",
    a: "Directly with the founder and principal engineer, Prabhat Sharma. No account managers or middlemen. Direct engineer-to-client communication."
  }
];

export default function FaqPage() {
  return (
    <section className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Find quick answers to common questions about our services, pricing, and how we work.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b border-primary/10">
                <AccordionTrigger className="text-left text-lg hover:no-underline py-5 font-bold hover:text-primary transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-5 text-muted-foreground leading-relaxed text-base">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
