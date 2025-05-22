
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, ArrowRight, Rss } from 'lucide-react';
import { blogPosts } from '@/lib/data';
import { Badge } from '@/components/ui/badge';


export const metadata: Metadata = {
  title: 'Blog | QuantumFusion Solutions',
  description: 'Insights, articles, and news from the QuantumFusion Solutions team.',
};

export default function BlogPage() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <Rss className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            QuantumFusion <span className="text-primary">Insights</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore our latest articles, industry analysis, and company news. Stay ahead of the curve with QuantumFusion Solutions.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
              <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/blog/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                  <CardHeader className="p-0">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width={600}
                      height={300}
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
        
        {/* Optional: Add pagination if many blog posts */}
        {/* <ScrollFadeIn className="text-center mt-12">
            <Button variant="outline" size="lg">Load More Posts</Button>
        </ScrollFadeIn> */}
      </div>
    </section>
  );
}
