import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { LifecycleWorkflow } from '@/components/product/lifecycle-workflow';
import {
  ArrowRight, ExternalLink, ShieldCheck, CircleDot, KeyRound, Lock,
  Cpu, Rocket, Lightbulb, Gauge, Building2, Users, Briefcase,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AcquisitionOS — AI-Native Client Acquisition Platform (Private Beta) | Paragonel',
  description:
    'AcquisitionOS is Paragonel\'s AI-native client acquisition operating system, currently in private beta. It unifies prospect discovery, research, opportunity reporting, scoring, outreach, pipeline, and proposals into one connected workflow.',
  alternates: { canonical: '/our-product/acquisitionos' },
  openGraph: {
    title: 'AcquisitionOS — AI-Native Client Acquisition Platform (Private Beta) | Paragonel',
    description:
      'AcquisitionOS is Paragonel\'s AI-native client acquisition operating system, currently in private beta. One connected workflow from prospect discovery to deal closure.',
    type: 'website',
  },
};

/**
 * The canonical AcquisitionOS product domain (Batch 4 Task 2). acquisitionos.net
 * is the INTENDED canonical product domain — NOT redirected to the temporary
 * beta Vercel URL. The current deployment lives at acquisitionosbeta.vercel.app
 * (the temporary deployment host); acquisitionos.net DNS must be pointed at that
 * Vercel deployment by the founder (see docs/DOMAINS.md). The visitor never sees
 * this raw URL as visible text — it lives behind CTA buttons/links with a
 * meaningful label.
 */
const PRODUCT_DOMAIN = 'https://acquisitionos.net';

const PROBLEMS = [
  { n: '01', t: 'Fragmented prospect research', d: 'Context rebuilt across browser tabs, spreadsheets and notes — never in one place, never current.' },
  { n: '02', t: 'Disconnected acquisition tools', d: 'A prospect finder, an enricher, a sequencer, a reply tracker, a CRM and a spreadsheet that do not talk to each other.' },
  { n: '03', t: 'Manual opportunity identification', d: 'A salesperson reads and reasons over everything by hand to decide whether an outreach is even worth sending.' },
  { n: '04', t: 'Generic outreach', d: 'Mail-merge variables instead of messages grounded in what was actually learned about the prospect.' },
  { n: '05', t: 'Inconsistent follow-ups', d: 'Sequences that lose the thread and start over, instead of carrying the conversation forward.' },
  { n: '06', t: 'Weak visibility into pipeline progress', d: 'The motion split across tools, so no one can see where opportunities actually stand.' },
];

const PRINCIPLES = [
  { icon: CircleDot, t: 'AI-assisted, not AI-autonomous', d: 'AI surfaces signals, drafts and suggested scores. A human decides and acts. AcquisitionOS is explicit that its output is assistance, not prediction.' },
  { icon: ShieldCheck, t: 'No invented data', d: 'The anti-hallucination stance: missing information stays missing rather than being fabricated. The system surfaces a gap instead of filling it with a guess.' },
  { icon: KeyRound, t: 'User-owned AI keys', d: 'You bring your own LLM provider keys (OpenAI, Anthropic, Google AI). Your prompts are not silently routed through a third party you did not choose.' },
];

const AUDIENCES = [
  { icon: Building2, t: 'Businesses', d: 'Teams that acquire clients as part of growth and want one connected motion instead of a stitched-together stack that loses context at every handoff.' },
  { icon: Users, t: 'Agencies', d: 'Service businesses running outbound for multiple clients, where prospect context is rebuilt per account and per campaign instead of carried forward.' },
  { icon: Rocket, t: 'Founders', d: 'Operators doing sales themselves early on, who need the research-to-pipeline work to happen without standing up a dedicated sales ops team.' },
  { icon: Lightbulb, t: 'Consultants', d: 'Independent practitioners who qualify, score, and personalize outreach as part of engagements, and need the reasoning behind each step to be defensible.' },
  { icon: Briefcase, t: 'B2B sales teams', d: 'Sales teams that want prospect discovery, scoring, outreach, and pipeline in one workflow — with a human kept in control at every decision stage.' },
];

