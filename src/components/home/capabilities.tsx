'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RevealGroup, RevealItem } from '@/components/motion/reveal';

const CAPABILITIES = [
  {
    n: '01',
    name: 'Product Engineering',
    scope: 'Taking software from idea to live users — architecture, build, ship, operate. SaaS platforms, internal products, commercial products.',
  },
  {
    n: '02',
    name: 'AI & Intelligent Systems',
    scope: 'AI that sits in the core workflow, not a bolted-on chatbot. Agents, copilots, scoring, personalization, knowledge systems — tied to a real business outcome.',
  },
  {
    n: '03',
    name: 'Cloud, Infrastructure & Platform Engineering',
    scope: 'Dependable, scalable infrastructure — migration, IaC, CI/CD, observability, reliability. Systems that do not fall over when load arrives.',
  },
  {
    n: '04',
    name: 'Data Engineering & Analytics',
    scope: 'Pipelines, warehouses, models and dashboards that give leadership a clear, current picture of the business instead of a delayed rear-view mirror.',
  },
  {
    n: '05',
    name: 'Experience & Interface Engineering',
    scope: 'Interfaces that make complex systems usable — interaction design, performance, accessibility, and the craft that makes a product feel deliberate.',
  },
];

export function HomeCapabilities() {
  const reduce = useReducedMotion();
  return (
    <section className="pt-section">
      <div className="pt-shell">
        <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="pt-eyebrow">03 — Engineering capabilities</span>
            <h2 className="pt-h2 mt-5 text-foreground">Five domains, one engineering org.</h2>
          </div>
          <p className="pt-lead max-w-sm">
            The broader capability structure behind everything we build and deliver.
            The detailed service catalogue is a separate batch.
          </p>
        </div>

        <RevealGroup stagger={0.07}>
          {CAPABILITIES.map((c) => (
            <RevealItem key={c.n}>
              <div className="group border-b border-border">
                <Link
                  href="/services"
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-6 transition-colors hover:bg-secondary/30 md:py-8"
                >
                  <span className="pt-index text-base">{c.n}</span>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground transition-transform duration-500 group-hover:translate-x-1 md:text-3xl">
                      {c.name}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {c.scope}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-500 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Capabilities are demonstrated by the work below — not by a list of logos.
          </p>
          <Link href="/services" className="pt-btn pt-btn-ghost">
            Explore services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
