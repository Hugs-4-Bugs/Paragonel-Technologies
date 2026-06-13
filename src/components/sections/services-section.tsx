
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Brain, Cloud, GitFork, Layers, ArrowRight, AppWindow, Zap, Code, ShieldCheck } from 'lucide-react';

const services = [
  {
    icon: Brain,
    title: 'AI Solutions',
    description: 'Unlock the power of Artificial Intelligence with our custom machine learning models, natural language processing, and computer vision solutions tailored to your business needs.',
    imgSrc: 'https://picsum.photos/seed/ai/600/400',
    aiHint: 'AI network',
    link: '/services/ai-solutions', 
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'Optimize your operations with our secure, scalable, and cost-effective cloud infrastructure services, including migration, management, and cloud-native development.',
    imgSrc: 'https://picsum.photos/seed/cloud/600/400',
    aiHint: 'cloud server',
    link: '/services/cloud-infrastructure',
  },
  {
    icon: GitFork,
    title: 'DevOps Automation',
    description: 'Accelerate your software delivery lifecycle with our comprehensive DevOps automation services, including CI/CD pipelines, infrastructure as code, and automated testing.',
    imgSrc: 'https://picsum.photos/seed/devops/600/400',
    aiHint: 'devops pipeline',
    link: '/services/devops-automation',
  },
  {
    icon: Layers,
    title: 'SaaS Platforms',
    description: 'Develop and launch robust, scalable, and user-friendly SaaS platforms with our end-to-end development services, from ideation and design to deployment and maintenance.',
    imgSrc: 'https://picsum.photos/seed/saas/600/400',
    aiHint: 'software platform',
    link: '/services/saas-platforms',
  },
  {
    icon: Code,
    title: 'Custom Platform Development',
    description: 'We build full-stack digital platforms for any domain — healthcare, fintech, e-commerce, or restaurant tech. No handoffs, no vendor blame.',
    imgSrc: 'https://picsum.photos/seed/custom/600/400',
    aiHint: 'code development',
    link: '/services/custom-platform',
  },
  {
    icon: AppWindow,
    title: 'Mobile App Development',
    description: 'Cross-platform Android and iOS apps built with Flutter, connected to robust Spring Boot backends. Firebase auth, push notifications, and offline support.',
    imgSrc: 'https://picsum.photos/seed/mobile/600/400',
    aiHint: 'mobile application',
    link: '/services/mobile-apps',
  },
  {
    icon: Zap,
    title: 'AI Automation & Integration',
    description: 'Add AI to what you already have. We integrate LLMs, build multi-agent systems with CrewAI, and automate repetitive workflows.',
    imgSrc: 'https://picsum.photos/seed/integration/600/400',
    aiHint: 'fast automation',
    link: '/services/ai-automation',
  },
  {
    icon: ShieldCheck,
    title: 'Fractional CTO / Tech Advisory',
    description: 'Senior technical voice without a full-time hire. We handle tech scoping, architecture, and team building on a retainer basis.',
    imgSrc: 'https://picsum.photos/seed/cto/600/400',
    aiHint: 'tech advisory',
    link: '/services/fractional-cto',
  },
];


export function ServicesSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Core <span className="text-primary">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            QuantumFusion Solutions delivers a comprehensive suite of IT services designed to propel your business into the future.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
              <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
                <CardHeader className="pb-2">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors shrink-0">
                      <service.icon className="h-6 w-6 text-primary neon-icon group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-1">{service.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-3">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-2 flex flex-col">
                   <div className="relative w-full h-40 mt-4 rounded-md overflow-hidden group-hover:opacity-90 transition-opacity">
                     <Image
                        src={service.imgSrc}
                        alt={service.title}
                        fill
                        className="object-cover"
                        data-ai-hint={service.aiHint}
                      />
                   </div>
                   <Button asChild variant="link" className="mt-auto self-start p-0 text-primary group-hover:underline">
                     <Link href={service.link}>
                       Learn More <ArrowRight className="ml-1 h-4 w-4" />
                     </Link>
                   </Button>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
