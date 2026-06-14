
import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections/hero';
import { ServicesSection } from '@/components/sections/services-section';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, BookOpen, HelpCircle, LayoutDashboard, Mail, ArrowRight, Star, Globe, Linkedin, Twitter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsBar } from '@/components/sections/stats-bar';
import { TargetClients } from '@/components/sections/target-clients';
import { ProcessSection } from '@/components/sections/process-section';
import { TechStackSection, CompactTechShowcase } from '@/components/sections/tech-stack-section';
import { basePortfolio, blogPosts } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

// Dynamically import sections for performance
const AiContent = dynamic(() => 
  import('@/components/sections/ai-content').then(mod => mod.AiContent), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
  }
);

const TechNewsSection = dynamic(() => 
  import('@/components/sections/tech-news-section').then(mod => mod.TechNewsSection), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
  }
);

const TestimonialsSection = dynamic(() => 
  import('@/components/sections/testimonials-section').then(mod => mod.TestimonialsSection), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
  }
);

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section & Stats Proof */}
      <Hero />
      <StatsBar />
      
      {/* 2. Core Services */}
      <ServicesSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 3. Problems We Solve / Solutions & 4. Why Businesses Choose Us */}
      <TechStackSection />
      
      {/* 5. Portfolio / Case Studies Preview */}
      <section id="portfolio-preview" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <LayoutDashboard className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
              Our Innovative <span className="text-primary">Projects</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Live products built to solve real problems. From AI platforms to developer intelligence tools.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {basePortfolio.slice(0, 3).map((project, index) => (
              <ScrollFadeIn key={project.id} delay={`${index * 100}ms`}>
                <Card className="h-full overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] group">
                  <div className="relative h-48 w-full">
                    <Image src={project.imageUrl} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-white border-none">{project.status}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3 text-[10px] uppercase font-black tracking-widest">{project.category}</Badge>
                    <CardTitle className="text-xl font-black mb-3">{project.name}</CardTitle>
                    <p className="text-sm text-zinc-500 line-clamp-3 mb-4">{project.description}</p>
                    <Button asChild variant="link" className="p-0 text-primary h-auto font-bold">
                      <Link href="/portfolio">View Project <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="rounded-full px-10">
              <Link href="/portfolio">Explore Full Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      {/* 6. Testimonials */}
      <TestimonialsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* Meet the Founder Spotlight */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-none shadow-2xl bg-secondary/10 rounded-[3rem]">
              <div className="grid md:grid-cols-3 gap-0">
                <div className="bg-primary flex items-center justify-center py-12 md:py-0 text-white">
                  <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-6xl font-black border-4 border-white/40 shadow-2xl">PS</div>
                </div>
                <div className="md:col-span-2 p-8 md:p-12">
                  <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Our Leadership</span>
                  <h3 className="text-3xl font-black mb-1">Prabhat Sharma</h3>
                  <p className="text-primary font-bold mb-6">Founder & Principal Engineer</p>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    "We don't build software to check a box. we build AI-native products that solve real business pain. My goal for QuantumFusion is to fuse precision engineering with meaningful outcomes for every client we serve."
                  </p>
                  <div className="flex gap-4">
                    <Button asChild size="sm" className="rounded-full shadow-lg">
                      <Link href="/team" className="flex items-center gap-2">View Team</Link>
                    </Button>
                    <div className="flex items-center gap-4 ml-auto">
                      <Link href="https://www.linkedin.com/company/quantumfusion-solutions" target="_blank" className="text-zinc-400 hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                      <Link href="https://x.com/kattyPrabhat" target="_blank" className="text-zinc-400 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 7. Technologies We Work With (Proof of Expertise) */}
      <CompactTechShowcase />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* Supporting Sections & Closure */}
      <ProcessSection />
      <TargetClients />
      <AiContent /> 
      <TechNewsSection />
      
      <section id="blog-preview" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Latest <span className="text-primary">Insights</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Engineering notes and strategies from our internal product development journey.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {blogPosts.slice(0, 2).map((post, index) => (
              <ScrollFadeIn key={post.id} delay={`${index * 100}ms`}>
                <Link href={`/blog/${post.slug}`}>
                  <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl transition-all rounded-3xl overflow-hidden group">
                    <div className="grid sm:grid-cols-2 gap-0">
                      <div className="relative h-48 sm:h-full w-full overflow-hidden">
                        <Image src={post.thumbnailUrl || ''} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <Badge className="mb-4 w-fit">{post.category}</Badge>
                        <h4 className="text-xl font-black mb-4 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h4>
                        <p className="text-sm text-zinc-500 line-clamp-2">{post.excerpt}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </ScrollFadeIn>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="rounded-full px-10">
              <Link href="/blog">Read All Articles</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Final Contact CTA */}
      <section id="contact-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Ready to <span className="text-primary">Innovate?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 font-medium">
            Let's discuss how we can build your next high-impact digital solution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black shadow-xl">
              <Link href="/contact">Contact Us Today</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-16 text-lg font-black">
              <Link href="/careers">Explore Careers</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
