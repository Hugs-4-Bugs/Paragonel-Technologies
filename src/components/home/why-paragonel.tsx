'use client';

import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';

const PRINCIPLES = [
  {
    n: '01',
    title: 'Product-minded, not task-minded',
    body: 'We ship and run our own software — AcquisitionOS, CodeGuard AI, SystemFoundry. Engineering a product end-to-end is different from executing an isolated task list, and the difference shows up in what we deliver.',
  },
  {
    n: '02',
    title: 'Business-problem-first technology',
    body: 'Technology choices follow the problem, not the other way around. We pick the stack that resolves the actual constraint — not the one we happen to be most familiar with.',
  },
  {
    n: '03',
    title: 'End-to-end thinking',
    body: 'Product, software, AI and infrastructure are treated as one system. The hard problems live at the seams between them, and we own those seams instead of handing them off.',
  },
  {
    n: '04',
    title: 'Practical, reliable engineering',
    body: 'Reliability, maintainability and scale are designed in by construction — not bolted on after something breaks in production. Explicit handling of the unknown over hopeful assumptions.',
  },
  {
    n: '05',
    title: 'Transparent collaboration',
    body: 'Clear delivery ownership, honest about what is known and what is not. You talk to the engineers building the work, and the reasoning behind each decision is visible.',
  },
];

export function HomeWhyParagonel() {
  return (
    <section className="pt-section pt-surface-quiet">
      <div className="pt-shell pt-shell-narrow text-center">
        <Reveal>
          <span className="pt-eyebrow justify-center">02 — Why Paragonel</span>
          <h2 className="pt-h1 mt-6 text-foreground">
            An engineering company that builds like a product company.
          </h2>
          <p className="pt-lead mt-6 mx-auto max-w-2xl">
            We are not claiming superiority over every agency or technology company. What
            follows is what makes this approach valuable — and it is supported by real work
            we have shipped, not a list of adjectives.
          </p>
        </Reveal>
      </div>

      <div className="pt-shell mt-16">
        <RevealGroup stagger={0.08} className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <RevealItem key={p.n}>
              {/* Last item spans differently on lg for an asymmetric finish */}
              <div
                className={`h-full bg-background p-8 lg:p-10 ${
                  i === PRINCIPLES.length - 1 ? 'lg:col-span-1' : ''
                }`}
              >
                <span className="pt-index text-base">{p.n}</span>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </RevealItem>
          ))}
          {/* Filler tile — closes the grid with a CTA, not an empty card */}
          <RevealItem>
            <div className="flex h-full flex-col justify-between bg-background p-8 lg:p-10">
              <p className="text-sm leading-relaxed text-muted-foreground">
                The proof is in the products and engagements below — not in this paragraph.
              </p>
              <a href="#products" className="pt-link mt-6 inline-flex w-fit items-center gap-1 text-sm font-medium">
                See the work
              </a>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}
