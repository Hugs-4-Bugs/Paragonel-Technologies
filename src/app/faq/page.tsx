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
    a: "We work with startups, SMBs, and enterprises across any industry. If you have a software problem, we can build an AI-native solution for it. We specialize in helping companies eliminate operational bottlenecks through intelligent automation."
  },
  {
    q: "How do you price your projects?",
    a: "We use fixed-scope, milestone-based pricing to ensure total transparency. Each project is quoted individually based on technical complexity, required integration depth, and business impact. We do not bill by the hour for project-based work, ensuring your budget remains predictable from start to finish."
  },
  {
    q: "Do you work with international clients?",
    a: "Yes. We are India-based but serve clients globally. We accept payments in INR via Razorpay and USD/EUR via Stripe, ensuring a seamless transaction process regardless of your location."
  },
  {
    q: "How long does a typical project take?",
    a: "A simple web application or MVP usually takes 6–10 weeks to ship. A full-scale SaaS platform or complex AI integration typically takes 12–22 weeks. We provide a detailed project timeline in every initial proposal."
  },
  {
    q: "Do you provide post-launch support?",
    a: "Absolutely. We offer tailored monthly retainers for ongoing development, critical bug fixes, performance monitoring, and feature additions. Our goal is to be your long-term technology partner, ensuring your platform grows alongside your business."
  },
  {
    q: "What tech stack do you use?",
    a: "We choose the best tool for the job. Our primary stack includes Java (Spring Boot) or Python for backends, Next.js or React for web frontends, and Flutter for mobile. We host primarily on AWS or GCP and leverage Firebase for real-time data needs."
  },
  {
    q: "Can I see your previous products?",
    a: "Yes. AcquisitionOS and SystemFoundry are live and used by clients today. CodeGuard AI is available on the VS Code Marketplace. You can explore these and other projects on our Portfolio page."
  },
  {
    q: "Who will I be working with?",
    a: "You will work directly with our engineering team and founders. We eliminate account managers and middlemen to ensure that the technical vision is never lost in translation. Direct engineer-to-client communication is our standard."
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
            Find quick answers to common questions about our services, process, and how we build high-impact technology.
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
