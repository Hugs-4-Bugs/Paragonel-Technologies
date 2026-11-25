import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

/**
 * ClientShowcase — a horizontally-scrollable strip of client/project brands
 * (founder request 2026-11-24).
 *
 * Renders the three named client brands as client/project work — brand name +
 * an external link only. NO fabricated quotes, customer names, job titles,
 * ratings, stars, or endorsements (per the founder's explicit instruction).
 * NO invented descriptions or claims about any brand.
 *
 * The strip is a finite horizontally-scrollable area (overflow-x-auto), NOT an
 * auto-scrolling marquee — the user scrolls/swipes horizontally. Cards are
 * equal-height within the row (flex + default stretch) + responsive (each card
 * has a min-width so it does not crush on mobile).
 *
 * BRAND ASSET NOTE: the DietMended Wellness Logo/Emblem, the Primoreon logo,
 * and the Maarogyam brand identity were NOT supplied in an identifiable form
 * in the implementation context (the GLM model cannot inspect image uploads,
 * and no named logo files exist under public/ or upload/). The cards therefore
 * use the brand NAME as the primary visual. When the founder supplies named
 * logo assets (e.g. public/images/clients/primoreon.png), they can be added to
 * the `logo` field below + rendered with preserved proportions.
 *
 * MAAROGYAM: the founder supplied the official website https://marogyam.com/.
 * Shown as a client project (brand name + Visit link), consistent with the
 * Primoreon + DietMended cards. Per "link only to its correct website or
 * profile — do not substitute another similarly named organization."
 *
 * Server Component (no client interactivity — native horizontal scroll only).
 */
interface ClientBrand {
  name: string;
  url?: string;
}

const CLIENTS: ClientBrand[] = [
  { name: 'Primoreon', url: 'https://www.primoreon.com/' },
  { name: 'DietMended', url: 'https://share.google/Ia3Kq6Ot7oHDTzjyp' },
  { name: 'Maarogyam', url: 'https://marogyam.com/' },
];

export function ClientShowcase() {
  return (
    <section className="pt-section">
      <div className="pt-shell">
        <Reveal>
          <span className="pt-eyebrow">Client Work</span>
          <h2 className="pt-h1 mt-6 text-foreground">Organisations we&apos;ve worked with.</h2>
          <p className="pt-lead mt-6 max-w-2xl">
            A selection of client and project engagements, shown by brand name
            with a link to each organisation. No testimonials, ratings, or
            endorsements are presented here.
          </p>
        </Reveal>

        {/*
          Horizontally-scrollable strip (finite, user-driven — not a marquee).
          overflow-x-auto on the wrapper; the inner flex row lays the cards out
          horizontally with a min-width each so they overflow + scroll on
          narrow viewports, without crushing the card content.
        */}
        <div className="mt-10 overflow-x-auto pb-4 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
          <div className="flex gap-5 sm:gap-6">
            {CLIENTS.map((c) => {
              const label = (
                <span className="pt-index text-xs">CLIENT PROJECT</span>
              );
              const name = (
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                  {c.name}
                </h3>
              );
              if (c.url) {
                return (
                  <a
                    key={c.name}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${c.name} — opens in a new tab`}
                    className="group flex min-w-[260px] flex-col rounded-[var(--pt-radius-md)] border border-border bg-background p-6 transition-colors hover:bg-secondary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-w-[300px]"
                  >
                    {label}
                    {name}
                    <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
                      Visit{' '}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                );
              }
              return (
                <div
                  key={c.name}
                  className="flex min-w-[260px] flex-col rounded-[var(--pt-radius-md)] border border-border bg-background p-6 sm:min-w-[300px]"
                >
                  {label}
                  {name}
                  <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm text-muted-foreground">
                    Profile link pending
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
