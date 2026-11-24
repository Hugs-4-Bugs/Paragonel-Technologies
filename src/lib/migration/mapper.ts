/**
 * mapper.ts — pure Firestore-doc → Supabase-row mapping for the migration.
 *
 * Each function takes a Firestore doc snapshot ({ id, data }) and returns the
 * Supabase row(s) it maps to. A single Firestore doc may fan out to multiple
 * Supabase rows (e.g. the embedded `candidates` doc splits into candidate_profiles
 * + candidate_skills + candidate_experience + ...).
 *
 * Idempotency: Firestore used the candidate's EMAIL as the doc id for users +
 * candidates. Supabase uses uuid PKs. To make re-runs idempotent (same email →
 * same uuid every run, so upserts don't duplicate), profiles.id / candidate
 * FKs use a deterministic UUIDv5 derived from the email. Production Firebase
 * Auth uids (if present) are preferred when available.
 *
 * This module is PURE (no I/O) so it is unit-testable with synthetic fixtures
 * without the Firestore emulator or a Supabase project.
 */
import { createHash } from 'node:crypto';
import { MIN_THRESHOLD, MAX_THRESHOLD, DEFAULT_MATCHING_THRESHOLD } from '@/lib/matching/preferences';

/** Fixed namespace for UUIDv5 derivation (deterministic across runs). */
const NAMESPACE = '6b1d7f9a-3c2e-4b5a-8d9f-0e1a2b3c4d5e';

/**
 * Deterministic fallback timestamp for migrated rows whose source Firestore doc
 * had no timestamp. The target columns are `NOT NULL DEFAULT now()`, so a value
 * MUST be supplied; using `new Date()` per-row (the previous behaviour) made
 * every row's created_at/updated_at a different "now" — non-deterministic
 * across rows AND across runs, which broke reconciliation. The Unix epoch is a
 * stable, explicit sentinel: every missing-timestamp row gets the SAME value in
 * every run, so they are identifiable for reconciliation via
 * `WHERE created_at = '1970-01-01'` and can be backfilled later if the real
 * timestamp is recovered. This is a documented null/default policy, not a
 * fabricated "now".
 */
export const MIGRATION_FALLBACK_TIMESTAMP = '1970-01-01T00:00:00.000Z';

/**
 * Deterministic UUIDv5 (SHA-1 namespace + name). Same input → same uuid every
 * run → upserts are idempotent. Returns a lowercase uuid string.
 */
