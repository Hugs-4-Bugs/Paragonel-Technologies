"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Code2, Cloud, Database, GitBranch, Boxes, Brain, Plug, Layers, Container, Workflow, Cpu, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Infinite horizontal marquee of technology / application labels.
 * The visual track is duplicated once for a seamless loop (this is a visual
 * duplication of the TRACK, not of testimonials or content records).
 * Reduced-motion: renders a static wrapped row.
 */
type Tech = { name: string; icon: LucideIcon };

const groups: { label: string; items: Tech[] }[] = [
  {
    label: "Languages",
    items: [
      { name: "Java", icon: Code2 },
      { name: "Python", icon: Terminal },
      { name: "TypeScript", icon: Code2 },
      { name: "JavaScript", icon: Code2 },
    ],
  },
  {
    label: "Web & App",
    items: [
      { name: "Next.js", icon: Layers },
      { name: "React", icon: Boxes },
      { name: "Node.js", icon: Workflow },
      { name: "Spring Boot", icon: Cpu },
      { name: "Flutter", icon: Boxes },
    ],
  },
  {
    label: "Cloud & DevOps",
    items: [
      { name: "AWS", icon: Cloud },
      { name: "GCP", icon: Cloud },
      { name: "Kubernetes", icon: Container },
      { name: "Docker", icon: Container },
      { name: "Terraform", icon: Layers },
      { name: "GitHub Actions", icon: GitBranch },
    ],
  },
  {
    label: "Data & AI",
    items: [
      { name: "PostgreSQL", icon: Database },
      { name: "Firebase", icon: Database },
      { name: "Vector DB", icon: Database },
      { name: "Genkit", icon: Brain },
      { name: "OpenAI", icon: Brain },
      { name: "Anthropic", icon: Brain },
      { name: "Google AI", icon: Brain },
    ],
  },
  {
    label: "APIs & Integration",
    items: [
      { name: "REST", icon: Plug },
      { name: "GraphQL", icon: Plug },
      { name: "Webhooks", icon: Plug },
    ],
  },
];

const flat: Tech[] = groups.flatMap((g) => g.items);

export function TechMarquee() {
  const reduce = useReducedMotion();
  const track = [...flat, ...flat]; // duplicate track for seamless loop
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#070b1a] py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#070b1a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#070b1a] to-transparent" />
      <div className="mx-auto mb-6 max-w-7xl px-4 text-center md:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-300/80">
          Technology familiarity — not a claim that each is a separately delivered service
        </p>
      </div>
      {reduce ? (
        <div className="flex flex-wrap justify-center gap-3 px-4">
          {flat.map((t) => (
            <Chip key={t.name} t={t} />
          ))}
        </div>
      ) : (
        <motion.div className="flex w-max gap-4" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
          {track.map((t, i) => (
            <Chip key={`${t.name}-${i}`} t={t} />
          ))}
        </motion.div>
      )}
    </section>
  );
}

function Chip({ t }: { t: Tech }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
      <t.icon className="h-4 w-4 text-sky-300" />
      <span className="text-sm font-bold text-slate-200">{t.name}</span>
    </div>
  );
}
