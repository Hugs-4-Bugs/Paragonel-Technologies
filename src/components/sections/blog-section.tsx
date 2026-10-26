
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, ArrowRight } from 'lucide-react';
import { blogPosts } from '@/lib/data'; // Import blogPosts from data.ts
import { Badge } from '@/components/ui/badge'; // Ensure Badge is imported from ui


export function BlogSection() {
  // Display only the first 3 posts for the homepage snippet
  const displayedPosts = blogPosts.slice(0, 3);

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Stay informed with the latest insights, trends, and news from Paragonel and the tech world.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedPosts.map((post, index) => (
            <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
              <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/blog/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                  <CardHeader className="p-0">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width={600}
                      height={300}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover w-full h-52"
                      data-ai-hint={post.aiHint}
                    />
                  </CardHeader>
                </Link>
                <CardContent className="flex-grow p-6">
                  <Badge variant="outline" className="mb-2">{post.category}</Badge>
                  <Link href={`/blog/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                    <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">{post.title}</CardTitle>
                  </Link>
                  <CardDescription className="text-sm line-clamp-3 mb-3">{post.excerpt}</CardDescription>
                  <div className="text-xs text-muted-foreground flex items-center space-x-4">
                    <div className="flex items-center">
                      <CalendarDays className="w-3.5 h-3.5 mr-1.5 neon-icon" />
                      {post.date}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5 neon-icon" />
                      {post.comments} Comments
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button asChild variant="link" className="p-0 text-primary">
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
        
        {blogPosts.length > 3 && (
          <ScrollFadeIn className="text-center mt-12">
              <Button variant="outline" size="lg" asChild>
                <Link href="/blog">View All Posts</Link>
              </Button>
          </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}
