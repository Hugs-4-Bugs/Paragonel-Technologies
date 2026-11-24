import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Linkedin, ArrowUpRight, Instagram } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { XIcon } from '@/components/brand/x-icon';

/**
 * AboutSection — Paragonel company story (Prompt 05D §3; founder profile
 * reworked to a credible 6-part profile: hero, engineering foundation, what he
 * is building, vision, why AcquisitionOS matters, social profiles).
 *
 * Six sections, on the 05A/05B/05C editorial system:
 *   A. Company introduction
 *   B. Why Paragonel exists (engineering philosophy)
 *   C. Engineering philosophy — five principles
 *   D. Founder — verified facts only (Prabhat Kumar, Founder & CEO, B.E. CS).
 *      No years, employment dates, previous-employer row, awards, certs, public
 *      speaking, or founder milestones are claimed. The prior "Engineer at
 *      Netcore Cloud" row and the defensive disclaimer were removed.
 *   E. Five engineering disciplines — narrative; links to /services (the
 *      current catalogue). The 13-offering catalogue is engineering scope, NOT
 *      proof of 13 delivered engagements.
 *   F. Engagement process — three steps; CTA -> /contact.
 *
 * No fabricated founding story, origin event, milestone, mission quote, or
 * journey timeline (all removed from the prior version per §3B/§3D).
 *
 * Server Component.
 */

const WHY_EXISTS = [
  'Build useful systems, not technology for its own sake. Engineering decisions are made against a real workflow and a real business requirement, not against what is interesting to build.',
  'Connect AI to actual workflows and business requirements. AI is integrated into the work a team already does, with the handoffs and guardrails that make it operable, not bolted onto an unrelated process.',
  'Design for maintainability, reliability, and responsible operation. Systems are built to be run after they are shipped — observable, documented, and honest about their failure modes.',
  'Make architecture, trade-offs, and limitations explicit. The constraints, the choices, and what a system does not yet do are stated plainly rather than hidden behind a marketing surface.',
  'Validate engineering through products Paragonel builds and operates itself. The same engineers who deliver services ship and run Paragonel\'s own products, so the engineering is tested by real operation.',
];

const PRINCIPLES = [
  { n: '01', t: 'Product thinking before feature accumulation', d: 'A named, verifiable core that does something specific is worth more than a broad surface of half-features. We design the product before we list the features.' },
  { n: '02', t: 'Engineering grounded in real workflows', d: 'Systems are designed against the actual work a team performs, with the handoffs, edge cases, and human judgment that workflow contains — not against an idealized flowchart.' },
  { n: '03', t: 'AI with human oversight and evidence', d: 'AI surfaces signals, drafts, and suggested scores; a human decides and acts. Missing information stays missing rather than being fabricated. Assistance, not autonomy.' },
  { n: '04', t: 'Clear architecture and measurable technical quality', d: 'The architecture is drawn and named; quality is measured against criteria that can be checked, not asserted. What is verified is stated; what is not is not.' },
  { n: '05', t: 'Responsible infrastructure and operational thinking', d: 'Infrastructure is built to be operated — cost-aware, observable, and bounded by what the system is actually meant to do. Operation is part of the build, not an afterthought.' },
];

const DISCIPLINES = [
  { n: '01', t: 'Product Engineering', d: 'The product spine — multi-tenant architecture, the auth/billing/data model, the workflow that makes the product a product.' },
  { n: '02', t: 'AI & Intelligent Systems', d: 'Retrieval, reasoning, and agentic workflows with human-in-the-loop guardrails, evaluation, and an anti-hallucination stance.' },
  { n: '03', t: 'Cloud, Infrastructure & Platform Engineering', d: 'The platform the product runs on — cost-aware, observable, reliable, and operable after shipping.' },
  { n: '04', t: 'Data Engineering & Analytics', d: 'The data layer — pipelines, lineage, a semantic layer, and dashboards whose numbers trace to a source.' },
  { n: '05', t: 'Experience & Interface Engineering', d: 'The surface — the interface, the interaction, and the accessibility that makes the system usable by the people it is for.' },
];

const ENGAGEMENT = [
  { n: '01', t: 'Introductory discussion with engineers', d: 'A first conversation with the engineers who would do the work — not a sales handoff. We talk through the problem, the constraints, and whether Paragonel is the right fit, before any scope is proposed.' },
  { n: '02', t: 'Scope and proposal', d: 'A written scope and proposal that names what would be built, the architecture, the trade-offs, and the limitations. What the engagement does and does not cover is explicit.' },
  { n: '03', t: 'Build, ship, and operate', d: 'The work is built and shipped against the scope, with the operational path accounted for. We do not promise a fixed delivery time or a guaranteed result; we do commit to the scope, the architecture, and honest progress.' },
];

