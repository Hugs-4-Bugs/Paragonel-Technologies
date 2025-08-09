
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Zap, ChevronRight, Server, ShieldCheck, TrendingUp, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cloud Infrastructure | QuantumFusion Solutions',
  description: 'Scalable, secure, and cost-effective cloud solutions including migration, management, and cloud-native development by QuantumFusion Solutions.',
};

const cloudFeatures = [
  { title: "Cloud Migration", description: "Seamless transition to leading cloud platforms (AWS, Azure, GCP).", icon: Server },
  { title: "Managed Cloud Services", description: "Ongoing management, optimization, and support for your cloud environment.", icon: Settings },
  { title: "Cloud-Native Development", description: "Build and deploy applications designed for cloud architecture.", icon: Zap },
  { title: "Cloud Security & Compliance", description: "Robust security measures and adherence to industry standards.", icon: ShieldCheck },
];

export default function CloudInfrastructurePage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Cloud className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cloud <span className="text-primary">Infrastructure</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              QuantumFusion Solutions empowers your business with robust, scalable, and secure cloud infrastructure. We specialize in cloud migration, management, and the development of cloud-native applications to optimize your operations and foster innovation.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms">
           <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-16">
            <Image
              src="/images/cloud-abstract.png"
              alt="Abstract cloud computing network"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              data-ai-hint="cloud network data"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Our Cloud Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cloudFeatures.map((feature, index) => (
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
              <CardTitle className="text-2xl md:text-3xl">Elevate Your Business with the Cloud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Leverage the full potential of cloud computing with QuantumFusion Solutions. We provide end-to-end cloud services, from strategic planning and migration to ongoing optimization and security. Our expertise ensures your cloud infrastructure is agile, resilient, and perfectly aligned with your business objectives, enabling you to scale efficiently and innovate without limits.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Multi-cloud and hybrid cloud strategies.</li>
                <li>Infrastructure as Code (IaC) for automation.</li>
                <li>Cost optimization and performance monitoring.</li>
                <li>Disaster recovery and business continuity planning.</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Optimize Your Cloud Journey?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Discuss your cloud infrastructure needs with our certified experts.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">
              Consult Our Cloud Specialists <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
