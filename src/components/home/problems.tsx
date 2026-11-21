'use client';

import { RevealGroup, RevealItem } from '@/components/motion/reveal';

const PROBLEMS = [
  {
    n: '01',
    problem: 'Fragmented business operations',
    detail: 'Work spread across disconnected tools, spreadsheets and tribal knowledge — no single source of truth for how the business actually runs.',
    capability: 'Product Engineering',
  },
  {
    n: '02',
    problem: 'Manual and repetitive workflows',
    detail: 'Skilled people doing copy-paste work that a well-engineered system should own end-to-end.',
    capability: 'AI & Intelligent Systems',
  },
  {
    n: '03',
    problem: 'Legacy systems and technical complexity',
    detail: 'Older systems that nobody fully understands, where every change carries risk and the architecture no longer fits the business.',
    capability: 'Software Architecture',
  },
  {
    n: '04',
    problem: 'Infrastructure reliability and scaling problems',
    detail: 'Systems that buckle under load, deploys that are risky, and outages that erode trust with customers.',
    capability: 'Cloud & Platform Engineering',
  },
  {
    n: '05',
    problem: 'Disconnected data and poor visibility',
    detail: 'Data trapped in silos — leadership cannot see what is happening until it is already in the rear-view mirror.',
    capability: 'Data Engineering & Analytics',
  },
  {
    n: '06',
    problem: 'Slow product development and delivery',
    detail: 'Good ideas stuck in a queue, with no clear path from concept to a dependable, shipped product.',
    capability: 'Product Engineering',
  },
  {
    n: '07',
    problem: 'AI adoption without a clear business use case',
    detail: 'Pressure to “do AI” with no connection to a real workflow, a real cost, or a measurable outcome.',
    capability: 'AI & Intelligent Systems',
  },
];

export function HomeProblems() {
  return (
    <section className="pt-section">
      <div className="pt-shell">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Section intro — sticky on desktop */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="pt-eyebrow">01 — Problems we solve</span>
            <h2 className="pt-h2 mt-5 text-foreground">
              The work is harder than the brochure let on.
            </h2>
            <p className="pt-lead mt-5 max-w-md">
              Most business pain is engineering pain in disguise. We start there —
              from the actual problem, not a service category — and connect each one
              to the engineering capability that resolves it.
            </p>
          </div>

          {/* Numbered editorial rows */}
          <RevealGroup stagger={0.06}>
            {PROBLEMS.map((p) => (
              <RevealItem key={p.n}>
                <div className="pt-row">
                  <span className="pt-index">{p.n}</span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {p.problem}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {p.detail}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground block">
                      Engineering capability
                    </span>
                    <span className="mt-1 block font-medium text-foreground">{p.capability}</span>
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
