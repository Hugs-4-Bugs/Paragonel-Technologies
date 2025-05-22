
"use client";

import React, { useState, useEffect } from 'react';
import { fetchTechNews, type FetchTechNewsOutput, type FetchTechNewsInput } from '@/ai/flows/fetch-tech-news';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Newspaper, AlertTriangle, Loader2, ExternalLink, CalendarDays } from 'lucide-react';
import Link from 'next/link';

const domainsForNews: FetchTechNewsInput['domains'] = ['Artificial Intelligence', 'Cloud Computing', 'DevOps', 'SaaS Platforms'];

export function TechNewsSection() {
  const [newsOutput, setNewsOutput] = useState<FetchTechNewsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchTechNews({ domains: domainsForNews, count: 3 });
        setNewsOutput(result);
      } catch (e) {
        console.error("Failed to fetch tech news:", e);
        setError("Could not load the latest tech insights at this time. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    getNews();
  }, []);

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <Newspaper className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest Tech <span className="text-primary">Insights</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the most recent developments and trends in AI, Cloud, DevOps, and SaaS from QuantumFusion Solutions.
          </p>
        </ScrollFadeIn>

        {isLoading && (
          <ScrollFadeIn className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary neon-icon" />
            <p className="ml-4 text-lg text-muted-foreground">Fetching latest news...</p>
          </ScrollFadeIn>
        )}

        {!isLoading && error && (
          <ScrollFadeIn className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Fetching News</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </ScrollFadeIn>
        )}

        {!isLoading && !error && newsOutput && newsOutput.newsItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {newsOutput.newsItems.map((item, index) => (
              <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
                <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl mb-1 line-clamp-2">{item.title}</CardTitle>
                    {item.source && <CardDescription className="text-sm text-primary">{item.source}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm line-clamp-4 leading-relaxed">{item.summary}</p>
                     {item.publishedDate && (
                        <div className="text-xs text-muted-foreground/80 mt-3 flex items-center">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5 neon-icon" /> {item.publishedDate}
                        </div>
                    )}
                  </CardContent>
                  {item.link && (
                    <CardFooter>
                      <Button asChild variant="link" className="p-0 text-primary">
                        <Link href={item.link} target="_blank" rel="noopener noreferrer">
                          Read More <ExternalLink className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        )}
        
        {!isLoading && !error && (!newsOutput || newsOutput.newsItems.length === 0) && (
           <ScrollFadeIn className="text-center py-10">
             <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
             <h3 className="text-xl font-semibold text-foreground mb-2">No News Available</h3>
             <p className="text-muted-foreground">We couldn't fetch the latest news at this moment. Please check back later.</p>
           </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}
