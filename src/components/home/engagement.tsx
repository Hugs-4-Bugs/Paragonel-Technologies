'use client';

import { RevealGroup, RevealItem } from '@/components/motion/reveal';

const STEPS = [
  {
    n: '01',
    title: 'Initial conversation',
    body: 'You tell us the business challenge. We listen for the actual constraint — the workflow, the cost, the risk — and whether engineering is genuinely the right lever.',
    note: 'No pitch. A real conversation with the engineers who would do the work.',
  },
  {
    n: '02',
    title: 'Technical discovery & proposal',
    body: 'We dig into the system, the data and the constraints, then come back with a scoped solution proposal — what we would build, why, and what it would not do.',
    note: 'Scope and approach are explicit before any build starts.',
  },
  {
    n: '03',
    title: 'Engineering, delivery & improvement',
    body: 'We engineer, ship, validate and keep improving against real usage. Delivery ownership stays with the engineers, not an account manager.',
    note: 'We do not invent guaranteed timelines — honest estimates, updated as the work teaches us.',
  },
];

export function HomeEngagement() {
  return (
    <section className="pt-section">
      <div className="pt-shell">
        <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="pt-eyebrow">06 — Engagement path</span>
            <h2 className="pt-h2 mt-5 text-foreground">What happens after you contact us.</h2>
          </div>
          <p className="pt-lead max-w-sm">
            Three stages, kept honest. No guaranteed timelines we cannot defend.
          </p>
        </div>

        <RevealGroup stagger={0.1} className="mt-12 grid gap-px bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <RevealItem key={s.n}>
              <div className="h-full bg-background p-8 lg:p-10">
                <span className="pt-index text-base">{s.n}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  {s.note}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
