'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { DomainVisual } from '@/components/services/domain-visuals';
import {
  getDomainBySlug,
  getOfferingsForDomain,
  getOfferingStatus,
  STATUS_META,
  type ServiceOffering,
  type ServiceDomain,
} from '@/lib/services-catalogue';

/**
 * Offering detail (Prompt 05B). A distinct, editorial composition per offering
 * — NOT a copy of the four legacy ServiceDetail pages. Answers the founder's
 * content standard: problem / deliverable / why / tech / engagement, with the
 * domain's conceptual visual + sibling offerings for navigation.
 */
export function OfferingDetail({ offering }: { offering: ServiceOffering }) {
  const domain = getDomainBySlug(offering.domainSlug) as ServiceDomain;
  const siblings = getOfferingsForDomain(offering.domainSlug).filter((o) => o.slug !== offering.slug);
  const st = getOfferingStatus(offering);

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-shell pt-6">
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to services
        </Link>
      </div>

      {/* Hero */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(4rem, 8vw, 6rem)' }}>
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <span className="pt-eyebrow">{domain.index} — {domain.name}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[st].tone}`} />
                {STATUS_META[st].label}
              </span>
            </div>
            <h1 className="pt-display mt-6 text-foreground">{offering.name}</h1>
            <p className="pt-lead mt-6 max-w-2xl">{offering.tagline}</p>
            <p className="mt-4 max-w-2xl text-xs text-muted-foreground">{STATUS_META[st].blurb}</p>
          </Reveal>
        </div>
      </section>

      {/* Body — problem / deliverable / why, with the domain visual alongside */}
      <section className="pt-section">
        <div className="pt-shell">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Reveal>
                <Block label="The problem" index="01">
                  {offering.problem}
                </Block>
              </Reveal>
              <Reveal>
                <Block label="What we deliver" index="02">
                  {offering.deliverable}
                </Block>
              </Reveal>
              <Reveal>
                <Block label="Why it matters" index="03">
                  {offering.why}
                </Block>
              </Reveal>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <Reveal variant="fade">
                <DomainVisual variant={domain.composition} />
              </Reveal>

              {/* Tech */}
              <Reveal variant="fade">
                <div className="pt-surface rounded-[var(--pt-radius-md)] p-6">
                  <span className="pt-index">RELEVANT ENGINEERING</span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {offering.tech.map((t) => (
                      <span key={t} className="border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement + CTA */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell pt-shell-narrow">
          <Reveal>
            <span className="pt-eyebrow">04 — How to engage</span>
            <p className="pt-lead mt-6 max-w-2xl">{offering.engagement}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Discuss this offering <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="pt-btn pt-btn-ghost">
                All services
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sibling offerings in the same domain */}
      {siblings.length > 0 && (
        <section className="pt-section">
          <div className="pt-shell">
            <div className="border-b border-border pb-6">
              <span className="pt-eyebrow">More in {domain.name}</span>
            </div>
            <RevealGroup stagger={0.07} className="mt-2">
              {siblings.map((s) => (
                <RevealItem key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="group flex items-baseline gap-4 border-t border-border py-5 hover:bg-secondary/30 transition-colors">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary shrink-0">{s.name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{s.tagline}</span>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}

function Block({ label, index, children }: { label: string; index: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-8">
      <div className="flex items-center gap-3">
        <span className="pt-index text-xs">{index}</span>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      </div>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground">{children}</p>
    </div>
  );
}
