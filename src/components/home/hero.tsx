'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { EASE_OUT } from '@/lib/motion';

const DOMAINS = [
  { n: '01', label: 'Product Engineering' },
  { n: '02', label: 'AI & Intelligent Systems' },
  { n: '03', label: 'Cloud, Infrastructure & Platform' },
  { n: '04', label: 'Data Engineering & Analytics' },
  { n: '05', label: 'Experience & Interface' },
];

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT, delay: 0.1 + i * 0.08 },
  }),
};

export function HomeHero() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  // Subtle parallax on the right-side system panel — Framer Motion useScroll.
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ['start start', 'end start'],
  });
  const panelY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section ref={root} className="pt-hero-backdrop relative overflow-hidden">
      <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(6rem, 12vw, 9rem)' }}>
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 items-start">
          {/* Left — editorial positioning */}
          <div>
            {reduce ? (
              <span className="pt-eyebrow mb-6">Engineering Studio — Paragonel</span>
            ) : (
              <motion.span
                className="pt-eyebrow mb-6 block"
                custom={0}
                variants={reveal}
                initial="hidden"
                animate="visible"
              >
                Engineering Studio — Paragonel
              </motion.span>
            )}

            <h1 className="pt-display text-foreground">
              {['We engineer', 'digital products', 'and systems that', 'move businesses'].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  custom={i + 1}
                  variants={reduce ? undefined : reveal}
                  initial={reduce ? false : 'hidden'}
                  animate={reduce ? undefined : 'visible'}
                >
                  {i === 3 ? (
                    <>
                      move businesses <span className="text-primary">forward.</span>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="pt-lead mt-8 max-w-xl"
              custom={5}
              variants={reduce ? undefined : reveal}
              initial={reduce ? false : 'hidden'}
              animate={reduce ? undefined : 'visible'}
            >
              Paragonel combines product engineering, AI, software architecture, cloud
              infrastructure and data engineering to turn complex business challenges into
 dependable digital solutions — built by engineers who ship their own products.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              custom={6}
              variants={reduce ? undefined : reveal}
              initial={reduce ? false : 'hidden'}
              animate={reduce ? undefined : 'visible'}
            >
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Discuss a challenge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/our-product/acquisitionos" className="pt-btn pt-btn-ghost">
                Explore AcquisitionOS
              </Link>
            </motion.div>

            <motion.p
              className="mt-8 text-sm text-muted-foreground"
              custom={7}
              variants={reduce ? undefined : reveal}
              initial={reduce ? false : 'hidden'}
              animate={reduce ? undefined : 'visible'}
            >
              <span className="text-foreground font-medium">Shaping the Future.</span>{' '}
              AcquisitionOS in private beta — Bangalore, India.
            </motion.p>
          </div>

          {/* Right — system index panel (distinctive, not an image card) */}
          <motion.aside
            className="pt-surface rounded-[var(--pt-radius-md)] p-6 md:p-8 lg:sticky lg:top-28"
            style={reduce ? undefined : { y: panelY }}
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT, delay: 0.35 } }}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="pt-index">SYSTEM INDEX</span>
              <span className="text-xs text-muted-foreground">5 domains</span>
            </div>
            <ul className="mt-2">
              {DOMAINS.map((d) => (
                <li
                  key={d.n}
                  className="group flex items-baseline gap-4 border-b border-border/60 py-3.5 transition-colors hover:bg-secondary/40"
                >
                  <span className="pt-index w-8 shrink-0">{d.n}</span>
                  <span className="text-sm font-medium text-foreground">{d.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Flagship</span>
              <Link href="/our-product/acquisitionos" className="pt-link">AcquisitionOS — Private Beta</Link>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
          style={{ opacity: cueOpacity }}
          aria-hidden
        >
          <span className="text-[0.7rem] tracking-[0.2em] uppercase">Scroll</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      )}
    </section>
  );
}
