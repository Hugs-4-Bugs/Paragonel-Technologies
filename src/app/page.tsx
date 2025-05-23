
import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections/hero';
// Sections that are above the fold or very light can be imported statically
import { ServicesSection } from '@/components/sections/services-section';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, Users, BookOpen, HelpCircle, LayoutDashboard, Mail, Brain } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // For a more consistent loading state

// Dynamically import sections that are further down or involve client-side data fetching/JS
const AiContent = dynamic(() => 
  import('@/components/sections/ai-content').then(mod => mod.AiContent), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
    // ssr: false // Often good for client-side heavy components // Removed ssr: false
  }
);

const TechNewsSection = dynamic(() => 
  import('@/components/sections/tech-news-section').then(mod => mod.TechNewsSection), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
    // ssr: false // Removed ssr: false
  }
);

const TestimonialsSection = dynamic(() => 
  import('@/components/sections/testimonials-section').then(mod => mod.TestimonialsSection), 
  { 
    loading: () => <div className="container mx-auto px-4 md:px-6 section-padding"><Skeleton className="h-32 w-full" /></div>,
    // ssr: false // Removed ssr: false
  }
);


export default function HomePage() {
  return (
    <>
      <Hero />
      
      <section id="about-snippet" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
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

      <section id="portfolio-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <LayoutDashboard className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Innovative <span className="text-primary">Projects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Explore our portfolio of successful projects and see how we leverage technology to solve complex challenges.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/portfolio">View Our Portfolio</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <AiContent /> 
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <TechNewsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <TestimonialsSection />
      <Separator className="my-0 container mx-auto max-w-7xl" />
      
      <section id="team-snippet" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Users className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Meet Our <span className="text-primary">Innovators</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            The brilliant minds behind QuantumFusion Solutions, dedicated to driving technological excellence and client success.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/team">Discover Our Team</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <section id="careers-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
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
      
      <section id="blog-snippet" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest <span className="text-primary">Insights</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Stay informed with articles, trends, and news from our experts and the tech world.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/blog">Read Our Blog</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <section id="faq-snippet" className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Have <span className="text-primary">Questions?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Find answers to common questions about our services, processes, and company.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/faq">Visit Our FAQ</Link>
          </Button>
        </div>
      </section>
      <Separator className="my-0 container mx-auto max-w-7xl" />

      <section id="contact-snippet" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-primary">Innovate?</span>
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
