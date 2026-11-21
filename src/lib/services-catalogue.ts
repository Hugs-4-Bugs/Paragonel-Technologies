/**
 * services-catalogue.ts — Paragonel engineering services catalogue (Prompt 05B).
 *
 * Five engineering domains → 13 individual offerings. The source of truth for
 * the new /services landing + the /services/[slug] detail pages.
 *
 * Content standard (per founder): every offering answers —
 *   1. What business/engineering problem does it solve?
 *   2. What does Paragonel actually deliver?
 *   3. Why does the solution matter?
 *   4. What technologies / engineering approaches are relevant?
 *   5. How can a prospective client engage?
 *
 * No invented clients, metrics, awards or enterprise-scale claims. Product
 * references are limited to verified Paragonel work (AcquisitionOS private
 * beta, CodeGuard AI on the VS Code Marketplace, SystemFoundry internal tool).
 */

export type CompositionVariant =
  | 'process' // domain 1: build → ship → operate
  | 'system' // domain 2: data → model → inference → loop
  | 'architecture' // domain 3: layered infra stack
  | 'pipeline' // domain 4: sources → pipeline → warehouse → surface
  | 'interface'; // domain 5: design system → components → interaction

export interface ServiceDomain {
  index: string; // 01..05
  slug: string;
  name: string;
  scope: string;
  composition: CompositionVariant;
}

export interface ServiceOffering {
  slug: string;
  domainSlug: string;
  name: string;
  tagline: string;
  problem: string;
  deliverable: string;
  why: string;
  tech: string[];
  engagement: string;
  metaTitle: string;
  metaDescription: string;
}

export const DOMAINS: ServiceDomain[] = [
  {
    index: '01',
    slug: 'product-engineering',
    name: 'Product Engineering',
    scope: 'Taking software from idea to live users — architecture, build, ship, operate. SaaS platforms, internal products, commercial products.',
    composition: 'process',
  },
  {
    index: '02',
    slug: 'ai-and-intelligent-systems',
    name: 'AI & Intelligent Systems',
    scope: 'AI that sits in the core workflow, not a bolted-on chatbot. Agents, copilots, scoring, personalization, knowledge systems — tied to a real business outcome.',
    composition: 'system',
  },
  {
    index: '03',
    slug: 'cloud-infrastructure-platform',
    name: 'Cloud, Infrastructure & Platform Engineering',
    scope: 'Dependable, scalable infrastructure — migration, IaC, CI/CD, observability, reliability. Systems that do not fall over when load arrives.',
    composition: 'architecture',
  },
  {
    index: '04',
    slug: 'data-engineering-analytics',
    name: 'Data Engineering & Analytics',
    scope: 'Pipelines, warehouses, models and dashboards that give leadership a clear, current picture of the business instead of a delayed rear-view mirror.',
    composition: 'pipeline',
  },
  {
    index: '05',
    slug: 'experience-interface',
    name: 'Experience & Interface Engineering',
    scope: 'Interfaces that make complex systems usable — interaction design, performance, accessibility, and the craft that makes a product feel deliberate.',
    composition: 'interface',
  },
];

