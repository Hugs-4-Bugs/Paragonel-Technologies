
import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections/hero';
import { ServicesSection } from '@/components/sections/services-section';
import { AcquisitionOSFeature } from '@/components/sections/acquisitionos-feature';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, LayoutDashboard, Mail, ArrowRight, Globe, Linkedin, Building2, Cpu, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsBar } from '@/components/sections/stats-bar';
import { TargetClients } from '@/components/sections/target-clients';
import { ProcessSection } from '@/components/sections/process-section';
import { TechStackSection, CompactTechShowcase } from '@/components/sections/tech-stack-section';
import { basePortfolio, blogPosts } from '@/lib/data';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
      {/* 1. Hero */}
      <Hero />
      <StatsBar />

      {/* 2. Company introduction */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Who we are</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              An AI-native product-engineering company
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Paragonel Technologies Pvt. Ltd. is an AI-native product-engineering company. We build our own software —
              including AcquisitionOS, our AI-native client acquisition platform — and we deliver the cloud, DevOps, AI,
              and product-engineering services that stand it up. The two halves feed each other: shipping products we run
              ourselves is how we validate the engineering we deliver to clients, and the engagements we run for clients
              surface the patterns that shape our products.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay="150ms">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Cpu, t: 'AI-native, not AI-bolted-on', d: 'AI sits in the core workflow — research, scoring, personalization — not in a chatbot widget added after the fact.' },
                { icon: Layers, t: 'Product builders', d: 'We ship our own products (AcquisitionOS, SystemFoundry, CodeGuard AI), so we understand what it takes to take software from idea to live users.' },
                { icon: Building2, t: 'Precision engineering', d: 'Small, named, verifiable systems that behave exactly as specified — with explicit handling of the unknown rather than fabrication.' },
              ].map((c) => (
                <Card key={c.t} className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-card">
                  <CardContent className="p-6">
                    <c.icon className="h-7 w-7 text-primary mb-3" />
                    <h3 className="font-black text-base mb-2">{c.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 3. Core Services */}
      <ServicesSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 4. AcquisitionOS flagship feature */}
      <AcquisitionOSFeature />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 5. Problems We Solve / Tech */}
      <TechStackSection />

      {/* 6. Our Product preview */}
      <section id="product-preview" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <LayoutDashboard className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
              Our <span className="text-primary">Product</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Products we build and run ourselves. AcquisitionOS leads the portfolio as our flagship, now in private beta.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {basePortfolio.slice(0, 3).map((project, index) => {
              const isFlagship = project.id === 'p-1';
              return (
                <ScrollFadeIn key={project.id} delay={`${index * 100}ms`}>
                  <Card className="h-full overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl rounded-[2rem] group flex flex-col">
                    <div className="relative h-48 w-full">
                      <Image src={project.imageUrl} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-white border-none">{project.status}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <Badge variant="outline" className="mb-3 text-[10px] uppercase font-black tracking-widest w-fit">{project.category}</Badge>
                      <CardTitle className="text-xl font-black mb-3">{project.name}</CardTitle>
                      <p className="text-sm text-zinc-500 line-clamp-3 mb-4 flex-grow">{project.description}</p>
                      <Button asChild variant="link" className="p-0 text-primary h-auto font-bold self-start">
                        <Link href={isFlagship ? '/our-product/acquisitionos' : '/our-product'}>
                          {isFlagship ? 'Explore product' : 'View product'} <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollFadeIn>
              );
            })}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="rounded-full px-10">
              <Link href="/our-product">Explore All Products</Link>
            </Button>
          </div>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 7. Testimonials */}
      <TestimonialsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 8. Founder spotlight */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-none shadow-2xl bg-secondary/10 rounded-[3rem]">
              <div className="grid md:grid-cols-3 gap-0">
                <div className="bg-primary flex items-center justify-center py-12 md:py-0 text-white">
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
                    <Image
                      src="/images/Prabhat.png"
                      alt="Prabhat Kumar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="md:col-span-2 p-8 md:p-12">
                  <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Founder & CEO</span>
                  <h3 className="text-3xl font-black mb-1">Prabhat Kumar</h3>
                  <p className="text-primary font-bold mb-6">Founder &amp; CEO, Paragonel Technologies</p>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    &ldquo;We don&apos;t build software to check a box — we build AI-native products that solve real business pain.
                    Paragonel fuses precision engineering with meaningful outcomes, drawing on a background in massive-scale
                    backend systems to build software that is reliable by construction, not by hope.&rdquo;
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild size="sm" className="rounded-full shadow-lg h-10 px-6 font-bold">
                      <Link href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/" target="_blank" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" /> LinkedIn Profile
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-full h-10 px-6 font-bold border-2">
                      <Link href="/about">Read our story
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 9. Technologies (proof of expertise) */}
      <CompactTechShowcase />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      {/* 10. Process + Target clients */}
      <ProcessSection />
      <TargetClients />
      <AiContent />
      <TechNewsSection />

      {/* 11. Blog preview */}
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

      {/* 12. Final Contact CTA */}
      <section id="contact-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Let&apos;s build something that <span className="text-primary">works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 font-medium">
            Whether you want to bring AcquisitionOS into your acquisition motion or you need a product engineered end-to-end,
            start a conversation. You will talk to the engineers who build the work, not an account manager.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black shadow-xl">
              <Link href="/contact">Contact Us Today</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-16 text-lg font-black">
              <Link href="/our-product/acquisitionos">Explore AcquisitionOS</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
