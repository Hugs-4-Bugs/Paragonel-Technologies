
"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { basePortfolio } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioPage() {
  const portfolioQuery = useMemo(() => query(collection(db, 'portfolio'), orderBy('createdAt', 'desc')), []);
  const { data: dynamicProjects, loading } = useCollection(portfolioQuery);

  const displayedProjects = useMemo(() => {
    return [...basePortfolio, ...(dynamicProjects || [])];
  }, [dynamicProjects]);

  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <Globe className="h-10 w-10 text-primary neon-icon" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Our <span className="text-primary">Portfolio</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Real products built to solve real problems. From live AI platforms to developer intelligence tools.
            </p>
          </ScrollFadeIn>

          {loading && !displayedProjects.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-[2.5rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayedProjects.map((project: any, index: number) => (
                <ScrollFadeIn key={project.id} delay={`${index * 100}ms`}>
                  <Card className="h-full flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-card group">
                    <CardHeader className="p-0">
                      <div className="relative h-60 w-full overflow-hidden">
                        {project.imageUrl ? (
                          <Image
                            src={project.imageUrl}
                            alt={project.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center"><Globe className="h-12 w-12 text-zinc-200" /></div>
                        )}
                        <div className="absolute top-6 right-6">
                          <Badge className="bg-primary text-white shadow-xl rounded-full px-4 py-1 font-bold border-none">{project.status}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-8">
                      <Badge variant="outline" className="mb-4 text-primary border-primary/30 font-black rounded-full uppercase tracking-widest text-[10px] px-3">{project.category}</Badge>
                      <CardTitle className="text-2xl font-black mb-4 group-hover:text-primary transition-colors tracking-tight">{project.name}</CardTitle>
                      <CardDescription className="text-base text-zinc-500 font-medium leading-relaxed mb-8 line-clamp-4">
                        {project.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.techs?.map((tech: string) => (
                          <span key={tech} className="text-[10px] uppercase font-black tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                    {project.link && project.link !== '#' && (
                      <div className="p-8 pt-0 mt-auto">
                        <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all border-2">
                          <Link href={project.link} target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> Visit Project</Link>
                        </Button>
                      </div>
                    )}
                  </Card>
                </ScrollFadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
