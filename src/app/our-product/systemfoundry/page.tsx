import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import {
  ArrowLeft, Cpu, Gauge, ShieldAlert, DollarSign, Layers, FlaskConical, Boxes, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SystemFoundry — Internal Infrastructure Simulator | Paragonel',
  description:
    'SystemFoundry is an internal cloud architecture and infrastructure simulation tool Paragonel uses for its own engineering scenarios — drag-and-drop component modelling, projected cost, load and risk signals before Terraform is written. Honestly labelled an internal tool, not a commercial product.',
  alternates: { canonical: '/our-product/systemfoundry' },
  openGraph: {
    title: 'SystemFoundry — Internal Infrastructure Simulator | Paragonel',
    description:
      'An internal cloud architecture simulator Paragonel uses to model infrastructure cost, load and risk before deployment. Internal tool — not a commercial product.',
    type: 'website',
    url: '/our-product/systemfoundry',
  },
};

const PROBLEM = [
  {
    n: '01',
    t: 'Architectural mistakes are expensive',
    d: 'A wrong instance family, a missing reserved capacity commitment, or a mis-placed NAT gateway can quietly compound into a large monthly bill or a reliability incident that is discovered only in production.',
  },
  {
    n: '02',
    t: 'Testing infrastructure means deploying it',
    d: 'Validating a cloud design typically requires provisioning real resources, so teams either pay to validate every sketch or skip validation and discover the cost in the invoice.',
  },
  {
    n: '03',
    t: 'Cost, load and risk live in separate heads',
    d: 'The person who knows the price, the person who knows the failure modes, and the person who knows the traffic pattern are rarely the same person — and rarely in the same document.',
  },
];

const WORKFLOW = [
  { icon: Boxes, t: 'Compose', d: 'Drag infrastructure components onto a canvas and connect them into a target architecture.' },
  { icon: Cpu, t: 'Simulate', d: 'The engine runs the design against a modelled load profile without deploying anything.' },
  { icon: Gauge, t: 'Project', d: 'Projected monthly cost and throughput are calculated per component and for the whole system.' },
  { icon: ShieldAlert, t: 'Flag', d: 'Potential bottlenecks and risk patterns are surfaced before a single line of Terraform is written.' },
];

const CAPABILITIES = [
  { icon: Layers, t: 'Component library', d: 'A drag-and-drop palette of cloud infrastructure components used to assemble candidate architectures.' },
  { icon: Cpu, t: 'Load simulation', d: 'A modelled load profile run against the composed design to estimate behaviour under traffic.' },
  { icon: DollarSign, t: 'Cost projection', d: 'Projected monthly cost computed per resource and aggregated for the full system.' },
  { icon: ShieldAlert, t: 'Risk + bottleneck detection', d: 'Patterns that commonly lead to cost overruns or reliability failures are flagged for review.' },
];

const STACK = ['React', 'D3.js', 'Firebase', 'Serverless'];

const LIMITATIONS = [
  'Internal tool — used by Paragonel for its own cloud engineering work. Not a commercial product, not externally available, and not a customer deployment.',
  'A simulation is a model, not a guarantee. Projected cost and load are estimates that must still be validated against real cloud behaviour before production deployment.',
  'The component library and risk patterns reflect the infrastructure Paragonel actually works with; coverage of every cloud service is not claimed.',
];

export default function SystemFoundryPage() {
  return (
    <div className="bg-background">
      {/* 1. Hero — positioning + honest internal-tool label */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">SystemFoundry · Internal Tool</span>
            <h1 className="pt-display mt-6 text-foreground">
              Simulate cloud architecture<br />before you pay for it.
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              SystemFoundry is an internal cloud architecture and infrastructure simulation tool Paragonel
              uses for its own engineering scenarios. It models projected cost, load and risk against a
              candidate design before any Terraform is written. It is honestly labelled an internal tool —
              not a commercial product and not a customer deployment.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/our-product" className="pt-btn pt-btn-ghost">
                <ArrowLeft className="h-4 w-4" /> All products
              </Link>
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Talk to the team <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. The problem */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">The problem</span>
            <h2 className="pt-h1 mt-6 text-foreground">Cloud designs are validated in production — or in the invoice.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              The cost of a wrong infrastructure decision is usually discovered late. SystemFoundry exists
              to move that discovery earlier, into a model an engineer can reason about before committing
              resources.
            </p>
          </Reveal>
          <RevealGroup stagger={0.06} className="mt-12">
            {PROBLEM.map((p) => (
              <RevealItem key={p.n}>
                <div className="grid grid-cols-[auto_1fr] gap-5 border-t border-border py-6 md:grid-cols-[auto_1fr_2fr]">
                  <span className="pt-mono text-sm text-muted-foreground">{p.n}</span>
                  <div className="font-semibold text-foreground">{p.t}</div>
                  <p className="text-muted-foreground leading-relaxed">{p.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 3. How it works — simulation workflow (diagram, not a screenshot) */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">How it works</span>
            <h2 className="pt-h1 mt-6 text-foreground">Compose, simulate, project, flag.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              No verified product screenshot is published here. The workflow below describes the simulation
              loop SystemFoundry runs internally; it is an honest description of the tool, not a render of
              the live UI.
            </p>
          </Reveal>
          <RevealGroup stagger={0.08} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w, i) => (
              <RevealItem key={w.t}>
                <div className="h-full rounded-lg border border-border bg-background p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="pt-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <w.icon className="h-5 w-5 text-primary neon-icon" aria-hidden="true" />
                  </div>
                  <div className="font-semibold text-foreground mb-2">{w.t}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 4. Capabilities */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Capabilities</span>
            <h2 className="pt-h1 mt-6 text-foreground">What the simulator does today.</h2>
          </Reveal>
          <RevealGroup stagger={0.07} className="mt-12 grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <RevealItem key={c.t}>
                <div className="h-full rounded-lg border border-border bg-background p-5 flex gap-4">
                  <c.icon className="h-6 w-6 text-primary neon-icon shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">{c.t}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 5. Technology stack — accurate, not cluttered */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Technology</span>
            <h2 className="pt-h1 mt-6 text-foreground">Built with</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {STACK.map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/40 border border-border px-3 py-1.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. Maturity + limitations — honest internal-tool labelling */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell max-w-3xl">
          <Reveal>
            <span className="pt-eyebrow">Maturity &amp; limitations</span>
            <h2 className="pt-h1 mt-6 text-foreground">An internal tool, stated plainly.</h2>
            <ul className="mt-8 space-y-5">
              {LIMITATIONS.map((l) => (
                <li key={l} className="flex gap-3 text-muted-foreground leading-relaxed">
                  <FlaskConical className="h-5 w-5 text-primary shrink-0 mt-0.5 neon-icon" aria-hidden="true" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 7. CTA */}
      <section className="pt-section">
        <div className="pt-shell text-center">
          <Reveal>
            <h2 className="pt-h1 text-foreground">Want engineering that reasons before it builds?</h2>
            <p className="pt-lead mt-6 max-w-2xl mx-auto">
              SystemFoundry is one of the ways Paragonel validates its own platform decisions. If you want a
              team that models cost and risk before it commits infrastructure, talk to us.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/our-product" className="pt-btn pt-btn-ghost">
                <ArrowLeft className="h-4 w-4" /> All products
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
