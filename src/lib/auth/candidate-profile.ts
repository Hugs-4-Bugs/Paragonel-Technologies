/**
 * candidate-profile.ts — candidate profile schema + helpers (Prompt 05Q §7).
 *
 * The profile is stored in `candidates/{email}` (server-side via Admin SDK;
 * Firestore rules deny all client access — ownership enforced in the route by
 * matching the session email to the doc id). The account auth lives in
 * `users/{email}` (separate concern); the profile holds the career data.
 *
 * Most fields are optional — the candidate can save a partial profile + return
 * to complete it. Profile completeness is computed honestly (never represent an
 * incomplete profile as complete).
 *
 * 05R-ready preference fields (jobAlertPreference, matchingThreshold) are
 * defined here but NOT acted on in 05Q (no job matching/alerts in this batch).
 */
import { z } from 'zod';
import { CONSENT_NOTICE_VERSION, PRIVACY_POLICY_VERSION, TERMS_VERSION } from '@/lib/submission-security';
import { MIN_THRESHOLD, MAX_THRESHOLD } from '@/lib/matching/preferences';

/* --------------------------- shared sub-schemas --------------------------- */

const UrlSchema = z
  .string()
  .trim()
  .max(300)
  .url('A valid URL is required')
  .optional()
  .or(z.literal(''));

const EmploymentEntrySchema = z.object({
  company: z.string().trim().max(200).optional().or(z.literal('')),
  designation: z.string().trim().max(200).optional().or(z.literal('')),
  startDate: z.string().trim().max(50).optional().or(z.literal('')),
  endDate: z.string().trim().max(50).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

const EducationEntrySchema = z.object({
  qualification: z.string().trim().max(200).optional().or(z.literal('')),
  institution: z.string().trim().max(200).optional().or(z.literal('')),
  year: z.string().trim().max(20).optional().or(z.literal('')),
});

const ProjectEntrySchema = z.object({
  name: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  technologies: z.string().trim().max(500).optional().or(z.literal('')),
  url: UrlSchema,
});

/* ----------------------------- profile schema ----------------------------- */

export const candidateProfileSchema = z.object({
  // Identity + contact.
  fullName: z.string().trim().min(2, 'Full name is required').max(200),
  // email is NOT in the updatable body — it comes from the verified account
  // (set server-side). phone is optional + voluntary.
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  currentLocation: z.string().trim().max(200).optional().or(z.literal('')),
  preferredJobLocation: z.string().trim().max(200).optional().or(z.literal('')),
  linkedinUrl: UrlSchema,
  portfolioUrl: UrlSchema,
  githubUrl: UrlSchema,

  // Professional details.
  headline: z.string().trim().max(200).optional().or(z.literal('')),
  summary: z.string().trim().max(5000).optional().or(z.literal('')),
  totalExperienceYears: z.coerce.number().int().min(0).max(80).optional(),
  totalExperienceMonths: z.coerce.number().int().min(0).max(11).optional(),
  currentDesignation: z.string().trim().max(200).optional().or(z.literal('')),
  employmentHistory: z.array(EmploymentEntrySchema).max(20).optional(),
  skills: z.array(z.string().trim().max(100)).max(50).optional(),
  techStack: z.array(z.string().trim().max(100)).max(50).optional(),
  education: z.array(EducationEntrySchema).max(20).optional(),
  projects: z.array(ProjectEntrySchema).max(20).optional(),
  certifications: z.array(z.string().trim().max(200)).max(30).optional(),
  achievements: z.array(z.string().trim().max(300)).max(30).optional(),

  // Preferences.
  preferredRoles: z.array(z.string().trim().max(200)).max(20).optional(),
  preferredEmploymentType: z
    .enum(['full-time', 'part-time', 'contract', 'internship', 'any'])
    .optional(),
  preferredLocations: z.array(z.string().trim().max(200)).max(20).optional(),
  workModePreference: z.enum(['remote', 'hybrid', 'on-site', 'any']).optional(),

  // 05R-ready preference fields (defined here, NOT acted on in 05Q).
  jobAlertPreference: z.boolean().optional(),
  matchingThreshold: z.coerce.number().int().min(MIN_THRESHOLD, 'Threshold must be between 75 and 100').max(MAX_THRESHOLD).optional(),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

/** The stored profile shape (server adds email + timestamps + resume ref). */
export interface CandidateProfile extends CandidateProfileInput {
  email: string; // from the verified account (server-set, not client-updatable)
  resumeStoragePath?: string | null; // private Storage path (not a public URL)
  resumeFileName?: string | null;
  resumeParsedAt?: string | null; // ISO timestamp of last parse
  createdAt: string;
  updatedAt: string;
}

/* --------------------------- consent evidence --------------------------- */

/**
 * Registration consent evidence (Prompt 05Q §4). Attached server-side on
 * account creation: the versions are SERVER constants (not client-forged) +
 * the timestamp is server-captured UTC.
 */
export interface RegistrationConsent {
  acknowledged: boolean;
  termsVersion: string;
  privacyVersion: string;
  consentNoticeVersion: string;
  timestampUtc: string;
}

/**
 * Login acknowledgement evidence (Prompt 05Q §4). Recorded SEPARATELY from the
 * registration consent — a successful login with the checkbox checked records
 * this; it never overwrites the original registration consent. Distinct field
 * so the registration record is preserved.
 */
export interface LoginConsent {
  acknowledged: boolean;
  termsVersion: string;
  privacyVersion: string;
  timestampUtc: string;
  loginAt: string;
}

/** Build a registration-consent record (server-side, from constants). */
export function buildRegistrationConsent(acknowledged: boolean): RegistrationConsent {
  return {
    acknowledged,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_POLICY_VERSION,
    consentNoticeVersion: CONSENT_NOTICE_VERSION,
    timestampUtc: new Date().toISOString(),
  };
}

/** Build a login-consent record (server-side, from constants). */
export function buildLoginConsent(acknowledged: boolean): LoginConsent {
  return {
    acknowledged,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_POLICY_VERSION,
    timestampUtc: new Date().toISOString(),
    loginAt: new Date().toISOString(),
  };
}

/* --------------------------- completeness --------------------------- */

/** The fields that count toward profile completeness (for honest display). */
const COMPLETENESS_FIELDS: (keyof CandidateProfileInput)[] = [
  'fullName', 'phone', 'currentLocation', 'preferredJobLocation',
  'headline', 'summary', 'totalExperienceYears', 'currentDesignation',
  'skills', 'education', 'preferredRoles', 'preferredEmploymentType',
  'workModePreference',
];

/** Compute an honest completeness percentage (0-100). Never inflates. */
export function profileCompleteness(profile: Partial<CandidateProfileInput> | null | undefined): number {
  if (!profile) return 0;
  let filled = 0;
  for (const key of COMPLETENESS_FIELDS) {
    const v = profile[key];
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    filled++;
  }
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

/** Minimum fields required to submit a job application (Phase 9). */
export function meetsApplicationMinimum(profile: Partial<CandidateProfileInput> | null | undefined): boolean {
  if (!profile) return false;
  return !!(
    profile.fullName &&
    profile.fullName.trim().length >= 2 &&
    (profile.phone?.trim() || profile.currentLocation?.trim()) &&
    (profile.skills?.length || profile.headline?.trim() || profile.currentDesignation?.trim())
  );
}
