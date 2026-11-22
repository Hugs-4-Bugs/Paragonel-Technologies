/**
 * industries-data.ts — Paragonel industry-solution patterns (Prompt 05E §4/§6).
 *
 * Source of truth for the /industries route. Each entry communicates Paragonel's
 * problem-solving RANGE in an industry — common operational problems, why
 * workflows become expensive, the type of software/automation that can address
 * them, a possible technical approach, and what needs discovery first.
 *
 * IMPORTANT — content-truth rules:
 *  - Every entry is a SOLUTION PATTERN / EXAMPLE, clearly labelled conceptual.
 *    No fake customers, case studies, metrics, or endorsements.
 *  - The four verified projects (AcquisitionOS, CodeGuard AI, SystemFoundry,
 *    Maa Arogyam) are the only work presented as real — referenced in
 *    `anchorProduct` where a genuine Paragonel product maps to the industry.
 *  - Regulated verticals (healthcare, government) carry `status: 'specialist'`;
 *    others default to the engineering-solutions status. No industry is
 *    presented as a delivered case study.
 *
 * Grounded in docs/MARKET_OPPORTUNITY_RESEARCH.md (research entry cited per
 * industry).
 */
import type { CapabilityStatus } from './services-catalogue';

export interface IndustryPattern {
  slug: string;
  name: string;
  status: CapabilityStatus;
  researchRef: string; // MARKET_OPPORTUNITY_RESEARCH.md entry id
  problems: string[];
  whyExpensive: string;
  solutionTypes: string[];
  approach: string;
  discoveryNeeded: string;
  anchorProduct?: string; // verified Paragonel product that maps here (no fake case study)
  geography: 'Global' | 'India-specific' | 'Global + India';
}

