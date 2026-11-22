import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { INDUSTRIES } from '@/lib/industries-data';
import { STATUS_META } from '@/lib/services-catalogue';

/**
 * IndustriesSection — Paragonel's industry solution patterns (Prompt 05E §6).
 *
 * Communicates problem-solving RANGE across industries. Every entry is a
 * SOLUTION PATTERN, clearly labelled conceptual — no fake customers, case
 * studies, metrics, or endorsements. The four verified projects are the only
 * work presented as real (referenced in `anchorProduct` where one maps).
 *
 * Server Component.
 */
export function IndustriesSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className="pt-section pt-surface-quiet">
      <div className="pt-shell">
        {!compact && (
          <Reveal>
            <span className="pt-eyebrow">Industry solutions</span>
            <h2 className="pt-h1 mt-6 text-foreground">Problem-solving range, by industry.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              These are solution patterns — the common operational problems in each industry, why
              existing workflows become expensive, and the kind of system that can address them.
              They are <span className="font-medium text-foreground">conceptual examples</span>, not
              delivered case studies. The only real work is on the Selected Work page.
            </p>
          </Reveal>
        )}

        <RevealGroup stagger={0.07} className="mt-12 grid gap-px bg-border md:grid-cols-2">
          {INDUSTRIES.map((ind) => (
            <RevealItem key={ind.slug}>
              <article className="flex h-full flex-col bg-background p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{ind.name}</h3>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground"
                    title={STATUS_META[ind.status].label}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[ind.status].tone}`} />
                    {STATUS_META[ind.status].label}
                  </span>
                </div>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {ind.geography} · research ref {ind.researchRef}
                </p>

                <div className="mt-4">
                  <p className="pt-index text-[0.6rem]">PROBLEMS</p>
                  <ul className="mt-2 space-y-1.5">
                    {ind.problems.map((p) => (
                      <li key={p} className="text-sm leading-relaxed text-muted-foreground">
                        — {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="pt-index text-[0.6rem]">WHY IT GETS EXPENSIVE</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.whyExpensive}</p>
                </div>

                <div className="mt-4">
                  <p className="pt-index text-[0.6rem]">SOLUTION APPROACH</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{ind.approach}</p>
                </div>

                <div className="mt-4">
                  <p className="pt-index text-[0.6rem]">DISCOVERY NEEDED FIRST</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.discoveryNeeded}</p>
                </div>

                {ind.anchorProduct && (
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    Anchor product:{' '}
                    <span className="font-medium text-foreground">{ind.anchorProduct}</span>
                  </p>
                )}
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal>
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            No industry above is presented as a delivered case study. Where a Paragonel product
            genuinely maps to an industry it is named as an anchor; otherwise the entry is a
            conceptual solution pattern. Engagements begin with discovery — see the engagement
            process on the About page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="pt-btn pt-btn-primary">
              Start a discovery <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" className="pt-btn pt-btn-ghost">
              Capability catalogue
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
