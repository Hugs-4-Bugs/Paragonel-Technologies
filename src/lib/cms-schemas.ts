/**
 * Shared CMS validation + payload builders (Phase 4, IU-0 slice 2).
 *
 * Server-side zod schemas for the jobs and blogPosts CMS. Used by every
 * `/api/admin/jobs/**` and `/api/admin/blog/**` route so create + update share
 * one authoritative validation path (the client forms have their own copies for
 * UX feedback, but the server re-validates and is the source of truth).
 *
 * Payload builders normalize the validated form values into the exact Firestore
 * document shape the existing UI reads (so migrating admin pages to the API
 * changes no field names or types).
 */
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

/* -------------------------------------------------------------------------- */
/* Jobs                                                                        */
/* -------------------------------------------------------------------------- */

const JOB_DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Sales'];
const JOB_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship'];
const JOB_ARRANGEMENTS = ['Remote', 'Onsite', 'Hybrid'];
/** Optional seniority bands a job may target (05R matching; absent = N/A). */
const JOB_SENIORITY = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];

/**
 * Shared job form schema (create + edit). Matches the client `jobSchema`.
 *
 * 05R adds OPTIONAL matching fields (preferredSkills, seniority,
 * educationRequired). They are optional so legacy jobs + the existing admin
 * form continue to validate; the matching engine treats absent fields as
 * "not applicable" (weight redistributed) rather than inventing requirements.
 */
export const jobFormSchema = z.object({
  jobId: z.string().min(3, 'Job ID is required (e.g. ABC123)'),
  title: z.string().min(2, 'Job title is required'),
  department: z.enum(JOB_DEPARTMENTS as [string, ...string[]]),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(JOB_TYPES as [string, ...string[]]),
  workArrangement: z.enum(JOB_ARRANGEMENTS as [string, ...string[]]),
  experienceRequired: z.string().min(1, 'Experience range is required'),
  salaryRange: z.string().optional(),
  skills: z.string().min(2, 'At least one skill is required'),
  // 05R: optional preferred skills (comma-list -> string[]). Distinct from the
  // required `skills` list so the matcher can weigh them lower + avoid double-
  // counting a skill that appears in both.
  preferredSkills: z.string().max(500).optional().or(z.literal('')),
  // 05R: optional seniority band + education requirement. Absent = N/A.
  seniority: z.enum(JOB_SENIORITY as [string, ...string[]]).optional().or(z.literal('')),
  educationRequired: z.string().max(300).optional().or(z.literal('')),
  description: z.string().min(50, 'Full job description is required'),
  deadline: z.string().optional(),
  status: z.string().default('Active'),
});
export type JobFormValues = z.infer<typeof jobFormSchema>;

/* -------------------------------------------------------------------------- */
/* Applications + Leads (CRM) — PATCH schemas                                  */
/* -------------------------------------------------------------------------- */
/* No dedicated CRM permission exists in rbac.ts, so these collections reuse
 * cms.* (matching blog/services). The schemas replace the inline
 * ALLOWED_STATUSES allowlists + unbounded string acceptance that left the
 * PATCH bodies un-validated. Every field is `.optional()` so a PATCH can
 * update any subset; the route rejects an empty patch. */

const APPLICATION_STATUSES = [
  'New',
  'Reviewing',
  'Shortlisted',
  'Interview Scheduled',
  'Rejected',
  'Hired',
] as const;
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Closed'] as const;

/**
 * PATCH body for /api/admin/applications/[id] — status / soft-delete / restore
 * / internalNotes. `internalNotes` capped at 5000 chars (was unbounded).
 */
export const applicationPatchSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  deletedAt: z.enum(['soft', 'restore']).optional(),
  internalNotes: z.string().max(5000).optional(),
});
export type ApplicationPatchValues = z.infer<typeof applicationPatchSchema>;

/**
 * PATCH body for /api/admin/leads/[id] — status / soft-delete / restore.
 */
export const leadPatchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  deletedAt: z.enum(['soft', 'restore']).optional(),
});
export type LeadPatchValues = z.infer<typeof leadPatchSchema>;

