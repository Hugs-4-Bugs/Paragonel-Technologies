
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Zap, ChevronRight, LayoutGrid, Users, Scaling, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SaaS Platforms | QuantumFusion Solutions',
  description: 'End-to-end SaaS platform development from ideation and design to deployment and maintenance by QuantumFusion Solutions.',
};

const saasFeatures = [
  { title: "MVP Development", description: "Rapidly build and launch your Minimum Viable Product.", icon: Zap },
  { title: "Scalable Architecture", description: "Design platforms built for growth and high performance.", icon: Scaling },
  { title: "User-Centric Design (UI/UX)", description: "Create intuitive and engaging user experiences.", icon: Palette },
  { title: "Multi-Tenant Solutions", description: "Develop secure and isolated environments for multiple clients.", icon: Users },
];

export default function SaaSPlatformsPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Layers className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              SaaS <span className="text-primary">Platforms</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Bring your Software-as-a-Service vision to life with QuantumFusion Solutions. We offer comprehensive SaaS development services, from initial concept and UI/UX design to robust backend engineering, deployment, and ongoing maintenance.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms">
          <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-16">
            <Image
              src="/images/saas-platform-dashboard.png"
              alt="Abstract SaaS platform dashboard interface"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              data-ai-hint="saas application interface"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Our SaaS Development Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {saasFeatures.map((feature, index) => (
              <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mx-auto mb-3 neon-icon" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="400ms" className="mb-16">
          <Card className="bg-card shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Build Your Next-Generation SaaS Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                QuantumFusion Solutions is your trusted partner for building innovative and successful SaaS applications. We combine technical expertise with a deep understanding of SaaS business models to deliver platforms that are not only technologically sound but also market-ready and user-loved. Our agile development process ensures flexibility and transparency throughout the project lifecycle.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Full-stack development (frontend, backend, database).</li>
                <li>API design and integration.</li>
                <li>Subscription management and billing system integration.</li>
                <li>Post-launch support and feature enhancements.</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Launch Your SaaS Platform?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Let's turn your SaaS idea into a market-leading reality.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">
              Start Your SaaS Project <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
