/**
 * services-content.ts — the four primary service categories (Phase 2 §3).
 *
 * Single source of truth for the Services landing cards (baseServices parity)
 * AND the four detail pages. Each service has a DISTINCT architecture/data-flow
 * diagram (stages array) so the four pages are not copies with different labels.
 *
 * Capability lists match the founder's exact taxonomy. No fabricated metrics,
 * no unverified client outcomes. Product/project references are limited to
 * Paragonel's own verified work (AcquisitionOS private beta, CodeGuard AI on
 * the VS Code Marketplace, SystemFoundry internal tool).
 */
import type { LucideIcon } from 'lucide-react';
import { Brain, Code2, Cloud, BarChart3 } from 'lucide-react';

export interface ServiceCapability {
  title: string;
  description: string;
}

export interface ServiceContent {
  slug: string;
  key: 'ai-solutions' | 'custom-software' | 'cloud-devops' | 'data-analytics';
  title: string;
  shortTitle: string;
  tagline: string;       // one-line positioning for cards / mega-menu
  iconName: string;      // matches iconMap in services-section
  icon: LucideIcon;
  imageUrl: string;
  order: number;
  /** Short card description (used on /services + homepage). */
  description: string;
  /** Longer intro for the detail hero. */
  intro: string;
  problem: string;
  solution: string;
  capabilities: ServiceCapability[];
  /** Distinct per service. */
  diagram: {
    eyebrow: string;
    title: string;
    caption: string;
    stages: { label: string; icon: string }[];
  };
  techStack: string;
  deliverables: string;
  engagement: string;
  explicit: string;
  metaTitle: string;
  metaDescription: string;
}

