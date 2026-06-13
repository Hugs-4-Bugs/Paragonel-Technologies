
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Brain, Cloud, GitFork, Layers, ArrowRight, AppWindow, Zap, Code, ShieldCheck } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import React, { useMemo } from 'react';

const iconMap: Record<string, any> = {
  Brain, Cloud, GitFork, Layers, AppWindow, Zap, Code, ShieldCheck
};

interface ServicesSectionProps {
  isFullPage?: boolean;
}

export function ServicesSection({ isFullPage = false }: ServicesSectionProps) {
  const firestore = useFirestore();
  
  const servicesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'services'), 
      where('isActive', '==', true), 
      orderBy('order', 'asc')
    );
  }, [firestore]);

  const { data: services, loading } = useCollection(servicesQuery);

  const displayedServices = isFullPage ? services : services?.slice(0, 4);

  return (
    <section className={isFullPage ? "" : "section-padding bg-secondary/30 dark:bg-secondary/10"}>
      {!isFullPage && (
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Our Core <span className="text-primary">Services</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium">
              QuantumFusion Solutions delivers a comprehensive suite of IT services designed to propel your business into the future.
            </p>
          </ScrollFadeIn>
        </div>
      )}

      <div className={isFullPage ? "" : "container mx-auto px-4 md:px-6"}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
          {displayedServices?.map((service: any, index: number) => {
            const Icon = iconMap[service.iconName] || Layers;
            return (
              <ScrollFadeIn key={service.id} delay={`${index * 100}ms`}>
                <Card className="h-full overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col group rounded-[2.5rem] border-zinc-100 dark:border-zinc-800 bg-card">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-primary/10 rounded-3xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                        <Icon className="h-8 w-8 text-primary group-hover:text-white transition-colors duration-500" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full px-3 py-1 font-bold text-[10px] tracking-widest uppercase border">Expertise Available</div>
                    </div>
                    <CardTitle className="text-2xl font-black mb-3 tracking-tight group-hover:text-primary transition-colors">{service.title}</CardTitle>
                    <CardDescription className="text-base text-zinc-500 font-medium line-clamp-3 leading-relaxed">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-8 pt-0 flex flex-col">
                    {service.imageUrl && (
                      <div className="relative w-full h-48 mb-8 rounded-3xl overflow-hidden shadow-inner bg-zinc-100">
                        <Image
                          src={service.imageUrl}
                          alt={service.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          unoptimized
                        />
                      </div>
                    )}
                    <Button asChild variant="link" className="mt-auto self-start p-0 text-primary font-black text-lg group-hover:translate-x-2 transition-transform">
                      <Link href={`/services/${service.slug}`}>
                        Deep Dive <ArrowRight className="ml-2 h-6 w-6" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            );
          })}
        </div>

        {!isFullPage && services && services.length > 4 && (
          <ScrollFadeIn className="text-center mt-16">
            <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-16 font-bold border-2 hover:bg-primary hover:text-white transition-all">
              <Link href="/services">View All Specializations</Link>
            </Button>
          </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