export const OFFERINGS: ServiceOffering[] = [
  // ── 01 Product Engineering ──────────────────────────────────────────────
  {
    slug: 'saas-product-engineering',
    domainSlug: 'product-engineering',
    name: 'SaaS & Product Engineering',
    tagline: 'A product, engineered end-to-end — from architecture to live users.',
    problem:
      'A good idea stuck with no clear path from concept to a dependable, shipped product — or a product that exists but buckles under real usage.',
    deliverable:
      'A product engineered as a system: architecture, application, data, deployment and operations. Multi-tenant SaaS, internal products, or commercial products — built to be run, not just launched.',
    why: 'Products fail at the seams between product, software and infrastructure. Engineering all three as one system is what makes a product survive contact with real users and real load.',
    tech: ['Next.js / React', 'TypeScript', 'Node / Python services', 'PostgreSQL', 'Event-driven backends', 'CI/CD'],
    engagement:
      'Starts with a conversation about the product and its real usage constraints, then a scoped build plan. We ship our own products (AcquisitionOS) — this is core practice, not a side service.',
    metaTitle: 'SaaS & Product Engineering — Paragonel',
    metaDescription: 'End-to-end product engineering: architecture, build, ship, operate. SaaS platforms, internal and commercial products.',
  },
  {
    slug: 'custom-business-software',
    domainSlug: 'product-engineering',
    name: 'Custom Business Software',
    tagline: 'Internal systems that replace spreadsheets, tribal knowledge and copy-paste.',
    problem:
      'The business runs on spreadsheets, chat threads and people remembering things. Operations are fragmented, with no single source of truth for how the business actually works.',
    deliverable:
      'Custom internal software that encodes the real workflow — admin panels, operations dashboards, workflow tools, internal APIs — built around how the business actually runs, not a generic template.',
    why: 'When the system matches the workflow, the workflow stops depending on heroics. Custom software is justified when the cost of the status quo (errors, delays, lost institutional knowledge) exceeds the cost of building the right thing.',
    tech: ['Next.js / React admin UIs', 'REST / GraphQL APIs', 'PostgreSQL / Firestore', 'Role-based access', 'Audit trails'],
    engagement:
      'We map the actual workflow first (not the wished-for one), then scope the system. Engagement sizes from a focused internal tool to a multi-module operations platform.',
    metaTitle: 'Custom Business Software — Paragonel',
    metaDescription: 'Internal systems that replace spreadsheets and tribal knowledge — built around how the business actually runs.',
  },
  {
    slug: 'api-systems-integration',
    domainSlug: 'product-engineering',
    name: 'API & Systems Integration',
    tagline: 'Disconnected systems made to behave as one.',
    problem:
      'Tools that should work together do not. Data lives in silos, manual sync between systems, and every integration is a fragile one-off that breaks on the next update.',
    deliverable:
      'Designed APIs and integrations that connect your systems reliably — typed contracts, idempotent sync, error handling, and observability so failures surface instead of corrupting data.',
    why: 'Integrations done wrong silently corrupt data and erode trust. Done right, they turn a stack of tools into one system — and they survive the next vendor version bump.',
    tech: ['REST / GraphQL / webhooks', 'Event brokers', 'Idempotent sync', 'Typed contracts', 'Retry + DLQ patterns'],
    engagement:
      'Scoped per integration surface. We start by mapping the systems + their failure modes, then design contracts that survive real-world change.',
    metaTitle: 'API & Systems Integration — Paragonel',
    metaDescription: 'Reliable APIs and integrations that connect disconnected systems — typed contracts, idempotent sync, observability.',
  },

  // ── 02 AI & Intelligent Systems ─────────────────────────────────────────
  {
    slug: 'ai-agents-copilots',
    domainSlug: 'ai-and-intelligent-systems',
    name: 'AI Agents & Copilots',
    tagline: 'AI that does the work, not just answers questions.',
    problem:
      'Pressure to "do AI" with no connection to a real workflow — or a chatbot that talks but cannot act, decide, or hand back to a human at the right moment.',
    deliverable:
      'Agents and copilots that take typed actions inside your actual systems — tool-using, scoped, with explicit handoffs to humans where the stakes warrant. Designed around a measurable workflow step, not a demo.',
    why: 'An agent that acts inside the workflow is worth more than one that only answers. The engineering value is in the tooling, the guardrails and the handoffs — not the model call.',
    tech: ['LLM tool-use / function calling', 'RAG + structured outputs', 'Eval harnesses', 'Guardrails + human-in-the-loop', 'Tracing'],
    engagement:
      'Begins with the specific workflow step the agent must own + its failure cost. AcquisitionOS is our own agent-platform reference (private beta) — we build agents we run ourselves.',
    metaTitle: 'AI Agents & Copilots — Paragonel',
    metaDescription: 'Agents that take typed actions inside your systems — tool-using, guarded, with explicit human handoffs.',
  },
  {
    slug: 'rag-knowledge-systems',
    domainSlug: 'ai-and-intelligent-systems',
    name: 'RAG & Knowledge Systems',
    tagline: 'Your knowledge, made queryable — with sources, not hallucinations.',
    problem:
      'Institutional knowledge trapped in docs, tickets and chats. LLMs answer confidently and wrong because they do not know your context.',
    deliverable:
      'Retrieval-augmented systems grounded in your actual content — ingestion, chunking, retrieval, citations. Answers that point back to the source document so a human can verify.',
    why: 'Grounding turns a general model into one that knows your business. Citations are the difference between a tool people trust and one they have to re-check line by line.',
    tech: ['Vector stores', 'Hybrid retrieval', 'Reranking', 'Citation pipelines', 'Ingestion + sync'],
    engagement:
      'Scoped to the knowledge domain + its update cadence. We start with the sources that matter + the questions that are actually asked, not a generic "chat with your docs."',
    metaTitle: 'RAG & Knowledge Systems — Paragonel',
    metaDescription: 'Retrieval-augmented systems grounded in your content — with citations, not hallucinations.',
  },
  {
    slug: 'workflow-automation',
    domainSlug: 'ai-and-intelligent-systems',
    name: 'Workflow Automation & BPA',
    tagline: 'Repetitive work owned by a system, not a person.',
    problem:
      'Skilled people doing copy-paste, routing and triage work that a well-engineered system should own — slowly, inconsistently, and at human cost.',
    deliverable:
      'Automated workflows across your tools — triggers, enrichment, decisions, actions — with logging, replay and human checkpoints where judgement is required. Process automation engineered for reliability, not a brittle no-code chain.',
    why: 'Automation that breaks silently is worse than no automation. Engineered automation logs every step, fails loudly, and hands back to a human cleanly — so it actually gets adopted.',
    tech: ['Event triggers / webhooks', 'Step-based run engine', 'Retry + observability', 'Human-in-the-loop gates', 'Audit logs'],
    engagement:
      'Starts from the actual manual workflow + its failure cost. We automate the steps that are safe to own, and leave the judgement steps to humans by design.',
    metaTitle: 'Workflow Automation & BPA — Paragonel',
    metaDescription: 'Reliable workflow automation — triggers, enrichment, decisions, actions, with logging, replay and human checkpoints.',
  },

  // ── 03 Cloud, Infrastructure & Platform ──────────────────────────────────
  {
    slug: 'cloud-architecture-migration',
    domainSlug: 'cloud-infrastructure-platform',
    name: 'Cloud Architecture & Migration',
    tagline: 'Infrastructure that fits the business, not a vendor template.',
    problem:
      'Infrastructure grown ad-hoc — expensive, fragile, and nobody fully sure why it is the way it is. Or a migration looming with no safe path.',
    deliverable:
      'Cloud architecture designed for your actual load + cost constraints, and migrations executed in safe slices with rollback. Right-sized, documented, and ownable by your team afterward.',
    why: 'Most cloud cost + reliability pain is architectural, not operational. Fixing the shape of the system resolves more than tuning ever will.',
    tech: ['AWS / GCP / Azure', 'Well-architected review', 'Migration in slices', 'Cost right-sizing', 'Network + IAM design'],
    engagement:
      'Architecture review + migration plan first, execution in slices. CodeGuard AI (our own tool) flags AWS infrastructure cost risks in Terraform — we eat our own dog food here.',
    metaTitle: 'Cloud Architecture & Migration — Paragonel',
    metaDescription: 'Cloud architecture designed for real load and cost constraints, and safe sliced migrations with rollback.',
  },
  {
    slug: 'devops-cicd',
    domainSlug: 'cloud-infrastructure-platform',
    name: 'DevOps & CI/CD',
    tagline: 'Deploys that are routine, not risky.',
    problem:
      'Deploys are events — manual, scary, after-hours. Rollback is a myth. Nobody is confident the production change is safe until it has already broken.',
    deliverable:
      'CI/CD pipelines with automated tests, progressive delivery, rollback and observability. Deploys become a routine, low-risk activity rather than a production event.',
    why: 'When deploys are routine, teams ship more + break less. Confidence comes from the pipeline catching what humans miss — not from heroism at 2am.',
    tech: ['GitHub Actions / GitLab CI', 'IaC (Terraform / Pulumi)', 'Progressive delivery', 'Automated test gates', 'Rollback'],
    engagement:
      'Pipelined per service. We start with the highest-risk deploy path + make it boring, then extend. Existing pipelines preserved + improved, not torn down.',
    metaTitle: 'DevOps & CI/CD — Paragonel',
    metaDescription: 'CI/CD with automated tests, progressive delivery, rollback and observability — deploys that are routine, not risky.',
  },
  {
    slug: 'platform-reliability',
    domainSlug: 'cloud-infrastructure-platform',
    name: 'Platform Engineering & Reliability',
    tagline: 'Systems that stay up under load — and tell you before they do not.',
    problem:
      'Outages that erode customer trust. No early warning. Scaling is reactive. The system works at 10 users and nobody knows what happens at 10,000.',
    deliverable:
      'Platform layer + reliability engineering — observability, SLOs, alerting, capacity planning, self-healing patterns. A system that fails loudly before customers notice, and scales by design.',
    why: 'Reliability is designed in, not bolted on. The cost of an outage is almost always higher than the cost of the observability that would have prevented it.',
    tech: ['SLOs / error budgets', 'Metrics + logs + traces', 'Alerting + on-call design', 'Capacity + load testing', 'Chaos / failure injection'],
    engagement:
      'Begins with the failure modes that hurt most + the SLOs that reflect real customer impact. We instrument before we optimize — measure, then improve.',
    metaTitle: 'Platform Engineering & Reliability — Paragonel',
    metaDescription: 'Observability, SLOs, alerting, capacity planning and self-healing — systems that stay up and warn you early.',
  },

  // ── 04 Data Engineering & Analytics ──────────────────────────────────────
  {
    slug: 'data-engineering-pipelines',
    domainSlug: 'data-engineering-analytics',
    name: 'Data Engineering & Pipelines',
    tagline: 'The right data, in the right place, on time.',
    problem:
      'Data is everywhere and nowhere — trapped in operational systems, inconsistent across reports, and nobody trusts the numbers because the pipeline is opaque.',
    deliverable:
      'Data pipelines + warehouse layer that ingest, clean and model your data with lineage + quality checks. One trustworthy source of truth, with the pipeline visible end-to-end.',
    why: 'Decisions made on untrusted data are guesses with confidence. Trust comes from lineage, quality gates and a model that reflects the business — not from a fancier chart.',
    tech: ['ETL / ELT', 'Warehouse (BigQuery / Snowflake / Postgres)', 'dbt models', 'Data quality gates', 'Lineage + orchestration'],
    engagement:
      'Scoped to the decisions the data must support. We model the business first, then build the pipeline that feeds it — not the reverse.',
    metaTitle: 'Data Engineering & Pipelines — Paragonel',
    metaDescription: 'Pipelines + warehouse layer with lineage and quality checks — one trustworthy source of truth.',
  },
  {
    slug: 'analytics-bi',
    domainSlug: 'data-engineering-analytics',
    name: 'Analytics & BI',
    tagline: 'A current picture of the business, not a delayed rear-view mirror.',
    problem:
      'Leadership sees what happened last month, this month. No leading indicators, no operational visibility, and the dashboard nobody opens because it does not answer the real question.',
    deliverable:
      'Dashboards + reporting built around the decisions leadership actually makes — KPIs, funnels, cohort + operational views. Current, sourced, and explained so the reader trusts the number.',
    why: 'A dashboard that answers the wrong question is decorative. The value is in surfacing the right metric at the right cadence — and making its provenance visible.',
    tech: ['BI / dashboarding', 'KPI + funnel design', 'Cohort + retention', 'Semantic layer', 'Embedded analytics'],
    engagement:
      'Starts with the decisions + the cadence. We design the metric before the chart, and source every number back to the pipeline so it can be trusted.',
    metaTitle: 'Analytics & BI — Paragonel',
    metaDescription: 'Dashboards and reporting built around real decisions — current, sourced, and explained.',
  },

  // ── 05 Experience & Interface ────────────────────────────────────────────
  {
    slug: 'ui-ux-product-design',
    domainSlug: 'experience-interface',
    name: 'UI/UX & Product Design',
    tagline: 'Interfaces that make a complex system usable.',
    problem:
      'Powerful software that nobody can use. The system works, but the interface fights the user, hides the important action, and trains people to avoid it.',
    deliverable:
      'Product design that makes complex systems usable — information architecture, interaction flows, design systems + component libraries. Interfaces that match how the user actually thinks about the work.',
    why: 'Usability is not polish — it is whether the product gets used. A well-designed interface is the difference between software that delivers value and software that gets abandoned.',
    tech: ['Information architecture', 'Interaction design', 'Design systems', 'Component libraries', 'Accessibility (WCAG)'],
    engagement:
      'Embedded with engineering, not handed off. We design in the context of what the system can actually do — and we ship our own interfaces, so design meets reality.',
    metaTitle: 'UI/UX & Product Design — Paragonel',
    metaDescription: 'Product design that makes complex systems usable — IA, interaction, design systems, accessibility.',
  },
  {
    slug: 'frontend-engineering',
    domainSlug: 'experience-interface',
    name: 'Frontend Engineering',
    tagline: 'Fast, accessible, deliberate interfaces that scale.',
    problem:
      'A frontend that is slow, breaks on edge cases, is inaccessible to part of the audience, and rots because there is no system underneath it.',
    deliverable:
      'Frontend engineering with performance, accessibility + a maintainable architecture — component systems, state management, motion that explains rather than decorates. Interfaces that stay fast + usable as they grow.',
    why: 'The frontend is where the user meets the system. Performance, accessibility and a real component architecture are what keep it usable at scale — and keep the team able to change it.',
    tech: ['React / Next.js', 'TypeScript', 'Component systems', 'Performance budgets', 'Accessibility / a11y'],
    engagement:
      'Can be a focused performance/a11y pass or a full frontend build. We build our own frontends (this site, AcquisitionOS) — frontend craft is core practice.',
    metaTitle: 'Frontend Engineering — Paragonel',
    metaDescription: 'Fast, accessible, maintainable frontends — component systems, performance, motion that explains.',
  },
];

export function getOfferingBySlug(slug: string): ServiceOffering | undefined {
  return OFFERINGS.find((o) => o.slug === slug);
}

export function getDomainBySlug(slug: string): ServiceDomain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}

export function getOfferingsForDomain(domainSlug: string): ServiceOffering[] {
  return OFFERINGS.filter((o) => o.domainSlug === domainSlug);
}