export function uuidV5(name: string): string {
  // SHA-1(namespace || name), then set version (5) + variant bits.
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1');
  hash.update(ns);
  hash.update(Buffer.from(name, 'utf8'));
  const bytes = Buffer.from(hash.digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant RFC 4122
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Remap a Firebase Storage resume path to the Supabase Storage convention so
 * the migrated `resumes.storage_path` satisfies the bucket's RLS policy.
 *
 *   Firebase : `candidates/{email}/resumes/{ts}_{sanitizedName}`
 *   Supabase : `candidate-resumes/{userId}/{ts}_{sanitizedName}`
 *
 * The Supabase `candidate-resumes` bucket RLS (0003_storage_buckets.sql)
 * requires `(storage.foldername(name))[1] = auth.uid()::text` — i.e. the first
 * path segment MUST be the user's uuid. The Firebase email-scoped path would
 * fail this for every user. The file bytes themselves are migrated separately
 * (copy objects between buckets during cutover); this function only rewrites
 * the metadata reference stored on the `resumes` row. Unknown shapes are
 * returned unchanged so the reconciler can flag them.
 */
export function remapResumeStoragePath(firebasePath: string, userId: string): string {
  const m = firebasePath.match(/^candidates\/[^/]+\/resumes\/(.+)$/);
  if (!m) return firebasePath; // unknown shape — leave as-is; reconciler flags it
  return `candidate-resumes/${userId}/${m[1]}`;
}

/** Normalize a Firestore value that may be a Timestamp, Date, ISO string, or null → ISO string | null. */
function toISO(v: unknown): string | null {
  if (v == null) return null;
  // Firestore Admin Timestamp has _seconds + _nanoseconds.
  if (typeof v === 'object' && v !== null && '_seconds' in v) {
    const s = (v as { _seconds: number })._seconds;
    return new Date(s * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function str(v: unknown, d = null): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : d;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
function num(v: unknown): number | null {
  return typeof v === 'number' && !isNaN(v) ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : null);
}
function bool(v: unknown, d = false): boolean {
  return typeof v === 'boolean' ? v : d;
}

export interface FirestoreDoc {
  id: string;
  data: Record<string, unknown>;
}

export interface MappedRow {
  table: string;
  row: Record<string, unknown>;
}

// ---------- users → profiles ----------
export function mapUser(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  const email = (str(d.email) || doc.id || '').toLowerCase();
  if (!email) return [];
  const id = str(d.uid) || uuidV5(`user:${email}`);
  return [{
    table: 'profiles',
    row: {
      id,
      email,
      email_verified: bool(d.emailVerified, false),
      full_name: str(d.fullName),
      account_type: d.accountType === 'admin' ? 'admin' : 'candidate',
      status: d.status === 'suspended' ? 'suspended' : d.status === 'deleted' ? 'deleted' : 'active',
      consent_version: str(d.consentVersion),
      consent_at: toISO(d.consentAt),
      marketing_consent: bool(d.marketingConsent, false),
      marketing_consent_at: toISO(d.marketingConsentAt),
      token_version: num(d.tokenVersion) ?? 1,
      created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    },
  }];
}

// ---------- admins → admin_roles ----------
export function mapAdmin(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  const email = (str(d.email) || doc.id || '').toLowerCase();
  if (!email) return [];
  const userId = str(d.uid) || uuidV5(`user:${email}`);
  const role = (str(d.role) || 'admin') as 'super_admin' | 'admin' | 'editor' | 'viewer';
  return [{
    table: 'admin_roles',
    row: {
      user_id: userId,
      role,
      granted_by: str(d.grantedBy) ? (str(d.grantedByUid) || uuidV5(`user:${str(d.grantedBy)!.toLowerCase()}`)) : null,
      granted_at: toISO(d.grantedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      suspended_at: toISO(d.suspendedAt),
      suspended_by: null,
    },
  }];
}

// ---------- candidates → candidate_profiles + normalized child rows ----------
export function mapCandidate(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  const email = (str(d.email) || doc.id || '').toLowerCase();
  if (!email) return [];
  const userId = str(d.uid) || uuidV5(`user:${email}`);
  const rows: MappedRow[] = [];

  rows.push({
    table: 'candidate_profiles',
    row: {
      user_id: userId,
      headline: str(d.headline),
      summary: str(d.summary),
      current_location: str(d.currentLocation),
      preferred_locations: strArr(d.preferredLocations).length ? strArr(d.preferredLocations) : (str(d.preferredJobLocation) ? [str(d.preferredJobLocation)!] : []),
      preferred_employment_type: str(d.preferredEmploymentType),
      work_mode_preference: str(d.workModePreference),
      total_experience_years: num(d.totalExperienceYears) ?? num(d.experienceYears),
      current_designation: str(d.currentDesignation),
      phone: str(d.phone),
      domain: str(d.domain),
      job_alert_enabled: bool(d.jobAlertPreference, false),
      matching_threshold: Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, num(d.matchingThreshold) ?? DEFAULT_MATCHING_THRESHOLD)),
      created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    },
  });

  // Split embedded arrays into normalized child tables. The matching engine
  // combines profile.skills + profile.techStack via canonicalSkillSet, so migrate
  // the union (deduped, case-insensitive) to preserve every skill the candidate
  // declared in either field.
  const skillSet = new Set<string>();
  for (const arr of [d.skills, d.techStack]) {
    if (Array.isArray(arr)) {
      for (const s of arr) {
        if (typeof s === 'string' && s.trim()) skillSet.add(s.trim());
      }
    }
  }
  for (const s of skillSet) {
    rows.push({ table: 'candidate_skills', row: { candidate_id: userId, skill: s, source: 'migration' } });
  }
  const exp = Array.isArray(d.employmentHistory) ? d.employmentHistory : Array.isArray(d.experience) ? d.experience : [];
  for (const e of exp) {
    if (e && typeof e === 'object') {
      const x = e as Record<string, unknown>;
      rows.push({
        table: 'candidate_experience',
        row: {
          candidate_id: userId,
          company: str(x.company) || 'Unknown',
          designation: str(x.designation) || str(x.role),
          start_date: toISO(x.startDate) ? toISO(x.startDate)!.slice(0, 10) : null,
          end_date: toISO(x.endDate) ? toISO(x.endDate)!.slice(0, 10) : null,
          is_current: bool(x.current, bool(x.isCurrent, false)),
          description: str(x.description),
        },
      });
    }
  }
  const edu = Array.isArray(d.education) ? d.education : [];
  for (const e of edu) {
    if (e && typeof e === 'object') {
      const x = e as Record<string, unknown>;
      rows.push({
        table: 'candidate_education',
        row: {
          candidate_id: userId,
          institution: str(x.institution) || str(x.school) || 'Unknown',
          degree: str(x.degree),
          field: str(x.field),
          start_year: num(x.startYear),
          end_year: num(x.endYear),
        },
      });
    }
  }
  const proj = Array.isArray(d.projects) ? d.projects : [];
  for (const p of proj) {
    if (p && typeof p === 'object') {
      const x = p as Record<string, unknown>;
      rows.push({
        table: 'candidate_projects',
        row: {
          candidate_id: userId,
          name: str(x.name) || str(x.title) || 'Project',
          description: str(x.description),
          tech_stack: strArr(x.techStack).length ? strArr(x.techStack) : strArr(x.technologies),
          url: str(x.url) || str(x.link),
          role: str(x.role),
        },
      });
    }
  }
  const cert = Array.isArray(d.certifications) ? d.certifications : [];
  for (const c of cert) {
    if (c && typeof c === 'object') {
      const x = c as Record<string, unknown>;
      rows.push({
        table: 'candidate_certifications',
        row: {
          candidate_id: userId,
          name: str(x.name) || str(x.title) || 'Certification',
          issuer: str(x.issuer) || str(x.organization),
          issued_date: toISO(x.issuedDate) ? toISO(x.issuedDate)!.slice(0, 10) : null,
          expiry_date: toISO(x.expiryDate) ? toISO(x.expiryDate)!.slice(0, 10) : null,
          url: str(x.url),
        },
      });
    }
  }

  // Resume metadata (the file bytes stay in Storage; migrate the reference).
  if (str(d.resumeStoragePath)) {
    rows.push({
      table: 'resumes',
      row: {
        candidate_id: userId,
        // Remap the Firebase email-scoped Storage path to the Supabase
        // user-id-scoped convention so the bucket RLS policy holds. See
        // remapResumeStoragePath.
        storage_path: remapResumeStoragePath(str(d.resumeStoragePath)!, userId),
        file_name: str(d.resumeFileName) || 'resume',
        content_type: str(d.resumeContentType) || 'application/octet-stream',
        size_bytes: num(d.resumeSizeBytes), // NULL for migrated rows without size info (schema allows it)
        uploaded_at: toISO(d.resumeUploadedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
        parsed_at: toISO(d.resumeParsedAt),
        deleted_at: null,
      },
    });
  }

  // Job-alert preferences mirror.
  rows.push({
    table: 'job_alert_preferences',
    row: {
      candidate_id: userId,
      enabled: bool(d.jobAlertPreference, false),
      threshold: Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, num(d.matchingThreshold) ?? DEFAULT_MATCHING_THRESHOLD)),
    },
  });

  return rows;
}

// ---------- jobs → jobs ----------
export function mapJob(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{
    table: 'jobs',
    row: {
      id: uuidV5(`job:${doc.id}`), // deterministic uuid from the Firestore id
      job_id: str(d.jobId),
      title: str(d.title) || 'Untitled',
      department: str(d.department),
      location: str(d.location) || 'Unspecified',
      employment_type: str(d.employmentType) || 'Full Time',
      work_arrangement: str(d.workArrangement) || str(d.workArrangment) || 'Remote',
      experience_required: str(d.experienceRequired) || str(d.experience),
      skills: strArr(d.skills),
      preferred_skills: strArr(d.preferredSkills),
      seniority: str(d.seniority),
      education_required: str(d.educationRequired),
      description: str(d.description),
      is_active: bool(d.isActive, true),
      deleted_at: toISO(d.deletedAt),
      created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    },
  }];
}

/** Resolve a Firestore job id → the deterministic Supabase uuid (matches mapJob). */
export function jobIdToUuid(firestoreJobId: string): string {
  return uuidV5(`job:${firestoreJobId}`);
}

// ---------- jobApplications → job_applications ----------
export function mapApplication(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  const email = (str(d.candidateEmail) || '').toLowerCase();
  const candidateId = str(d.candidateId) || (email ? uuidV5(`user:${email}`) : null);
  if (!candidateId) return []; // orphaned application without a resolvable candidate
  const jobFirestoreId = str(d.jobId) || doc.id;
  return [{
    table: 'job_applications',
    row: {
      id: uuidV5(`application:${doc.id}`),
      application_id: str(d.applicationId) || `APP_MIG_${doc.id.slice(0, 8)}`,
      job_id: jobIdToUuid(jobFirestoreId), // FK to jobs.id (deterministic uuid)
      candidate_id: candidateId,
      candidate_email: email,
      candidate_name: str(d.candidateName),
      cover_letter: str(d.coverLetter),
      expected_salary: str(d.expectedSalary),
      notice_period: str(d.noticePeriod),
      preferred_job_location: str(d.preferredJobLocation),
      match_score: num(d.matchScore),
      applied_via: str(d.appliedVia) || 'web',
      status: str(d.status) || 'New',
      confirmation_email: d.confirmationEmail ?? null,
      applied_at: toISO(d.appliedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      deleted_at: toISO(d.deletedAt),
    },
  }];
}

// ---------- newsletterSubscribers → newsletter_subscribers ----------
export function mapNewsletter(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  const email = (str(d.email) || '').toLowerCase();
  if (!email) return [];
  return [{
    table: 'newsletter_subscribers',
    row: {
      id: uuidV5(`newsletter:${doc.id}`),
      email,
      source: str(d.source) || 'Migration',
      subscribed_at: toISO(d.subscribedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
      deleted_at: toISO(d.deletedAt),
      unsubscribed_at: toISO(d.unsubscribedAt),
      // Double opt-in (Task 5): legacy docs without a status default to 'active'
      // (they were already-confirmed under the previous immediate-active model).
      status: d.status === 'pending' || d.status === 'active' ? d.status : 'active',
      confirmed_at: toISO(d.confirmedAt),
      confirmation_email: d.confirmationEmail ?? null,
    },
  }];
}

// ---------- leads → contact_enquiries ----------
export function mapLead(doc: FirestoreDoc): MappedRow[] {
  return [{
    table: 'contact_enquiries',
    row: {
      id: uuidV5(`enquiry:${doc.id}`),
      name: str(doc.data.name) || 'Unknown',
      email: str(doc.data.email) || 'unknown@example.com',
      company: str(doc.data.company),
      role: str(doc.data.role),
      business_problem: str(doc.data.businessProblem) || str(doc.data.message) || 'N/A',
      required_service: str(doc.data.requiredService),
      project_description: str(doc.data.projectDescription),
      scope: str(doc.data.scope),
      budget: str(doc.data.budget),
      timeline: str(doc.data.timeline),
      preferred_contact: str(doc.data.preferredContact),
      additional_info: str(doc.data.additionalInfo),
      marketing_consent: bool(doc.data.marketingConsent, false),
      submitted_at: (toISO(doc.data.submittedAt) || toISO(doc.data.createdAt)) ?? MIGRATION_FALLBACK_TIMESTAMP,
      status: str(doc.data.status) || 'New',
      deleted_at: toISO(doc.data.deletedAt),
    },
  }];
}

// ---------- CMS content (services / blog_posts / tech_ecosystem / testimonials / client_projects) ----------
export function mapService(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{ table: 'services', row: {
    id: uuidV5(`service:${doc.id}`), slug: str(d.slug) || doc.id, title: str(d.title) || 'Untitled',
    summary: str(d.summary), description: str(d.description), icon: str(d.icon),
    is_active: bool(d.isActive, true), sort_order: num(d.sortOrder) ?? 0,
    deleted_at: toISO(d.deletedAt), created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
  }}];
}

export function mapBlogPost(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{ table: 'blog_posts', row: {
    id: uuidV5(`blog:${doc.id}`), slug: str(d.slug) || doc.id, title: str(d.title) || 'Untitled',
    excerpt: str(d.excerpt), content: str(d.content), cover_image: str(d.coverImage),
    author: str(d.author), is_published: bool(d.isPublished, bool(d.isActive, false)),
    published_at: toISO(d.publishedAt), deleted_at: toISO(d.deletedAt),
    created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP, updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
  }}];
}

export function mapTechEcosystem(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{ table: 'tech_ecosystem', row: {
    id: uuidV5(`tech:${doc.id}`), slug: str(d.slug) || doc.id, name: str(d.name) || 'Untitled',
    category: str(d.category), description: str(d.description), logo: str(d.logo),
    is_active: bool(d.isActive, true), sort_order: num(d.sortOrder) ?? 0,
    deleted_at: toISO(d.deletedAt), created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
  }}];
}

