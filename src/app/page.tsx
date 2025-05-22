
import { Hero } from '@/components/sections/hero';
import { AiContent } from '@/components/sections/ai-content';
import { TechNewsSection } from '@/components/sections/tech-news-section';
import { AboutSection } from '@/components/sections/about-section';
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { FaqSection } from '@/components/sections/faq-section';
import { PortfolioSection } from '@/components/sections/portfolio-section';
import { TeamSection } from '@/components/sections/team-section';
import { BlogSection } from '@/components/sections/blog-section';
import { ContactSection } from '@/components/sections/contact-section';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';


export default function HomePage() {
  return (
    <>
      <Hero />
      
      <section id="about-snippet" className="section-padding bg-background">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to <span className="text-primary">QuantumFusion Solutions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            We are dedicated to revolutionizing IT with cutting-edge solutions in AI, Cloud, DevOps, and SaaS. We empower businesses to shape a smarter tomorrow.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">Learn More About Us</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <ServicesSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <PortfolioSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <AiContent /> 
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <TechNewsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <TestimonialsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <TeamSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <section id="careers-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto max-w-5xl text-center">
          <Briefcase className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Propel Your Career with Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Join a team of innovators at QuantumFusion Solutions and contribute to groundbreaking projects. We offer a dynamic environment where your talent can thrive.
          </p>
          <Button asChild size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/careers">Explore Open Roles</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <BlogSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <FaqSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <section id="contact-snippet" className="section-padding bg-background">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Innovate?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Let's discuss how QuantumFusion Solutions can help your business achieve its technological goals.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
