'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';

const PATHS = [
  { label: 'Discuss a business challenge', href: '/contact', hint: 'Tell us the problem. We will scope it against your actual process.' },
  { label: 'Explore engineering services', href: '/services', hint: 'The five capability domains and what each one resolves.' },
  { label: 'Explore AcquisitionOS', href: '/our-product/acquisitionos', hint: 'The flagship AI-native acquisition platform, in private beta.' },
  { label: 'Contact Paragonel', href: '/contact', hint: 'Direct line to the engineers who build the work.' },
];

export function HomeConversion() {
  return (
    <section className="pt-section pt-hero-backdrop">
      <div className="pt-shell">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-center">
          {/* Left — the closing statement (natural continuation, not a generic CTA) */}
          <Reveal>
            <span className="pt-eyebrow">07 — Start a conversation</span>
            <h2 className="pt-h1 mt-6 text-foreground">
              If the problem is engineering-shaped, we should talk.
            </h2>
            <p className="pt-lead mt-6 max-w-lg">
              Paragonel is a product-minded engineering company. Whether you want to bring
              AcquisitionOS into your acquisition motion or you need a product engineered
              end-to-end, the next step is a conversation with the engineers who would do the
              work — not a form that disappears into a queue.
            </p>
            <div className="mt-8">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Contact Paragonel <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {/* Right — four explicit paths as an editorial list */}
          <RevealGroup stagger={0.08}>
            {PATHS.map((p, i) => (
              <RevealItem key={p.label}>
                <Link
                  href={p.href}
                  className="group flex items-start gap-5 border-t border-border/70 py-6 transition-colors hover:bg-secondary/30"
                >
                  <span className="pt-index pt-2">{`0${i + 1}`}</span>
                  <span className="flex-1">
                    <span className="block text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {p.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{p.hint}</span>
                  </span>
                  <ArrowRight className="mt-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
