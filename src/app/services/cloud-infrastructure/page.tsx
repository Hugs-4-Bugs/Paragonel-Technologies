import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Globe, Server, ShieldCheck, Network, Gauge, ChevronRight, Layers, ClipboardCheck, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cloud Infrastructure & Platform Engineering | Paragonel',
  description:
    'High-availability, multi-region infrastructure on AWS and GCP. Paragonel architects distributed backends, event-driven systems, and scalable platform foundations grounded in high-concurrency engineering experience.',
};

const capabilities = [
  { title: 'High-availability architecture', description: 'Multi-region, multi-AZ designs that survive a zone or region failure without a manual fire drill. We design for the failure you hope never happens.', icon: Server },
  { title: 'Distributed & event-driven backends', description: 'Event streaming, async processing, and services that scale horizontally under real load — the kind of high-concurrency engineering our founder built at Netcore Cloud.', icon: Network },
  { title: 'Platform foundations', description: 'The shared platform layer — auth, storage, queues, observability, internal tooling — that lets your product teams ship faster instead of rebuilding plumbing.', icon: Layers },
  { title: 'Cost & performance engineering', description: 'Right-sized infrastructure, reserved capacity where it pays, and the instrumentation that shows you where spend and latency actually live.', icon: Gauge },
  { title: 'Security boundaries', description: 'Network segmentation, least-privilege IAM, and fail-closed access patterns. We default to denial, not to open.', icon: ShieldCheck },
  { title: 'Database & storage design', description: 'Relational, document, vector, and cache stores chosen for the workload, with the indexing and sharding strategy to match.', icon: Database },
];

export default function CloudInfrastructurePage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Cloud className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Service</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cloud Infrastructure &amp; <span className="text-primary">Platform Engineering</span></h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              High-availability, multi-region infrastructure on AWS and GCP, engineered for security and cost control. We architect distributed backends, event-driven systems, and the platform foundations a product team builds on.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="150ms">
          <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl mb-16">
            <Image src="/images/cloud-abstract.png" alt="Cloud infrastructure conceptual visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms" className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">The problem we address</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            Infrastructure that grew organically is usually infrastructure that fails expensively. A single-region deployment, an over-privileged service account, a database with no failover, a queue that silently drops messages under load — each is a latent incident waiting for the traffic spike that exposes it. Most teams do not feel the gap until the bill surprises them or the outage takes the product down.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            It matters because infrastructure is the floor everything stands on. A fragile floor means every feature above it is fragile, and every scaling milestone is a risk event rather than a celebration.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What we deliver</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((feature) => (
              <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-3 neon-icon" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="400ms" className="mb-16 max-w-4xl mx-auto">
          <Card className="bg-card shadow-xl rounded-2xl">
            <CardHeader><CardTitle className="text-2xl">How we approach it</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We design for the failure first: what breaks, how it is detected, how it fails over, and how it recovers. Then we build the platform layer that lets your product teams ship on top of it without rebuilding the plumbing each time. We instrument from day one so cost and latency are visible, not discovered in a monthly invoice.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Engagement</h4>
                  <p className="text-sm">Architecture reviews, greenfield platform builds, or migration of an existing system to a more reliable footprint.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Typical deliverables</h4>
                  <p className="text-sm">An architecture design, Infrastructure-as-Code, a hardened landing zone, observability, and a runbook for the failures you designed for.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="font-bold text-foreground mb-2">Technology we use</h4>
                <p className="text-sm">AWS and GCP, Kubernetes, Terraform, Spring Boot and Node services, Redis and async database layers, vector stores. Founder background: high-concurrency Java backend at Netcore Cloud.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="450ms" className="mb-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 dark:bg-secondary/10 p-6 md:p-8">
            <h3 className="font-bold text-foreground mb-2">Where we are explicit</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not promise zero downtime — no honest engineer does. We design for high availability and for graceful failure, and we make the trade-offs visible. We will not quote a cost saving for your workload until we have modeled it against your actual usage.
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Architect infrastructure that holds up</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Tell us what is fragile, what is expensive, or what you are about to build. We will design the footprint.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">Discuss your infrastructure <ChevronRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