/* -------------------------------------------------------------------------- */
/* Testimonials — founder-confirmed client feedback (Prompt 05K §2/§11.1)      */
/* -------------------------------------------------------------------------- */
/* Original feedback is OPTIONAL at create time so a draft can be created with
 * just the company name while the founder awaits the client's real feedback.
 * A testimonial renders publicly ONLY when status==='published' AND
 * permissionDisplayFeedback===true AND there is a non-empty quote. No feedback
 * is ever fabricated — the founder supplies the real client wording. Company
 * name + designation are individually permission-gated so a company-attributed
 * quote can be credible without disclosing an individual's identity. */

const TESTIMONIAL_STATUSES = ['draft', 'pending', 'published'] as const;

export const testimonialSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  originalQuote: z.string().max(2000).optional(),
  approvedQuote: z.string().max(2000).optional(),
  clientName: z.string().max(120).optional(),
  designation: z.string().max(120).optional(),
  logoUrl: z.string().max(500).optional(),
  projectRef: z.string().max(120).optional(),
  permissionDisplayFeedback: z.boolean().default(false),
  permissionDisplayName: z.boolean().default(false),
  permissionDisplayLogo: z.boolean().default(false),
  status: z.enum(TESTIMONIAL_STATUSES).default('draft'),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export type TestimonialFormValues = z.infer<typeof testimonialSchema>;

/** The quote shown publicly: approved version if present, else the original. */
export function publicQuote(t: { approvedQuote?: string; originalQuote?: string }): string {
  const approved = (t.approvedQuote ?? '').trim();
  const original = (t.originalQuote ?? '').trim();
  return approved || original;
}

export function buildTestimonialCreatePayload(values: TestimonialFormValues): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    companyName: values.companyName,
    originalQuote: values.originalQuote ?? '',
    approvedQuote: values.approvedQuote ?? '',
    clientName: values.clientName ?? '',
    designation: values.designation ?? '',
    logoUrl: values.logoUrl ?? '',
    projectRef: values.projectRef ?? '',
    permissionDisplayFeedback: values.permissionDisplayFeedback,
    permissionDisplayName: values.permissionDisplayName,
    permissionDisplayLogo: values.permissionDisplayLogo,
    status: values.status,
    displayOrder: values.displayOrder,
    isActive: values.status === 'published' && values.permissionDisplayFeedback,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function buildTestimonialUpdatePayload(values: TestimonialFormValues): Record<string, unknown> {
  return {
    companyName: values.companyName,
    originalQuote: values.originalQuote ?? '',
    approvedQuote: values.approvedQuote ?? '',
    clientName: values.clientName ?? '',
    designation: values.designation ?? '',
    logoUrl: values.logoUrl ?? '',
    projectRef: values.projectRef ?? '',
    permissionDisplayFeedback: values.permissionDisplayFeedback,
    permissionDisplayName: values.permissionDisplayName,
    permissionDisplayLogo: values.permissionDisplayLogo,
    status: values.status,
    displayOrder: values.displayOrder,
    isActive: values.status === 'published' && values.permissionDisplayFeedback,
    updatedAt: Timestamp.now(),
  };
}

export function buildTestimonialStatusPayload(status: TestimonialFormValues['status']): Record<string, unknown> {
  // isActive is re-derived from the new status; permissionDisplayFeedback is
  // read from the existing doc in the route before this is merged.
  return { status, updatedAt: Timestamp.now() };
}

/* -------------------------------------------------------------------------- */
/* Client Projects — founder-confirmed client engagements (Prompt 05L §2)      */
/* -------------------------------------------------------------------------- */
/* Full CMS CRUD for client projects/case studies. The public Selected Work
 * surface merges these published entries with the static product entries.
 * scope/services/technologies are OPTIONAL so a project can be published with
 * just the verified company name + engagement type while the founder supplies
 * fuller detail later — no scope is ever invented. */

const CLIENT_PROJECT_STATUSES = ['draft', 'published'] as const;
/** Icon key → Lucide icon mapping lives in selected-work-section.tsx. */
const CLIENT_PROJECT_ICONS = ['folder', 'globe', 'code', 'server', 'rocket'] as const;

