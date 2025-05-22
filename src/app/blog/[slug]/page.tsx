
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, type BlogPost as BlogPostType } from '@/lib/data';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, User, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Using the existing Badge from ui

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Function to generate metadata dynamically
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = blogPosts.find(p => p.slug === params.slug);
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }
  return {
    title: `${post.title} | QuantumFusion Solutions Blog`,
    description: post.excerpt,
    openGraph: {
        title: post.title,
        description: post.excerpt,
        images: [{ url: post.imageUrl }],
        type: 'article',
        publishedTime: post.date, // Assuming date is in ISO format or similar
        authors: [post.author],
    },
    twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [post.imageUrl],
    }
  };
}

// Function to generate static paths for all blog posts
export async function generateStaticParams() {
  return blogPosts.map(post => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find(p => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <ScrollFadeIn className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </ScrollFadeIn>

        <article>
          <ScrollFadeIn>
            <header className="mb-8">
              <Badge variant="outline" className="mb-3 text-sm">{post.category}</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="mr-1.5 h-4 w-4 neon-icon" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-1.5 h-4 w-4 neon-icon" />
                  <span>By {post.author}</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="mr-1.5 h-4 w-4 neon-icon" />
                  <span>{post.comments} Comments</span>
                </div>
              </div>
            </header>
          </ScrollFadeIn>

          <ScrollFadeIn delay="100ms" className="mb-8">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                className="object-cover"
                data-ai-hint={post.aiHint}
                priority
              />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay="200ms">
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
              {/* Using excerpt as placeholder for full content */}
              <p>{post.content || post.excerpt}</p>
              {/* Add more paragraphs or structured content if available */}
              {post.id === '1' && (
                <>
                  <h2 className="text-2xl font-semibold mt-8 mb-4">Key Takeaways from the Article</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>AI significantly speeds up candidate sourcing and screening.</li>
                    <li>Bias mitigation in AI tools is crucial for fair hiring.</li>
                    <li>Human oversight remains essential in AI-driven recruitment.</li>
                    <li>Predictive analytics can help forecast candidate success.</li>
                  </ul>
                </>
              )}
               {post.id === '2' && (
                <>
                  <h2 className="text-2xl font-semibold mt-8 mb-4">Core Strategies Discussed</h2>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Embrace continuous learning and upskilling.</li>
                    <li>Develop strong networking and personal branding.</li>
                    <li>Cultivate soft skills alongside technical expertise.</li>
                    <li>Adapt to evolving work environments, including remote work.</li>
                  </ol>
                </>
              )}
               {post.id === '3' && (
                <>
                  <h2 className="text-2xl font-semibold mt-8 mb-4">Benefits of Personalized Learning</h2>
                   <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">Increased learner engagement.</div>
                        <div className="bg-muted/50 p-4 rounded-lg">Improved knowledge retention.</div>
                        <div className="bg-muted/50 p-4 rounded-lg">More efficient skill acquisition.</div>
                        <div className="bg-muted/50 p-4 rounded-lg">Tailored to individual career goals.</div>
                   </div>
                </>
              )}
            </div>
          </ScrollFadeIn>
        </article>

        <ScrollFadeIn delay="300ms" className="mt-12 pt-8 border-t">
           <h3 className="text-xl font-semibold mb-4">Enjoyed this article?</h3>
           <p className="text-muted-foreground mb-6">Share it with your network or subscribe to our newsletter for more insights.</p>
           <div className="flex gap-4">
            <Button variant="outline">Share Post (Placeholder)</Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/#contact-snippet">Subscribe Now</Link>
            </Button>
           </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
