'use client';

/**
 * TestimonialsMarquee — continuous horizontal track WITH manual navigation
 * (Prompt 05K §3, reworked in 05L §4).
 *
 * JS-driven (requestAnimationFrame) so auto-scroll, prev/next, swipe-drag and
 * snap can coexist without CSS-animation/inline-transform conflicts.
 *
 * Renders ONLY the published testimonials passed in as props. The track
 * duplicates the items enough times to fill ≥ 2× the viewport (computed on
 * mount + resize) so the loop has no visible jump or blank gap — even with
 * only 1, 2 or 3 published testimonials. The duplicate copies are
 * `aria-hidden` so screen readers announce each testimonial once. NO fake
 * testimonial records are created; the carousel does not imply a larger
 * customer base than the unique published entries.
 *
 * Interaction:
 *  - Auto-scroll: slow linear rAF advance; wraps at one set width (seamless).
 *  - Prev/Next buttons + Arrow Left/Right: pause auto-scroll + nudge one card.
 *  - Touch-drag/swipe: live drag during touchmove; snap to nearest card on
 *    touchend; a decisive swipe advances one card.
 *  - Pause/Play button (aria-pressed). Space/Enter on the region toggles.
 *  - Pause on hover + on keyboard focus within (temporary; resumes on leave).
 *  - Manual nav (prev/next/swipe) sets user-paused — stays paused until Play,
 *    so the user navigates rather than only watching.
 *  - prefers-reduced-motion → static horizontally-scrollable list (no rAF).
 *  - Company name is the primary identity; logo + person name are optional +
 *    permission-gated. Consistent card width + min-height; overflow-hidden
 *    viewport prevents horizontal page overflow.
 */
import { useEffect, useRef, useState, useCallback, type KeyboardEvent, type TouchEvent } from 'react';
import { Quote, Pause, Play, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
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
  heading?: string;
  subheading?: string;
}

/** px values — gap-5 = 1.25rem = 20px. */
const GAP = 20;
/** px per frame — ~24px/s at 60fps: slow, readable, not a cheap fast marquee. */
const SPEED = 0.4;

const publicQuote = (t: MarqueeTestimonial): string =>
  (t.approvedQuote?.trim() || t.originalQuote?.trim() || '').trim();