export const servicesContent: ServiceContent[] = [
  {
    slug: 'ai-solutions',
    key: 'ai-solutions',
    title: 'AI Solutions',
    shortTitle: 'AI Solutions',
    tagline: 'Intelligent systems that automate work, improve decisions, and personalize experiences.',
    iconName: 'Brain',
    icon: Brain,
    imageUrl: '/images/ai-abstract.png',
    order: 1,
    description:
      'Build intelligent systems that automate repetitive work, improve decision-making, and deliver personalized customer experiences. Retrieval-augmented generation, agentic orchestration, and LLM operations inside your cloud boundary, with your own provider keys.',
    intro:
      'We integrate large language models into real product workflows — not a chatbot bolted on after the fact, but retrieval, reasoning, and generation built into the core of how your product works. Inside your own cloud boundary, with your own provider keys, and with the evaluation harness that tells you when it is actually working.',
    problem:
      'Most teams that "add AI" end up with a prompt someone pastes into a model, with no retrieval, no evaluation, no guardrails, and no idea what it costs or when it hallucinates. The demo excites in a meeting and embarrasses in production. The gap between an AI demo and an AI capability that ships is engineering — retrieval design, evaluation, operations, and the discipline to say "missing" instead of guessing. Unreliable AI is worse than no AI: it erodes trust the moment it confidently invents a wrong answer.',
    solution:
      'We start from the workflow you want AI to assist, not from the model. We design the retrieval that grounds output in your data, the guardrails that bound it, and the evaluation that measures it. We integrate inside your existing cloud boundary so your data does not leave a perimeter you control, and we wire bring-your-own provider keys so the model choice and the spend stay yours. AI output is framed as signals, drafts, and suggested scores — a human decides and acts. We do not build unsupervised decision systems into high-stakes workflows.',
    capabilities: [
      { title: 'AI Agents', description: 'Multi-step agents that retrieve, reason, and act under human-defined guardrails — the same pattern we use in AcquisitionOS for research, scoring, and personalization.' },
      { title: 'Internal AI Copilots', description: 'Copilots embedded in your internal tools that draft, summarize, and classify so your team handles the judgment, not the busywork.' },
      { title: 'Knowledge Assistants', description: 'Retrieval-augged assistants grounded in your documents and data, citing a source instead of hallucinating, with a chunking and evaluation strategy behind them.' },
      { title: 'Customer Support Automation', description: 'Triage, routing, and draft replies that cut handle time without pretending the model is the final answer — a human reviews before anything reaches the customer.' },
      { title: 'Document Intelligence', description: 'Extraction, classification, and structuring of unstructured documents into fields your systems can act on, with confidence scores and human-in-the-loop review.' },
    ],
    diagram: {
      eyebrow: 'AI / RAG architecture',
      title: 'From data sources to evaluated AI output',
      caption: 'A retrieval-augmented, orchestrated pipeline that grounds LLM output in your data and measures when it is working.',
      stages: [
        { label: 'Data Sources', icon: 'Database' },
        { label: 'Ingestion', icon: 'ArrowDownToLine' },
        { label: 'Chunking / Embeddings', icon: 'Scissors' },
        { label: 'Vector Database', icon: 'Boxes' },
        { label: 'Retrieval', icon: 'Search' },
        { label: 'LLM Orchestration', icon: 'Brain' },
        { label: 'Evaluation', icon: 'Gauge' },
        { label: 'Application', icon: 'LayoutDashboard' },
      ],
    },
    techStack: 'Next.js / Node backends, Python services, Genkit + Google Gemini, OpenAI / Anthropic / Google AI via customer keys, vector stores (pgvector / Pinecone-class), Spring Boot where Java is the existing stack.',
    deliverables: 'A retrieval pipeline, an evaluation harness, prompt and model versioning, cost monitoring, guardrail definitions, and a documented handover so your team can operate it.',
    engagement: 'Fixed-scope AI integration projects, or retainer-based LLM-ops support for a product already in production.',
    explicit:
      'We do not promise that AI output is a prediction or a guaranteed outcome. We build AI-assisted systems where a human decides. We will not ship an unsupervised decision system into a high-stakes workflow, and we will not claim accuracy or cost-reduction numbers for your use case until we have measured them against your data.',
    metaTitle: 'AI Solutions — AI Agents, Copilots & Knowledge Assistants | Paragonel',
    metaDescription: 'Paragonel builds intelligent systems — AI agents, internal copilots, knowledge assistants, support automation, and document intelligence — grounded in your data with evaluation and human oversight.',
  },
  {
    slug: 'custom-software',
    key: 'custom-software',
    title: 'Custom Software Development',
    shortTitle: 'Custom Software',
    tagline: 'Scalable software tailored to your business processes and growth objectives.',
    iconName: 'Code2',
    icon: Code2,
    imageUrl: '/images/saas-platform-dashboard.png',
    order: 2,
    description:
      'Design and build scalable software tailored to your business processes and growth objectives. Full-lifecycle product engineering — architecture, MVP, scaled platform, and ongoing maintenance — from a team that ships its own products.',
    intro:
      'We design and build software around your actual business processes, not around a template. From architecture and MVP to a scaled, maintained platform, we take products from idea to live users — including our own (AcquisitionOS, SystemFoundry, CodeGuard AI) — so we understand what it takes to ship and operate software that real people rely on.',
    problem:
      'Off-the-shelf software forces your business to fit the tool. Custom builds from generic agencies often look like a product for a quarter and feel like a maintenance nightmare for a decade: unclear architecture, no ownership of the data model, no deployment story, and a handover that leaves your team unable to change anything without the original vendor. Software that does not match how your business actually works becomes friction, not leverage.',
    solution:
      'We start from the business process and the data model, not from a UI mock. We architect for the scale you are heading toward, build in small verifiable increments, and own the deployment and observability story from day one — so the software is operable by your team, not just buildable by ours. We hand over code, documentation, and runbooks that let your engineers (or ours, on retainer) keep the product evolving without a vendor lock-in cliff.',
    capabilities: [
      { title: 'SaaS Platforms', description: 'Multi-tenant SaaS products with auth, billing, usage metering, and an admin/tenant data model designed for your domain.' },
      { title: 'Enterprise Applications', description: 'Internal enterprise systems that integrate with your existing stack and replace spreadsheets and manual handoffs with a real workflow.' },
      { title: 'Internal Business Systems', description: 'Tools for your own teams — ops, finance, HR, ops-intelligence — that capture the process instead of forcing the process into a generic tool.' },
      { title: 'Workflow Automation', description: 'Event-driven automation that connects your systems end-to-end, with human checkpoints where judgment is required.' },
      { title: 'Customer Portals', description: 'Self-service portals that let your customers do what they need without a support ticket, securely and with the right data isolation.' },
      { title: 'Database Engineering', description: 'Schema design, indexing, partitioning, and query performance for transactional and analytical workloads — a data model that stays correct and fast as volume grows, with migrations that do not lock the business.' },
    ],
    diagram: {
      eyebrow: 'Product engineering lifecycle',
      title: 'From business process to operable platform',
      caption: 'A build lifecycle anchored in the data model and the deployment story, not just the UI.',
      stages: [
        { label: 'Process Discovery', icon: 'ClipboardList' },
        { label: 'Architecture', icon: 'DraftingCompass' },
        { label: 'Data Model', icon: 'Database' },
        { label: 'Build (Iterative)', icon: 'Code2' },
        { label: 'Integrate', icon: 'Workflow' },
        { label: 'Test / QA', icon: 'ShieldCheck' },
        { label: 'Deploy', icon: 'Rocket' },
        { label: 'Operate / Maintain', icon: 'Activity' },
      ],
    },
    techStack: 'Next.js / React frontends, Node / Spring Boot backends, PostgreSQL / Firestore data layers, REST + webhook integrations, infrastructure as code, CI/CD from day one.',
    deliverables: 'A working application, the data model and architecture documentation, a deployment and runbook, test coverage for the critical paths, and a handover that leaves your team in control.',
    engagement: 'Fixed-scope product builds (MVP to scaled platform) or a dedicated retainer engagement with a defined delivery cadence.',
    explicit:
      'We will not quote a fixed price for a product we have not scoped against your actual process. We will not promise a launch date without a corresponding scope and a deployment target. We do not abandon software after launch — every build comes with an operability handover.',
    metaTitle: 'Custom Software Development — SaaS, Enterprise & Workflow Systems | Paragonel',
    metaDescription: 'Paragonel designs and builds scalable custom software — SaaS platforms, enterprise applications, internal systems, workflow automation, and customer portals — tailored to your business.',
  },
  {
    slug: 'cloud-devops',
    key: 'cloud-devops',
    title: 'Cloud & DevOps',
    shortTitle: 'Cloud & DevOps',
    tagline: 'Modernize infrastructure, improve reliability, and deploy faster with cloud-native solutions.',
    iconName: 'Cloud',
    icon: Cloud,
    imageUrl: '/images/cloud-abstract.png',
    order: 3,
    description:
      'Modernize infrastructure, improve reliability, and deploy software faster with cloud-native solutions. Cloud migration, infrastructure as code, CI/CD automation, observability, and scalability engineering — the high-concurrency platform work our founder built at Netcore Cloud.',
    intro:
      'We architect and operate cloud infrastructure that lets your team ship frequently and safely. Infrastructure as code, automated CI/CD with rollback paths, observability that tells you what is happening before a customer does, and scalability engineering for the load you are heading toward — not just the load you have today.',
    problem:
      'Teams inherit infrastructure that was hand-configured years ago: no infrastructure as code, deployments that require a specific person, no rollback path, and observability that means "we know something broke when a customer tells us." Every deploy is a risk, scaling is a fire drill, and the cloud bill grows without anyone knowing what is actually spending. The cost is not just money — it is the velocity the team loses being afraid of its own platform.',
    solution:
      'We treat infrastructure as a product: versioned, reviewed, and deployed through the same discipline as application code. We migrate workloads without a flag day, build CI/CD with automated rollback so a bad deploy is minutes not hours, instrument observability that catches regressions before users do, and engineer for the scalability curve ahead. Cost control is built in — you see what spends and why. The platform our founder helped run at Netcore Cloud handled high concurrency; we bring that discipline to your stack.',
    capabilities: [
      { title: 'Cloud Migration', description: 'Workload assessment and migration to AWS / GCP without a flag day — incremental, reversible, and validated at each step.' },
      { title: 'CI/CD Automation', description: 'Build pipelines with automated testing, progressive delivery, and one-click rollback so deploys are routine instead of risky.' },
      { title: 'Infrastructure Management', description: 'Infrastructure as code (Terraform-class), versioned and reviewed — no snowflake servers, no "don\'t touch that box" tribal knowledge.' },
      { title: 'Monitoring & Observability', description: 'Metrics, logs, traces, and alerts that surface regressions before users do, with SLOs that match what your customers actually care about.' },
      { title: 'Scalability Engineering', description: 'Capacity planning, load testing, and architecture for the concurrency curve ahead — event-driven systems, caching, and partitioning where the load demands it.' },
      { title: 'Distributed Systems Engineering', description: 'Architecture for distributed systems — service boundaries, data consistency, failure isolation, and the operational patterns (retry, backpressure, circuit-breaking) that keep a multi-service system honest under load.' },
      { title: 'Microservices Architecture', description: 'Decomposition into right-sized services with clear contracts, API boundaries, and independent deployability — designed against your actual team and domain boundaries, not a generic microservices template.' },
      { title: 'Event Streaming', description: 'Event-streaming backbones (Kafka-class brokers, event schemas, replay) that decouple producers from consumers and make the system\u2019s real-time flow observable and durable.' },
    ],
    diagram: {
      eyebrow: 'Cloud / DevOps pipeline',
      title: 'From commit to a monitored, scalable production',
      caption: 'A cloud-native delivery pipeline where infrastructure, release, and observability are code — not manual steps.',
      stages: [
        { label: 'Commit', icon: 'GitCommitHorizontal' },
        { label: 'CI Build / Test', icon: 'Hammer' },
        { label: 'IaC Plan', icon: 'Cloud' },
        { label: 'Progressive Deploy', icon: 'Rocket' },
        { label: 'Validate (Canary)', icon: 'ShieldCheck' },
        { label: 'Observability', icon: 'Activity' },
        { label: 'Scale / Rollback', icon: 'Gauge' },
      ],
    },
    techStack: 'AWS / GCP, Terraform / Pulumi, Docker / Kubernetes, GitHub Actions / GitLab CI, OpenTelemetry, Prometheus / Grafana / Sentry-class observability, with cost monitoring wired in.',
    deliverables: 'A versioned infrastructure codebase, a CI/CD pipeline with automated rollback, an observability stack with defined SLOs and alerts, a load-test report, and a runbook for incidents.',
    engagement: 'Fixed-scope migration / platform projects, or a retainer for ongoing reliability and on-call engineering support.',
    explicit:
      'We will not promise "zero downtime" — we promise a rollback path and an SLO with a measured error budget. We will not migrate a workload we have not assessed against your actual dependencies. Cost-reduction claims are backed by a measured before/after, not a percentage invented in a proposal.',
    metaTitle: 'Cloud & DevOps — Migration, CI/CD, IaC & Observability | Paragonel',
    metaDescription: 'Paragonel modernizes cloud infrastructure — migration, CI/CD automation, infrastructure as code, monitoring, and scalability engineering — so your team ships faster and safer.',
  },
  {
    slug: 'data-analytics',
    key: 'data-analytics',
    title: 'Data & Analytics',
    shortTitle: 'Data & Analytics',
    tagline: 'Transform raw data into actionable insights that support better business decisions.',
    iconName: 'BarChart3',
    icon: BarChart3,
    imageUrl: '/images/devops-pipeline.png',
    order: 4,
    description:
      'Transform raw data into actionable insights that support better business decisions. Dashboards, business intelligence, data pipelines, reporting systems, and KPI monitoring — built on a data model that reflects how your business actually measures success.',
    intro:
      'We turn the data your systems already generate into decisions you can defend. Data pipelines that are reliable and documented, dashboards that answer the questions your team actually asks, and KPI monitoring that catches drift before it becomes a missed quarter — grounded in a data model that matches how your business measures success.',
    problem:
      'Most companies are data-rich and insight-poor: raw data sits in five disconnected systems, the "dashboard" is a spreadsheet someone maintains by hand, the KPIs were defined once and never questioned, and nobody trusts the numbers enough to make a hard decision from them. Every report takes a week to produce, by which time the question has moved on. Without a trusted data layer, decisions default to the loudest opinion in the room.',
    solution:
      'We build the pipeline that moves data reliably from source to a model your team can query, define the metrics with the stakeholders who will use them, and ship dashboards that answer real questions instead of decorating a wall. We document the metric definitions so two people reading the same number get the same answer, and we wire KPI monitoring so drift surfaces as an alert, not a retrospective. The data stays in your boundary; we bring the engineering, not a black-box analytics vendor.',
    capabilities: [
      { title: 'Dashboards', description: 'Operational and executive dashboards that answer the questions your team actually asks — designed for the decision, not for the chart library.' },
      { title: 'Business Intelligence', description: 'BI layers over a documented semantic model so any analyst can build a report that agrees with the numbers everyone else sees.' },
      { title: 'Data Pipelines', description: 'Reliable, monitored ingestion and transformation pipelines with lineage and retries — so the dashboard is never showing yesterday\'s broken extract.' },
      { title: 'Reporting Systems', description: 'Scheduled, distributed reports that reach the right people in the right format, with versioned definitions instead of one-off spreadsheets.' },
      { title: 'KPI Monitoring', description: 'KPI definitions with baselines and thresholds that alert on drift before it becomes a missed target, tied to the decisions each KPI is meant to inform.' },
    ],
    diagram: {
      eyebrow: 'Data pipeline architecture',
      title: 'From raw signals to a decision-ready metric',
      caption: 'A data pipeline with lineage, validation, and a documented semantic layer — so the number on the dashboard is defensible.',
      stages: [
        { label: 'Sources', icon: 'Database' },
        { label: 'Ingest (Batch / Stream)', icon: 'ArrowDownToLine' },
        { label: 'Validate', icon: 'ShieldCheck' },
        { label: 'Transform / Model', icon: 'Workflow' },
        { label: 'Semantic Layer', icon: 'Layers' },
        { label: 'Dashboards / Reports', icon: 'BarChart3' },
        { label: 'KPI Alerts', icon: 'Bell' },
      ],
    },
    techStack: 'Python / dbt-class transforms, PostgreSQL / BigQuery-class warehouses, streaming where needed (Kafka-class), BI tooling (Metabase / Looker-class), scheduled reporting, alerting wired to your incident channels.',
    deliverables: 'A documented data pipeline with lineage, a semantic/metric layer with versioned definitions, executive and operational dashboards, scheduled reports, and KPI alerts with baselines.',
    engagement: 'Fixed-scope analytics build-out, or a retainer for ongoing data engineering and metric evolution as the business changes.',
    explicit:
      'We will not ship a dashboard whose numbers we cannot trace to a source. We will not define a KPI without the stakeholder who owns the decision it informs. We do not claim "data-driven transformation" — we deliver a data layer your team can trust and operate.',
    metaTitle: 'Data & Analytics — Dashboards, BI, Pipelines & KPIs | Paragonel',
    metaDescription: 'Paragonel turns raw data into decisions — dashboards, business intelligence, data pipelines, reporting systems, and KPI monitoring on a documented, trusted data layer.',
  },
];

export function getServiceBySlug(slug: string): ServiceContent | undefined {
  return servicesContent.find((s) => s.slug === slug);
}

/** Parity export consumed by the public Services list + homepage cards. */
export const baseServicesV2 = servicesContent.map((s) => ({
  id: `base-${s.key}`,
  title: s.title,
  description: s.description,
  iconName: s.iconName,
  slug: s.slug,
  imageUrl: s.imageUrl,
  isActive: true,
  order: s.order,
}));
