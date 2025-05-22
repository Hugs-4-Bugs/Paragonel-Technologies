
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
import { Star, UserCircle } from 'lucide-react'; // Added UserCircle

const testimonials = [
  {
    id: '1',
    name: 'Sarah L.',
    title: 'Software Engineer at TechNova',
    avatarUrl: 'https://placehold.co/100x100/3498DB/FFFFFF.png?text=SL',
    aiHint: 'person avatar',
    feedback: "QuantumLeap's AI matching found me the perfect role that aligned with my skills and aspirations. The process was seamless!",
    rating: 5,
  },
  {
    id: '2',
    name: 'John B.',
    title: 'HR Manager at Innovate Solutions',
    // No avatar, fallback will be used
    aiHint: 'person avatar',
    feedback: 'We reduced our hiring time by 30% using QuantumLeap. The quality of candidates is consistently high. Highly recommend!',
    rating: 5,
  },
  {
    id: '3',
    name: 'Maria G.',
    title: 'Aspiring Data Scientist',
    avatarUrl: 'https://placehold.co/100x100/663399/FFFFFF.png?text=MG',
    aiHint: 'person avatar',
    feedback: 'The personalized career coaching and skill development resources on QuantumLeap have been invaluable for my career transition.',
    rating: 4,
  },
  {
    id: '4',
    name: 'David K.',
    title: 'Freelance UX Designer',
    avatarUrl: 'https://placehold.co/100x100/1A237E/FFFFFF.png?text=DK',
    aiHint: 'person avatar',
    feedback: 'Found amazing project opportunities through QuantumLeap. The platform is intuitive and easy to navigate.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="text-primary">Users Say</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Real stories from individuals and companies who have experienced the QuantumLeap difference.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/1"> {/* Show 1 or 2 per slide */}
                  <div className="p-2 md:p-4 h-full">
                    <Card className="h-full flex flex-col justify-between text-center shadow-lg bg-card">
                      <CardHeader className="items-center pt-8">
                        {testimonial.avatarUrl ? (
                          <Image
                            src={testimonial.avatarUrl}
                            alt={testimonial.name}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-primary/50 object-cover mb-4"
                            data-ai-hint={testimonial.aiHint}
                          />
                        ) : (
                          <div className="w-[80px] h-[80px] bg-muted rounded-full flex items-center justify-center mb-4 border-2 border-primary/50">
                            <UserCircle className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-foreground">{testimonial.name}</h3>
                        <p className="text-sm text-primary">{testimonial.title}</p>
                      </CardHeader>
                      <CardContent className="flex-grow px-6 py-4">
                        <p className="text-base text-muted-foreground italic leading-relaxed">
                          "{testimonial.feedback}"
                        </p>
                        <div className="flex justify-center mt-4">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
            <CarouselNext className="absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
          </Carousel>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
