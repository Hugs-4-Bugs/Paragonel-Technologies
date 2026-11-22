import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { FlowDiagram } from '@/components/sections/flow-diagram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, ClipboardCheck, ChevronRight, ArrowRight } from 'lucide-react';
import type { ServiceContent } from '@/lib/services-content';

/**
 * ServiceDetail — shared layout for the four primary service detail pages
 * (Phase 2 §3). Server Component. Renders: hero, full-bleed image, a DISTINCT
 * animated FlowDiagram per service, the business problem, the engineering
 * approach, the capability grid, technology + deliverables, an explicit/honest
 * guardrails block, and an engagement CTA. Each page passes its ServiceContent;
 * the diagram stages differ per service so the four pages are not copies.
 */
export function ServiceDetail({ service }: { service: ServiceContent }) {
  const Icon = service.icon;
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero */}
        <ScrollFadeIn>
          <header className="text-center mb-14 max-w-3xl mx-auto">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary text-primary">
              <Icon className="h-8 w-8" />
            </div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Service</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{service.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{service.intro}</p>
          </header>
        </ScrollFadeIn>

        {/* Image */}
        <ScrollFadeIn delay="120ms">
          <div className="relative mx-auto mb-14 h-56 w-full max-w-5xl overflow-hidden rounded-xl border border-border shadow-sm md:h-72">
            <Image src={service.imageUrl} alt={`${service.title} conceptual visual`} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </ScrollFadeIn>

        {/* Distinct animated diagram */}
        <FlowDiagram
          eyebrow={service.diagram.eyebrow}
          title={service.diagram.title}
          caption={service.diagram.caption}
          stages={service.diagram.stages}
        />

        {/* Problem + Solution */}
        <ScrollFadeIn delay="150ms" className="mx-auto mb-14 max-w-4xl">
          <h2 className="mb-5 text-2xl font-bold tracking-tight md:text-3xl">The business problem</h2>
          <p className="mb-4 text-lg leading-relaxed text-muted-foreground">{service.problem}</p>
          <h2 className="mb-5 mt-10 text-2xl font-bold tracking-tight md:text-3xl">Our engineering approach</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{service.solution}</p>
        </ScrollFadeIn>

        {/* Capabilities */}
        <ScrollFadeIn delay="200ms" className="mb-14">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Capabilities</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">What we deliver</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {service.capabilities.map((cap) => (
              <Card key={cap.title} className="rounded-lg border-border shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold">{cap.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{cap.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        {/* Approach + tech + deliverables */}
        <ScrollFadeIn delay="250ms" className="mx-auto mb-14 max-w-4xl">
          <Card className="rounded-lg border-border shadow-sm">
            <CardHeader><CardTitle className="text-xl">Engagement & deliverables</CardTitle></CardHeader>
            <CardContent className="space-y-5 leading-relaxed text-muted-foreground">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-foreground"><Gauge className="h-4 w-4 text-primary" /> Engagement</h4>
                  <p className="text-sm">{service.engagement}</p>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-foreground"><ClipboardCheck className="h-4 w-4 text-primary" /> Typical deliverables</h4>
                  <p className="text-sm">{service.deliverables}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="mb-2 font-bold text-foreground">Technology we use</h4>
                <p className="text-sm">{service.techStack}</p>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        {/* Explicit / honest guardrails */}
        <ScrollFadeIn delay="300ms" className="mx-auto mb-14 max-w-4xl">
          <div className="rounded-lg border border-border bg-secondary/40 p-6 dark:bg-secondary/15 md:p-8">
            <h3 className="mb-2 font-bold text-foreground">Where we are explicit</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{service.explicit}</p>
          </div>
        </ScrollFadeIn>

        {/* CTA */}
        <ScrollFadeIn delay="350ms" className="text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">Engage {service.shortTitle}</h2>
          <p className="mx-auto mb-7 max-w-xl text-muted-foreground">Tell us the problem you want solved. We will scope it against your actual process and come back with an approach.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-md">
              <Link href="/contact">Discuss your project <ChevronRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md">
              <Link href="/services">All services <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
