import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Code2, Cloud, BarChart3, ArrowRight, ShieldCheck, Wrench, Users2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * ProblemsWeSolve (Phase 3 §B2/B3). Fills the buyer-journey gap between
 * "Who we are" and "Services": it states (a) the concrete business problems
 * Paragonel addresses, mapped to the service that solves each, and (b) why
 * Paragonel's engineering approach differs from generic outsourcing.
 *
 * Factual only — no fabricated metrics, no "better than every competitor"
 * claims. Differentiation is stated as defensible engineering posture.
 * Server Component.
 */
const problems = [
  {
    icon: Brain,
    problem: 'AI demos that never reach production',
    answer: 'Retrieval, evaluation, and LLM operations built into the core workflow — inside your cloud boundary, with your own keys, and an evaluation harness that tells you when it is working.',
    href: '/services/ai-solutions',
    label: 'AI Solutions',
  },
  {
    icon: Code2,
    problem: 'Software that does not match how your business works',
    answer: 'Custom software engineered around your actual processes and data model — with the deployment and operability story owned from day one, not handed over as a cliff.',
    href: '/services/custom-software',
    label: 'Custom Software',
  },
  {
    icon: Cloud,
    problem: 'Deploys that are a risk and infrastructure no one dares touch',
    answer: 'Infrastructure as code, CI/CD with one-click rollback, and observability that catches regressions before users do — so frequent, safe deploys become routine.',
    href: '/services/cloud-devops',
    label: 'Cloud & DevOps',
  },
  {
    icon: BarChart3,
    problem: 'Data-rich and insight-poor — numbers no one trusts',
    answer: 'A documented data pipeline with validation, a semantic layer, and lineage — so the number on the dashboard is defensible and the decision is real.',
    href: '/services/data-analytics',
    label: 'Data & Analytics',
  },
];

const differentiators = [
  {
    icon: Wrench,
    title: 'We ship our own products',
    body: 'AcquisitionOS, CodeGuard AI, and SystemFoundry are products we build and run — not portfolio decorations. The engineering we deliver to clients is the same engineering we depend on ourselves.',
  },
  {
    icon: ShieldCheck,
    title: 'Explicit about the unknown',
    body: 'Missing information stays missing rather than being fabricated. AI output is framed as signals and drafts a human confirms — not unsupervised decisions in high-stakes workflows.',
  },
  {
    icon: Users2,
    title: 'You talk to the engineers',
    body: 'No account-manager relay. The people who scope the work are the people who build it, which means estimates are grounded in the actual implementation, not a sales curve.',
  },
];

export function ProblemsWeSolve() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Business problems → Paragonel's answer */}
        <ScrollFadeIn className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-3 block">Business problems we address</span>
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            The problems we are built to solve
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Four recurring problems we see across the teams we work with — and the engineering discipline
            Paragonel brings to each.
          </p>
        </ScrollFadeIn>

        <div className="grid gap-5 md:grid-cols-2">
          {problems.map((p, i) => (
            <ScrollFadeIn key={p.problem} delay={`${i * 70}ms`}>
              <Card className="h-full rounded-lg border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-foreground">{p.problem}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{p.answer}</p>
                      <Button asChild variant="link" className="h-auto p-0 text-primary">
                        <Link href={p.href} className="flex items-center gap-1 text-sm font-medium">
                          {p.label} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>

        {/* Differentiation: why Paragonel vs generic outsourcing */}
        <ScrollFadeIn delay="120ms" className="mx-auto mt-16 max-w-2xl text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-3 block">Why Paragonel</span>
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Engineering approach, not body-shopping
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Generic outsourcing ships hours; we ship systems that behave as specified. The difference is
            posture, not size.
          </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay="180ms">
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {differentiators.map((d) => (
              <div key={d.title} className="rounded-lg border border-border bg-secondary/40 p-6 dark:bg-secondary/15">
                <d.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-bold text-foreground">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
