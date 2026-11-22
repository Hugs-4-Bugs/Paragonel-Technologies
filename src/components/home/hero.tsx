'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { EASE_OUT } from '@/lib/motion';

/**
 * HomeHero (Prompt 05E §8 redesign).
 *
 * Founder-observed problem (05E): the prior hero occupied too many lines, the
 * right-side system index + left text created a tall composition, and the
 * paragraph + CTAs fell below the first viewport — the founder had to scroll to
 * see the complete hero.
 *
 * Fix:
 *  - Two controlled headline lines (was four), sized with a hero-specific
 *    clamp below pt-display so the headline, lead, and BOTH CTAs fit in the
 *    first viewport on common desktop heights (1440×900, 1366×768, 1280×720).
 *  - Top padding clears the sticky header (h-24 / 96px desktop, h-20 / 80px
 *    mobile) via clamp(5rem, 7vw, 6.5rem).
 *  - Shortened supporting copy; CTAs at mt-7.
 *  - Right panel repurposed from a 5-domain index (now 13 families — too tall)
 *    to the THREE core specialization pillars + a compact status legend +
 *    flagship link — meaningful and compact.
 *  - Mobile: natural vertical stack, single column, readable headline, primary
 *    CTA visible without awkward overflow; full content preserved (no hiding).
 *  - Reduced-motion: reveals collapse to static via the conditional-variants
 *    pattern (variants={reduce ? undefined : reveal}).
 */

const PILLARS = [
  { n: '01', label: 'AI-native workflow systems', href: '/services/ai-agents-copilots' },
  { n: '02', label: 'Engineering intelligence & trust', href: '/services/secure-architecture-appsec' },
  { n: '03', label: 'Platform & data engineering for AI', href: '/services/cloud-architecture-migration' },
];

const STATUS = [
  { tone: 'bg-emerald-500', label: 'Deliver Now', count: '8 families' },
  { tone: 'bg-amber-500', label: 'Specialist Support', count: '3 families' },
  { tone: 'bg-sky-500', label: 'Research & Emerging', count: '2 families' },
];

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay: 0.08 + i * 0.07 },
  }),
};

export function HomeHero() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : reveal;
  const init = reduce ? false : 'hidden';
  const anim = reduce ? undefined : 'visible';

  return (
    <section className="pt-hero-backdrop relative overflow-hidden">
      <div
        className="pt-shell"
        style={{ paddingTop: 'clamp(5rem, 7vw, 6.5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* Left — positioning + CTAs (visible in first viewport on desktop) */}
          <div>
            <motion.span className="pt-eyebrow mb-5 block" custom={0} variants={v} initial={init} animate={anim}>
              Engineering Studio — Paragonel
            </motion.span>

            <motion.h1
              className="text-foreground"
              style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)', lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em' }}
              custom={1}
              variants={v}
              initial={init}
              animate={anim}
            >
              <span className="block">We engineer AI-native</span>
              <span className="block">
                systems, <span className="text-primary">end-to-end.</span>
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-xl text-muted-foreground"
              style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1875rem)', lineHeight: 1.55 }}
              custom={2}
              variants={v}
              initial={init}
              animate={anim}
            >
              The intelligence, the platform, the security and the evidence behind an AI-native
              system — built by engineers who ship their own products.
            </motion.p>

            <motion.div className="mt-7 flex flex-wrap items-center gap-3" custom={3} variants={v} initial={init} animate={anim}>
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Discuss a challenge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/our-product/acquisitionos" className="pt-btn pt-btn-ghost">
                Explore AcquisitionOS
              </Link>
            </motion.div>

            <motion.p className="mt-5 text-sm text-muted-foreground" custom={4} variants={v} initial={init} animate={anim}>
              <span className="font-medium text-foreground">Shaping the Future.</span>{' '}
              AcquisitionOS in private beta — Bangalore, India.
            </motion.p>
          </div>

          {/* Right — compact specialization panel (was a 5-domain index; 13 now) */}
          <motion.aside
            className="pt-surface rounded-[var(--pt-radius-md)] p-6 lg:p-7"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.3 } }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="pt-index">CORE PILLARS</span>
              <Link href="/services" className="pt-link text-xs">Catalogue</Link>
            </div>
            <ul className="mt-1">
              {PILLARS.map((p) => (
                <li key={p.n}>
                  <Link
                    href={p.href}
                    className="group flex items-baseline gap-3 border-b border-border/60 py-3 transition-colors hover:bg-secondary/40"
                  >
                    <span className="pt-index w-6 shrink-0 text-[0.65rem]">{p.n}</span>
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-3">
              <span className="pt-index text-[0.6rem]">CAPABILITY STATUS</span>
              <ul className="mt-2 space-y-1.5">
                {STATUS.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${s.tone}`} />
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="ml-auto text-muted-foreground">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Flagship</span>
              <Link href="/our-product/acquisitionos" className="pt-link">AcquisitionOS — Private Beta</Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
