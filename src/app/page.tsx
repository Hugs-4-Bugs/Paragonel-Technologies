
import { Hero } from '@/components/sections/hero';
import { CareersSection } from '@/components/sections/careers-section';
import { AiContent } from '@/components/sections/ai-content'; // This might need to be re-evaluated or repurposed
import { AboutSection } from '@/components/sections/about-section';
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { FaqSection } from '@/components/sections/faq-section';
import { PortfolioSection } from '@/components/sections/portfolio-section';
import { TeamSection } from '@/components/sections/team-section';
import { BlogSection } from '@/components/sections/blog-section'; // Basic placeholder
import { ContactSection } from '@/components/sections/contact-section'; // Snippet or link
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function HomePage() {
  return (
    <>
      <Hero />
      
      <section id="about-snippet" className="section-padding bg-background">
        <div className="container max-w-5xl text-center">
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
      <Separator className="my-0 container max-w-7xl" />
      
      <ServicesSection />
      <Separator className="my-0 container max-w-7xl" />

      <PortfolioSection />
      <Separator className="my-0 container max-w-7xl" />
      
      {/* Temporarily repurpose AiContent or remove if not fitting the new scope */}
      {/* <AiContent /> 
      <Separator className="my-0 container max-w-7xl" /> */}
      
      <TestimonialsSection />
      <Separator className="my-0 container max-w-7xl" />
      
      <TeamSection />
      <Separator className="my-0 container max-w-7xl" />

      <CareersSection />
      <Separator className="my-0 container max-w-7xl" />
      
      <BlogSection /> {/* Consider making this a snippet */}
      <Separator className="my-0 container max-w-7xl" />

      <FaqSection />
      <Separator className="my-0 container max-w-7xl" />

      <section id="contact-snippet" className="section-padding bg-background">
        <div className="container max-w-5xl text-center">
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
