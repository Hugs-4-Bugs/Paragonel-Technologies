
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const portfolioItems = [
  {
    id: '1',
    title: 'AI-Driven Recruitment Platform for TechCorp',
    category: 'Talent Acquisition',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'AI recruitment dashboard',
    description: 'Developed a cutting-edge platform that reduced hiring time by 40% using AI matchmaking and automated workflows.',
  },
  {
    id: '2',
    title: 'Career Path Visualization Tool for EduFuture',
    category: 'Career Development',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'career graph',
    description: 'Created an interactive tool helping students visualize and plan their career paths based on skills and interests.',
  },
  {
    id: '3',
    title: 'Personalized Learning Portal for SkillUp',
    category: 'EdTech Solutions',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'edtech saas ui',
    description: 'Built a SaaS platform offering personalized learning journeys and skill assessments for professionals.',
  },
   {
    id: '4',
    title: 'Remote Team Collaboration Suite',
    category: 'Productivity Tools',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'team productivity app',
    description: 'Designed and launched a comprehensive suite of tools for enhancing remote team productivity and communication.',
  },
];

export function PortfolioSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Showcasing our commitment to innovation and excellence through successful client projects and impactful solutions.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {portfolioItems.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <CardHeader className="p-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={600}
                          height={400}
                          className="object-cover w-full h-56"
                          data-ai-hint={item.aiHint}
                        />
                      </CardHeader>
                      <CardContent className="flex-grow p-6">
                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                        <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-3">{item.description}</CardDescription>
                      </CardContent>
                      <CardFooter className="p-6 pt-0">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" /> View Case Study (Placeholder)
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-20px] md:left-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
            <CarouselNext className="absolute right-[-20px] md:right-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
          </Carousel>
        </ScrollFadeIn>
      </div>
    </section>
  );
}

// Basic Badge component if not already defined globally or in ui
function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & {variant?: string}) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full
        ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}
        ${className}`}
      {...props}
    />
  );
}
