
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
    question: 'What is Paragonel?',
    answer: 'Paragonel is a premier IT company specializing in AI Solutions, Cloud Infrastructure, DevOps Automation, and SaaS Platforms. We help businesses innovate and achieve digital transformation.',
  },
  {
    id: 'faq2',
    question: 'What industries do you serve?',
    answer: 'We serve a diverse range of industries including tech, finance, healthcare, retail, and manufacturing, providing tailored IT solutions to meet specific sector challenges.',
  },
  {
    id: 'faq3',
    question: 'How does Paragonel approach AI development?',
    answer: 'Our AI development process is collaborative and iterative. We work closely with clients to understand their needs, develop custom AI models, and integrate them seamlessly into their existing workflows for maximum impact.',
  },
  {
    id: 'faq4',
    question: 'Can you help migrate our infrastructure to the cloud?',
    answer: 'Absolutely. Paragonel offers comprehensive cloud migration services, from initial assessment and strategy to execution and post-migration support, ensuring a smooth transition to platforms like AWS, Azure, or GCP.',
  },
  {
    id: 'faq5',
    question: 'What kind of DevOps services do you offer?',
    answer: 'We provide end-to-end DevOps services, including CI/CD pipeline automation, infrastructure as code (IaC), containerization (Docker, Kubernetes), monitoring, and security integration to accelerate your software delivery lifecycle.',
  },
  {
    id: 'faq6',
    question: 'How can I apply for a job at Paragonel?',
    answer: 'Please visit our Careers page to view current openings and submit your application. We are always looking for talented individuals to join our team!',
  },
];

export function FaqSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Find quick answers to common questions about Paragonel and our services.
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
