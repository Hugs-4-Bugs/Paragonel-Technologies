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
  | 'interface' // domain 5: design system → components → interaction
  | 'network' // integration: connected systems
  | 'loop' // automation: trigger → check → act → review
  | 'shield' // security: defence-in-depth
  | 'gauge' // quality: measure → regress → guard
  | 'edge' // iot: device → edge → cloud
  | 'lab'; // emerging: research → prototype → validate

/**
 * Capability delivery status (Prompt 05E §5). Every domain and offering is
 * assigned one of:
 *   - 'deliver-now'    — Paragonel can credibly deliver with present skills + evidence.
 *   - 'specialist'     — Deliverable via a validated specialist/partner (not an
 *                        implied in-house specialist team).
 *   - 'research'       — Under exploration / R&D; NOT an established current service.
 *
 * The field is optional only so the original 05B five-domain / 13-offering
 * entries (all 'deliver-now' per docs/CAPABILITY_STRATEGY.md §3) need no
 * per-entry rewrite; `getDomainStatus` / `getOfferingStatus` resolve the
 * default. New 05E entries set `status` explicitly.
 */
export type CapabilityStatus = 'deliver-now' | 'specialist' | 'research';

export const STATUS_META: Record<CapabilityStatus, { label: string; tone: string; blurb: string }> = {
  'deliver-now': {
    label: 'Deliver Now',
    tone: 'bg-emerald-500',
    blurb: 'Credibly deliverable today with Paragonel’s present engineering skills and existing evidence.',
  },
  specialist: {
    label: 'Specialist Support',
    tone: 'bg-amber-500',
    blurb: 'Deliverable through a validated specialist or partner arrangement — not an implied in-house specialist team.',
  },
  research: {
    label: 'Research & Emerging',
    tone: 'bg-sky-500',
    blurb: 'Under exploration, validation or R&D. Not presented as an established current delivery service.',
  },
};

