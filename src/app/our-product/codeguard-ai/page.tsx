import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import {
  ArrowLeft, ArrowRight, Code2, FileCode2, ScanSearch, DollarSign, AlertTriangle,
  Lightbulb, ShieldCheck, CircleDot, Store,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'CodeGuard AI — VS Code Extension for AWS Terraform Cost Awareness | Paragonel',
  description:
    'CodeGuard AI is a VS Code extension that identifies potentially expensive AWS infrastructure choices in Terraform — NAT Gateway, provisioned DynamoDB, Lambda memory, large EC2 instances — and gives developers cost awareness before infrastructure is deployed.',
  alternates: { canonical: '/our-product/codeguard-ai' },
  openGraph: {
    title: 'CodeGuard AI — VS Code Extension for AWS Terraform Cost Awareness | Paragonel',
    description:
      'A VS Code extension that flags potentially expensive AWS infrastructure choices in Terraform before deployment. Published on the VS Code Marketplace.',
    type: 'website',
    url: '/our-product/codeguard-ai',
  },
};

const PROBLEM = [
  {
    n: '01',
    t: 'Cost is invisible while you write infrastructure',
    d: 'A developer writing Terraform sees resources, not dollars. The cost implication of a chosen instance family or a provisioned capacity setting is not obvious at the moment the line is written.',
  },
  {
    n: '02',
    t: 'The bill is the first feedback loop',
    d: 'Without in-editor cost awareness, the first time a team learns that a resource was over-provisioned is usually the monthly invoice — after the spend has already happened.',
  },
  {
    n: '03',
    t: 'Cheaper alternatives are not surfaced',
    d: 'Even when a cheaper option exists (a different instance family, on-demand vs provisioned capacity, a smaller memory setting), it is not put in front of the developer at the point of decision.',
  },
];

const WORKFLOW = [
  { icon: FileCode2, t: 'Write Terraform', d: 'The developer authors Terraform (or CloudFormation) infrastructure-as-code in VS Code as normal.' },
  { icon: ScanSearch, t: 'Static analysis', d: 'CodeGuard AI analyses the resources as they are written, without deploying anything.' },
  { icon: DollarSign, t: 'Cost signal', d: 'Potentially expensive AWS configuration choices are identified and surfaced in the editor.' },
  { icon: AlertTriangle, t: 'Act earlier', d: 'The developer sees cost-awareness signals before the infrastructure is deployed, and can choose a cheaper alternative.' },
];

/**
 * Cost-awareness checks CodeGuard AI is designed to surface. Per Prompt 05K §5.4
 * the exact detection coverage of the published extension should be verified
 * against the live build; these are the AWS configuration patterns the tool
 * targets, framed honestly as designed checks.
 */
const CHECKS = [
  { t: 'NAT Gateway', d: 'NAT Gateway usage that can become a significant cost centre for high-traffic workloads, flagged for review.' },
  { t: 'Provisioned DynamoDB', d: 'Provisioned capacity DynamoDB tables where on-demand billing may be more cost-effective for the workload.' },
  { t: 'Lambda memory', d: 'AWS Lambda functions configured with high memory, where the memory setting drives both performance and per-invocation cost.' },
  { t: 'Large EC2 instances', d: 'Large or over-provisioned EC2 instance families, where a smaller or different family may serve the workload at lower cost.' },
];

const PRINCIPLES = [
  { icon: CircleDot, t: 'Cost awareness, not a bill', d: 'The extension surfaces potentially expensive choices for developer review — it is a cost-awareness signal, not a precise invoice.' },
  { icon: ShieldCheck, t: 'Static analysis only', d: 'Analysis runs against the infrastructure-as-code you author in the editor. Nothing is deployed to surface a signal.' },
  { icon: Lightbulb, t: 'Cheaper alternatives, where they exist', d: 'Where a cheaper configuration option is relevant, it is put in front of the developer at the point of decision.' },
];

