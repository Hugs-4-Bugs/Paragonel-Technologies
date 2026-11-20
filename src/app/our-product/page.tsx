import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Boxes, ExternalLink, ArrowRight } from 'lucide-react';
import { basePortfolio } from '@/lib/data';
import { stripMarkdown } from '@/lib/markdown-utils';

export const metadata: Metadata = {
  title: 'Our Product | Paragonel',
  description:
    'Paragonel products: AcquisitionOS (AI-native client acquisition platform, private beta), SystemFoundry (infrastructure simulator), and CodeGuard AI (VS Code cost intelligence).',
};

export default function OurProductPage() {
  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <Boxes className="h-10 w-10 text-primary neon-icon" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Our <span className="text-primary">Product</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Paragonel builds its own products. Shipping software we run ourselves is how we validate the engineering we
              deliver as services. Our flagship is AcquisitionOS, an AI-native client acquisition platform currently in
              private beta.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {basePortfolio.map((project, index) => {
              const isFlagship = project.id === 'p-1';
              return (
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
                        ) : null}
                        <div className="absolute top-6 right-6">
                          <Badge className="bg-primary text-white shadow-xl rounded-full px-4 py-1 font-bold border-none">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-8 flex flex-col">
                      <Badge variant="outline" className="mb-4 text-primary border-primary/30 font-black rounded-full uppercase tracking-widest text-[10px] px-3 w-fit">
                        {project.category}
                      </Badge>
                      <CardTitle className="text-2xl font-black mb-4 group-hover:text-primary transition-colors tracking-tight">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-base text-zinc-500 font-medium leading-relaxed mb-8 line-clamp-4">
                        {stripMarkdown(project.description)}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.techs?.map((tech) => (
                          <span key={tech} className="text-[10px] uppercase font-black tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto">
                        {isFlagship ? (
                          <Button asChild className="w-full h-12 rounded-2xl font-bold transition-all">
                            <Link href="/our-product/acquisitionos">
                              Explore AcquisitionOS <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        ) : project.link && project.link !== '#' ? (
                          <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all border-2">
                            <Link href={project.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Visit Project
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollFadeIn>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
