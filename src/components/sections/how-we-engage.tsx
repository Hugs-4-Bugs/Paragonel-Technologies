import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MessageSquareText, FileSearch, Rocket } from 'lucide-react';

/**
 * HowWeEngage (Phase 3 GATE 4). Fills the conversion-path gap: the homepage
 * had a final CTA but no "what happens after you contact us" path. This states
 * a clear, honest 3-step engagement model for a high-value client, so a
 * prospective buyer understands the path from first contact to shipped work.
 *
 * Factual only — no fabricated timelines, guarantees, or pricing. The steps are
 * described as the actual engagement posture (you talk to engineers; scope is
 * grounded in the real implementation), consistent with FOUNDER_REQUIREMENTS §5.
 * Server Component.
 */
const steps = [
  {
    icon: MessageSquareText,
    n: '01',
    title: 'Introductory conversation',
    body: 'A 30-minute call with the engineers who would build the work — not an account manager. You describe the business problem and the constraints; we say plainly whether it is a fit and where we would start. No sales deck, no inflated promises.',
  },
  {
    icon: FileSearch,
    n: '02',
    title: 'Scope & proposal',
    body: 'We translate the conversation into a written scope: the architecture, the milestones, the unknowns we will resolve first, and what "done" looks like for each phase. Estimates are grounded in the actual implementation, because the people scoping it are the people who build it.',
  },
  {
    icon: Rocket,
    n: '03',
    title: 'Build, ship, operate',
    body: 'We engineer the system end-to-end — code, cloud, AI, data — with CI/CD, rollback, and observability from day one. You see working software early and often, and the operability story is owned by us, not handed over as a cliff at the end.',
  },
];

export function HowWeEngage() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <ScrollFadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-3 block">How engagement works</span>
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            A clear path from first call to shipped system
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            No opaque sales funnel. Three steps, owned by the engineers who do the work —
            so the scope you agree to is the scope that gets built.
          </p>
        </ScrollFadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <ScrollFadeIn key={s.n} delay={`${i * 90}ms`}>
              <div className="relative h-full rounded-lg border border-border bg-card p-6 md:p-7 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black text-muted-foreground/30 tabular-nums">{s.n}</span>
                </div>
                <h3 className="mb-2 font-bold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay="180ms" className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-full px-10 h-14 text-base font-bold shadow-lg">
            <Link href="/contact" className="flex items-center gap-2">
              Start the conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            You will talk to the engineers who build the work — not an account manager.
          </p>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
