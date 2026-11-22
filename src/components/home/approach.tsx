'use client';

import { useRef } from 'react';
import { useGsapScrub } from '@/components/motion/use-scrub';
import { RevealGroup, RevealItem } from '@/components/motion/reveal';

const STEPS = [
  {
    n: '01',
    title: 'Understand the business problem',
    body: 'Start from the actual constraint — the workflow, the cost, the risk — not from a technology we want to use.',
    outcome: 'A shared, honest definition of the problem.',
  },
  {
    n: '02',
    title: 'Define the solution',
    body: 'Translate the problem into a concrete solution shape: what the system does, what it does not, and where the boundaries are.',
    outcome: 'Scope that is explicit, not implied.',
  },
  {
    n: '03',
    title: 'Architect the system',
    body: 'Design the architecture across product, software, AI and infrastructure as one system — owning the seams where the hard problems live.',
    outcome: 'A design that fits the business, not a template.',
  },
  {
    n: '04',
    title: 'Engineer the product',
    body: 'Build it with reliability, maintainability and scale designed in by construction. Explicit handling of the unknown over hopeful assumptions.',
    outcome: 'Software that behaves exactly as specified.',
  },
  {
    n: '05',
    title: 'Validate',
    body: 'Verify against the real problem, not the spec. Test the seams, the failure modes, the edge cases the business will actually hit.',
    outcome: 'Confidence earned, not assumed.',
  },
  {
    n: '06',
    title: 'Deploy',
    body: 'Ship with infrastructure that does not buckle under load — CI/CD, observability, rollback. Deploys that are routine, not risky.',
    outcome: 'A live system that stays live.',
  },
  {
    n: '07',
    title: 'Improve',
    body: 'Operate, measure, and improve against real usage. The system gets better after launch, not frozen at it.',
    outcome: 'Engineering decisions tied to business outcomes.',
  },
];

export function HomeApproach() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger scrubs the vertical connector draw (scaleY 0→1).
  useGsapScrub(
    line,
    { scaleY: 0 },
    { scaleY: 1 },
    root,
    'top 75%',
    'bottom 25%',
  );

  return (
    <section ref={root} className="pt-section">
      <div className="pt-shell pt-shell-narrow">
        <div className="border-b border-border pb-8">
          <span className="pt-eyebrow">05 — Engineering approach</span>
          <h2 className="pt-h2 mt-5 text-foreground">How a project actually moves.</h2>
          <p className="pt-lead mt-5">
            Seven stages, in sequence — and at every stage, an engineering decision tied to a
            business outcome. This is not a sales process dressed up as engineering.
          </p>
        </div>

        <div className="relative mt-4">
          {/* Vertical connector — drawn by GSAP ScrollTrigger scrub */}
          <div
            ref={line}
            className="absolute left-[1.4rem] top-0 bottom-0 w-[2px] origin-top bg-primary/30"
            style={{ transform: 'scaleY(1)' }}
            aria-hidden
          />

          <RevealGroup stagger={0.05}>
            {STEPS.map((s) => (
              <RevealItem key={s.n}>
                <div className="relative grid grid-cols-[2.8rem_1fr] gap-4 py-7 md:py-9">
                  <div className="flex flex-col items-center">
                    <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background pt-index text-xs">
                      {s.n}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      <span className="text-muted-foreground">→ </span>
                      {s.outcome}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
