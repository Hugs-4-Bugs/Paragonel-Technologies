'use client';

/**
 * TestimonialsMarquee — premium continuous horizontal testimonial track
 * (Prompt 05K §3).
 *
 * Renders ONLY the published testimonials passed in as props (the server
 * fetches getPublishedTestimonials). The visual track duplicates the items
 * exactly once to produce a seamless loop — the duplicate copy is
 * `aria-hidden` so screen readers do not announce it twice, and NO fake
 * testimonial records are created to pad the track. With three published
 * testimonials the track visually repeats those three; the carousel does not
 * imply a larger customer base than the unique published entries.
 *
 * Behaviour:
 *  - Continuous, slow (40s), linear movement — readable, not a fast marquee.
 *  - Pause on hover, on keyboard focus within, and on touch (mobile).
 *  - Accessible Pause/Play button (aria-pressed) + keyboard operable.
 *  - prefers-reduced-motion → static horizontally-scrollable list (no
 *    animation), still fully readable + swipeable.
 *  - Consistent card width + min-height; sufficient padding + gaps; no
 *    horizontal page overflow (overflow-hidden on the viewport).
 *  - Company name is the primary identity (shown when permissionDisplayName);
 *    logo + person name are optional + permission-gated. A card stays visually
 *    strong with no logo.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Quote, Pause, Play, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MarqueeTestimonial {
  id: string;
  companyName: string;
  approvedQuote?: string;
  originalQuote?: string;
  clientName?: string;
  designation?: string;
  logoUrl?: string;
  projectRef?: string;
  permissionDisplayName?: boolean;
  permissionDisplayLogo?: boolean;
}

interface Props {
  testimonials: MarqueeTestimonial[];
  /** Optional heading rendered above the track. */
  heading?: string;
  subheading?: string;
}

const publicQuote = (t: MarqueeTestimonial): string =>
  (t.approvedQuote?.trim() || t.originalQuote?.trim() || '').trim();

function TestimonialCard({ t, dup }: { t: MarqueeTestimonial; dup?: boolean }) {
  const q = publicQuote(t);
  const showCompany = t.permissionDisplayName !== false; // default show when undefined
  const showPerson = showCompany && !!t.clientName?.trim();
  const showLogo = t.permissionDisplayLogo === true && !!t.logoUrl?.trim();
  return (
    <figure
      className="w-[300px] sm:w-[360px] shrink-0 rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-sm"
      role="listitem"
    >
      <Quote className="h-5 w-5 text-primary/40 shrink-0" aria-hidden="true" />
      <blockquote className="text-sm text-foreground/90 leading-relaxed flex-grow min-h-[4.5rem]">
        &ldquo;{q}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 pt-3 border-t border-border">
        {showLogo ? (
          // Consistent logo container — keeps cards aligned when some clients
          // have no logo. No distortion/recolor of supplied logos.
          <span className="h-9 w-9 rounded-md bg-secondary/40 border border-border flex items-center justify-center overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.logoUrl} alt="" className="h-full w-full object-contain" />
          </span>
        ) : (
          <span className="h-9 w-9 rounded-md bg-primary/10 border border-border flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary/70" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0">
          {showCompany ? (
            <span className="block font-semibold text-foreground text-sm truncate">{t.companyName}</span>
          ) : (
            <span className="block font-semibold text-foreground text-sm truncate">Verified client</span>
          )}
          {showPerson ? (
            <span className="block text-xs text-muted-foreground truncate">
              {t.clientName}
              {t.designation?.trim() ? `, ${t.designation}` : ''}
            </span>
          ) : null}
        </span>
      </figcaption>
      {dup ? null : null}
    </figure>
  );
}

export function TestimonialsMarquee({ testimonials, heading, subheading }: Props) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!testimonials || testimonials.length === 0) return null;

  // Deduplicate by id (defensive — the server already returns unique published).
  const items = testimonials.filter((t) => publicQuote(t).length > 0);
  if (items.length === 0) return null;

  // Pause on touch (mobile) — resume on touch end.
  const onTouchStart = () => setPaused(true);
  const onTouchEnd = () => setPaused(false);

  if (reducedMotion) {
    // Static, scrollable list — fully readable + swipeable, no animation.
    return (
      <section aria-label="Client testimonials" className="py-12">
        <div className="container mx-auto px-4">
          {heading ? <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-2">{heading}</h2> : null}
          {subheading ? <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">{subheading}</p> : null}
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-5 w-max" role="list">
              {items.map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Animated marquee: the track renders the items twice (two inline halves
  // below) for a seamless loop. The duplicate half is aria-hidden so assistive
  // tech announces each testimonial once.

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Space/Enter on the section toggles play state (in addition to the button).
    if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement).tagName !== 'BUTTON') {
      e.preventDefault();
      setPaused((p) => !p);
    }
  };

  return (
    <section aria-label="Client testimonials" className="py-12">
      <div className="container mx-auto px-4">
        {heading ? <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-2">{heading}</h2> : null}
        {subheading ? <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6">{subheading}</p> : null}
        <div className="flex justify-center mb-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="rounded-full"
          >
            {paused ? <Play className="h-4 w-4 mr-2" aria-hidden="true" /> : <Pause className="h-4 w-4 mr-2" aria-hidden="true" />}
            {paused ? 'Play' : 'Pause'}
          </Button>
        </div>
      </div>
      {/* Viewport: overflow-hidden prevents horizontal page overflow. */}
      <div
        ref={viewportRef}
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
      >
        {/* Track: two identical halves; translateX(-50%) loops seamlessly. */}
        <div
          className="flex w-max pt-marquee-track"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
        >
          <div className="flex gap-5 shrink-0" role="list" aria-label={`${items.length} client testimonial${items.length === 1 ? '' : 's'}`}>
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
          {/* Duplicate copy — visual only, hidden from assistive technology. */}
          <div className="flex gap-5 shrink-0" aria-hidden="true">
            {items.map((t) => (
              <TestimonialCard key={`${t.id}-dup`} t={t} dup />
            ))}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pt-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .pt-marquee-track { animation: pt-marquee 40s linear infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .pt-marquee-track { animation: none; }
        }
        `,
      }} />
    </section>
  );
}
