'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { DomainVisual } from '@/components/services/domain-visuals';
import {
  DOMAINS,
  getOfferingsForDomain,
  getDomainStatus,
  getOfferingStatus,
  STATUS_META,
  type ServiceOffering,
  type CapabilityStatus,
} from '@/lib/services-catalogue';

/**
 * Services landing (Prompt 05B, expanded in 05E). Editorial composition built
 * on the 05A design system. Thirteen capability-family sections, each with a
 * DISTINCT visual composition (DomainVisual) + its offerings as numbered
 * editorial rows that link to /services/[slug] detail pages.
 *
 * Each domain + offering carries a capability-status indicator (Deliver Now /
 * Specialist Support / Research & Emerging) per docs/CAPABILITY_STRATEGY.md §3.
 * The original five 05B domains (all Deliver Now) are preserved as a subset.
 *
 * `dynamicServices` (admin-published via the CMS / getPublicServices) are
 * preserved in a dedicated section so the admin CMS continues to surface
 * published services alongside the structured catalogue.
 */
export function CatalogueLanding({ dynamicServices = [], ecosystemSlot }: { dynamicServices?: { slug?: string; title?: string; description?: string }[]; ecosystemSlot?: ReactNode }) {
  return (
    <>
      {/* Hero */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 7rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">Engineering solutions</span>
            <h1 className="pt-display mt-6 text-foreground">
              AI-native systems,<br />
              <span className="text-primary">engineered end-to-end.</span>
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              Paragonel engineers the intelligence, the platform, the security and the evidence
              behind an AI-native system. Thirteen capability families — each with an honest
              delivery status. Not a generic outsourcing shop listing every technology in existence.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Discuss a challenge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/industries" className="pt-btn pt-btn-ghost">
                Industry solutions
              </Link>
            </div>

            {/* Status legend */}
            <RevealGroup stagger={0.04} className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5">
              {(Object.keys(STATUS_META) as CapabilityStatus[]).map((k) => (
                <RevealItem key={k} variant="fade">
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${STATUS_META[k].tone}`} />
                    <span className="font-medium text-foreground">{STATUS_META[k].label}</span>
                    <span className="hidden sm:inline">— {STATUS_META[k].blurb}</span>
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </Reveal>

          {/* Domain quick-nav — 13 families, responsive card grid.
              Discrete bordered cards with real gaps (not a gap-px tiled sheet)
              so there are no oversized background rectangles or empty filler
              blocks on the partial last row — just balanced whitespace. Uniform
              card padding + hover border-colour give a clearer visual rhythm. */}
          <RevealGroup stagger={0.04} className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {DOMAINS.map((d) => {
              const st = getDomainStatus(d);
              return (
                <RevealItem key={d.slug} variant="fade">
                  <a
                    href={`#${d.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-secondary/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="pt-index text-xs">{d.index}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${STATUS_META[st].tone}`}
                        title={STATUS_META[st].label}
                        aria-label={STATUS_META[st].label}
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                      {d.name}
                    </p>
                  </a>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Domain sections */}
      {DOMAINS.map((domain) => {
        const offerings = getOfferingsForDomain(domain.slug);
        const st = getDomainStatus(domain);
        return (
          <section key={domain.slug} id={domain.slug} className="pt-section scroll-mt-24">
            <div className="pt-shell">
              <Reveal>
                <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="pt-eyebrow">{domain.index} — {domain.name}</span>
                      <span className={`inline-flex h-2 w-2 rounded-full ${STATUS_META[st].tone}`} title={STATUS_META[st].label} />
                    </div>
                    <h2 className="pt-h2 mt-5 text-foreground">{domain.name}</h2>
                    <p className="pt-lead mt-4 max-w-xl">{domain.scope}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{STATUS_META[st].label}.</span>{' '}
                      {STATUS_META[st].blurb}
                    </p>
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

      {/* Technology & integration ecosystem (server-rendered slot from the
          page). Placed after the catalogue + before the engagement CTA so the
          flow reads: what we deliver → what we build with / can connect → how
          to engage. Distinct from /our-product's product-level integration
          status — this is company-level capability. */}
      {ecosystemSlot}

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
  const st = getOfferingStatus(offering);
  return (
    <RevealItem>
      <Link
        href={`/services/${offering.slug}`}
        className="group block border-t border-border py-6 transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-baseline gap-4">
          <span className="pt-index text-xs">{String(index).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {offering.name}
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[st].tone}`} />
                {STATUS_META[st].label}
              </span>
            </div>
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
