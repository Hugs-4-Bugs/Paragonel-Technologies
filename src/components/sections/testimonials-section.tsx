
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, UserCircle, Quote } from 'lucide-react';

const testimonials = [
  {
    id: '1',
    name: 'Javier M.',
    title: 'CTO, Alpha Dynamics',
    avatarUrl: 'https://placehold.co/100x100.png',
    aiHint: 'client headshot executive',
    feedback: "QuantumFusion Solutions transformed our legacy systems with their AI and Cloud expertise. Our efficiency has skyrocketed!",
    rating: 5,
  },
  {
    id: '2',
    name: 'Priya S.',
    title: 'Head of Innovation, Beta Health',
    avatarUrl: 'https://placehold.co/100x100.png', // Added placeholder
    aiHint: 'client headshot manager',
    feedback: 'The DevOps automation implemented by QuantumFusion has been a game-changer for our development cycles. True professionals.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Kenji T.',
    title: 'Founder, Gamma SaaS Co.',
    avatarUrl: 'https://placehold.co/100x100.png',
    aiHint: 'client headshot founder',
    feedback: 'Their SaaS platform development was top-notch, from concept to launch. The QuantumFusion team is incredibly skilled and supportive.',
    rating: 4,
  },
  {
    id: '4',
    name: 'Linda Chen',
    title: 'CIO, Delta Corp',
    avatarUrl: 'https://placehold.co/100x100.png',
    aiHint: 'client headshot cio',
    feedback: 'Working with QuantumFusion Solutions felt like a true partnership. Their insights and technical execution are unparalleled.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Client <span className="text-primary">Success Stories</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from businesses transformed by QuantumFusion Solutions' innovative IT services.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2">
                  <div className="p-2 md:p-4 h-full">
                    <Card className="h-full flex flex-col justify-between shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="items-center pt-8 pb-4">
                        {testimonial.avatarUrl ? (
                          <Image
                            src={testimonial.avatarUrl}
                            alt={testimonial.name}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-primary/50 object-cover mb-4 shadow-md"
                            data-ai-hint={testimonial.aiHint}
                          />
                        ) : (
                          <div className="w-[80px] h-[80px] bg-muted rounded-full flex items-center justify-center mb-4 border-2 border-primary/50 shadow-md">
                            <UserCircle className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-foreground">{testimonial.name}</h3>
                        <p className="text-sm text-primary">{testimonial.title}</p>
                      </CardHeader>
                      <CardContent className="flex-grow px-6 py-4 text-center relative">
                        <Quote className="absolute top-0 left-2 h-8 w-8 text-primary/20 transform -translate-x-2 -translate-y-2 neon-icon opacity-50" />
                        <p className="text-base text-muted-foreground italic leading-relaxed">
                          {testimonial.feedback}
                        </p>
                         <Quote className="absolute bottom-0 right-2 h-8 w-8 text-primary/20 transform translate-x-2 translate-y-2 rotate-180 neon-icon opacity-50" />
                      </CardContent>
                       <div className="flex justify-center pb-6">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400 neon-icon' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex bg-background/80 hover:bg-background" />
            <CarouselNext className="absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex bg-background/80 hover:bg-background" />
          </Carousel>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
