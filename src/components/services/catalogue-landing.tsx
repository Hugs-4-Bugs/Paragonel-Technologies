'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { DomainVisual } from '@/components/services/domain-visuals';
import { DOMAINS, getOfferingsForDomain, type ServiceOffering } from '@/lib/services-catalogue';

/**
 * Services landing (Prompt 05B). Editorial composition built on the Prompt 05A
 * design system. Five engineering-domain sections, each with a DISTINCT visual
 * composition (DomainVisual) + its offerings as numbered editorial rows that
 * link to /services/[slug] detail pages.
 *
 * `dynamicServices` (admin-published via the CMS / getPublicServices) are
 * preserved in a dedicated section so the admin CMS continues to surface
 * published services alongside the structured catalogue.
 */
export function CatalogueLanding({ dynamicServices = [] }: { dynamicServices?: { slug?: string; title?: string; description?: string }[] }) {
  return (
    <>
      {/* Hero */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(6rem, 12vw, 9rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">Services</span>
            <h1 className="pt-display mt-6 text-foreground">
              Five engineering domains.<br />
              <span className="text-primary">Thirteen offerings.</span> One engineering org.
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              Paragonel is not a generic outsourcing shop listing every technology in existence.
              These are the five domains we actually engineer in, and the specific offerings inside
              each — the problem each one solves, what we deliver, and why it matters.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Discuss a challenge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#approach" className="pt-btn pt-btn-ghost">
                How we engineer
              </Link>
            </div>
          </Reveal>

          {/* Domain quick-nav */}
          <RevealGroup stagger={0.05} className="mt-14 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
            {DOMAINS.map((d) => (
              <RevealItem key={d.slug} variant="fade">
                <a href={`#${d.slug}`} className="block bg-background p-5 transition-colors hover:bg-secondary/40">
                  <span className="pt-index text-xs">{d.index}</span>
                  <p className="mt-2 text-sm font-medium leading-tight text-foreground">{d.name}</p>
                </a>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Domain sections */}
      {DOMAINS.map((domain) => {
        const offerings = getOfferingsForDomain(domain.slug);
        return (
          <section key={domain.slug} id={domain.slug} className="pt-section scroll-mt-24">
            <div className="pt-shell">
              <Reveal>
                <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
                  <div>
                    <span className="pt-eyebrow">{domain.index} — {domain.name}</span>
                    <h2 className="pt-h2 mt-5 text-foreground">{domain.name}</h2>
                    <p className="pt-lead mt-4 max-w-xl">{domain.scope}</p>
                  </div>
                  <span className="pt-index text-xs shrink-0">{offerings.length} offerings</span>
                </div>
              </Reveal>

              <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
                {/* Distinct domain composition */}
                <Reveal variant="fade">
                  <DomainVisual variant={domain.composition} />
                </Reveal>

                {/* Offerings — numbered editorial rows */}
                <RevealGroup stagger={0.07}>
                  {offerings.map((o, i) => (
                    <OfferingRow key={o.slug} offering={o} index={i + 1} />
                  ))}
                </RevealGroup>
              </div>
            </div>
          </section>
        );
      })}

      {/* CMS-preserved dynamic services (admin-published) */}
      {dynamicServices.length > 0 && (
        <section className="pt-section pt-surface-quiet">
          <div className="pt-shell">
            <Reveal>
              <span className="pt-eyebrow">From the live catalogue</span>
              <h2 className="pt-h2 mt-5 text-foreground">Published by the Paragonel team.</h2>
              <p className="pt-lead mt-4 max-w-xl">
                Service entries published through the admin CMS. These appear alongside the
                structured domain catalogue above.
              </p>
            </Reveal>
            <RevealGroup stagger={0.06} className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dynamicServices.map((s) => (
                <RevealItem key={s.slug ?? s.title}>
                  <Link href={`/services/${s.slug}`} className="group block h-full border-t border-border pt-5">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
                    {s.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{s.description}</p>}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-primary">
                      View <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="pt-section">
        <div className="pt-shell pt-shell-narrow text-center">
          <Reveal>
            <span className="pt-eyebrow justify-center">Engagement</span>
            <h2 className="pt-h1 mt-6 text-foreground">Not sure which offering fits?</h2>
            <p className="pt-lead mt-6 mx-auto max-w-2xl">
              Tell us the business challenge. We map it to the right domain + offering, honestly —
              including when the right answer is a combination, or none of the above.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Contact Paragonel <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/our-product/acquisitionos" className="pt-btn pt-btn-ghost">
                See our own product
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function OfferingRow({ offering, index }: { offering: ServiceOffering; index: number }) {
  return (
    <RevealItem>
      <Link
        href={`/services/${offering.slug}`}
        className="group block border-t border-border py-6 transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-baseline gap-4">
          <span className="pt-index text-xs">{String(index).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {offering.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{offering.tagline}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {offering.problem}
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </Link>
    </RevealItem>
  );
}
