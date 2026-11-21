'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Smooth-scroll + scroll-storytelling backbone (Prompt 05A).
 *
 * - Registers GSAP ScrollTrigger once.
 * - Boots Lenis for premium inertial scrolling, wired into ScrollTrigger so
 *   scrub/pin animations stay in sync with the smoothed scroll position.
 * - Respects `prefers-reduced-motion`: when the user has reduced motion
 *   enabled, Lenis is NOT mounted (native scroll) and ScrollTrigger scrub
 *   animations are skipped (sections that use scrub check the media query
 *   themselves + fall back to a static layout).
 *
 * Mounted once near the root (AppShell) so it is active on every route.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // native scroll, no scrub — reduced-motion users.

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger once fonts/layout settle.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const t = setTimeout(refresh, 600);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.removeEventListener('load', refresh);
      clearTimeout(t);
    };
  }, []);

  return null;
}
