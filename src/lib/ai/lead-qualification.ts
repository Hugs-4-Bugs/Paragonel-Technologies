/**
 * lead-qualification.ts — Paragonel AI lead qualification + capture (Prompt 05P).
 *
 * Extends the 05O knowledge assistant with conversational lead qualification:
 *   - 10 enquiry categories (Phase 2).
 *   - Progressive field collection (Phase 3).
 *   - Consent + capture (Phase 4).
 *   - Structured lead record schema (Phase 5).
 *
 * This module is the SINGLE source of truth for the lead shape, categories, +
 * validation. The /api/lead endpoint + the ChatSection UI import from here so
 * the client + server agree on the schema. The model flow imports the category
 * list for intent classification.
 *
 * Reuses the existing contact infra (submission-security.ts: checkRateLimit,
 * fingerprint, isLikelyDuplicate, consent versions) + the existing `leads`
 * Firestore collection (extended with AI-specific fields) — NOT a duplicate
 * contact system.
 */

/* ----------------------------- categories ----------------------------- */

/**
 * The 10 enquiry categories (Prompt 05P §4). The model classifies a genuine
 * enquiry into one of these. `general` is NOT a sales lead — it's a company
 * question answered normally. `career` directs to /careers (no qualification).
 */
export const ENQUIRY_CATEGORIES = [
  'new_business',
  'ai_development',
  'custom_software',
  'cloud_devops',
  'acquisitionos_beta',
  'partnership',
  'investor',
  'career',
  'existing_client_support',
  'general',
] as const;
export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];

export const ENQUIRY_CATEGORY_LABELS: Record<EnquiryCategory, string> = {
  new_business: 'New business / project enquiry',
  ai_development: 'AI development / AI integration',
  custom_software: 'Custom software / SaaS development',
  cloud_devops: 'Cloud infrastructure / DevOps',
  acquisitionos_beta: 'AcquisitionOS private-beta access',
  partnership: 'Partnership enquiry',
  investor: 'Investor enquiry',
  career: 'Career enquiry',
  existing_client_support: 'Existing client / support enquiry',
  general: 'General company enquiry',
};

/** Categories that represent a genuine business lead (need qualification +
 *  consent + storage). `general` + `career` are NOT leads. */
export const LEAD_CATEGORIES: ReadonlySet<EnquiryCategory> = new Set([
  'new_business',
  'ai_development',
  'custom_software',
  'cloud_devops',
  'acquisitionos_beta',
  'partnership',
  'investor',
  'existing_client_support',
]);

export function isLeadCategory(c: EnquiryCategory | undefined | null): boolean {
  return !!c && LEAD_CATEGORIES.has(c);
}

/* --------------------------- captured fields --------------------------- */

/**
 * Fields collected during qualification (Phase 3). All optional during
 * collection; name + email + businessProblem are required for submission
 * (enforced by leadSchema). Budget + timeline are NEVER forced.
 */
export interface CapturedLeadFields {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  businessProblem?: string;
  requiredService?: string;
  projectDescription?: string;
  scope?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  additionalInfo?: string;
}

export type QualificationStage = 'collecting' | 'reviewing' | 'submitted' | 'cancelled';

export interface QualificationState {
  active: boolean;
  category: EnquiryCategory | null;
  captured: CapturedLeadFields;
  stage: QualificationStage;
}

export const INITIAL_QUALIFICATION_STATE: QualificationState = {
  active: false,
  category: null,
  captured: {},
  stage: 'collecting',
};

/** Merge newly-captured fields into the existing state (client-side). */
export function mergeCaptured(
  existing: CapturedLeadFields,
  incoming: Partial<CapturedLeadFields> | undefined,
): CapturedLeadFields {
  if (!incoming) return existing;
  const merged = { ...existing };
  for (const key of Object.keys(incoming) as (keyof CapturedLeadFields)[]) {
    const v = incoming[key];
    if (typeof v === 'string' && v.trim()) {
      merged[key] = v.trim();
    }
  }
  return merged;
}

/** Does the captured set have the minimum required for submission? */
export function hasMinimumForSubmission(c: CapturedLeadFields): boolean {
  return !!(c.name && c.email && c.businessProblem);
}

/* ------------------------------ lead schema ------------------------------ */

import { z } from 'zod';

/**
 * Zod schema for the /api/lead endpoint (Phase 5). Server-side validation of
 * every submitted field. Field lengths are bounded. consentAcknowledged MUST
 * be true (enforced server-side — a direct API call cannot bypass it).
 * marketingConsent is separate + optional (never bundled). The honeypot
 * `website` field must be empty.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().toLowerCase().email('Valid work email required').max(254),
  company: z.string().trim().max(100, 'Company too long').optional().or(z.literal('')),
  role: z.string().trim().max(100).optional().or(z.literal('')),
  enquiryCategory: z.enum(ENQUIRY_CATEGORIES).refine(
    (c) => c !== 'general' && c !== 'career',
    'This category does not require a lead submission.',
  ),
  businessProblem: z
    .string()
    .trim()
    .min(10, 'Please describe your enquiry (min 10 characters)')
    .max(2000, 'Enquiry too long (max 2000 characters)'),
  requiredService: z.string().trim().max(500).optional().or(z.literal('')),
  projectDescription: z.string().trim().max(2000).optional().or(z.literal('')),
  scope: z.string().trim().max(1000).optional().or(z.literal('')),
  budget: z.string().trim().max(200).optional().or(z.literal('')),
  timeline: z.string().trim().max(200).optional().or(z.literal('')),
  preferredContact: z.string().trim().max(100).optional().or(z.literal('')),
  additionalInfo: z.string().trim().max(2000).optional().or(z.literal('')),
  // Mandatory acknowledgement of the privacy/processing notice (lawful basis).
  // Must be explicitly true — enforced server-side so a direct API call cannot
  // bypass it. NOT a bundling of marketing consent.
  consentAcknowledged: z
    .boolean()
    .refine((v) => v === true, 'Please acknowledge the Privacy Notice to submit your enquiry.'),
  // Optional, separate marketing consent. Never a condition of submission.
  marketingConsent: z.boolean().optional().default(false),
  // Honeypot — must be empty (bots fill hidden fields).
  website: z.string().max(0).optional().or(z.literal('')),
});

export type LeadInput = z.infer<typeof leadSchema>;

/* --------------------------- linkedin + routing --------------------------- */

/**
 * Official company LinkedIn profile (founder-supplied, Prompt 05P §6).
 * Used as a human-handoff / company-social destination. NOT a substitute for
 * secure enquiry submission. LinkedIn messaging is NOT integrated.
 */
export const COMPANY_LINKEDIN_URL =
  'https://www.linkedin.com/company/paragonel.vercel.app/home/?viewAsMember=true';

/** Route a lead category to the appropriate internal page / channel. */
export function routeForCategory(c: EnquiryCategory): { path: string; label: string } {
  switch (c) {
    case 'career':
      return { path: '/careers', label: 'Careers page' };
    case 'acquisitionos_beta':
      return { path: '/our-product/acquisitionos', label: 'AcquisitionOS (private beta)' };
    case 'partnership':
    case 'investor':
    case 'new_business':
    case 'ai_development':
    case 'custom_software':
    case 'cloud_devops':
    case 'existing_client_support':
    default:
      return { path: '/contact', label: 'Contact Paragonel' };
  }
}