export function mapTestimonial(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{ table: 'testimonials', row: {
    id: uuidV5(`testimonial:${doc.id}`), client_name: str(d.clientName) || str(d.name) || 'Unknown',
    client_role: str(d.clientRole) || str(d.role), company: str(d.company),
    content: str(d.content) || str(d.quote) || '', rating: num(d.rating),
    is_published: bool(d.isPublished, bool(d.isActive, false)), sort_order: num(d.sortOrder) ?? 0,
    deleted_at: toISO(d.deletedAt), created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
  }}];
}

export function mapClientProject(doc: FirestoreDoc): MappedRow[] {
  const d = doc.data;
  return [{ table: 'client_projects', row: {
    id: uuidV5(`project:${doc.id}`), slug: str(d.slug) || doc.id, title: str(d.title) || 'Untitled',
    client: str(d.client), summary: str(d.summary), description: str(d.description),
    technologies: strArr(d.technologies).length ? strArr(d.technologies) : strArr(d.techStack),
    image: str(d.image), is_published: bool(d.isPublished, bool(d.isActive, false)),
    deleted_at: toISO(d.deletedAt), created_at: toISO(d.createdAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
    updated_at: toISO(d.updatedAt) ?? MIGRATION_FALLBACK_TIMESTAMP,
  }}];
}

/** Collection name → mapper dispatch. */
export const COLLECTION_MAPPERS: Record<string, (doc: FirestoreDoc) => MappedRow[]> = {
  users: mapUser,
  admins: mapAdmin,
  candidates: mapCandidate,
  jobs: mapJob,
  jobApplications: mapApplication,
  newsletterSubscribers: mapNewsletter,
  leads: mapLead,
  services: mapService,
  blogPosts: mapBlogPost,
  techEcosystem: mapTechEcosystem,
  testimonials: mapTestimonial,
  clientProjects: mapClientProject,
};