function TestimonialCard({ t }: { t: MarqueeTestimonial }) {
  const q = publicQuote(t);
  const showCompany = t.permissionDisplayName !== false;
  const showPerson = showCompany && !!t.clientName?.trim();
  const showLogo = t.permissionDisplayLogo === true && !!t.logoUrl?.trim();
  return (
    <figure
      data-card
      className="w-[300px] sm:w-[360px] shrink-0 rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-sm"
      role="listitem"
    >
      <Quote className="h-5 w-5 text-primary/40 shrink-0" aria-hidden="true" />
      <blockquote className="text-sm text-foreground/90 leading-relaxed flex-grow min-h-[4.5rem]">
        &ldquo;{q}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 pt-3 border-t border-border">
        {showLogo ? (
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
    </figure>
  );
}

export function TestimonialsMarquee({ testimonials, heading, subheading }: Props) {
  const [userPaused, setUserPaused] = useState(false);
  const [interactivePaused, setInteractivePaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [copies, setCopies] = useState(2);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null); // first (AT-visible) set
  const offsetRef = useRef(0);
  const setWidthRef = useRef(0); // one set width + inter-set gap (wrap distance)
  const cardStepRef = useRef(0); // one card + gap (nudge distance)
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, offset: 0 });

  // Refs mirroring state so the rAF loop reads current values without stale
  // closures.
  const userPausedRef = useRef(false);
  const interactivePausedRef = useRef(false);
  useEffect(() => { userPausedRef.current = userPaused; }, [userPaused]);
  useEffect(() => { interactivePausedRef.current = interactivePaused; }, [interactivePaused]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const applyTransform = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  }, []);

  // Measure set width + card step; compute how many copies fill ≥ 2× viewport.
  useEffect(() => {
    if (reducedMotion) return;
    const measure = () => {
      const setEl = setRef.current;
      const vp = viewportRef.current;
      if (!setEl || !vp) return;
      const setElWidth = setEl.offsetWidth; // one set's own width
      const setWidth = setElWidth + GAP; // distance to the next set's start
      setWidthRef.current = setWidth;
      const firstCard = setEl.querySelector('[data-card]') as HTMLElement | null;
      cardStepRef.current = firstCard ? firstCard.offsetWidth + GAP : 0;
      const vw = vp.offsetWidth || 1;
      // Need copies sets so the track (copies × setWidth) ≥ 2 × viewport, with
      // copies even so the duplicate halves are identical.
      const needed = Math.max(2, Math.ceil((2 * vw) / Math.max(setWidth, 1)));
      setCopies(needed % 2 === 0 ? needed : needed + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [reducedMotion]);

  // rAF auto-scroll loop.
  useEffect(() => {
    if (reducedMotion) return;
    const loop = () => {
      if (!userPausedRef.current && !interactivePausedRef.current && !draggingRef.current) {
        offsetRef.current += SPEED;
        const sw = setWidthRef.current;
        if (sw > 0 && offsetRef.current >= sw) offsetRef.current -= sw;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [reducedMotion, applyTransform]);

  if (!testimonials || testimonials.length === 0) return null;
  const items = testimonials.filter((t) => publicQuote(t).length > 0);
  if (items.length === 0) return null;

  // One-card nudge (prev/next). Pauses auto-scroll until the user hits Play.
  const nudge = (dir: 1 | -1) => {
    setUserPaused(true);
    const step = cardStepRef.current;
    const sw = setWidthRef.current;
    if (step <= 0 || sw <= 0) return;
    offsetRef.current = (((offsetRef.current + dir * step) % sw) + sw) % sw;
    applyTransform();
  };
  const prev = () => nudge(-1);
  const next = () => nudge(1);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement).tagName !== 'BUTTON') {
      e.preventDefault();
      setUserPaused((p) => !p);
    }
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      offset: offsetRef.current,
    };
    setInteractivePaused(true);
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const sw = setWidthRef.current;
    if (sw <= 0) return;
    draggingRef.current = true;
    // Live drag: dragging right (dx>0) should reveal earlier content → offset
    // decreases. Wrap modulo setWidth so the drag stays within one set span.
    offsetRef.current = (((touchStartRef.current.offset - dx) % sw) + sw) % sw;
    applyTransform();
  };
  const onTouchEnd = () => {
    draggingRef.current = false;
    setInteractivePaused(false);
    setUserPaused(true); // stay paused after manual nav — user hits Play to resume
    // Snap to the nearest card boundary.
    const step = cardStepRef.current;
    const sw = setWidthRef.current;
    if (step > 0 && sw > 0) {
      offsetRef.current = Math.round(offsetRef.current / step) * step % sw;
      applyTransform();
    }
  };

  if (reducedMotion) {
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

  return (
    <section aria-label="Client testimonials" className="py-12">
      <div className="container mx-auto px-4">
        {heading ? <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-2">{heading}</h2> : null}
        {subheading ? <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6">{subheading}</p> : null}
        <div className="flex items-center justify-center gap-2 mb-5">
          <Button type="button" variant="outline" size="icon" onClick={prev} aria-label="Previous testimonial" className="rounded-full">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            className="rounded-full"
          >
            {userPaused ? <Play className="h-4 w-4 mr-2" aria-hidden="true" /> : <Pause className="h-4 w-4 mr-2" aria-hidden="true" />}
            {userPaused ? 'Play' : 'Pause'}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={next} aria-label="Next testimonial" className="rounded-full">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="overflow-hidden"
        role="region"
        aria-label="Testimonial carousel — use arrow keys or the previous/next buttons to navigate"
        tabIndex={0}
        onMouseEnter={() => setInteractivePaused(true)}
        onMouseLeave={() => setInteractivePaused(false)}
        onFocusCapture={() => setInteractivePaused(true)}
        onBlurCapture={() => setInteractivePaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
      >
        <div ref={trackRef} className="flex gap-5 w-max">
          {/* AT-visible set — screen readers announce these once. */}
          <div
            ref={setRef}
            className="flex gap-5 shrink-0"
            role="list"
            aria-label={`${items.length} client testimonial${items.length === 1 ? '' : 's'}`}
          >
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
          {/* Duplicate visual copies — hidden from assistive technology. */}
          {Array.from({ length: Math.max(0, copies - 1) }).map((_, i) => (
            <div key={i} className="flex gap-5 shrink-0" aria-hidden="true">
              {items.map((t) => (
                <TestimonialCard key={`${t.id}-dup-${i}`} t={t} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
