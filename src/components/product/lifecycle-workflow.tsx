'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LIFECYCLE, type LifecycleStage } from '@/lib/acquisitionos-data';

/**
 * LifecycleWorkflow — the premium, readable visual explanation of the
 * AcquisitionOS 12-stage lifecycle (Prompt 05C centerpiece).
 *
 * Design intent:
 *  - One connected track of all 12 stages (Discover → Close), not 12 repetitive
 *    cards. The track reads as a journey: numbered nodes joined by a line.
 *  - Click/tap a node to open its full detail (short, detail, input → output →
 *    hands-to). Default open on stage 01.
 *  - Horizontal on desktop; horizontally scrollable with snap on mobile so the
 *    "connected journey" metaphor is preserved at every width.
 *  - Motion explains the flow (nodes reveal in sequence; the detail crossfades
 *    on stage change). Respects prefers-reduced-motion.
 *  - Clearly labelled "Conceptual workflow — not a product screenshot." No
 *    fabricated dashboard, no generic AI artwork, no blue-purple gradient.
 *
 * Stage terminology/order/detail are preserved verbatim from
 * `acquisitionos-data.ts` (no rename, reorder, or simplification).
 */
export function LifecycleWorkflow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const stage: LifecycleStage = LIFECYCLE[active];
  const Icon = stage.icon;

  return (
    <figure className="pt-surface rounded-[var(--pt-radius-md)] p-5 md:p-7">
      <figcaption className="mb-5 flex items-center justify-between border-b border-border pb-3">
        <span className="pt-index">THE CONNECTED LIFECYCLE · 12 STAGES</span>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          Conceptual workflow — not a product screenshot
        </span>
      </figcaption>

      {/* Track */}
      <div className="-mx-1 overflow-x-auto pb-3 [scrollbar-width:thin]">
        <ol
          className="flex min-w-max items-stretch gap-0 px-1 md:min-w-0"
          role="tablist"
          aria-label="AcquisitionOS 12-stage lifecycle"
        >
          {LIFECYCLE.map((s, i) => {
            const SIcon = s.icon;
            const selected = i === active;
            return (
              <li key={s.n} className="flex items-stretch">
                <button
                  role="tab"
                  aria-selected={selected}
                  aria-controls="lifecycle-detail"
                  id={`lifecycle-tab-${s.n}`}
                  onClick={() => setActive(i)}
                  className={`group relative flex w-[88px] flex-col items-center gap-2 px-1 py-3 text-center transition-colors md:w-auto md:flex-1 ${
                    selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* connector line to the next node (not after the last) */}
                  {i < LIFECYCLE.length - 1 && (
                    <span
                      className="absolute left-1/2 top-[34px] h-[2px] w-full bg-border"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-background transition-all ${
                      selected
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground group-hover:border-foreground/40'
                    }`}
                  >
                    <SIcon className="h-4 w-4" />
                  </span>
                  <span className="pt-index text-[0.6rem] leading-none">{s.n}</span>
                  <span className="text-[0.7rem] font-medium leading-tight">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Detail panel */}
      <div
        id="lifecycle-detail"
        role="tabpanel"
        aria-labelledby={`lifecycle-tab-${stage.n}`}
        className="mt-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.n}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-8"
          >
            <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--pt-radius-sm)] border border-primary/30 bg-primary/5 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="pt-index text-xs">STAGE {stage.n} / 12</div>
                <h3 className="pt-h2 text-2xl">{stage.name}</h3>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-base font-medium text-foreground">{stage.short}</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{stage.detail}</p>
            </div>

            <div className="grid gap-4 text-sm md:border-l md:border-border md:pl-6 md:min-w-[200px]">
              <Flow label="Input" value={stage.input} />
              <Flow label="Output" value={stage.output} />
              <div>
                <span className="pt-index block text-[0.6rem]">HANDS TO</span>
                <span className="mt-1 inline-flex items-center gap-1.5 font-medium text-primary">
                  {stage.next} {stage.next !== '—' && <ArrowRight className="h-3.5 w-3.5" />}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </figure>
  );
}

function Flow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="pt-index block text-[0.6rem]">{label.toUpperCase()}</span>
      <span className="mt-1 block text-foreground">{value}</span>
    </div>
  );
}
