
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Brain, Cloud, GitFork, Layers, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: Brain,
    title: 'AI Solutions',
    description: 'Unlock the power of Artificial Intelligence with our custom machine learning models, natural language processing, and computer vision solutions tailored to your business needs.',
    imgSrc: 'https://placehold.co/600x350.png',
    aiHint: 'AI neural network',
    link: '/services/ai-solutions', 
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'Optimize your operations with our secure, scalable, and cost-effective cloud infrastructure services, including migration, management, and cloud-native development.',
    imgSrc: 'https://placehold.co/600x350.png',
    aiHint: 'cloud data server',
    link: '/services/cloud-infrastructure',
  },
  {
    icon: GitFork,
    title: 'DevOps Automation',
    description: 'Accelerate your software delivery lifecycle with our comprehensive DevOps automation services, including CI/CD pipelines, infrastructure as code, and automated testing.',
    imgSrc: 'https://placehold.co/600x350.png',
    aiHint: 'devops cycle',
    link: '/services/devops-automation',
  },
  {
    icon: Layers,
    title: 'SaaS Platforms',
    description: 'Develop and launch robust, scalable, and user-friendly SaaS platforms with our end-to-end development services, from ideation and design to deployment and maintenance.',
    imgSrc: 'https://placehold.co/600x350.png',
    aiHint: 'saas dashboard ui',
    link: '/services/saas-platforms',
  },
];

export function ServicesSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Core <span className="text-primary">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            QuantumFusion Solutions delivers a comprehensive suite of IT services designed to propel your business into the future.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
              <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
                <CardHeader className="pb-2">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-8 w-8 text-primary neon-icon group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-1">{service.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-2 flex flex-col">
                   <div className="relative w-full h-48 mt-4 rounded-md overflow-hidden group-hover:opacity-90 transition-opacity">
                     <Image
                        src={service.imgSrc}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
