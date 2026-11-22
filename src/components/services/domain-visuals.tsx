'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactElement } from 'react';
import { Database, Cpu, Terminal, Activity, RefreshCw, Layers, Boxes, MousePointerClick, Network, ShieldCheck, Gauge, CircuitBoard, FlaskConical, Workflow, Repeat, ScanLine, Radio, Waypoints } from 'lucide-react';
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

// ── 05E expansion visuals (six new domain shapes) ───────────────────────

function NetworkGraph() {
  const nodes = [
    { icon: Database, label: 'System A' },
    { icon: Boxes, label: 'System B' },
    { icon: Cpu, label: 'System C' },
    { icon: Waypoints, label: 'Middleware' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {nodes.map((n) => (
          <div key={n.label} className="flex items-center gap-2 border border-border bg-background p-3">
            <n.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{n.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3 text-muted-foreground">
        <Network className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">Typed contracts · event-driven · observed end-to-end</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Connected nodes — the stack behaves as one system.</p>
    </div>
  );
}

function AutomationLoop() {
  const phases = [
    { icon: Radio, label: 'Trigger' },
    { icon: ScanLine, label: 'Check' },
    { icon: Workflow, label: 'Act' },
    { icon: Repeat, label: 'Review' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {phases.map((p, i) => (
          <div key={p.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
              <p.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[0.65rem] font-medium text-foreground">{p.label}</span>
            {i < phases.length - 1 && <span className="hidden">→</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3 text-muted-foreground">
        <RefreshCw className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">Human checkpoint on consequential actions</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">A loop with a review gate — not a brittle bot.</p>
    </div>
  );
}

function DefenceShield() {
  const layers = [
    { n: 'D1', label: 'Access control (authz-as-code)', tone: 'bg-background' },
    { n: 'D2', label: 'Supply-chain / SBOM posture', tone: 'bg-secondary/40' },
    { n: 'D3', label: 'Secrets & CI/CD posture', tone: 'bg-background' },
    { n: 'D4', label: 'Monitoring & response', tone: 'bg-secondary/40' },
  ];
  return (
    <div className="space-y-2">
      {layers.map((l) => (
        <div key={l.n} className={`flex items-center gap-3 border border-border ${l.tone} px-3 py-2.5`}>
          <span className="pt-index text-[0.6rem]">{l.n}</span>
          <span className="text-xs font-medium text-foreground">{l.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-border pt-3 text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">OWASP 2025 · least privilege by construction</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Defence in depth — security engineered, not audited once.</p>
    </div>
  );
}

function QualityGauge() {
  const rows = [
    { icon: Gauge, label: 'SLOs + error budgets' },
    { icon: ScanLine, label: 'Regression on every change' },
    { icon: ShieldCheck, label: 'Quality gates in CI' },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 border-t border-border pt-3">
          <r.icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">{r.label}</span>
        </div>
      ))}
      <div className="mt-3 flex items-center gap-2 text-muted-foreground">
        <Gauge className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">Measurable, not aspirational</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Quality by construction — caught cheaply, early.</p>
    </div>
  );
}

function EdgeTier() {
  const tiers = [
    { n: 'T1', label: 'Devices / sensors', tone: 'bg-background' },
    { n: 'T2', label: 'Edge compute', tone: 'bg-secondary/40' },
    { n: 'T3', label: 'Cloud / platform', tone: 'bg-background' },
  ];
  return (
    <div className="space-y-2">
      {tiers.map((t) => (
        <div key={t.n} className={`flex items-center gap-3 border border-border ${t.tone} px-3 py-2.5`}>
          <span className="pt-index text-[0.6rem]">{t.n}</span>
          <CircuitBoard className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">{t.label}</span>
        </div>
      ))}
      <div className="mt-3 flex items-center gap-2 text-muted-foreground">
        <Radio className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">Research stage — hardware partnership required</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Device → edge → cloud — exploratory, not delivered yet.</p>
    </div>
  );
}

function ResearchLab() {
  const steps = [
    { icon: FlaskConical, label: 'Research' },
    { icon: ScanLine, label: 'Validate' },
    { icon: Boxes, label: 'Prototype' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s) => (
          <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border bg-background">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[0.65rem] font-medium text-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3 text-muted-foreground">
        <FlaskConical className="h-4 w-4 text-primary" />
        <span className="text-[0.7rem]">Applied research — separated from delivery</span>
      </div>
      <p className="mt-2 text-[0.7rem] text-muted-foreground">Research → validate → prototype. Not a live service.</p>
    </div>
  );
}

const MAP: Record<CompositionVariant, () => ReactElement> = {
  process: ProcessFlow,
  system: SystemLoop,
  architecture: ArchitectureStack,
  pipeline: PipelineFlow,
  interface: InterfaceTiers,
  network: NetworkGraph,
  loop: AutomationLoop,
  shield: DefenceShield,
  gauge: QualityGauge,
  edge: EdgeTier,
  lab: ResearchLab,
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
