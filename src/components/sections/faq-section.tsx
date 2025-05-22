
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
    id: 'faq1',
    question: 'What is QuantumLeap?',
    answer: 'QuantumLeap is an innovative platform that uses AI to connect talented individuals with their ideal career opportunities and helps companies find the best candidates efficiently.',
  },
  {
    id: 'faq2',
    question: 'How does the AI job matching work?',
    answer: 'Our AI algorithms analyze your profile, skills, experience, and preferences, along with job requirements and company culture, to provide highly relevant and personalized job matches.',
  },
  {
    id: 'faq3',
    question: 'Is QuantumLeap free for job seekers?',
    answer: 'Yes, creating a profile, browsing jobs, and applying for positions on QuantumLeap is completely free for job seekers. We also offer optional premium services for enhanced career support.',
  },
  {
    id: 'faq4',
    question: 'How can companies benefit from QuantumLeap?',
    answer: 'Companies can leverage QuantumLeap to access a diverse talent pool, streamline their recruitment process with AI-powered tools, improve employer branding, and make data-driven hiring decisions.',
  },
  {
    id: 'faq5',
    question: 'What kind of support do you offer?',
    answer: 'We offer comprehensive support for both job seekers and employers, including a help center, email support, and personalized assistance for premium users and enterprise clients.',
  },
];

export function FaqSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Find quick answers to common questions about QuantumLeap and our services.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={item.id} key={item.id} className="border-b border-border/70">
                <AccordionTrigger className="text-left text-lg hover:no-underline py-5 font-medium text-foreground data-[state=open]:text-primary">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-5 text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
