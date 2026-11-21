import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Selected Work — factual, attributable case study (Phase 1 §7 credibility).
 *
 * Replaces the previous TestimonialsSection, which (a) read the `testimonials`
 * Firestore collection client-side via a rule that denied all reads in
 * production, and (b) displayed a fabricated, unapproved quote attributed to
 * Maa Arogyam. Per the Content Truth Register §5, NO testimonials are approved
 * for publication. Instead of a fabricated quote, this section presents a
 * factual project entry: Paragonel built the Maa Arogyam website
 * (maarogyam.com). No invented outcomes, metrics, or endorsement wording.
 *
 * Server Component — static, no Firestore read, no client SDK.
 */
export function SelectedWorkSection() {
  return (
    <section className="section-padding bg-background overflow-hidden relative">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollFadeIn className="text-center mb-14">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Selected work</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Real <span className="text-primary">engagements</span>
          </h2>
          <p className="mt-4 text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
            We are selective about the work we take on. Here is a factual project from a real engagement — presented as work delivered, not as a fabricated endorsement.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 max-w-3xl mx-auto gap-8">
          <ScrollFadeIn>
            <Card className="h-full rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-xl p-8 md:p-10 relative overflow-hidden bg-card group hover:border-primary/30 transition-colors duration-500">
              <CardContent className="p-0 relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0">
                    <FolderGit2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-black tracking-tight">Maa Arogyam</h4>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                      Project · Website build
                    </p>
                  </div>
                </div>

                <p className="text-base md:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Paragonel built the Maa Arogyam website — a professional, modern web presence
                  for the organization. The engagement is listed here factually as work delivered;
                  no client outcome metric, quote, or endorsement is claimed without evidence.
                </p>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Verified engagement
                  </span>
                  <Button asChild variant="link" className="p-0 h-auto text-primary font-bold">
                    <Link href="/our-product" className="flex items-center gap-1">
                      See our product work <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}