const INTEGRATIONS = [
  { name: 'Email', status: 'BUILDING', note: 'Primary outreach channel.' },
  { name: 'WhatsApp', status: 'BUILDING', note: 'Outreach channel.' },
  { name: 'LinkedIn', status: 'BUILDING', note: 'Outreach channel.' },
  { name: 'Instagram', status: 'BUILDING', note: 'Outreach channel.' },
  { name: 'Telegram', status: 'IN MAP', note: 'Present in the integration map.' },
  { name: 'OpenAI (user-provided key)', status: 'AVAILABLE', note: 'Bring your own API key.' },
  { name: 'Google AI (user-provided key)', status: 'AVAILABLE', note: 'Bring your own API key.' },
  { name: 'Anthropic / Claude', status: 'IN DEVELOPMENT', note: 'Deeper integration in progress.' },
  { name: 'MCP server', status: 'IN DEVELOPMENT', note: 'So external AI assistants can call AcquisitionOS.' },
  { name: 'Google Calendar', status: 'COMING SOON', note: 'Meeting scheduling.' },
  { name: 'Cal.com', status: 'PLANNED', note: 'Scheduling alternative.' },
  { name: 'HubSpot', status: 'PLANNED', note: 'CRM connector.' },
  { name: 'Salesforce', status: 'PLANNED', note: 'CRM connector.' },
  { name: 'Stripe', status: 'DECLARED', note: 'Declared available; checkout unverified.' },
  { name: 'Razorpay', status: 'DECLARED', note: 'Declared available; checkout unverified.' },
];

// Status → semantic dot colour. Honest classification only.
const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500',
  DECLARED: 'bg-sky-500',
  'IN DEVELOPMENT': 'bg-amber-500',
  BUILDING: 'bg-amber-500',
  'COMING SOON': 'bg-violet-500',
  PLANNED: 'bg-zinc-400',
  'IN MAP': 'bg-zinc-400',
};

const TRUST = [
  { icon: ShieldCheck, t: 'AI-assisted, not autonomous', d: 'Signals, drafts, and suggested scores — a human decides and acts.' },
  { icon: CircleDot, t: 'No invented data', d: 'Missing information stays missing rather than being fabricated.' },
  { icon: KeyRound, t: 'User-owned AI keys', d: 'You bring your own LLM provider keys. No silent third-party routing.' },
  { icon: Lock, t: 'Private beta, real feedback', d: 'Status is private beta; real use is driving refinement before broader access.' },
];

const SCORE_SAMPLE = [
  { label: 'Strategic fit', val: 82 },
  { label: 'Engagement signal', val: 64 },
  { label: 'Trigger recency', val: 71 },
];