export function AboutSection() {
  return (
    <div className="bg-background">
      {/* A. Company introduction */}
      <section className="pt-hero-backdrop">
        <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)' }}>
          <Reveal>
            <span className="pt-eyebrow">About Paragonel</span>
            <h1 className="pt-display mt-6 text-foreground">
              An AI-native<br />product-engineering company.
            </h1>
            <p className="pt-lead mt-7 max-w-2xl">
              Paragonel Technologies Pvt. Ltd. is an AI-native product-engineering company.
              We engineer digital products that move businesses forward — connecting product
              engineering, AI systems, cloud and platform engineering, data systems, and
              independent product development into one coherent practice.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The company has three responsibilities: a technology engineering partner for
              businesses, an independent software and product company, and a builder of
              AI-native products and intelligent business systems. We serve buyers who need a
              complete product engineered end-to-end — not an isolated task executed against a
              ticket. <span className="font-medium text-foreground">Shaping the Future.</span>
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/portfolio" className="pt-btn pt-btn-primary">
                See selected work <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="pt-btn pt-btn-ghost">
                Engineering services
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* B. Why Paragonel exists */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Why Paragonel exists</span>
            <h2 className="pt-h1 mt-6 text-foreground">Engineering philosophy, not a slogan.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Paragonel exists to build useful systems — software that does specific,
              verifiable work for a business, engineered to be maintained and operated, not
              just demoed. The philosophy below is the stance behind every engagement and
              every product we ship.
            </p>
          </Reveal>
          <RevealGroup stagger={0.06} className="mt-12">
            {WHY_EXISTS.map((p, i) => (
              <RevealItem key={i}>
                <div className="grid grid-cols-[auto_1fr] gap-5 border-t border-border py-6">
                  <span className="pt-index text-xs">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm leading-relaxed text-foreground md:text-base">{p}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* C. Engineering philosophy — five principles */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Engineering philosophy</span>
            <h2 className="pt-h1 mt-6 text-foreground">Five principles we build by.</h2>
          </Reveal>
          <RevealGroup stagger={0.07} className="mt-12 grid gap-px bg-border md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <RevealItem key={p.n}>
                <div className="flex h-full flex-col bg-background p-6 md:p-7">
                  <span className="pt-index text-xs">{p.n}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{p.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* D. Founder profile — verified facts only (6-part) */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          {/* D1. Hero — photograph, name, role, introduction, social profiles */}
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <Reveal>
              <figure className="overflow-hidden rounded-[var(--pt-radius-md)] border border-border bg-secondary/20">
                <div className="relative aspect-square w-full">
                  <Image
                    src="/images/Prabhat.png"
                    alt="Prabhat Kumar, Founder & CEO, Paragonel Technologies"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="px-5 py-4 text-xs text-muted-foreground">
                  Prabhat Kumar — Founder &amp; CEO, Paragonel Technologies Pvt. Ltd.
                </figcaption>
              </figure>
            </Reveal>
            <Reveal variant="fade">
              <span className="pt-eyebrow">Founder</span>
              <h2 className="pt-h1 mt-6 text-foreground">Prabhat Kumar.</h2>
              <p className="mt-4 text-base font-medium text-foreground">Founder &amp; CEO, Paragonel Technologies Pvt. Ltd.</p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/90">
                Prabhat Kumar is the Founder and CEO of Paragonel Technologies, where he leads the
                company&apos;s direction across software engineering, AI-native products and
                technology-led solutions. His work is grounded in backend engineering and
                application architecture — turning complex technical problems into practical,
                dependable software that businesses can actually run.
              </p>
              <dl className="mt-6 space-y-px bg-border">
                <Fact label="Role" value="Founder & CEO" />
                <Fact label="Education" value="Bachelor of Engineering (B.E.), Computer Science" />
              </dl>
              {/* Founder's personal profiles — LinkedIn + X. Distinct from the
                  company LinkedIn URL; both open safely in a new tab. */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-btn pt-btn-ghost"
                  aria-label="Prabhat Kumar on LinkedIn (opens in a new tab)"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </Link>
                <Link
                  href="https://x.com/PrabhatKumarHQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-btn pt-btn-ghost"
                  aria-label="Prabhat Kumar on X (opens in a new tab)"
                >
                  <XIcon className="h-4 w-4" /> X
                </Link>
                <Link
                  href="https://www.instagram.com/_s_4_sharma/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-btn pt-btn-ghost"
                  aria-label="Prabhat Kumar on Instagram (opens in a new tab)"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </Link>
              </div>
            </Reveal>
          </div>

          {/* D2–D5. Foundation · what he is building · vision · product direction */}
          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:gap-14">
            <Reveal className="h-full">
              <div className="h-full border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground">Engineering foundation</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  His engineering foundation is in computer science and Java backend development —
                  Spring Boot, REST APIs, data modelling with SQL and Hibernate/JPA, application
                  security and software architecture. Around that core, he works across the modern
                  product stack: Next.js, React and TypeScript on the front end; cloud
                  infrastructure, Docker and CI/CD on the platform side; and AI-enabled application
                  workflows that connect language models to real product work. These are areas he
                  works in, not a claim of equal depth in each — the spine is backend engineering
                  and architecture.
                </p>
              </div>
            </Reveal>
            <Reveal className="h-full">
              <div className="h-full border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground">What he is building</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Paragonel ships its own products alongside its engineering services.{' '}
                  <Link href="/our-product/acquisitionos" className="font-medium text-foreground underline-offset-4 hover:underline">AcquisitionOS</Link>{' '}
                  is the flagship — an AI-powered client acquisition operating system, currently
                  in private beta.{' '}
                  <Link href="/our-product/systemfoundry" className="font-medium text-foreground underline-offset-4 hover:underline">SystemFoundry</Link>{' '}
                  is an internal architecture simulator used for Paragonel&apos;s cloud-engineering
                  work.{' '}
                  <Link href="/our-product/codeguard-ai" className="font-medium text-foreground underline-offset-4 hover:underline">CodeGuard AI</Link>,
                  a VS Code extension giving real-time cloud-cost feedback on Terraform and
                  CloudFormation, is published on the VS Code Marketplace. These are
                  Paragonel&apos;s own products, distinct from client engagements listed on
                  Selected Work.
                </p>
              </div>
            </Reveal>
            <Reveal className="h-full">
              <div className="h-full border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground">Vision</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Paragonel is being built as an engineering-led technology company where strong
                  software foundations and intelligent automation reinforce each other. The intent
                  is not to chase every trend, but to build a small set of useful systems well —
                  products that do specific work, and services that deliver the same engineering
                  quality to clients. The same engineers who ship Paragonel&apos;s products deliver
                  its engagements, so the engineering is tested by real operation.
                </p>
              </div>
            </Reveal>
            <Reveal className="h-full">
              <div className="h-full border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground">Why AcquisitionOS matters</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  AcquisitionOS matters to Paragonel because it is where the company&apos;s
                  engineering, AI and automation work meets a concrete business problem — client
                  acquisition, end to end. Building it forces the same decisions Paragonel makes
                  for clients: product architecture, reliable AI behaviour, operable
                  infrastructure and honest data. The product is the proof that the services are
                  real, and the services feed back into the product.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* E. Five engineering disciplines */}
      <section className="pt-section">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Engineering scope</span>
            <h2 className="pt-h1 mt-6 text-foreground">Five disciplines, one complete product.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              A complete digital product is not one discipline — it is product engineering, AI,
              cloud and platform, data, and experience, composed into one operable system. These
              five disciplines are how Paragonel scopes and delivers the engineering behind a
              product. Our services catalogue details how we deliver them today.
            </p>
          </Reveal>
          <RevealGroup stagger={0.06} className="mt-12">
            {DISCIPLINES.map((d) => (
              <RevealItem key={d.n}>
                <div className="grid grid-cols-[auto_1fr_2fr] gap-5 border-t border-border py-6">
                  <span className="pt-index text-xs">{d.n}</span>
                  <h3 className="text-base font-semibold text-foreground">{d.t}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:pl-6">{d.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal>
            <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              The 13-offering services catalogue is an engineering and service scope — the work
              Paragonel is set up to deliver across these disciplines. It is not proof that 13
              separate customer engagements have been delivered. Delivered and verified work is
              listed on the Selected Work page.
            </p>
            <div className="mt-6">
              <Link href="/services" className="pt-btn pt-btn-ghost">
                View the services catalogue <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* F. Engagement process */}
      <section className="pt-section pt-surface-quiet">
        <div className="pt-shell">
          <Reveal>
            <span className="pt-eyebrow">Engagement process</span>
            <h2 className="pt-h1 mt-6 text-foreground">How a client engages with Paragonel.</h2>
            <p className="pt-lead mt-6 max-w-2xl">
              Three steps, with the engineers who would do the work involved from the first
              conversation. We do not promise free services, free consultations, fixed delivery
              times, or guaranteed results — we commit to a clear scope, an explicit
              architecture, and honest progress.
            </p>
          </Reveal>
          <RevealGroup stagger={0.08} className="mt-12 grid gap-px bg-border md:grid-cols-3">
            {ENGAGEMENT.map((s) => (
              <RevealItem key={s.n}>
                <div className="flex h-full flex-col bg-background p-6 md:p-7">
                  <span className="pt-index text-xs">{s.n}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal>
            <div className="mt-10">
              <Link href="/contact" className="pt-btn pt-btn-primary">
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 bg-background px-4 py-3">
      <dt className="pt-index text-[0.65rem]">{label.toUpperCase()}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
