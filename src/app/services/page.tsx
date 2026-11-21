import { getPublicServices } from '@/lib/public-data';
import { ServicesSection } from '@/components/sections/services-section';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Layers } from 'lucide-react';

// Revalidate every 60s so admin publish/activate/deactivate reflects on the
// public site without a full rebuild, while keeping SSR speed.
export const revalidate = 60;

/**
 * Server Component (Phase 1A). Fetches active services on the server via the
 * Admin SDK (bypasses firestore.rules, filters isActive && !deletedAt). The
 * previous client version used `useCollection` against the `services`
 * collection whose read rule denied ALL reads in production — leaving the
 * page on a perpetual skeleton (G16 blank Services page). Now SSR with data;
 * no client SDK shipped to the browser for this page.
 */
export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <Layers className="h-10 w-10 text-primary neon-icon" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Our <span className="text-primary">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Four focused engineering services — AI, cloud infrastructure, DevOps, and custom product engineering — grounded in products we have shipped ourselves.
            </p>
          </ScrollFadeIn>

          <ServicesSection services={services} isFullPage />
        </div>
      </section>
    </div>
  );
}
