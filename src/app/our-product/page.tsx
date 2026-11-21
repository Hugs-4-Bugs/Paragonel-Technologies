import { Metadata } from 'next';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Boxes, ArrowRight, Rocket, Server, Code2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { basePortfolio } from '@/lib/data';
import { stripMarkdown } from '@/lib/markdown-utils';
import { TechnologyEcosystem } from '@/components/sections/technology-ecosystem';

// ISR so published tech-ecosystem entries (CMS) appear within 60s of an admin
// mutation (revalidatePublicContent('techEcosystem') also purges this route).
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Our Product | Paragonel',
  description:
    'Paragonel products: AcquisitionOS (AI-native client acquisition platform, private beta), SystemFoundry (infrastructure simulator), and CodeGuard AI (VS Code cost intelligence).',
  alternates: { canonical: '/our-product' },
  openGraph: {
    title: 'Our Product | Paragonel',
    description:
      'AcquisitionOS (private beta), SystemFoundry (internal infrastructure simulator), and CodeGuard AI (VS Code cost-intelligence extension).',
    url: '/our-product',
  },
};

/** Product-specific header icon (no fake screenshot — branded mark per product). */
const PRODUCT_ICON: Record<string, LucideIcon> = {
  acquisitionos: Rocket,
  systemfoundry: Server,
  'codeguard-ai': Code2,
};

export default function OurProductPage() {
  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
              <Boxes className="h-8 w-8 text-primary neon-icon" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-5">
              Our <span className="text-primary">Product</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Paragonel builds its own products. Shipping software we run ourselves is how we validate the engineering we
              deliver as services. Our flagship is AcquisitionOS, an AI-native client acquisition platform currently in
              private beta.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {basePortfolio.map((project, index) => {
              const Icon = PRODUCT_ICON[project.slug] ?? Boxes;
              return (
                <ScrollFadeIn key={project.id} delay={`${index * 100}ms`} className="h-full">
                  <Card className="h-full flex flex-col overflow-hidden border border-border shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl bg-card group">
                    <CardHeader className="p-0">
                      {/* Compact branded header — no fake screenshot (Prompt 05K §5.1).
                          Product icon on a subtle primary band + status badge. */}
                      <div className="relative h-28 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center overflow-hidden">
                        <Icon className="h-10 w-10 text-primary/80 neon-icon" aria-hidden="true" />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary text-white shadow rounded-full px-3 py-0.5 text-xs font-semibold border-none">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-6 flex flex-col">
                      <Badge variant="outline" className="mb-3 text-primary border-primary/30 font-semibold rounded-full uppercase tracking-wider text-[10px] px-2.5 w-fit">
                        {project.category}
                      </Badge>
                      <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors tracking-tight">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                        {stripMarkdown(project.description)}
                      </CardDescription>
                      <div className="mt-auto">
                        <Button asChild className="w-full h-11 rounded-xl font-semibold transition-all">
                          <Link href={`/our-product/${project.slug}`} aria-label={`Explore ${project.name}`}>
                            Explore <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollFadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <TechnologyEcosystem />
    </div>
  );
}
