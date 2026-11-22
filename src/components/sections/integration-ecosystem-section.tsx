import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Plug, Workflow, BarChart3, AlertCircle } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { BrandIcon, type SimpleIconSlim } from '@/components/brand/brand-icon';
import {
  siNextdotjs, siReact, siTypescript, siNodedotjs, siSpringboot, siPython,
  siAmazonwebservices, siGooglecloud, siDocker, siKubernetes, siTerraform,
  siPostgresql, siFirebase, siGithub, siOpenai, siAnthropic, siGoogle,
  siSlack, siGmail, siWhatsapp, siHubspot, siSalesforce, siZoho,
  siGoogleanalytics, siPosthog, siMixpanel, siVercel, siGitlab, siJira,
  siPostman, siNotion, siFigma, siStripe, siRazorpay, siShopify,
  siN8n, siMake, siZapier,
} from 'simple-icons';

/**
 * IntegrationEcosystemSection — company-level technology + integration
 * ecosystem on the Services page.
 *
 * Three honest, research-led parts (see the integration-ecosystem evidence
 * report — Retool/Vercel/Make/n8n patterns):
 *   1. A compact brand-logo technology marquee — "technologies we work with",
 *      framed as familiarity, NOT a claim that each is a separately delivered
 *      service. Reuses the site's `.pt-marquee` CSS (seamless -50% loop,
 *      pause-on-hover, prefers-reduced-motion → static). Track is duplicated
 *      once so the loop has no visible jump; the duplicate copy is aria-hidden.
 *   2. An integration-capability grid — platforms Paragonel can connect through
 *      APIs, webhooks, SDKs or custom engineering. Each entry is explicitly
 *      labelled an integration CAPABILITY, never a "native integration" or
 *      "official partnership" (zero proven native connectors — see the
 *      candidate inventory). Grouped by category with a one-line action-verb
 *      description (Vercel-style specificity).
 *   3. A conceptual workflow visual — Connect → Automate → Analyze. Clearly
 *      illustrative; NOT a deployed customer integration.
 *
 * Distinct from /our-product's `TechnologyEcosystem` (AcquisitionOS-specific
 * integration STATUS: live/dev/planned/evaluated). No overlap: this section is
 * company-level engineering + integration capability; that one is product-level
 * integration state. Customer/client logos are NOT shown here (Selected Work /
 * testimonials only).
 *
 * Server Component — the marquee is CSS-driven, Reveal handles motion.
 */
type Icon = SimpleIconSlim;

interface TechItem { name: string; icon: Icon; }
interface CapabilityItem { name: string; icon: Icon; action: string; }
interface CapabilityCategory { label: string; items: CapabilityItem[]; }

/** Marquee — technologies Paragonel works with day to day (familiarity). */
const MARQUEE_TECH: TechItem[] = [
  { name: 'Next.js', icon: siNextdotjs },
  { name: 'React', icon: siReact },
  { name: 'TypeScript', icon: siTypescript },
  { name: 'Node.js', icon: siNodedotjs },
  { name: 'Spring Boot', icon: siSpringboot },
  { name: 'Python', icon: siPython },
  { name: 'AWS', icon: siAmazonwebservices },
  { name: 'Google Cloud', icon: siGooglecloud },
  { name: 'Docker', icon: siDocker },
  { name: 'Kubernetes', icon: siKubernetes },
  { name: 'Terraform', icon: siTerraform },
  { name: 'PostgreSQL', icon: siPostgresql },
  { name: 'Firebase', icon: siFirebase },
  { name: 'GitHub', icon: siGithub },
  { name: 'OpenAI', icon: siOpenai },
  { name: 'Anthropic', icon: siAnthropic },
  { name: 'Google AI', icon: siGoogle },
];