export const clientProjectSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  projectTitle: z.string().min(2, 'Project title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, hyphens/numbers only'),
  description: z.string().min(10, 'Description is required').max(2000),
  scope: z.string().max(2000).optional(),
  servicesDelivered: z.string().max(1000).optional(), // comma-list → array
  technologies: z.string().max(1000).optional(), // comma-list → array
  websiteUrl: z.string().max(500).optional(),
  mediaUrls: z.string().max(2000).optional(), // comma-list → array
  logoUrl: z.string().max(500).optional(),
  iconKey: z.enum(CLIENT_PROJECT_ICONS).default('folder'),
  permissionDisplayName: z.boolean().default(true),
  permissionDisplayLogo: z.boolean().default(false),
  status: z.enum(CLIENT_PROJECT_STATUSES).default('draft'),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export type ClientProjectFormValues = z.infer<typeof clientProjectSchema>;

function splitList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function buildClientProjectCreatePayload(values: ClientProjectFormValues): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    companyName: values.companyName,
    projectTitle: values.projectTitle,
    slug: values.slug,
    description: values.description,
    scope: values.scope ?? '',
    servicesDelivered: splitList(values.servicesDelivered),
    technologies: splitList(values.technologies),
    websiteUrl: values.websiteUrl ?? '',
    mediaUrls: splitList(values.mediaUrls),
    logoUrl: values.logoUrl ?? '',
    iconKey: values.iconKey,
    permissionDisplayName: values.permissionDisplayName,
    permissionDisplayLogo: values.permissionDisplayLogo,
    status: values.status,
    displayOrder: values.displayOrder,
    isActive: values.status === 'published',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function buildClientProjectUpdatePayload(values: ClientProjectFormValues): Record<string, unknown> {
  return {
    companyName: values.companyName,
    projectTitle: values.projectTitle,
    slug: values.slug,
    description: values.description,
    scope: values.scope ?? '',
    servicesDelivered: splitList(values.servicesDelivered),
    technologies: splitList(values.technologies),
    websiteUrl: values.websiteUrl ?? '',
    mediaUrls: splitList(values.mediaUrls),
    logoUrl: values.logoUrl ?? '',
    iconKey: values.iconKey,
    permissionDisplayName: values.permissionDisplayName,
    permissionDisplayLogo: values.permissionDisplayLogo,
    status: values.status,
    displayOrder: values.displayOrder,
    isActive: values.status === 'published',
    updatedAt: Timestamp.now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Technology Ecosystem — integrations overview (Prompt 05L §3)               */
/* -------------------------------------------------------------------------- */
/* Admin-managed technology/integration entries. Categories are the four
 * evidence-backed kinds from §3 — live, dev, evaluated, planned. Exploratory
 * vendor discussions (Broadchat, VoiceLink, etc.) are NOT added without
 * evidence + permission. */

const ECOSYSTEM_CATEGORIES = ['live', 'dev', 'evaluated', 'planned'] as const;
const ECOSYSTEM_STATUSES = ['draft', 'published'] as const;

export const techEcosystemSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  category: z.enum(ECOSYSTEM_CATEGORIES),
  relationshipStatus: z.string().min(2, 'Relationship status is required').max(120),
  description: z.string().min(10, 'Description is required').max(1000),
  evidenceReference: z.string().max(500).optional(),
  logoUrl: z.string().max(500).optional(),
  linkUrl: z.string().max(500).optional(),
  publicDisplayPermission: z.boolean().default(false),
  logoPermission: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(ECOSYSTEM_STATUSES).default('draft'),
});
export type TechEcosystemFormValues = z.infer<typeof techEcosystemSchema>;

