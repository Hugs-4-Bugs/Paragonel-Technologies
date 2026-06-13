
"use client";

import React from 'react';
import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const portfolioItems = [
  {
    name: 'AcquisitionOS',
    category: 'AI / SaaS',
    description: 'AI-powered lead acquisition and CRM platform. Replaces 3–4 separate sales tools. Deployed on Vercel + Google Cloud Run.',
    status: 'Live',
    techs: ['Next.js', 'Spring Boot', 'Firebase', 'Stripe', 'Claude API', 'GCP'],
    imageUrl: 'https://picsum.photos/seed/p1/600/400'
  },
  {
    name: 'SystemFoundry',
    category: 'Developer Tools / AI',
    description: 'Visual AI-powered system architecture simulator for engineers and technical teams. Design and validate architectures in real time.',
    status: 'Live',
    techs: ['React', 'Spring Boot', 'Firebase', 'GCP'],
    imageUrl: 'https://picsum.photos/seed/p2/600/400'
  },
  {
    name: 'CodeGuard AI',
    category: 'Developer Tools',
    description: 'VS Code extension that detects expensive AWS infrastructure patterns in Terraform files in real time, before deployment.',
    status: 'Published (VS Code Marketplace)',
    techs: ['TypeScript', 'VS Code API', 'Node.js', 'Terraform'],
    imageUrl: 'https://picsum.photos/seed/p3/600/400'
  },
  {
    name: 'AaharAI',
    category: 'Health / Mobile',
    description: 'India-first AI nutrition and health companion for Android. Regional food intelligence with Indian language support.',
    status: 'In Development',
    techs: ['Flutter', 'Spring Boot', 'Claude API', 'Google Cloud Run', 'Firebase'],
    imageUrl: 'https://picsum.photos/seed/p4/600/400'
  },
  {
    name: 'Maa-Aarogyam Health Platform',
    category: 'Healthcare / Custom',
    description: 'Hospital management system for a clinic. Appointment scheduling, patient records, billing, and reporting.',
    status: 'In Development',
    techs: ['Java Spring Boot', 'AWS', 'Razorpay'],
    imageUrl: 'https://picsum.photos/seed/p5/600/400'
  },
];

export default function PortfolioPage() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <Globe className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Real products built to solve real problems. From live SaaS platforms to AI-powered developer tools.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioItems.map((project, index) => (
            <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
              <Card className="h-full flex flex-col overflow-hidden border-none shadow-xl bg-secondary/10 group">
                <CardHeader className="p-0">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={project.imageUrl}
                      alt={project.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-white shadow-lg">{project.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{project.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="mb-4 text-primary border-primary/30">{project.category}</Badge>
                  <CardDescription className="text-muted-foreground mb-6 leading-relaxed">
                    {project.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techs.map(tech => (
                      <span key={tech} className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-background px-2 py-1 rounded-sm border border-border">
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn className="text-center mt-20">
          <div className="p-10 rounded-3xl bg-primary/5 border border-primary/20">
            <h2 className="text-2xl font-bold mb-4">Have a project in mind?</h2>
            <p className="text-muted-foreground mb-8">Let's build your AI-native solution together.</p>
            <Button asChild size="lg" className="rounded-full px-12">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
