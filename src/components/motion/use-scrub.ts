'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * GSAP ScrollTrigger scrub hook — for the "appropriate advanced interactions"
 * the founder requires alongside Framer Motion (Prompt 05A).
 *
 * Animates `targetRef` from `fromVars` to `toVars`, scrubbed to the scroll
 * progress through `triggerRef` (defaults to the target's own element).
 *
 * Reduced-motion: no-op — the target keeps its CSS final state (call sites set
 * the final state in CSS / inline so reduced-motion users see the completed
 * visual with no scroll-driven motion).
 */
export function useGsapScrub(
  targetRef: RefObject<HTMLElement | null>,
  fromVars: gsap.TweenVars,
  toVars: gsap.TweenVars,
  triggerRef?: RefObject<HTMLElement | null>,
  start = 'top 80%',
  end = 'bottom 20%',
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = targetRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const trigger = triggerRef?.current ?? el;

    const ctx = gsap.context(() => {
      gsap.fromTo(el, fromVars, {
        ...toVars,
        ease: 'none',
        scrollTrigger: { trigger, start, end, scrub: 0.6 },
      });
    }, el);

    return () => ctx.revert();
  }, [targetRef, triggerRef, start, end]); // fromVars/toVars are stable per call site
}
