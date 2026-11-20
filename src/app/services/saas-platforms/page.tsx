import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Zap, Palette, Users, Gauge, Rocket, ChevronRight, Code2, ClipboardCheck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Custom SaaS / Product Engineering | Paragonel',
  description:
    'Full-lifecycle product builds from Paragonel — architecture and MVP to a scaled, maintained platform. We have shipped our own SaaS products, including AcquisitionOS, so we know what it takes to take a product to live users.',
};

const capabilities = [
  { title: 'MVP to scaled product', description: 'We take a product from a validated idea through an MVP to a platform serving real users — without the rewrite that kills most early-stage builds.', icon: Rocket },
  { title: 'Full-stack engineering', description: 'Frontend, backend, database, and the integrations between them. We own the whole stack so there is no seam where ownership ends.', icon: Code2 },
  { title: 'Multi-tenant architecture', description: 'Secure, isolated environments for multiple customers on one platform — the tenant model, the data boundaries, and the billing hooks.', icon: Users },
  { title: 'User-centric UI/UX', description: 'Interfaces built for the people who use them. Design decisions grounded in the workflow, not in a trend.', icon: Palette },
  { title: 'Subscription & billing', description: 'Plan tiers, usage metering, and payment integration (Stripe / Razorpay) wired into the product as first-class, not an afterthought.', icon: Zap },
  { title: 'Maintained, not abandoned', description: 'Post-launch support, monitoring, and feature work so the product keeps moving after the launch hype fades.', icon: Gauge },
];

export default function SaaSPlatformsPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Layers className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Service</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Custom SaaS / <span className="text-primary">Product Engineering</span></h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Full-lifecycle product builds — from architecture and MVP to a scaled, maintained platform. We have shipped our own SaaS products (AcquisitionOS, SystemFoundry, CodeGuard AI), so we understand what it takes to take a product from idea to live users.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="150ms">
          <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl mb-16">
            <Image src="/images/saas-platform-dashboard.png" alt="SaaS platform interface conceptual visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms" className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">The problem we address</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            Most SaaS builds die in the gap between a working demo and a product people pay for. The MVP that was supposed to take six weeks becomes a year of rewrites because the foundation could not carry what the product became. Teams ship a feature, then discover the architecture cannot support the next ten. The cost is not just time — it is the momentum a competitor takes while you rebuild.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            It matters because a product is not a launch, it is a trajectory. The architecture decisions made in the first month decide whether month twelve is growth or a rewrite. We build for the trajectory.
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
                We build products we run ourselves, so we engineer for the day after launch, not just the demo. We start with the architecture that will still hold at ten times the load, ship an MVP that is a real slice of that architecture rather than a throwaway, and keep the product maintained after it is live. The same team that ships it supports it.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Engagement</h4>
                  <p className="text-sm">Fixed-scope MVP builds, or retainer-based product engineering for a platform that needs sustained development.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Typical deliverables</h4>
                  <p className="text-sm">A production application, the backend and data layer, multi-tenant + billing where needed, observability, and ongoing support.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="font-bold text-foreground mb-2">Technology we use</h4>
                <p className="text-sm">Next.js and React frontends, Spring Boot or Node backends, Python services where the workload fits, Firebase for real-time data, AWS / GCP for hosting. Mobile as a supporting capability under this service.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="450ms" className="mb-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 dark:bg-secondary/10 p-6 md:p-8">
            <h3 className="font-bold text-foreground mb-2">Our own products are the evidence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We do not just advise on product engineering — we practice it. AcquisitionOS (an AI-native client acquisition platform, private beta), SystemFoundry (an infrastructure simulator), and CodeGuard AI (a VS Code extension) are products we built and run. That is the difference between a team that draws product architecture and one that ships it.
            </p>
            <Link href="/our-product" className="text-primary font-bold text-sm inline-flex items-center gap-1 hover:underline">See our products <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Build a product that lasts past launch</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Tell us what you are building. We will engineer it for the trajectory, not just the demo.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">Start your product project <ChevronRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
