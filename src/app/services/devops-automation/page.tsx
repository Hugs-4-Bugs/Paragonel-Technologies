
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitFork, Zap, ChevronRight, SlidersHorizontal, Repeat, ShieldAlert, Gauge } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DevOps Automation | QuantumFusion Solutions',
  description: 'Accelerate software delivery with CI/CD pipelines, Infrastructure as Code, and automated testing by QuantumFusion Solutions.',
};

const devopsFeatures = [
  { title: "CI/CD Pipelines", description: "Automate build, test, and deployment processes.", icon: Repeat },
  { title: "Infrastructure as Code (IaC)", description: "Manage and provision infrastructure through code.", icon: SlidersHorizontal },
  { title: "Automated Testing", description: "Ensure software quality with comprehensive test automation.", icon: Zap },
  { title: "Monitoring & Observability", description: "Gain insights into application performance and health.", icon: Gauge },
];

export default function DevOpsAutomationPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <GitFork className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              DevOps <span className="text-primary">Automation</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Streamline your software development lifecycle with QuantumFusion Solutions' DevOps automation services. We implement robust CI/CD pipelines, manage infrastructure as code, and integrate automated testing to enhance speed, quality, and reliability.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms">
          <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-16">
            <Image
              src="/images/devops-pipeline.png"
              alt="Abstract DevOps pipeline visualization"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              data-ai-hint="devops automation pipeline"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Our DevOps Expertise</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {devopsFeatures.map((feature, index) => (
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
              <CardTitle className="text-2xl md:text-3xl">Accelerate Your Innovation Cycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                QuantumFusion Solutions helps you embrace a DevOps culture by implementing best practices and cutting-edge automation tools. Our approach focuses on collaboration, efficiency, and continuous improvement, enabling your teams to deliver high-quality software faster and more reliably. Reduce manual effort, minimize errors, and improve deployment frequency with our tailored DevOps solutions.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Containerization with Docker and Kubernetes.</li>
                <li>Security integration throughout the SDLC (DevSecOps).</li>
                <li>Configuration management and orchestration.</li>
                <li>Performance and reliability engineering.</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Modernize Your Development?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Let's discuss how DevOps automation can revolutionize your workflows.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">
              Talk to Our DevOps Team <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
