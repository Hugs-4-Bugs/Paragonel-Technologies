"use client";

import React, { useState, useEffect } from 'react';
import { recommendRelatedContent, type RecommendRelatedContentOutput } from '@/ai/flows/recommend-related-content';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Zap, BookOpen, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2

// Sample viewed job titles to simulate user behavior
const sampleViewedJobTitles = ['Software Engineer', 'Product Manager', 'Data Scientist'];

export function AiContent() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);


  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: RecommendRelatedContentOutput = await recommendRelatedContent({
        jobTitles: sampleViewedJobTitles,
      });
      setRecommendations(result.recommendations);
    } catch (e) {
      console.error("Failed to fetch recommendations:", e);
      setError("Could not load personalized content at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch recommendations when the component mounts and is visible, or when user interacts
  useEffect(() => {
    if (userInteracted) {
        fetchRecommendations();
    }
  }, [userInteracted]);


  const handleFetchContent = () => {
    setUserInteracted(true);
  };


  return (
    <section className="section-padding bg-background">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <Zap className="inline-block h-8 w-8 mr-2 text-primary neon-icon -mt-1" />
            Personalized Insights For You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover articles, case studies, and resources tailored to your interests based on your activity.
          </p>
        </ScrollFadeIn>

        {!userInteracted && (
            <ScrollFadeIn className="text-center">
                <Button onClick={handleFetchContent} size="lg" className="rounded-full px-8 py-6 text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Load Personalized Content
                    <ThumbsUp className="ml-2 h-5 w-5" />
                </Button>
            </ScrollFadeIn>
        )}

        {userInteracted && isLoading && (
          <ScrollFadeIn className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary neon-icon" />
            <p className="ml-4 text-lg text-muted-foreground">Curating content just for you...</p>
          </ScrollFadeIn>
        )}

        {userInteracted && !isLoading && error && (
          <ScrollFadeIn className="text-center py-10">
            <Card className="max-w-md mx-auto bg-destructive/10 border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-destructive">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Oops! Something went wrong.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive-foreground/80">{error}</p>
                <Button variant="destructive" className="mt-4" onClick={fetchRecommendations}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        )}

        {userInteracted && !isLoading && !error && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((rec, index) => (
              <ScrollFadeIn key={index} delay={`${index * 100}ms`}>
                <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <BookOpen className="h-6 w-6 mr-3 text-primary neon-icon" />
                      Recommended Read
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-foreground/90">{rec}</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                     <Button variant="link" className="text-primary p-0">Read More &rarr;</Button>
                  </div>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        )}
        
        {userInteracted && !isLoading && !error && recommendations.length === 0 && (
           <ScrollFadeIn className="text-center py-10">
             <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4 neon-icon" />
             <h3 className="text-xl font-semibold text-foreground mb-2">No Recommendations Yet</h3>
             <p className="text-muted-foreground">We couldn't find specific recommendations for you at this moment. Explore more jobs to get personalized content!</p>
           </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}
