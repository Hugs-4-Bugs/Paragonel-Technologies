'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactElement } from 'react';
import { Database, Cpu, Terminal, Activity, RefreshCw, Layers, Boxes, MousePointerClick } from 'lucide-react';
import { RevealGroup, RevealItem } from '@/components/motion/reveal';
import type { CompositionVariant } from '@/lib/services-catalogue';

/**
 * Domain visuals — five DISTINCT compositions, one per engineering domain.
 *
 * These are CONCEPTUAL illustrations of the engineering shape of each domain
 * (not product screenshots). Each is clearly labelled "Conceptual — not a
 * product screenshot" so nothing here is mistaken for evidence of a shipped
 * Paragonel product.
 *
 * Variety is deliberate: a process flow, a feedback loop, a layered stack, a
 * left→right pipeline, and nested tiers — so the five domains do NOT look like
 * five copies of the same card.
 */

const NOTE = 'Conceptual — not a product screenshot.';

function ProcessFlow() {
  const steps = [
    { n: '01', label: 'Architecture', icon: Layers },
    { n: '02', label: 'Build', icon: Boxes },
    { n: '03', label: 'Ship', icon: Terminal },
    { n: '04', label: 'Operate', icon: Activity },
  ];
  return (
    <div>
      <RevealGroup stagger={0.12} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {steps.map((s) => (
          <RevealItem key={s.n} variant="scale">
            <div className="border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="pt-index text-xs">{s.n}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{s.label}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
      <div className="mt-3 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
        <span className="pt-index">FLOW</span>
        <span>Architecture → Build → Ship → Operate → improve.</span>
      </div>
    </div>
  );
}

function SystemLoop() {
  const ring = ['Ingest', 'Retrieve', 'Infer', 'Act', 'Observe'];
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
        {ring.map((r, i) => (
          <div key={r} className="flex items-center gap-2">
            <div className="border border-border bg-background px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{r}</span>
            </div>
            {i < ring.length - 1 && <span className="text-primary">→</span>}
          </div>
        ))}
        <span className="text-primary">↺</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Database, label: 'Grounded in your data' },
          { icon: Cpu, label: 'Model + tool-use' },
          { icon: RefreshCw, label: 'Human-in-the-loop' },
        ].map((x) => (
          <div key={x.label} className="border-t border-border pt-2">
            <x.icon className="h-4 w-4 text-primary" />
            <p className="mt-1 text-xs text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureStack() {
  const layers = [
    { n: 'L4', label: 'Observability · SLOs', tone: 'bg-background' },
    { n: 'L3', label: 'Application services', tone: 'bg-secondary/40' },
    { n: 'L2', label: 'Data + storage', tone: 'bg-background' },
    { n: 'L1', label: 'Network · IAM · compute', tone: 'bg-secondary/40' },
    { n: 'L0', label: 'IaC · CI/CD · platform', tone: 'bg-background' },
  ];
  return (
    <div className="space-y-1">
      {layers.map((l) => (
        <div key={l.n} className={`flex items-center justify-between border border-border px-4 py-2.5 ${l.tone}`}>
          <span className="pt-index text-xs">{l.n}</span>
          <span className="text-sm font-medium text-foreground">{l.label}</span>
        </div>
      ))}
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Layered — each tier ownable + replaceable independently.</p>
    </div>
  );
}

function PipelineFlow() {
  const stages = [
    { icon: Database, label: 'Sources' },
    { icon: Layers, label: 'Ingest' },
    { icon: Boxes, label: 'Warehouse' },
    { icon: Cpu, label: 'Model' },
    { icon: Activity, label: 'Surface' },
  ];
  return (
    <div>
      <div className="flex items-center gap-0">
        {stages.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2 px-2">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-[0.7rem] font-medium text-foreground">{s.label}</span>
            </div>
            {i < stages.length - 1 && <div className="h-[2px] flex-1 bg-border" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[0.7rem] text-muted-foreground">Left → right, with lineage + quality gates at each hop.</p>
    </div>
  );
}

function InterfaceTiers() {
  const tiers = [
    { n: '01', label: 'Design system + tokens', icon: Layers },
    { n: '02', label: 'Components', icon: Boxes },
    { n: '03', label: 'Interaction + motion', icon: MousePointerClick },
    { n: '04', label: 'Surface', icon: Activity },
  ];
  return (
    <div className="space-y-1">
      {tiers.map((t) => (
        <div key={t.n} className="flex items-center gap-3 border border-border bg-background px-4 py-2.5" style={{ marginLeft: `${Number(t.n) * 4}px` }}>
          <t.icon className="h-4 w-4 text-primary" />
          <span className="pt-index text-xs">{t.n}</span>
          <span className="text-sm font-medium text-foreground">{t.label}</span>
        </div>
      ))}
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Nested tiers — the surface is built on a real system underneath.</p>
    </div>
  );
}

const MAP: Record<CompositionVariant, () => ReactElement> = {
  process: ProcessFlow,
  system: SystemLoop,
  architecture: ArchitectureStack,
  pipeline: PipelineFlow,
  interface: InterfaceTiers,
};

export function DomainVisual({ variant }: { variant: CompositionVariant }) {
  const reduce = useReducedMotion();
  const Comp = MAP[variant];
  return (
    <figure className="pt-surface rounded-[var(--pt-radius-md)] p-5 md:p-6">
      <figcaption className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <span className="pt-index">DOMAIN SHAPE</span>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{NOTE}</span>
      </figcaption>
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <Comp />
      </motion.div>
    </figure>
  );
}