const AVAILABILITY = [
  'CodeGuard AI is a VS Code extension, published on the VS Code Marketplace. The exact Marketplace listing URL is not published here: the previously-cached URL did not resolve when re-checked, and no verified listing URL is used until one is confirmed.',
  'The extension targets AWS infrastructure choices in Terraform. Coverage of every AWS service or IaC format is not claimed; the checks above are the cost-awareness patterns the tool is designed to surface.',
  'Adoption, download counts, revenue, or customer cost-savings figures are not claimed without a measured or approved source.',
];

export default function CodeGuardAIPage() {
  return (
    <div className="bg-background">
      {/* 1. Hero — positioning + published-tool label */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">CodeGuard AI · Published · VS Code Extension</span>
            <h1 className="pt-display mt-6 text-foreground">
              See the cost of your<br />Terraform before you deploy.
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              CodeGuard AI is a VS Code extension that identifies potentially expensive AWS infrastructure
              choices in Terraform — including NAT Gateway, provisioned DynamoDB, Lambda memory, and large
              EC2 instances — and gives developers cost awareness before infrastructure is deployed.
              Published on the VS Code Marketplace.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Talk to the team <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/our-product" className="pt-btn pt-btn-ghost">
                <ArrowLeft className="h-4 w-4" /> All products
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
            <h2 className="pt-h1 mt-6 text-foreground">Infrastructure cost is discovered in the invoice.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Developers authoring infrastructure-as-code rarely see the cost of a decision at the moment
              they make it. CodeGuard AI moves that signal into the editor, where the decision is actually
              being made.
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

      {/* 3. How it works — in-editor flow (diagram, not a screenshot) */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">How it works</span>
            <h2 className="pt-h1 mt-6 text-foreground">Cost awareness inside the editor.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              No verified screenshot of the extension is published here. The flow below describes the
              in-editor loop CodeGuard AI runs; it is an honest description of the tool, not a render of
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

      {/* 4. Supported checks */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Designed checks</span>
            <h2 className="pt-h1 mt-6 text-foreground">AWS cost patterns the extension targets.</h2>
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
              The exact detection coverage of the published extension should be verified against the live
              build. These are the AWS configuration patterns the tool is designed to surface for developer
              review.
            </p>
          </Reveal>
          <RevealGroup stagger={0.07} className="mt-10 grid gap-4 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <RevealItem key={c.t}>
                <div className="h-full rounded-lg border border-border bg-background p-5 flex gap-4">
                  <Code2 className="h-6 w-6 text-primary neon-icon shrink-0 mt-0.5" aria-hidden="true" />
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

      {/* 5. Principles */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Principles</span>
            <h2 className="pt-h1 mt-6 text-foreground">How the tool is positioned.</h2>
          </Reveal>
          <RevealGroup stagger={0.07} className="mt-10 grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <RevealItem key={p.t}>
                <div className="h-full rounded-lg border border-border bg-background p-5">
                  <p.icon className="h-6 w-6 text-primary neon-icon mb-3" aria-hidden="true" />
                  <div className="font-semibold text-foreground mb-1">{p.t}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 6. Availability + limitations — honest, no fake Marketplace URL */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell max-w-3xl">
          <Reveal>
            <span className="pt-eyebrow">Availability &amp; limitations</span>
            <h2 className="pt-h1 mt-6 text-foreground">Published, stated plainly.</h2>
            <ul className="mt-8 space-y-5">
              {AVAILABILITY.map((a) => (
                <li key={a} className="flex gap-3 text-muted-foreground leading-relaxed">
                  <Store className="h-5 w-5 text-primary shrink-0 mt-0.5 neon-icon" aria-hidden="true" />
                  <span>{a}</span>
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
            <h2 className="pt-h1 text-foreground">Want cost-aware engineering in your toolchain?</h2>
            <p className="pt-lead mt-6 max-w-2xl mx-auto">
              CodeGuard AI is one of the tools Paragonel ships to make cost a first-class engineering
              concern. If you want a team that builds with cost awareness built in, talk to us.
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