export default function AcquisitionOSPage() {
  return (
    <div className="bg-background">
      {/* 1. Hero — positioning + private-beta CTA */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">AcquisitionOS · Private Beta</span>
            <h1 className="pt-display mt-6 text-foreground">
              The AI-native client acquisition<br />operating system.
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              Paragonel&apos;s flagship product — an AI-powered Client Acquisition Operating System
              developed by Paragonel Technologies Pvt. Ltd. It connects the client-acquisition
              lifecycle — from prospect discovery to deal closure — in one connected workflow.
              Currently in private beta.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer" className="pt-btn pt-btn-primary">
                Request Private Beta Access <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="pt-btn pt-btn-ghost">
                Talk to the team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. The business problem */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">The problem</span>
            <h2 className="pt-h1 mt-6 text-foreground">Outbound acquisition is slow, manual, and fragmented.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Most outbound teams pay an integration tax — a stack of tools that lose context at
              every handoff. The result is a set of recurring, concrete failures AcquisitionOS is
              built to remove.
            </p>
          </Reveal>
          <RevealGroup stagger={0.06} className="mt-12">
            {PROBLEMS.map((p) => (
              <RevealItem key={p.n}>
                <div className="grid grid-cols-[auto_1fr] gap-5 border-t border-border py-6 md:grid-cols-[auto_1fr_2fr]">
                  <span className="pt-index text-xs">{p.n}</span>
                  <h3 className="text-base font-semibold text-foreground">{p.t}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:pl-6">{p.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 3. Positioning — one workflow instead of a stack */}
      <section className="pt-section">
        <div className="pt-shell">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Reveal>
              <span className="pt-eyebrow">What it is</span>
              <h2 className="pt-h1 mt-6 text-foreground">One workflow instead of a stack.</h2>
              <p className="pt-lead mt-6 max-w-xl">
                AcquisitionOS collapses that stack into one AI-native workflow where each stage
                hands verified context to the next. The team&apos;s real knowledge of a prospect
                becomes actionable instead of being rebuilt at every step.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                It is an AI-powered Client Acquisition Operating System — not a bolted-on chatbot,
                and not a prediction engine. The work it does sits inside the acquisition motion,
                and a human stays in control at the decision stages.
              </p>
            </Reveal>
            <RevealGroup stagger={0.08} className="space-y-px bg-border">
              {PRINCIPLES.map((p) => (
                <RevealItem key={p.t}>
                  <div className="bg-background p-6">
                    <div className="flex items-center gap-3">
                      <p.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{p.t}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* 3b. Who it's for — target audience */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Who it&apos;s for</span>
            <h2 className="pt-h1 mt-6 text-foreground">Built for the people who carry the acquisition motion.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              AcquisitionOS is built for the operators who own prospect-to-pipeline work — not for
              a generic audience. The workflow assumes a human reasons over the output at every
              decision stage.
            </p>
          </Reveal>
          <RevealGroup stagger={0.06} className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => (
              <RevealItem key={a.t}>
                <div className="bg-background p-6">
                  <div className="flex items-center gap-3">
                    <a.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{a.t}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 4. The 12-stage lifecycle — premium interactive visual */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">The connected lifecycle</span>
            <h2 className="pt-h1 mt-6 text-foreground">From Discover to Close — 12 connected stages.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Every stage hands its output to the next, so context is never rebuilt and never lost.
              Tap a stage to read what it does, what it takes in, and what it hands forward.
            </p>
          </Reveal>
          <Reveal variant="fade" className="mt-12">
            <LifecycleWorkflow />
          </Reveal>
        </div>
      </section>

      {/* 5. Scoring & personalization — signals, not predictions */}
      <section className="pt-section">
        <div className="pt-shell">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
            <Reveal>
              <span className="pt-eyebrow">Scoring & personalization</span>
              <h2 className="pt-h1 mt-6 text-foreground">Signals, not predictions.</h2>
              <p className="pt-lead mt-6 max-w-xl">
                AcquisitionOS scores each opportunity so a team can decide where to spend its time
                first, and it personalizes outreach from the research and the opportunity report so
                a message is specific rather than generic.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Both are framed honestly: the score is an AI-assisted signal that ranks and
                prioritizes, not a prediction that guarantees an outcome; the personalized message
                is a draft a human reviews and sends. The human stays in control at the decision
                stages.
              </p>
            </Reveal>
            <Reveal variant="fade">
              <figure className="pt-surface rounded-[var(--pt-radius-md)] p-6 md:p-8">
                <figcaption className="mb-5 flex items-center gap-3 border-b border-border pb-3">
                  <Gauge className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Lead score — sample signal</span>
                </figcaption>
                <div className="space-y-5">
                  {SCORE_SAMPLE.map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-foreground">{row.val}</span>
                      </div>
                      <div className="mt-2 h-[3px] w-full bg-border">
                        <div className="h-full bg-primary" style={{ width: `${row.val}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    Illustrative sample. Scores are AI-assisted signals, not predictions of outcome.
                  </p>
                </div>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Integration directory — honest status */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Supported channels & integrations</span>
            <h2 className="pt-h1 mt-6 text-foreground">An honest integration directory.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Every integration carries a status drawn only from verified evidence. Nothing here is
              implied to be live unless its status says so. Checkout on Stripe and Razorpay is
              unverified, so they are marked declared, not live.
            </p>
          </Reveal>
          <Reveal variant="fade" className="mt-10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Integration</th>
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 font-medium text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {INTEGRATIONS.map((it) => (
                    <tr key={it.name} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium text-foreground">{it.name}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[it.status] ?? 'bg-zinc-400'}`} />
                          <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{it.status}</span>
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{it.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Trust & data handling */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Trust & data handling</span>
            <h2 className="pt-h1 mt-6 text-foreground">Bounded by what we can verify.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              We describe how AcquisitionOS handles data at a product level without claiming
              certifications the product does not hold. The beta explicitly disclaims SOC 2,
              ISO 27001, and GDPR-certified status.
            </p>
          </Reveal>
          <RevealGroup stagger={0.07} className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((c) => (
              <RevealItem key={c.t}>
                <div className="bg-background p-6">
                  <c.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal>
            <p className="mt-8 max-w-2xl text-xs text-muted-foreground">
              No SOC 2, ISO 27001, or GDPR certification is claimed. No encryption-residency,
              uptime, or SLA guarantee is offered while the product is in private beta.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8. Roadmap — current vs in-development vs vision */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Roadmap</span>
            <h2 className="pt-h1 mt-6 text-foreground">Where AcquisitionOS is today, and where it is going.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              The distinction between what is being built now and what is aimed toward is visible at
              a glance. Nothing here is presented as an accomplishment.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-3">
            <RoadmapColumn
              icon={Cpu} label="In development"
              items={['Deeper Claude and ChatGPT integrations.', 'An MCP server so external AI assistants can call AcquisitionOS.', 'Google Calendar scheduling (coming soon).']}
            />
            <RoadmapColumn
              icon={Rocket} label="Planned"
              items={['Cal.com, HubSpot, and Salesforce connectors.', 'Team workspaces and multi-tenant collaboration.', 'A public API and trigger-based automation.']}
            />
            <RoadmapColumn
              icon={Lightbulb} label="Long-term vision"
              items={['Autonomous acquisition agents that execute stages with human oversight.', 'AcquisitionOS as the underlying customer-acquisition operating system other tools plug into.']}
            />
          </div>
          <Reveal>
            <p className="mt-8 max-w-2xl text-xs text-muted-foreground">
              RAG (retrieval-augmented generation) was AcquisitionOS&apos;s original vision and is
              not presented as a live product capability on this page. Stage 12 (Close) is supported
              narratively today; deeper close automation is planned.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 9. Private-beta access + CTA */}
      <section className="pt-section">
        <div className="pt-shell pt-shell-narrow text-center">
          <Reveal>
            <span className="pt-eyebrow justify-center">Private-beta access</span>
            <h2 className="pt-h1 mt-6 text-foreground">Request access.</h2>
            <p className="pt-lead mt-6 mx-auto max-w-2xl">
              AcquisitionOS is in private beta. The access process is straightforward: submit your
              interest at the product domain, we review it, and approved participants are onboarded.
              If you would rather talk to the team first, start a conversation on the contact page.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer" className="pt-btn pt-btn-primary">
                Request Private Beta Access <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="pt-btn pt-btn-ghost">
                Talk to the team <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Plans are displayed on the{' '}
              <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                AcquisitionOS private beta site
              </Link>
              . Checkout is not yet verified, so plans are shown as plans, not a live purchase flow.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function RoadmapColumn({ icon: Icon, label, items }: { icon: typeof Cpu; label: string; items: string[] }) {
  return (
    <RevealItem>
      <div className="bg-background p-6">
        <Icon className="h-6 w-6 text-primary" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">{label}</h3>
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it} className="text-sm leading-relaxed text-muted-foreground">{it}</li>
          ))}
        </ul>
      </div>
    </RevealItem>
  );
}