/** Integration-capability grid — platforms Paragonel can connect to (custom engineering). */
const CAPABILITY_CATEGORIES: CapabilityCategory[] = [
  {
    label: 'AI & Automation',
    items: [
      { name: 'OpenAI', icon: siOpenai, action: 'Embed LLM reasoning into product workflows.' },
      { name: 'Anthropic', icon: siAnthropic, action: 'Route analysis + drafting to Claude.' },
      { name: 'Google Gemini', icon: siGoogle, action: 'Use Gemini for multimodal + retrieval tasks.' },
      { name: 'n8n', icon: siN8n, action: 'Build self-hosted workflow automation graphs.' },
      { name: 'Make', icon: siMake, action: 'Compose cross-app automations visually.' },
      { name: 'Zapier', icon: siZapier, action: 'Connect business apps with no-code triggers.' },
    ],
  },
  {
    label: 'CRM & Sales',
    items: [
      { name: 'HubSpot', icon: siHubspot, action: 'Sync contacts, deals + pipeline via the HubSpot API.' },
      { name: 'Salesforce', icon: siSalesforce, action: 'Read/write records through Salesforce REST.' },
      { name: 'Zoho CRM', icon: siZoho, action: 'Push lead + deal data to Zoho.' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Slack', icon: siSlack, action: 'Send notifications + bot interactions to channels.' },
      { name: 'Gmail', icon: siGmail, action: 'Send + thread email through the Gmail API.' },
      { name: 'WhatsApp', icon: siWhatsapp, action: 'Send business messages via the WhatsApp Business API.' },
    ],
  },
  {
    label: 'Analytics & Data',
    items: [
      { name: 'Google Analytics', icon: siGoogleanalytics, action: 'Pipe events to GA4 for web analytics.' },
      { name: 'PostHog', icon: siPosthog, action: 'Self-host product analytics + feature flags.' },
      { name: 'Mixpanel', icon: siMixpanel, action: 'Track funnels + retention events.' },
    ],
  },
  {
    label: 'Cloud & Infrastructure',
    items: [
      { name: 'AWS', icon: siAmazonwebservices, action: 'Provision compute, storage + managed services.' },
      { name: 'Google Cloud', icon: siGooglecloud, action: 'Run workloads on GCP managed services.' },
      { name: 'Docker', icon: siDocker, action: 'Containerize applications for portable deploys.' },
      { name: 'Vercel', icon: siVercel, action: 'Ship Next.js frontends to the edge.' },
    ],
  },
  {
    label: 'Developer Workflow',
    items: [
      { name: 'GitHub', icon: siGithub, action: 'Source control + CI via GitHub Actions.' },
      { name: 'GitLab', icon: siGitlab, action: 'CI/CD pipelines + repository hosting.' },
      { name: 'Jira', icon: siJira, action: 'Mirror engineering tickets + sprints.' },
      { name: 'Postman', icon: siPostman, action: 'Design, test + document API contracts.' },
    ],
  },
  {
    label: 'Productivity & Collaboration',
    items: [
      { name: 'Notion', icon: siNotion, action: 'Sync docs + databases via the Notion API.' },
      { name: 'Figma', icon: siFigma, action: 'Pull design tokens + assets into the build.' },
    ],
  },
  {
    label: 'Payments & Commerce',
    items: [
      { name: 'Stripe', icon: siStripe, action: 'Accept payments + manage subscriptions.' },
      { name: 'Razorpay', icon: siRazorpay, action: 'Process India-market payments + payouts.' },
      { name: 'Shopify', icon: siShopify, action: 'Read orders + sync catalog via the Shopify API.' },
    ],
  },
];

/** Workflow visual stages — conceptual, illustrative only. */
const WORKFLOW_STAGES = [
  {
    n: '01',
    icon: Plug,
    title: 'Connect',
    summary: 'Pull data from + push actions to the systems a business already runs, through APIs, webhooks and SDKs.',
    examples: ['REST + GraphQL', 'Webhooks', 'OAuth + API keys'],
  },
  {
    n: '02',
    icon: Workflow,
    title: 'Automate',
    summary: 'Route events through a Paragonel-engineered workflow — with guardrails, retries and human-in-the-loop checkpoints.',
    examples: ['Event pipeline', 'Idempotent handlers', 'Retry + DLQ'],
  },
  {
    n: '03',
    icon: BarChart3,
    title: 'Analyze',
    summary: 'Surface what moved between systems into dashboards, reports and decision-support views whose numbers trace to a source.',
    examples: ['Pipelines + warehouse', 'Dashboards', 'Lineage'],
  },
];

export function IntegrationEcosystemSection() {
  return (
    <section className="pt-section pt-surface-quiet" aria-labelledby="ecosystem-heading">
      <div className="pt-shell">
        {/* Heading */}
        <Reveal>
          <span className="pt-eyebrow">Technology &amp; integration ecosystem</span>
          <h2 id="ecosystem-heading" className="pt-h1 mt-6 text-foreground">
            What we build with — and what we can connect.
          </h2>
          <p className="pt-lead mt-6 max-w-2xl">
            Two honest layers: the technologies Paragonel engineers with day to day, and the
            external platforms we can connect through APIs, webhooks, SDKs or custom engineering.
            These are capabilities and familiarity — not claimed native integrations or official
            partnerships. Verified product-level integration status lives on the Our Product page.
          </p>
        </Reveal>

        {/* 1. Technology marquee */}
        <Reveal variant="fade">
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Technologies we work with — familiarity, not a delivered-service claim
            </p>
            <div className="overflow-hidden border-y border-border py-5">
              {/* Single track with the set duplicated enough times to always
                  fill ≥2× the viewport. `.pt-marquee` animates translateX to
                  -50%; because the track is an even number of identical copies,
                  the content at 0% and -50% is identical → the loop is seamless
                  with no visible jump. The first copy is AT-visible; every
                  duplicate copy is aria-hidden so screen readers announce each
                  brand exactly once. prefers-reduced-motion → static (CSS). */}
              <ul className="pt-marquee" aria-label="Technologies Paragonel works with">
                {[...MARQUEE_TECH, ...MARQUEE_TECH, ...MARQUEE_TECH, ...MARQUEE_TECH].map((t, i) => (
                  <li
                    key={i}
                    aria-hidden={i >= MARQUEE_TECH.length ? true : undefined}
                    className="flex items-center gap-2.5 px-5"
                  >
                    <BrandIcon icon={t.icon} className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">{t.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* 2. Integration-capability grid */}
        <Reveal variant="fade">
          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Integration capabilities — custom engineering
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Platforms Paragonel can integrate for a product or engagement. Not native connectors,
              not official partnerships — each is an API/webhook/SDK target we engineer against.
            </p>
          </div>
        </Reveal>

        <RevealGroup stagger={0.05} className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {CAPABILITY_CATEGORIES.map((cat) => (
            <RevealItem key={cat.label} variant="fade">
              <div className="h-full rounded-lg border border-border bg-background p-5 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{cat.label}</h3>
                <ul className="space-y-3">
                  {cat.items.map((it) => (
                    <li key={it.name} className="flex items-start gap-2.5">
                      <BrandIcon
                        icon={it.icon}
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{it.name}</span>
                        <span className="block text-xs leading-snug text-muted-foreground">{it.action}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* 3. Conceptual workflow visual */}
        <Reveal variant="fade">
          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              How an integration engagement flows — illustrative
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              A conceptual view of how APIs, data and business systems interact in work Paragonel
              engineers. Illustrative architecture — not a deployed customer integration.
            </p>
          </div>
        </Reveal>

        <RevealGroup stagger={0.08} className="mt-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            {WORKFLOW_STAGES.map((s, i) => (
              <RevealItem key={s.n} variant="fade" className="contents">
                <div className="rounded-lg border border-border bg-background p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="pt-index text-xs">{s.n}</span>
                    <s.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-4 flex-grow">{s.summary}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {s.examples.map((ex) => (
                      <li key={ex} className="rounded-full border border-border px-2.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div className="hidden md:flex items-center justify-center" aria-hidden="true">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </RevealItem>
            ))}
          </div>
        </RevealGroup>

        {/* Honest framing + CTA */}
        <Reveal>
          <div className="mt-10 rounded-lg border border-border bg-secondary/20 p-5 flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Vendors explored through meetings, demos or sandbox accounts — but without a signed
              partnership or production integration — are not listed as confirmed. No count of
              &ldquo;connected apps&rdquo; is claimed. Showing a brand mark identifies a platform
              Paragonel can engineer against; it does not imply endorsement, certification or an
              official partnership. Customer engagements are listed separately on Selected Work.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="pt-btn pt-btn-primary">
              Discuss an integration <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/our-product" className="pt-btn pt-btn-ghost">
              Verified product integration status <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
