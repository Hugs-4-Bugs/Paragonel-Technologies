"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, Cloud, GitBranch, Boxes, Brain, Database, Plug, Workflow, Code2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/**
 * Cinematic hero (Phase 2 §1). Left: copy with the exact founder headline +
 * supporting message + primary/secondary CTAs. Right: a connected
 * product-engineering ecosystem (animated SVG hub-and-spoke) with floating
 * panels, an auto-rotating "capability spotlight" that cycles through the
 * engineering capabilities, and a clearly-distinguished AcquisitionOS panel.
 *
 * Visual: deep-navy foundation with a SINGLE restrained electric-blue accent
 * (was sky+cyan+indigo multi-blue). Reduced-motion disables travel/float/rotate.
 * Every panel is illustrative — never presented as live customer data.
 */
type Node = { id: string; label: string; icon: LucideIcon; x: number; y: number };

const nodes: Node[] = [
  { id: "ai", label: "AI / LLM Ops", icon: Brain, x: 78, y: 70 },
  { id: "cloud", label: "Cloud Platform", icon: Cloud, x: 300, y: 44 },
  { id: "devops", label: "DevOps & CI/CD", icon: GitBranch, x: 430, y: 150 },
  { id: "saas", label: "SaaS Products", icon: Boxes, x: 360, y: 270 },
  { id: "data", label: "Data & Retrieval", icon: Database, x: 120, y: 250 },
  { id: "api", label: "APIs & Integrations", icon: Plug, x: 250, y: 168 },
];

const hub = { x: 245, y: 162 };

const pathFor = (n: Node) => {
  const mx = (hub.x + n.x) / 2;
  const my = (hub.y + n.y) / 2 - 26;
  return `M ${hub.x} ${hub.y} Q ${mx} ${my} ${n.x} ${n.y}`;
};

/** Auto-rotating capability spotlight — cycles through engineering capabilities. */
const capabilities = [
  { icon: Brain, label: "AI / LLM Orchestration", detail: "RAG, agents & evaluation grounded in your data." },
  { icon: Cloud, label: "Cloud-Native Platforms", detail: "Multi-region infra engineered for reliability & cost." },
  { icon: GitBranch, label: "DevOps & Deployment", detail: "CI/CD with rollback — deploys that are routine." },
  { icon: BarChart3, label: "Data Pipelines & Analytics", detail: "Raw signals → defensible, decision-ready metrics." },
  { icon: Code2, label: "SaaS / Product Engineering", detail: "Architecture → MVP → scaled, operable platform." },
  { icon: Plug, label: "API & System Integration", detail: "Webhooks, queues, CRM & productivity glue." },
];

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
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setActive((i) => (i + 1) % capabilities.length), 2600);
    return () => clearInterval(t);
  }, [reduce]);

  const cap = capabilities[active];

  return (
    <section className="relative isolate overflow-hidden bg-[#070b1a] text-white">
      {/* Deep-navy foundation + a single restrained electric-blue accent glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070b1a] via-[#0b1226] to-[#070b1a]" />
      <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-[130px]" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-blue-400/10 blur-[130px]" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:py-28 md:grid-cols-[1.05fr_1fr] md:px-6 lg:py-32">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-xl">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-200"
          >
            <Sparkles className="h-3.5 w-3.5" /> Paragonel Technologies · Product Engineering &amp; AI
          </motion.span>
          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            We Engineer Digital Products That{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              Move Businesses Forward.
            </span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
            Paragonel Technologies designs and engineers AI-powered systems, scalable software products and
            cloud-native platforms that solve practical business problems. From architecture and development to
            automation and deployment, we turn complex requirements into working technology.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-md bg-blue-600 px-7 text-base font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25">
              <Link href="/services">
                Explore Our Capabilities <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-md border-white/20 bg-white/5 px-7 text-base font-bold text-white backdrop-blur hover:bg-white/10"
            >
              <Link href="/our-product/acquisitionos">Discover AcquisitionOS</Link>
            </Button>
          </motion.div>
          <motion.p variants={item} className="mt-6 text-xs text-slate-400">
            Shaping the Future · AcquisitionOS in <span className="font-bold text-blue-300">Private Beta</span>
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
              {nodes.map((n, i) => (
                <motion.path
                  key={n.id}
                  d={pathFor(n)}
                  fill="none"
                  stroke="url(#wire)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.12, ease: "easeInOut" }}
                />
              ))}
              {!reduce &&
                nodes.map((n) => (
                  <motion.circle
                    key={`p-${n.id}`}
                    r={2.6}
                    fill="#60a5fa"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                    style={{ offsetPath: `path("${pathFor(n)}")` }}
                  />
                ))}
              <defs>
                <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
            </svg>

            {/* hub */}
            <Floating delay={0.2} x="46%" y="50%" reduce={reduce}>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-blue-400/40 bg-white/10 px-4 py-3 backdrop-blur-md shadow-xl shadow-blue-500/20">
                <Cpu className="h-6 w-6 text-blue-300" />
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
                <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-[#0b1226]/85 px-2.5 py-2 backdrop-blur shadow-lg">
                  <n.icon className="h-4 w-4 text-blue-300" />
                  <span className="text-[10px] font-bold text-slate-200">{n.label}</span>
                </div>
              </Floating>
            ))}

            {/* Auto-rotating capability spotlight (top-left) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute left-0 top-2 w-[200px] rounded-xl border border-white/15 bg-[#0b1226]/90 p-3 shadow-xl backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-300">Capability</span>
                <span className="text-[9px] text-slate-500">{active + 1}/{capabilities.length}</span>
              </div>
              <div className="mt-2 h-[52px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <cap.icon className="h-3.5 w-3.5 text-blue-300" />
                      <span className="text-[11px] font-bold text-white">{cap.label}</span>
                    </div>
                    <p className="text-[9px] leading-snug text-slate-400">{cap.detail}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Distinct AcquisitionOS floating panel (bottom-center) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="absolute -bottom-2 left-1/2 w-[230px] -translate-x-1/2 rounded-xl border border-blue-400/45 bg-gradient-to-br from-[#0c1a3f]/95 to-[#0a1226]/95 p-3 shadow-2xl shadow-blue-500/25 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Workflow className="h-3.5 w-3.5 text-blue-300" />
                  <span className="text-[11px] font-black tracking-tight text-white">AcquisitionOS</span>
                </div>
                <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-300">
                  Beta
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <div className="h-1 flex-1 rounded-full bg-white/15">
                      <motion.div
                        className="h-full rounded-full bg-blue-400"
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
