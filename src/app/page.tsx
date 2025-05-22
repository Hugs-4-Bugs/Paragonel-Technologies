
import { Hero } from '@/components/sections/hero';
import { CareersSection } from '@/components/sections/careers-section'; // Renamed from JobListings
import { AiContent } from '@/components/sections/ai-content';
import { AboutSection } from '@/components/sections/about-section';
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { FaqSection } from '@/components/sections/faq-section';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <>
      <Hero />
      
      {/* About Us Snippet (or full section) */}
      <section id="about-snippet" className="py-16 md:py-20 bg-background">
        <div className="container max-w-5xl">
          {/* Simplified version of AboutSection or a dedicated snippet component */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Welcome to <span className="text-primary">QuantumLeap</span>
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-10">
            We are dedicated to revolutionizing how talent meets opportunity, fostering growth, and building the future of work.
          </p>
          {/* Could add 2-3 key points or a CTA to full about page */}
        </div>
      </section>
      <Separator className="my-0 container max-w-7xl" />
      
      {/* Services Overview */}
      <ServicesSection />
      <Separator className="my-0 container max-w-7xl" />

      {/* Careers Section (formerly Job Listings) */}
      <CareersSection />
      <Separator className="my-0 container max-w-7xl" />
      
      {/* AI Content Section */}
      <AiContent />
      <Separator className="my-0 container max-w-7xl" />

      {/* Testimonials Section */}
      <TestimonialsSection />
      <Separator className="my-0 container max-w-7xl" />

      {/* FAQ Snippet or full section */}
      <FaqSection />
    </>
  );
}
