import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { MotionCard } from '@/components/motion/motion-card';
import { SELECTED_WORK, type WorkStatusTone } from '@/lib/selected-work';
import { getPublishedClientProjects } from '@/lib/public-data';
import { mapClientProjectToWorkEntry } from '@/lib/client-project-mapper';

/**
 * SelectedWorkSection — Paragonel's verified public project inventory
 * (Prompt 05D §4/§5).
 *
 * Single source of truth: `src/lib/selected-work.ts`. The same data drives the
 * homepage work index (`home/products.tsx`) and this section (rendered on
 * /portfolio and /testimonials) — no duplicate, conflicting arrays.
 *
 * Content rules enforced by the data module:
 *  - Exactly four verified entries (AcquisitionOS, CodeGuard AI,
 *    SystemFoundry, Maa Arogyam). No TechCorp / EduFuture / SkillUp / Remote
 *    Team Collaboration Suite. No DietMended / Primoreon. Quantum AI not merged.
 *  - Honest status labels (Private Beta / Published / Internal / Delivered).
 *  - No fabricated testimonials, metrics, case-study buttons, or stock images.
 *  - AcquisitionOS CTA -> /our-product/acquisitionos (the approved beta URL
 *    lives behind the product page's CTA, never as visible text here).
 *
 * Server Component — static, no Firestore read, no client SDK.
 */
const TONE_DOT: Record<WorkStatusTone, string> = {
  beta: 'bg-primary',
  live: 'bg-emerald-500',
  internal: 'bg-zinc-400',
  client: 'bg-violet-500',
};

export async function SelectedWorkSection({ compact = false }: { compact?: boolean }) {
  // Merge static products with published CMS client projects (Prompt 05L §2).
  // No duplicate source — client engagements live in the clientProjects CMS
  // collection; products live in selected-work.ts.
  const clientProjects = (await getPublishedClientProjects()).map(mapClientProjectToWorkEntry);
  const flagship = SELECTED_WORK.find((w) => w.flagship);
  const rest = [...SELECTED_WORK.filter((w) => !w.flagship), ...clientProjects];

  return (
    <section className="pt-section pt-surface-quiet">
      <div className="pt-shell">
        {!compact && (
          <Reveal>
            <span className="pt-eyebrow">Selected work</span>
            <h2 className="pt-h1 mt-6 text-foreground">What we have actually built.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Real engineering work — our own products and a delivered client engagement —
              presented factually. We do not publish client quotes, outcome metrics, or
              endorsements without evidence, and we do not present conceptual illustrations as
              real product screenshots.
            </p>
          </Reveal>
        )}

        {flagship && <FlagshipBlock entry={flagship} />}

        <RevealGroup stagger={0.08} className="mt-12 grid gap-px bg-border md:grid-cols-3">
          {rest.map((w) => (
            <RevealItem key={w.slug}>
              <MotionCard className="group flex h-full flex-col bg-background p-6">
                <div className="flex items-center gap-3">
                  <w.icon className="h-5 w-5 text-primary" />
                  <span className="pt-index text-[0.65rem]">{w.kind.toUpperCase()}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${TONE_DOT[w.statusTone]}`} />
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{w.status}</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{w.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                {w.href && w.ctaLabel && (
                  <Link
                    href={w.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded"
                  >
                    {w.ctaLabel} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </MotionCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function FlagshipBlock({ entry }: { entry: typeof SELECTED_WORK[number] }) {
  const Icon = entry.icon;
  return (
    <Reveal variant="fade" className="mt-12">
      <figure className="pt-surface overflow-hidden rounded-[var(--pt-radius-md)]">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-border p-8 lg:border-r lg:p-10">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" />
              <span className="pt-index">FLAGSHIP PRODUCT</span>
              <span className="rounded-full border border-primary/40 px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide text-primary">
                {entry.status}
              </span>
            </div>
            <h3 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{entry.title}</h3>
            <p className="mt-3 max-w-md text-base text-muted-foreground">{entry.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {entry.href && entry.ctaLabel && (
                <Link href={entry.href} className="pt-btn pt-btn-primary">
                  {entry.ctaLabel} <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <Link href="/portfolio" className="pt-btn pt-btn-ghost">
                All selected work
              </Link>
            </div>
          </div>
          <div className="bg-secondary/20 p-8 lg:p-10">
            <div className="flex items-center justify-between">
              <span className="pt-index">PROJECT TYPE</span>
              <span className="text-xs text-muted-foreground">Verified</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{entry.kind}</p>
            <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              No verified product screenshot is published here. The AcquisitionOS product page
              carries the full 12-stage lifecycle and the private-beta access path; no conceptual
              illustration is presented as a live product screenshot.
            </p>
          </div>
        </div>
      </figure>
    </Reveal>
  );
}
