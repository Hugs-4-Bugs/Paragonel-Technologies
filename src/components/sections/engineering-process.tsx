"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Search, PencilRuler, Palette, Code2, Plug, ShieldCheck, Rocket, TrendingUp, ChevronDown, type LucideIcon,
} from "lucide-react";

/**
 * Paragonel's engineering approach as an animated, connected 8-step flow.
 * Each step opens a detail panel. Labelled as our approach, not a claim that
 * every project follows an identical process.
 */
type Step = { n: number; name: string; icon: LucideIcon; short: string; detail: string };

const steps: Step[] = [
  { n: 1, name: "Understand", icon: Search, short: "Map the real problem and constraints.", detail: "We start by understanding the business pain, the users, and the constraints — not the feature list. Output: a problem statement and success criteria the engineering work is measured against." },
  { n: 2, name: "Architect", icon: PencilRuler, short: "Choose the system shape.", detail: "We pick the architecture — service boundaries, data flow, scaling seams, and failure modes — before writing product code. Output: an architecture sketch and a build sequence." },
  { n: 3, name: "Design", icon: Palette, short: "Define the product surface.", detail: "UX, information architecture, and the interaction model. Output: wireframes and a component vocabulary that engineering can build against." },
  { n: 4, name: "Engineer", icon: Code2, short: "Build the product.", detail: "Implementation with tests, code review, and type safety. Output: working software behind the designed surface." },
  { n: 5, name: "Integrate", icon: Plug, short: "Connect systems and data.", detail: "APIs, data pipelines, auth, and third-party services wired together with contracts. Output: an integrated, runnable system." },
  { n: 6, name: "Validate", icon: ShieldCheck, short: "Prove correctness and safety.", detail: "Automated tests, security checks, and edge-case validation. Output: confidence the system behaves under real conditions." },
  { n: 7, name: "Deploy", icon: Rocket, short: "Ship with safety rails.", detail: "CI/CD, environments, rollout, and observability. Output: a live system with rollback and monitoring." },
  { n: 8, name: "Improve", icon: TrendingUp, short: "Learn and iterate.", detail: "Measure against the success criteria, fix what matters, and plan the next increment. Output: a feedback loop into the next Understand." },
];

export function EngineeringProcess() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(1);

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Our approach</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">How Paragonel engineers a product</h2>
          <p className="mt-4 text-muted-foreground">
            A connected flow we adapt to each engagement — not a rigid template every project must follow.
          </p>
        </div>

        {/* Flow track */}
        <div className="relative">
          {/* animated connector line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 md:block" />
          <motion.div
            className="absolute left-0 top-7 hidden h-px bg-primary md:block"
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {steps.map((s, i) => (
              <motion.button
                key={s.n}
                type="button"
                onClick={() => setOpen(open === s.n ? null : s.n)}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative flex flex-col items-center gap-2 text-center"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                    open === s.n
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "border-border bg-card text-primary group-hover:border-primary/50 group-hover:shadow-md"
                  }`}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {s.n}</span>
                <span className="text-sm font-bold text-foreground">{s.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* detail panel */}
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key={open}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8"
            >
              {(() => {
                const s = steps.find((x) => x.n === open)!;
                return (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {s.n}</span>
                        <h3 className="text-xl font-black tracking-tight">{s.name}</h3>
                      </div>
                      <p className="mt-1 font-bold text-foreground">{s.short}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
