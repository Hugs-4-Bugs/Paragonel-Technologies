'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { OTHER_WORK, type WorkStatusTone } from '@/lib/selected-work';

const PIPELINE = [
  'Discover', 'Research', 'Find Gaps', 'Opportunity Report', 'Score',
  'Personalize', 'Outreach', 'Reply', 'Meeting', 'Pipeline', 'Proposal', 'Close',
];

// OTHER_WORK is imported from src/lib/selected-work.ts — the single source of
// truth shared with /portfolio and /testimonials (Prompt 05D §5). No duplicate
// project array here.

const TONE_DOT: Record<WorkStatusTone, string> = {
  beta: 'bg-primary',
  live: 'bg-emerald-500',
  internal: 'bg-zinc-400',
  client: 'bg-violet-500',
};

export function HomeProducts() {
  const reduce = useReducedMotion();
  const section = useRef<HTMLDivElement>(null);
  const [activeCount, setActiveCount] = useState(reduce ? PIPELINE.length : 1);

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ['start end', 'end start'],
  });
  const trackScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduce) return;
    setActiveCount(Math.max(1, Math.round(v * PIPELINE.length)));
  });

  return (
    <section ref={section} id="products" className="pt-section pt-surface-quiet">
      <div className="pt-shell">
        <Reveal>
          <span className="pt-eyebrow">04 — Products & engineering work</span>
          <h2 className="pt-h2 mt-5 text-foreground">What we have actually built.</h2>
          <p className="pt-lead mt-5 max-w-2xl">
            A commercial flagship in private beta, a shipped developer tool, an internal
            simulator, and a delivered engagement. No invented screenshots — where an
            illustration is used, its illustrative nature is clear.
          </p>
        </Reveal>

        {/* AcquisitionOS — featured */}
        <Reveal className="mt-12">
          <div className="pt-surface overflow-hidden rounded-[var(--pt-radius-md)]">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8 lg:p-10 lg:border-r border-border">
                <div className="flex items-center gap-3">
                  <span className="pt-index">FLAGSHIP</span>
                  <span className="rounded-full border border-primary/40 px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide text-primary">
                    Private Beta
                  </span>
                </div>
                <h3 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  AcquisitionOS
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  An AI-native client acquisition platform. The full acquisition motion as
                  one engineered system — from discovering accounts to closing the proposal.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="https://acquisitionosbeta.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pt-btn pt-btn-primary"
                  >
                    Open the beta <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Link href="/our-product/acquisitionos" className="pt-btn pt-btn-ghost">
                    Explore the product
                  </Link>
                </div>
              </div>

              {/* Pipeline — single track that fills on scroll + nodes light up */}
              <div className="bg-secondary/20 p-8 lg:p-10">
                <div className="flex items-center justify-between">
                  <span className="pt-index">ACQUISITION PIPELINE</span>
                  <span className="text-xs text-muted-foreground">{PIPELINE.length} stages</span>
                </div>

                <div className="mt-10 overflow-x-auto pb-2">
                  <div className="relative min-w-[36rem]">
                    {/* background + fill tracks aligned to the node row */}
                    <div className="absolute left-[1.6rem] right-[1.6rem] top-[0.4rem] h-[2px] bg-border" />
                    <motion.div
                      className="absolute left-[1.6rem] right-[1.6rem] top-[0.4rem] h-[2px] bg-primary"
                      style={{ scaleX: trackScale, transformOrigin: 'left center' }}
                    />
                    <div className="relative flex justify-between">
                      {PIPELINE.map((stage, i) => (
                        <div key={stage} className="flex w-20 flex-col items-center gap-2">
                          <span className="pt-pipeline-node" data-active={i < activeCount} />
                          <span
                            className={`text-center text-[0.7rem] leading-tight transition-colors ${
                              i < activeCount ? 'text-foreground font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-8 text-xs text-muted-foreground">
                  Discover → Research → Find Gaps → Opportunity Report → Score → Personalize →
                  Outreach → Reply → Meeting → Pipeline → Proposal → Close.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Other work — compact labeled index (shared verified data) */}
        <RevealGroup stagger={0.08} className="mt-10 grid gap-6 md:grid-cols-3">
          {OTHER_WORK.map((w) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${TONE_DOT[w.statusTone]}`} />
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{w.kind}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                {w.href && w.ctaLabel && (
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {w.ctaLabel} <ArrowUpRight className="h-4 w-4" />
                  </span>
                )}
              </>
            );
            return (
              <RevealItem key={w.slug}>
                {w.href ? (
                  <Link href={w.href} className="group block h-full border-t border-border pt-6">
                    {inner}
                  </Link>
                ) : (
                  <div className="group block h-full border-t border-border pt-6">{inner}</div>
                )}
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
