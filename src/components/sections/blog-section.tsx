
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: '1',
    title: 'The Future of AI in Talent Acquisition',
    date: 'August 5, 2024',
    author: 'Dr. Evelyn Reed',
    excerpt: 'Exploring how artificial intelligence is revolutionizing the recruitment landscape, from automated screening to predictive hiring.',
    imageUrl: 'https://placehold.co/600x400/3498DB/FFFFFF.png?text=AI+Recruitment',
    aiHint: 'artificial intelligence technology',
    category: 'AI & Recruitment',
    comments: 12,
    slug: '/blog/future-of-ai-talent-acquisition', // Placeholder slug
  },
  {
    id: '2',
    title: 'Navigating Your Career Path in the Digital Age',
    date: 'July 28, 2024',
    author: 'Aisha Khan',
    excerpt: 'Tips and strategies for professionals looking to thrive and adapt in an ever-evolving digital job market.',
    imageUrl: 'https://placehold.co/600x400/663399/FFFFFF.png?text=Career+Path',
    aiHint: 'career guidance',
    category: 'Career Development',
    comments: 8,
    slug: '/blog/navigating-career-path-digital-age',
  },
  {
    id: '3',
    title: 'The Power of Personalized Learning for Skill Enhancement',
    date: 'July 15, 2024',
    author: 'Marcus Chen',
    excerpt: 'How QuantumLeap\'s personalized learning modules help individuals acquire new skills and stay ahead.',
    imageUrl: 'https://placehold.co/600x400/1A237E/FFFFFF.png?text=Personalized+Learning',
    aiHint: 'online education',
    category: 'EdTech',
    comments: 5,
    slug: '/blog/power-of-personalized-learning',
  },
];

export function BlogSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Stay informed with the latest insights, trends, and news from the world of career development and technology.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
              <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={post.slug} aria-label={`Read more about ${post.title}`}>
                  <CardHeader className="p-0">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width={600}
                      height={300} // Adjusted for typical blog image aspect ratio
                      className="object-cover w-full h-52"
                      data-ai-hint={post.aiHint}
                    />
                  </CardHeader>
                </Link>
                <CardContent className="flex-grow p-6">
                  <Badge variant="outline" className="mb-2">{post.category}</Badge>
                  <Link href={post.slug} aria-label={`Read more about ${post.title}`}>
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
                    <Link href={post.slug}>
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
        
        {/* Placeholder for pagination or "Load More" button */}
        <ScrollFadeIn className="text-center mt-12">
            <Button variant="outline" size="lg">View All Posts (Placeholder)</Button>
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
        ${variant === 'outline' ? 'border border-border text-foreground' : 
          (variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground')}
        ${className}`}
      {...props}
    />
  );
}
