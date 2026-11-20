"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, Cloud, GitBranch, Boxes, Brain, Database, Plug, Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/**
 * Cinematic hero with a connected product-engineering ecosystem visual.
 * Left: copy. Right: a hub-and-spoke node graph (animated SVG connectors) with
 * floating UI panels, including a clearly-distinguished AcquisitionOS panel.
 * All panels are illustrative — never presented as live customer data.
 */
type Node = { id: string; label: string; icon: LucideIcon; x: number; y: number; tone: string };

const nodes: Node[] = [
  { id: "ai", label: "AI / LLM Ops", icon: Brain, x: 78, y: 70, tone: "text-sky-300" },
  { id: "cloud", label: "Cloud Platform", icon: Cloud, x: 300, y: 44, tone: "text-cyan-300" },
  { id: "devops", label: "DevOps & CI/CD", icon: GitBranch, x: 430, y: 150, tone: "text-emerald-300" },
  { id: "saas", label: "SaaS Products", icon: Boxes, x: 360, y: 270, tone: "text-violet-300" },
  { id: "data", label: "Data & Retrieval", icon: Database, x: 120, y: 250, tone: "text-amber-300" },
  { id: "api", label: "APIs & Integrations", icon: Plug, x: 250, y: 168, tone: "text-rose-300" },
];

const hub = { x: 245, y: 162 };

// Curved path from hub to each node
const pathFor = (n: Node) => {
  const mx = (hub.x + n.x) / 2;
  const my = (hub.y + n.y) / 2 - 26;
  return `M ${hub.x} ${hub.y} Q ${mx} ${my} ${n.x} ${n.y}`;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroEcosystem() {
  const reduce = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden bg-[#070b1a] text-white">
      {/* Deep-navy gradient + electric-blue glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070b1a] via-[#0a1230] to-[#070b1a]" />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:py-28 md:grid-cols-[1.05fr_1fr] md:px-6 lg:py-32">
        {/* Copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-xl"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-sky-200"
          >
            <Sparkles className="h-3.5 w-3.5" /> Paragonel Technologies · Product Engineering &amp; AI
          </motion.span>
          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            We Engineer Digital Products That{" "}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Move Businesses Forward.
            </span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            From AI-powered systems and intelligent automation to scalable SaaS platforms and cloud-native
            applications, Paragonel designs and engineers technology that turns complex business challenges into
            practical digital products.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full bg-sky-500 px-7 text-base font-bold text-white hover:bg-sky-400 shadow-lg shadow-sky-500/30">
              <Link href="/services">
                Explore Our Capabilities <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/25 bg-white/5 px-7 text-base font-bold text-white backdrop-blur hover:bg-white/10"
            >
              <Link href="/our-product/acquisitionos">Discover AcquisitionOS</Link>
            </Button>
          </motion.div>
          <motion.p variants={item} className="mt-6 text-xs text-slate-400">
            Shaping the Future · AcquisitionOS in <span className="font-bold text-sky-300">Private Beta</span>
          </motion.p>
        </motion.div>

        {/* Ecosystem visual */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <div className="relative aspect-square w-full">
            <svg viewBox="0 0 520 320" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
              {/* animated connectors */}
              {nodes.map((n, i) => (
                <motion.path
                  key={n.id}
                  d={pathFor(n)}
                  fill="none"
                  stroke="url(#wire)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.55 }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.12, ease: "easeInOut" }}
                />
              ))}
              {/* travelling data pulse along each wire */}
              {!reduce &&
                nodes.map((n) => (
                  <motion.circle
                    key={`p-${n.id}`}
                    r={2.6}
                    fill="#7dd3fc"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                    style={{ offsetPath: `path("${pathFor(n)}")` }}
                  />
                ))}
              <defs>
                <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* hub */}
            <Floating delay={0.2} x="46%" y="50%" reduce={reduce}>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-sky-400/40 bg-white/10 px-4 py-3 backdrop-blur-md shadow-xl shadow-sky-500/20">
                <Cpu className="h-6 w-6 text-sky-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Product Eng.</span>
              </div>
            </Floating>

            {/* satellite nodes */}
            {nodes.map((n, i) => (
              <Floating
                key={n.id}
                delay={0.5 + i * 0.1}
                x={`${(n.x / 520) * 100}%`}
                y={`${(n.y / 320) * 100}%`}
                reduce={reduce}
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#0b1530]/80 px-2.5 py-2 backdrop-blur shadow-lg">
                  <n.icon className={`h-4 w-4 ${n.tone}`} />
                  <span className="text-[10px] font-bold text-slate-200">{n.label}</span>
                </div>
              </Floating>
            ))}

            {/* Distinct AcquisitionOS floating panel */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="absolute -bottom-2 left-1/2 w-[230px] -translate-x-1/2 rounded-2xl border border-sky-400/50 bg-gradient-to-br from-[#0c1a3f]/95 to-[#0a1230]/95 p-3 shadow-2xl shadow-sky-500/30 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Workflow className="h-3.5 w-3.5 text-sky-300" />
                  <span className="text-[11px] font-black tracking-tight text-white">AcquisitionOS</span>
                </div>
                <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-sky-300">
                  Beta
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <div className="h-1 flex-1 rounded-full bg-white/15">
                      <motion.div
                        className="h-full rounded-full bg-sky-400"
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${60 + k * 12}%` }}
                        transition={{ duration: 1, delay: 1.4 + k * 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[8px] text-slate-400">Illustrative lifecycle progress — not live data.</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Floating({
  children,
  x,
  y,
  delay,
  reduce,
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
