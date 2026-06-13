
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, TrendingUp, Cpu, User } from 'lucide-react';

const targets = [
  {
    title: "Early-stage Startups",
    description: "Who need a technical co-founder for their first product development.",
    icon: Rocket
  },
  {
    title: "Growing SMBs",
    description: "Replacing fragmented tools with one integrated platform.",
    icon: TrendingUp
  },
  {
    title: "Enterprises",
    description: "Adding AI capabilities to existing enterprise systems.",
    icon: Cpu
  },
  {
    title: "Individual Founders",
    description: "With a great idea and no internal tech team to execute.",
    icon: User
  }
];

export function TargetClients() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We <span className="text-primary">Work With</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">We partner with organizations and individuals at various stages of their technology journey.</p>
        </ScrollFadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {targets.map((target, i) => (
            <ScrollFadeIn key={i} delay={`${i * 100}ms`}>
              <Card className="h-full border-none shadow-md bg-secondary/20">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <target.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{target.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{target.description}</p>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