export interface ServiceDomain {
  index: string; // 01..13
  slug: string;
  name: string;
  scope: string;
  composition: CompositionVariant;
  status?: CapabilityStatus; // defaults to 'deliver-now' (see getDomainStatus)
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
  status?: CapabilityStatus; // defaults to the domain's status (see getOfferingStatus)
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
  // ── 05E expansion (docs/CAPABILITY_STRATEGY.md §3) — eight new families ──
  {
    index: '06',
    slug: 'automation-digital-operations',
    name: 'Automation & Digital Operations',
    scope: 'AI-native workflow automation — API-first, exception-handling, human-in-the-loop. Not brittle UI-scraping RPA: intelligent orchestration that handles real operational variance.',
    composition: 'loop',
    status: 'deliver-now',
  },
  {
    index: '07',
    slug: 'enterprise-integration',
    name: 'Enterprise Integration & Business Systems',
    scope: 'Connecting fragmented systems end-to-end — API platforms, ERP/CRM extensions, middleware, event-driven architecture. The interoperability layer that makes a stack behave as one system.',
    composition: 'network',
    status: 'deliver-now',
  },
  {
    index: '08',
    slug: 'advisory-managed-engineering',
    name: 'Technology Advisory & Managed Engineering',
    scope: 'Architecture consulting, product discovery, modernization roadmaps, technical due diligence, and ongoing engineering support — the judgment layer around the build.',
    composition: 'process',
    status: 'deliver-now',
  },
  {
    index: '09',
    slug: 'cybersecurity-application-security',
    name: 'Cybersecurity, Application Security & Digital Trust',
    scope: 'Defensive engineering — secure architecture, app-sec posture, DevSecOps, dependency/supply-chain security, secrets management. Authorized testing via specialist partners; grounded in OWASP 2025 (A01 broken access control, A03 supply chain).',
    composition: 'shield',
    status: 'specialist',
  },
  {
    index: '10',
    slug: 'quality-engineering',
    name: 'Quality Engineering & Software Reliability',
    scope: 'Automated test architecture, regression, reliability and resilience engineering. Performance/load/stress and chaos testing via specialist support where deep infrastructure is required.',
    composition: 'gauge',
    status: 'specialist',
  },
  {
    index: '11',
    slug: 'industry-solutions',
    name: 'Industry-Specific Digital Solutions',
    scope: 'Domain solutions for B2B SaaS, developer tooling, India SMB/MSME, fintech, healthcare administration, logistics, enterprise IT and government — each with its real workflow gaps. Mixed status per industry; regulated verticals via specialist partners.',
    composition: 'process',
    status: 'specialist',
  },
  {
    index: '12',
    slug: 'iot-embedded-edge',
    name: 'IoT, Embedded & Edge Systems',
    scope: 'Device connectivity, embedded software, edge computing, sensor data systems. Research/emerging — hardware-dependent; revisit via specialist partnership.',
    composition: 'edge',
    status: 'research',
  },
  {
    index: '13',
    slug: 'emerging-technology',
    name: 'Emerging Technology & Applied Research',
    scope: 'Applied research into digital twins, robotics software, spatial/AR-VR, distributed ledgers, edge-AI, and new human-computer interfaces. R&D only — not an established delivery service.',
    composition: 'lab',
    status: 'research',
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

  // ── 06 Automation & Digital Operations (deliver-now) ────────────────────
  {
    slug: 'ai-native-workflow-automation',
    domainSlug: 'automation-digital-operations',
    name: 'AI-Native Workflow Automation',
    tagline: 'API-first automation that handles real variance — not brittle bots.',
    problem:
      'Robotic process automation fails at scale: research indicates roughly half of RPA projects fail, and over 70% plateau below 50 bots. UI-scraping bots break on interface changes, cannot handle exceptions, and cannot learn. The result is automation that works in a demo and fails in production.',
    deliverable:
      'API-first, event-driven automation with exception handling, human checkpoints where judgment is required, and an audit trail. Intelligence is native to the workflow (drafting, classifying, deciding within guardrails) rather than a chatbot bolted onto a manual process.',
    why: 'Automation that survives production is built on stable APIs, explicit exception paths, and human-in-the-loop on consequential actions — the same pattern AcquisitionOS uses for outreach and scoring. It replaces brittle bots with operable systems.',
    tech: ['Event-driven architecture', 'API orchestration', 'Human-in-the-loop review', 'Workflow engines', 'Observability'],
    engagement:
      'Begin with one documented, failing manual workflow. We map the stable API surface, design the exception/human-review paths, and ship automation against that scope. No fixed delivery time or guaranteed outcome is promised.',
    metaTitle: 'AI-Native Workflow Automation — Paragonel',
    metaDescription: 'API-first, human-in-the-loop automation that replaces brittle RPA. Built to survive production variance.',
    status: 'deliver-now',
  },
  {
    slug: 'document-intelligence',
    domainSlug: 'automation-digital-operations',
    name: 'Document Intelligence & Data Extraction',
    tagline: 'Structured extraction from unstructured documents, with confidence and review.',
    problem:
      'Finance, legal and operations teams manually enter data from invoices, contracts and forms into downstream systems. Raw OCR is error-prone; the verification burden stays with humans.',
    deliverable:
      'LLM-grounded extraction that pulls structured fields from documents, attaches confidence scores, and routes low-confidence extractions to human review — rather than asserting an answer and moving on.',
    why: 'Extraction that surfaces its own uncertainty is safer to operate than extraction that hides it. Confidence + human review is the defensible pattern; blind automation is the failure pattern.',
    tech: ['LLM extraction', 'Confidence scoring', 'Human review queues', 'Validation rules', 'PII handling'],
    engagement:
      'One document type (e.g. invoices or contracts) as a scoped pilot. We deliver the extraction + review flow against that type and measure accuracy before broadening.',
    metaTitle: 'Document Intelligence — Paragonel',
    metaDescription: 'LLM-grounded document extraction with confidence scores and human review — not blind OCR.',
    status: 'deliver-now',
  },

  // ── 07 Enterprise Integration & Business Systems (deliver-now) ──────────
  {
    slug: 'enterprise-system-integration',
    domainSlug: 'enterprise-integration',
    name: 'Enterprise System Integration',
    tagline: 'The interoperability layer that makes a stack behave as one system.',
    problem:
      'Operations teams work across five to fifteen SaaS and on-prem systems, moving data by CSV, email and spreadsheet between them. Integrations exist individually but do not connect end-to-end; poor documentation blocks advanced use of even good tools.',
    deliverable:
      'API platforms, middleware and event-driven architecture that connect systems end-to-end — with typed contracts, error handling, and observability on the flow of data between systems.',
    why: 'The cost of fragmented tools is not the tool price; it is the manual labour, errors and delay of moving data between them. Integration is where the stack either behaves as one system or does not.',
    tech: ['API design / contracts', 'Event-driven architecture', 'Middleware', 'ERP/CRM extensions', 'iPaaS where fit'],
    engagement:
      'Map the current system graph + the manual handoffs. We scope the highest-pain integration first, ship it with observability, then extend. No guaranteed timeline.',
    metaTitle: 'Enterprise System Integration — Paragonel',
    metaDescription: 'API platforms, middleware and event-driven architecture connecting fragmented systems end-to-end.',
    status: 'deliver-now',
  },

  // ── 08 Technology Advisory & Managed Engineering (deliver-now) ──────────
  {
    slug: 'technical-architecture-advisory',
    domainSlug: 'advisory-managed-engineering',
    name: 'Technical Architecture Advisory',
    tagline: 'Architecture, trade-offs and limitations — stated explicitly.',
    problem:
      'Teams inherit systems they did not build and face decisions (modernize, rebuild, migrate, integrate) without a clear architecture picture or an honest statement of trade-offs and limitations.',
    deliverable:
      'Architecture assessment, modernization roadmaps, technical due diligence support, and product-discovery/feasibility work — with constraints, choices and unknowns stated plainly rather than hidden behind a recommendation.',
    why: 'A good architecture decision requires the trade-offs to be visible. Paragonel’s stance is the same here as in its products: make architecture, trade-offs and limitations explicit; what is verified is stated, what is not is not.',
    tech: ['Architecture review', 'Modernization roadmaps', 'Technical due diligence', 'Feasibility / discovery', 'Documentation'],
    engagement:
      'Scoped engagement — a defined assessment or roadmap deliverable. We do not promise free consultations or guaranteed outcomes; we commit to an explicit, written analysis.',
    metaTitle: 'Technical Architecture Advisory — Paragonel',
    metaDescription: 'Architecture assessment, modernization roadmaps and due diligence — trade-offs made explicit.',
    status: 'deliver-now',
  },

  // ── 09 Cybersecurity, Application Security & Digital Trust (specialist) ──
  {
    slug: 'secure-architecture-appsec',
    domainSlug: 'cybersecurity-application-security',
    name: 'Secure Architecture & Application Security',
    tagline: 'Defensive engineering, grounded in OWASP 2025.',
    problem:
      'OWASP Top 10:2025 reports broken access control in 100% of tested applications, and elevates software supply-chain failures to a top-three risk. Authorization is hand-coded per endpoint, transitive dependencies go unaudited, and secrets leak via CI/CD.',
    deliverable:
      'Secure architecture review, access-control policy design (authz-as-code), dependency/supply-chain posture gates, secrets-management posture, and DevSecOps integration. Defensive engineering delivered in-house; authorized penetration testing delivered via a validated specialist partner.',
    why: 'Security is engineered, not audited-once. The 2025 risk landscape (broken access control, supply chain, misconfiguration) is addressed by shift-left defensive engineering and least-privilege by construction — the same discipline behind CodeGuard AI’s shift-left analysis.',
    tech: ['OWASP 2025', 'Access-control policy (Cedar/OPA-class)', 'Dependency/SBOM posture', 'Secrets posture', 'DevSecOps CI gates'],
    engagement:
      'Posture assessment or secure-architecture engagement in-house; authorized penetration testing via a specialist partner under proper authorization. We do not imply an in-house specialist pen-test team.',
    metaTitle: 'Secure Architecture & Application Security — Paragonel',
    metaDescription: 'Defensive engineering grounded in OWASP 2025 — access control, supply-chain posture, DevSecOps. Authorized testing via specialist partners.',
    status: 'specialist',
  },
  {
    slug: 'ai-agent-security-governance',
    domainSlug: 'cybersecurity-application-security',
    name: 'AI Agent Security & Permission Governance',
    tagline: 'Agents now execute actions — govern the actions, not just the prompts.',
    problem:
      'AI agents are granted permissions to delete records, send external messages, change configurations and execute code. Prompt injection bypasses application-level authorization; over-privileged agents become high-value targets. Dozens of CVEs were disclosed across major AI platforms in late 2025. Traditional security was not built for agents that act.',
    deliverable:
      'Agent permission scoping (least privilege, separated destructive actions), human-in-the-loop gates on consequential tools, action audit logging, and pre-deployment agent evaluation. Currently delivered as a research-grounded engagement; a productized governance layer is on the roadmap.',
    why: 'AI security moved from prompts to actions. The defensible position is governing what an agent is permitted to do, with a human deciding on destructive paths — the same human-in-the-loop stance AcquisitionOS applies to outreach and scoring.',
    tech: ['Permission scoping', 'Human-in-the-loop gates', 'Action audit', 'Agent evaluation', 'Prompt-injection defence'],
    engagement:
      'Research-grounded engagement: scope an agent’s permissions, design the human-review paths, and define the eval suite. Pen-test-grade validation via a specialist partner.',
    metaTitle: 'AI Agent Security & Permission Governance — Paragonel',
    metaDescription: 'Govern what AI agents are permitted to do — permission scoping, human-in-the-loop, action audit, pre-deployment eval.',
    status: 'specialist',
  },

  // ── 10 Quality Engineering & Software Reliability (specialist) ──────────
  {
    slug: 'test-architecture-reliability',
    domainSlug: 'quality-engineering',
    name: 'Test Architecture & Reliability Engineering',
    tagline: 'Automated quality by construction, not by hope.',
    problem:
      'Teams rely on manual QA and late-stage testing; regressions ship to production, reliability degrades under load, and the cost of a defect grows the later it is caught.',
    deliverable:
      'Test architecture (unit/integration/regression), continuous quality engineering integrated into CI, and reliability engineering (SLOs, error budgets). Performance, load, stress and chaos testing delivered via specialist support where deep infrastructure is required.',
    why: 'Quality is a property of the architecture and the pipeline, not a final gate. Tests that run on every change catch regressions cheaply; SLOs make reliability measurable instead of aspirational.',
    tech: ['Test architecture', 'CI quality gates', 'SLOs / error budgets', 'Regression suites', 'Specialist: load/chaos'],
    engagement:
      'Test-architecture engagement or ongoing quality-engineering support. Load/chaos/stress via specialist partner when required.',
    metaTitle: 'Test Architecture & Reliability Engineering — Paragonel',
    metaDescription: 'Automated test architecture, CI quality gates and reliability engineering. Load/chaos via specialist support.',
    status: 'specialist',
  },

  // ── 11 Industry-Specific Digital Solutions (specialist) ─────────────────
  {
    slug: 'industry-solution-discovery',
    domainSlug: 'industry-solutions',
    name: 'Industry Solution Discovery & Engineering',
    tagline: 'Real workflow gaps, by industry — then a scoped system to address them.',
    problem:
      'Industries share a pattern: workflows that organizations have normalized but that waste money, time and labour — fragmented data, manual reconciliation, poor visibility, preventable errors, and software that is overpriced or difficult to adopt. Generic tools do not fit the specific workflow.',
    deliverable:
      'Industry-grounded solution discovery (the real workflow, the gap, the cost) followed by a scoped system to address it — from a focused tool that removes one recurring headache to a multi-module platform. Regulated verticals (healthcare administration, government) delivered with specialist partners; see /industries for the pattern by sector.',
    why: 'A defensible system is built against a specific workflow gap, not a generic category. Paragonel’s products (AcquisitionOS for sales, CodeGuard AI for developer tooling) are the proof that vertical depth beats horizontal breadth.',
    tech: ['Workflow discovery', 'Domain modelling', 'Mixed stack per industry', 'Specialist partners (regulated)'],
    engagement:
      'Discovery engagement first — document the workflow and the gap, then propose a scoped build. No outcome metric is claimed without a measured source; no fake case studies.',
    metaTitle: 'Industry Solution Discovery & Engineering — Paragonel',
    metaDescription: 'Industry-grounded solution discovery and scoped engineering — real workflow gaps, no fabricated case studies.',
    status: 'specialist',
  },

  // ── 12 IoT, Embedded & Edge Systems (research) ──────────────────────────
  {
    slug: 'iot-edge-research',
    domainSlug: 'iot-embedded-edge',
    name: 'IoT, Embedded & Edge Systems (Research)',
    tagline: 'Exploring device connectivity, embedded software and edge compute.',
    problem:
      'Device data is siloed; edge processing is underused; hardware/software integration is hard to scope without a partner. No mature Paragonel offering exists yet in this space.',
    deliverable:
      'Currently research and prototyping only — device connectivity patterns, embedded software approaches, edge-compute architecture. Not delivered as an established service; revisit via a specialist hardware partner.',
    why: 'IoT and edge are strategically relevant to the long-term platform vision but require hardware dependency and partnership Paragonel has not yet validated. Listed honestly as research, not as a current capability.',
    tech: ['Device connectivity (research)', 'Embedded software (research)', 'Edge compute (research)', 'Sensor data (research)'],
    engagement:
      'Research / exploratory conversations only at this stage. No delivery is promised. Engage via /contact if you have a hardware partnership and want to explore.',
    metaTitle: 'IoT, Embedded & Edge Systems (Research) — Paragonel',
    metaDescription: 'Research-stage exploration of IoT, embedded software and edge computing — not an established delivery service.',
    status: 'research',
  },

  // ── 13 Emerging Technology & Applied Research (research) ────────────────
  {
    slug: 'emerging-tech-research',
    domainSlug: 'emerging-technology',
    name: 'Emerging Technology & Applied Research',
    tagline: 'Applied research into the next frontier — labelled as research.',
    problem:
      'Digital twins, robotics software, spatial/AR-VR, distributed ledgers, edge-AI and new human-computer interfaces are commercially relevant in places, but the relevance is uneven and the maturity is low. Adopting them prematurely is expensive; ignoring them is risky.',
    deliverable:
      'Applied research and feasibility assessment — where a given emerging technology is commercially relevant, where it is not, and what validation is required before investing. Prototyping where justified. Not delivered as an established service.',
    why: 'The honest stance on emerging technology is to research it, validate it, and separate what is ready from what is not — the same stance Paragonel applies to its own product roadmap. Trendy technologies are not added to the catalogue to look large.',
    tech: ['Digital twins (research)', 'Robotics software (research)', 'Spatial / AR-VR (research)', 'Distributed ledgers (research)', 'Edge-AI (research)'],
    engagement:
      'Research / feasibility engagement only. No delivery of production emerging-tech systems is promised. Engage via /contact to discuss a specific research question.',
    metaTitle: 'Emerging Technology & Applied Research — Paragonel',
    metaDescription: 'Applied research into digital twins, robotics software, spatial/AR-VR, distributed ledgers and edge-AI — labelled as research.',
    status: 'research',
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

/** Resolve a domain's delivery status (defaults to 'deliver-now'). */
export function getDomainStatus(d: ServiceDomain): CapabilityStatus {
  return d.status ?? 'deliver-now';
}

/** Resolve an offering's delivery status (defaults to its domain's status). */
export function getOfferingStatus(o: ServiceOffering): CapabilityStatus {
  if (o.status) return o.status;
  const domain = DOMAINS.find((d) => d.slug === o.domainSlug);
  return getDomainStatus(domain ?? DOMAINS[0]);
}

/** Domains grouped by status, for status-aware rendering on /services. */
export function getDomainsByStatus(): Record<CapabilityStatus, ServiceDomain[]> {
  const out: Record<CapabilityStatus, ServiceDomain[]> = { 'deliver-now': [], specialist: [], research: [] };
  for (const d of DOMAINS) out[getDomainStatus(d)].push(d);
  return out;
}