export function buildTechEcosystemCreatePayload(values: TechEcosystemFormValues): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    organizationName: values.organizationName,
    category: values.category,
    relationshipStatus: values.relationshipStatus,
    description: values.description,
    evidenceReference: values.evidenceReference ?? '',
    logoUrl: values.logoUrl ?? '',
    linkUrl: values.linkUrl ?? '',
    publicDisplayPermission: values.publicDisplayPermission,
    logoPermission: values.logoPermission,
    displayOrder: values.displayOrder,
    status: values.status,
    isActive: values.status === 'published' && values.publicDisplayPermission,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function buildTechEcosystemUpdatePayload(values: TechEcosystemFormValues): Record<string, unknown> {
  return {
    organizationName: values.organizationName,
    category: values.category,
    relationshipStatus: values.relationshipStatus,
    description: values.description,
    evidenceReference: values.evidenceReference ?? '',
    logoUrl: values.logoUrl ?? '',
    linkUrl: values.linkUrl ?? '',
    publicDisplayPermission: values.publicDisplayPermission,
    logoPermission: values.logoPermission,
    displayOrder: values.displayOrder,
    status: values.status,
    isActive: values.status === 'published' && values.publicDisplayPermission,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Split a comma-list skills string into a trimmed, de-duplicated array.
 * Trims whitespace, drops empty entries, and removes duplicates
 * (case-insensitive key, first-seen display form preserved) so a job form
 * entry like "React, react, Node" cannot inflate the required-skills
 * denominator in the matching engine (Prompt §4.2 / §5.3: "Do not allow
 * duplicate skills to inflate the score").
 */
export function splitSkills(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(',')) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Build the Firestore document for a NEW job. Adds server timestamps and the
 * lifecycle fields the public careers page + admin list depend on
 * (isActive, deletedAt, postedDate). `version` starts at 1; it is bumped by the
 * admin route on a material change or a publish transition (05R §7) so the
 * match-trigger event id is stable per published version.
 */
export function buildJobCreatePayload(values: JobFormValues): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    jobId: values.jobId,
    title: values.title,
    department: values.department,
    location: values.location,
    employmentType: values.employmentType,
    workArrangement: values.workArrangement,
    experienceRequired: values.experienceRequired,
    salaryRange: values.salaryRange ?? '',
    skills: splitSkills(values.skills),
    preferredSkills: splitSkills(values.preferredSkills ?? ''),
    seniority: values.seniority || '',
    educationRequired: values.educationRequired || '',
    description: values.description,
    deadline: values.deadline ?? '',
    status: values.status,
    isActive: values.status === 'Active',
    postedDate: now.toMillis(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isDraft: false,
    version: 1,
  };
}

/**
 * Build the update patch for an existing job. Re-derives isActive from status
 * and refreshes skills + updatedAt. Does NOT touch createdAt / deletedAt.
 * `version` is NOT set here — the admin route computes it from the previous doc
 * (bumping only on a material change / publish transition) and merges it.
 */
export function buildJobUpdatePayload(values: JobFormValues): Record<string, unknown> {
  return {
    jobId: values.jobId,
    title: values.title,
    department: values.department,
    location: values.location,
    employmentType: values.employmentType,
    workArrangement: values.workArrangement,
    experienceRequired: values.experienceRequired,
    salaryRange: values.salaryRange ?? '',
    skills: splitSkills(values.skills),
    preferredSkills: splitSkills(values.preferredSkills ?? ''),
    seniority: values.seniority || '',
    educationRequired: values.educationRequired || '',
    description: values.description,
    deadline: values.deadline ?? '',
    status: values.status,
    isActive: values.status === 'Active',
    updatedAt: Timestamp.now(),
  };
}

/** Normalize a PATCH toggle payload `{ isActive: boolean }` into a patch. */
export function buildJobTogglePayload(isActive: boolean): Record<string, unknown> {
  return {
    isActive,
    status: isActive ? 'Active' : 'Draft',
    updatedAt: Timestamp.now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

/** Full create schema (matches the client `blogSchema` in blog/new). */
export const blogCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug is required'),
  category: z.string().min(2, 'Category is required'),
  author: z.string().default('Paragonel Team'),
  thumbnailUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
  excerpt: z.string().max(300, 'Excerpt too long').min(10, 'Excerpt is required'),
  body: z.string().min(50, 'Body content is required'),
  tags: z.string().optional(),
  status: z.enum(['Draft', 'Published', 'Scheduled']),
  metaTitle: z.string().max(60, 'Keep SEO title under 60 chars').optional(),
  metaDescription: z.string().max(160, 'Keep SEO description under 160 chars').optional(),
  focusKeyword: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  publishAt: z.string().optional(),
});
export type BlogCreateValues = z.infer<typeof blogCreateSchema>;

/** Edit schema — a subset (matches the client `blogSchema` in blog/[id]/edit). */
export const blogEditSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug is required'),
  category: z.string().min(2, 'Category is required'),
  author: z.string().default('Paragonel Team'),
  thumbnailUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
  excerpt: z.string().max(300, 'Excerpt too long').min(10, 'Excerpt is required'),
  body: z.string().min(50, 'Body content is required'),
  tags: z.string().optional(),
  status: z.enum(['Draft', 'Published']),
});
export type BlogEditValues = z.infer<typeof blogEditSchema>;

function splitTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Firestore document for a NEW blog post (status drives publishedAt). */
export function buildBlogCreatePayload(values: BlogCreateValues): Record<string, unknown> {
  const now = Timestamp.now();
  const isPublished = values.status === 'Published';
  return {
    title: values.title,
    slug: values.slug,
    category: values.category,
    author: values.author || 'Paragonel Team',
    thumbnailUrl: values.thumbnailUrl || '',
    excerpt: values.excerpt,
    body: values.body,
    tags: splitTags(values.tags),
    status: values.status,
    metaTitle: values.metaTitle ?? '',
    metaDescription: values.metaDescription ?? '',
    focusKeyword: values.focusKeyword ?? '',
    canonicalUrl: values.canonicalUrl ?? '',
    publishAt: values.publishAt ?? '',
    publishedAt: isPublished ? now : null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    isDraft: values.status === 'Draft',
  };
}

/**
 * Update patch for an existing blog post. Sets publishedAt when first published,
 * clears it when moved to Draft, and OMITS it when staying Published (so the
 * original publication timestamp is preserved across content edits).
 */
export function buildBlogEditPayload(
  values: BlogEditValues,
  prevStatus?: string
): Record<string, unknown> {
  const becomingPublished = values.status === 'Published' && prevStatus !== 'Published';
  const patch: Record<string, unknown> = {
    title: values.title,
    slug: values.slug,
    category: values.category,
    author: values.author || 'Paragonel Team',
    thumbnailUrl: values.thumbnailUrl || '',
    excerpt: values.excerpt,
    body: values.body,
    tags: splitTags(values.tags),
    status: values.status,
    isDraft: values.status === 'Draft',
    updatedAt: Timestamp.now(),
  };
  if (becomingPublished) patch.publishedAt = Timestamp.now();
  else if (values.status === 'Draft') patch.publishedAt = null;
  return patch;
}

/** Normalize a PATCH publish/unpublish payload `{ status }` into a patch. */
export function buildBlogTogglePayload(
  status: 'Published' | 'Draft',
  prevStatus?: string
): Record<string, unknown> {
  const becomingPublished = status === 'Published' && prevStatus !== 'Published';
  const patch: Record<string, unknown> = {
    status,
    isDraft: status === 'Draft',
    updatedAt: Timestamp.now(),
  };
  if (becomingPublished) patch.publishedAt = Timestamp.now();
  else if (status === 'Draft') patch.publishedAt = null;
  return patch;
}

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Services CMS schema (Phase 1). The public Services page + homepage section
 * read `title, slug, description, iconName, imageUrl, isActive, order` from the
 * `services` collection. The admin Services CMS was previously client-only
 * (direct Firestore writes), which is blocked by `firestore.rules`
 * (`allow write: if false` on `services`) — so create/edit/delete never worked
 * in production. This schema + the `/api/admin/services/**` routes move all
 * writes server-side via the Admin SDK (which bypasses the rules), mirroring
 * the jobs/blog CMS.
 */
export const serviceFormSchema = z.object({
  title: z.string().min(2, 'Service title is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  iconName: z.string().min(2, 'Icon name is required (e.g. Brain, Cloud)'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  order: z.coerce.number().int().min(0, 'Order must be 0 or higher').default(0),
  isActive: z.boolean().default(true),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

/** Firestore document for a NEW service. */
export function buildServiceCreatePayload(values: ServiceFormValues): Record<string, unknown> {
  const now = Timestamp.now();
  return {
    title: values.title,
    slug: values.slug,
    description: values.description,
    iconName: values.iconName,
    imageUrl: values.imageUrl || '',
    order: values.order,
    isActive: values.isActive,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** Update patch for an existing service (does not touch createdAt/deletedAt). */
export function buildServiceUpdatePayload(values: ServiceFormValues): Record<string, unknown> {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description,
    iconName: values.iconName,
    imageUrl: values.imageUrl || '',
    order: values.order,
    isActive: values.isActive,
    updatedAt: Timestamp.now(),
  };
}

/** Normalize a PATCH toggle payload `{ isActive: boolean }` into a patch. */
export function buildServiceTogglePayload(isActive: boolean): Record<string, unknown> {
  return {
    isActive,
    updatedAt: Timestamp.now(),
  };
}

