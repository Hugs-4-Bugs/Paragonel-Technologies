
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Cloud, Users, Briefcase, Lightbulb } from 'lucide-react';

const services = [
  {
    icon: Brain,
    title: 'AI-Powered Job Matching',
    description: 'Leveraging advanced AI algorithms to connect candidates with their ideal roles and help companies find top talent.',
    imgSrc: 'https://placehold.co/600x400/3498DB/FFFFFF.png?text=AI+Matching',
    aiHint: 'artificial intelligence',
  },
  {
    icon: Users,
    title: 'Personalized Career Coaching',
    description: 'Data-driven insights and expert guidance to help individuals navigate their career paths and achieve professional growth.',
    imgSrc: 'https://placehold.co/600x400/663399/FFFFFF.png?text=Career+Coaching',
    aiHint: 'career coaching',
  },
  {
    icon: Briefcase,
    title: 'Enterprise Talent Solutions',
    description: 'Comprehensive solutions for businesses, including talent sourcing, employer branding, and workforce analytics.',
    imgSrc: 'https://placehold.co/600x400/1A237E/FFFFFF.png?text=Talent+Solutions',
    aiHint: 'business solution',
  },
  {
    icon: Lightbulb,
    title: 'Skill Development Platform',
    description: 'Curated learning resources and skill assessments to help users upskill and stay competitive in the job market.',
    imgSrc: 'https://placehold.co/600x400/2ECC71/FFFFFF.png?text=Skill+Development',
    aiHint: 'online learning',
  },
];

export function ServicesSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            QuantumLeap offers a suite of innovative services designed to empower your career journey and streamline talent acquisition.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
              <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <service.icon className="h-8 w-8 text-primary neon-icon" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-1">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                   <Image
                    src={service.imgSrc}
                    alt={service.title}
                    width={600}
                    height={300} // Adjust height as needed
                    className="rounded-md object-cover w-full h-48 mt-4"
                    data-ai-hint={service.aiHint}
                  />
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
