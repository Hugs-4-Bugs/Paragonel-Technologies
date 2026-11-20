"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Database, ArrowDownToLine, Cpu, Search, Brain, Boxes, Gauge, Globe, Server, Network,
  Layers, GitFork, GitBranch, Activity, ShieldCheck, Rocket, Palette, Users, Code2, Lock,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Database, ArrowDownToLine, Cpu, Search, Brain, Boxes, Gauge, Globe, Server, Network,
  Layers, GitFork, GitBranch, Activity, ShieldCheck, Rocket, Palette, Users, Code2, Lock,
};

export type FlowStage = { label: string; icon: string };

/**
 * Animated linear flow diagram (pipeline / architecture path).
 * Desktop: left→right with progressive draw connector. Mobile: top→bottom.
 */
export function FlowDiagram({
  stages,
  eyebrow,
  title,
  caption,
}: {
  stages: FlowStage[];
  eyebrow: string;
  title: string;
  caption: string;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10 border-y border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</span>
          <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{caption}</p>
        </div>

        {/* Desktop horizontal flow */}
        <div className="relative hidden md:block">
          <div className="absolute left-0 right-0 top-7 h-px bg-border" />
          <motion.div
            className="absolute left-0 top-7 h-0.5 bg-primary"
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => {
              const Icon = ICONS[s.icon] || Boxes;
              return (
                <motion.div
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2 px-1 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-xs font-bold leading-tight text-foreground">{s.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical flow */}
        <div className="relative md:hidden">
          <div className="absolute bottom-3 left-7 top-3 w-px bg-border" />
          <motion.div
            className="absolute left-7 w-0.5 bg-primary"
            initial={reduce ? false : { height: 0 }}
            whileInView={{ height: "calc(100% - 24px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            style={{ top: 12 }}
          />
          <div className="space-y-6">
            {stages.map((s, i) => {
              const Icon = ICONS[s.icon] || Boxes;
              return (
                <motion.div
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="relative flex items-center gap-4"
                >
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm font-bold text-foreground">{s.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