export const INDUSTRIES: IndustryPattern[] = [
  {
    slug: 'b2b-saas-sales',
    name: 'B2B SaaS & Sales Technology',
    status: 'deliver-now',
    researchRef: 'P-20',
    problems: [
      'Client-acquisition workflow fragmented across 5+ disconnected tools (research, scoring, outreach, CRM).',
      'Manual research per prospect; AI bolted onto CRM as a chatbot, not native to the workflow.',
    ],
    whyExpensive:
      'Rep time on manual research and follow-ups; missed opportunities from slow, generic outreach; low conversion from disconnected signals.',
    solutionTypes: ['AI-native acquisition platform', 'Signal + opportunity intelligence', 'Human-in-the-loop outreach'],
    approach:
      'A connected acquisition system — discover → research → score → personalize → outreach → reply → pipeline → proposal → close — with human-in-the-loop on consequential actions and missing information kept missing.',
    discoveryNeeded:
      'The current tool stack and the manual handoffs between stages; which stages consume the most rep time; the data sources available for enrichment.',
    anchorProduct: 'AcquisitionOS (Private Beta)',
    geography: 'Global',
  },
  {
    slug: 'developer-tooling-platform',
    name: 'Developer Tooling & Platform Engineering',
    status: 'deliver-now',
    researchRef: 'P-02, P-19',
    problems: [
      'Cloud cost overruns from over-provisioned IaC; cost feedback absent at write-time.',
      'Dependency / supply-chain risk unaudited; secrets leak via CI/CD.',
    ],
    whyExpensive:
      'Wasted cloud spend (often a large fraction of the bill); breach exposure from supply-chain and secrets failures (CISA KEV +20% in 2025).',
    solutionTypes: ['Shift-left cost intelligence', 'Supply-chain / SBOM posture', 'Secrets posture in CI'],
    approach:
      'Shift-left analysis inside the developer workflow — cost, supply-chain and secrets posture surfaced at write-time and in CI, before production.',
    discoveryNeeded: 'The IaC stack, the CI/CD pipeline, and the existing security/FinOps tooling gaps.',
    anchorProduct: 'CodeGuard AI (Published)',
    geography: 'Global',
  },
  {
    slug: 'india-smb-msme',
    name: 'India SMB / MSME Operations',
    status: 'deliver-now',
    researchRef: 'P-05, P-06, P-07',
    problems: [
      'Fragmented business software — billing here, inventory there, payments elsewhere; manual reconciliation.',
      'English-only software excludes Indic-language users (870M Indians access content in Indic languages, 2024).',
    ],
    whyExpensive:
      'Manual reconciliation across tools; errors and delayed close; low real-time visibility; exclusion of non-English users limits adoption.',
    solutionTypes: ['Integrated MSME ops platform', 'Multi-source reconciliation', 'Vernacular-first interaction'],
    approach:
      'An integrated operations surface (billing + inventory + payments + reconciliation) with a vernacular UI/voice layer — built for MSME scale and literacy, not enterprise complexity.',
    discoveryNeeded:
      'The specific MSME segment; the existing tools; the Indic languages required; affordability constraints.',
    geography: 'India-specific',
  },
  {
    slug: 'fintech-accounting',
    name: 'Fintech & Accounting',
    status: 'deliver-now',
    researchRef: 'P-05',
    problems: [
      'Month-end reconciliation across multiple payment processors and banks — the "manual QA" of accounting.',
      'Discrepancies missed; delayed close; manual matching labour.',
    ],
    whyExpensive:
      'Hours of manual labour per cycle; errors; missed discrepancies that surface as financial surprises.',
    solutionTypes: ['Unified reconciliation engine', 'Rules + ML matching', 'Discrepancy alerting'],
    approach:
      'A multi-source reconciliation engine that ingests invoices, ledger, bank statements and processor reports, matches with rules + ML, and flags discrepancies for review.',
    discoveryNeeded: 'The processor/bank set; the ledger system; the matching rules currently in use; volume.',
    geography: 'Global + India',
  },
  {
    slug: 'healthcare-administration',
    name: 'Healthcare Administration',
    status: 'specialist',
    researchRef: 'P-08',
    problems: [
      'Revenue-cycle management (scheduling → coding → billing → reimbursement) largely manual.',
      'Manual payment posting (~2 minutes per claim vs seconds automated); complex coding; denial handling.',
    ],
    whyExpensive:
      'Revenue leakage from denied claims; admin overhead; adoption friction (40% of hospitals adopting AI in billing saw a temporary productivity dip).',
    solutionTypes: ['AI coding assist', 'Denial prediction', 'Automated posting'],
    approach:
      'Human-in-the-loop RCM intelligence — coding assistance, denial prediction, and automated posting with review — not an autonomous billing bot.',
    discoveryNeeded:
      'The EHR/billing system; the coding standard; regulatory scope (HIPAA-equivalent). Delivered with a specialist partner for the regulated health-data layer.',
    geography: 'Global',
  },
  {
    slug: 'logistics-supply-chain',
    name: 'Logistics & Supply Chain',
    status: 'specialist',
    researchRef: 'P-09',
    problems: [
      'Point-to-point EDI/email integrations between suppliers, manufacturers and retailers; no networked visibility.',
      'Cannot react dynamically to disruption; stockouts and excess inventory coexist.',
    ],
    whyExpensive:
      'Inventory carrying cost; stockout lost sales; disruption exposure; enterprise SCV tools are overpriced for mid-market.',
    solutionTypes: ['Networked visibility platform', 'Event-driven disruption alerting', 'Mid-market SCV'],
    approach:
      'A networked visibility layer replacing point-to-point integrations — event-driven, with disruption alerting — sized for mid-market, not enterprise pricing.',
    discoveryNeeded: 'The current integration graph; the data sources; the decision-makers; the mid-market pricing envelope.',
    geography: 'Global',
  },
  {
    slug: 'enterprise-it-modernization',
    name: 'Enterprise IT & Legacy Modernization',
    status: 'deliver-now',
    researchRef: 'P-12',
    problems: [
      'Decades-old ERPs/custom systems — expensive to maintain, hard to upgrade, can’t integrate, security-unpatched.',
      'Inflexibility; frequent downtime; cannot comply with modern regulations.',
    ],
    whyExpensive:
      'High maintenance cost; security risk; inability to adapt or integrate with newer systems.',
    solutionTypes: ['Strangler-fig modernization', 'API facades', 'Cloud migration', 'CI/CD introduction'],
    approach:
      'Incremental modernization — strangle the legacy system module by module behind API facades, introduce CI/CD and observability, migrate to cloud where it fits.',
    discoveryNeeded: 'The legacy system graph; the highest-risk/highest-cost module; the integration constraints; the team capacity.',
    geography: 'Global',
  },
  {
    slug: 'government-public-services',
    name: 'Government & Public Services',
    status: 'specialist',
    researchRef: 'P-22',
    problems: [
      'Manual administrative processing; legacy systems; citizen-service friction.',
      'YC explicitly flagged "AI software to automate government administrative tasks" as a funded area.',
    ],
    whyExpensive:
      'Citizen delay; public-sector cost; service failure; procurement and compliance complexity.',
    solutionTypes: ['Admin-process automation', 'Citizen-service portals', 'Workflow interoperability'],
    approach:
      'Human-in-the-loop automation of administrative processing, with audit trails and compliance gating — not autonomous decision systems in regulated public functions.',
    discoveryNeeded:
      'The specific department; the regulatory/procurement scope; the legacy systems. Delivered with a specialist partner for the regulated layer.',
    geography: 'Global + India',
  },
];
