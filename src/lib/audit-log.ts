/**
 * audit-log.ts — server-generated audit logging (Paragonel DB/realtime foundation).
 *
 * WHY THIS EXISTS:
 *   The original `adminActivityLogs` writer (`logActivityServer` in admin-auth.ts)
 *   stored only `{ adminEmail, action, resourceType, resourceId, timestamp }`, and
 *   the `/api/admin/activity` POST route let ANY active admin (incl. a read-only
 *   `viewer`) append entries with client-supplied `action`/`resourceType`/
 *   `resourceId`. That violated two hard rules for an audit trail:
 *     1. "Audit records must be server-generated" — the actor identity, role,
 *        timestamp and event type must never be trusted from the client.
 *     2. "Do not allow ordinary users to edit or delete privileged audit records"
 *        — and a viewer writing audit entries is a privilege violation.
 *
 * WHAT THIS MODULE DOES:
 *   - `writeAuditLog(entry)` writes a richer, SERVER-generated record to the SAME
 *     `adminActivityLogs` Firestore collection (Firestore remains the single
 *     source of truth for audit; no second store). The record carries the legacy
 *     fields (so the existing Activity page + GET route keep working) PLUS the
 *     enriched fields: eventId, actorId, actorRole, actorTier, eventType,
 *     outcome, changeSummary (safe before/after), correlationId, metadata.
 *   - `eventId`, `timestamp`, `correlationId` are ALWAYS generated server-side.
 *   - `actor` is ALWAYS taken from the verified session (`verifySession` /
 *     `verifyAdmin`) — never from the request body. A frontend cannot forge the
 *     actor identity, role or tier.
 *   - `sanitizeChangeSummary(before, after)` produces a SAFE diff: only changed
 *     FIELD NAMES + safe scalar values, with any field whose name looks like a
 *     secret (password / token / key / hash / otp / code / path) redacted to its
 *     name only. Nested objects/arrays are summarized as "changed", never dumped.
 *     No password, token, service-role key, OTP, or raw resume storage path is
 *     ever stored in an audit record.
 *   - Errors are surfaced (console.error) but NEVER thrown — a failed audit log
 *     must not block a successful mutation (callers `await` it AFTER the data
 *     write succeeds) and must not turn a successful mutation into a 500.
 *
 * WHO CAN WRITE: only server code (route handlers / server libs) that has a
 *   verified actor. There is NO public POST route for audit entries anymore
 *   (the client `logActivity` helper is a deprecated no-op). Ordinary users and
 *   viewer-role admins cannot write or delete audit records.
 *
 * WHO CAN READ: `GET /api/admin/activity` requires `security.audit.read`
 *   (super_admin only). firestore.rules denies all client access
 *   (`allow read, write: if false`); only the Admin SDK (server) reaches the
 *   collection.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { randomHex } from '@/lib/auth/crypto-utils';

/** Who performed the action. Always server-derived from the verified session. */
export interface AuditActor {
  /** The actor's stable id — email for both admins and candidates in this app. */
  id: string;
  /** 'super_admin' | 'admin' | 'editor' | 'viewer' for admins; 'candidate' for users. */
  role: string;
  /** 'admin' for admin-tier sessions, 'user' for candidate-tier sessions. */
  tier: 'admin' | 'user';
}

export type AuditOutcome = 'success' | 'failure';

/**
 * Known audit event types. This is a documented catalogue, not a closed set —
 * `eventType` is typed as `string` so new server call sites do not need to edit
 * this list, but every event written SHOULD use one of these names for
 * consistency in the Activity feed.
 */
export const AUDIT_EVENT_TYPES = [
  // Admin CMS mutations (already logged via logActivityServer — now enriched)
  'job_create', 'job_update', 'job_publish_toggle', 'job_delete',
  'blog_create', 'blog_update', 'blog_publish_toggle', 'blog_delete',
  'service_create', 'service_update', 'service_visibility_toggle', 'service_delete',
  'testimonial_create', 'testimonial_update', 'testimonial_status_change', 'testimonial_delete',
  'client_project_create', 'client_project_update', 'client_project_status_change', 'client_project_delete',
  'tech_ecosystem_create', 'tech_ecosystem_update', 'tech_ecosystem_status_change', 'tech_ecosystem_delete',
  'lead_update', 'lead_delete', 'lead_restore',
  'newsletter_subscriber_delete',
  // Admin recruitment mutations
  'application_status_change', 'application_note_add', 'application_delete', 'application_restore',
  'interview_schedule', 'interview_reschedule', 'interview_cancel', 'interview_feedback',
  'resume_download',
  // Admin user/role mutations
  'admin_create', 'admin_invite', 'admin_role_change', 'admin_suspend', 'admin_reactivate',
  'admin_session_revoke', 'mfa_disable', 'matching_threshold_update',
  // Candidate lifecycle (NEW — previously un-audited)
  'candidate_profile_update', 'candidate_preferences_update',
  'candidate_resume_upload', 'candidate_resume_delete',
  'candidate_application_submit', 'candidate_application_withdraw',
] as const;

export type AuditEventType = string;

/** A safe before/after change summary (field names + safe scalars only). */
export interface ChangeSummary {
  /** Field names whose values changed (name only — no value for non-scalar/secret fields). */
  changedFields: string[];
  /** Field names that were redacted because they look like secrets. */
  redactedFields: string[];
  /** Safe scalar samples (string≤120/number/boolean/null) for non-secret fields. */
  samples: Record<string, { before?: SafeScalar; after?: SafeScalar }>;
}

type SafeScalar = string | number | boolean | null;

/** Field-name pattern that indicates a secret — value is NEVER stored, only the name. */
const SECRET_FIELD_RE = /password|token|secret|key|hash|otp|code|credential|cookie|session/i;
/** Field-name pattern that indicates a private path/id we summarize but do not dump.
 *  Includes resumeFileName — a resume filename routinely contains the candidate's
 *  real name (e.g. "John_Doe_Resume.pdf"), so it is treated as PII, not a scalar. */
const SENSITIVE_PATH_RE = /resumeStoragePath|resumeStorageUrl|storagePath|signedUrl|resumeFileName/i;

const MAX_SAMPLE_STRING = 120;
const MAX_CHANGED_FIELDS = 60;

function isSafeScalar(v: unknown): v is SafeScalar {
  return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

function truncateScalar(v: SafeScalar): SafeScalar {
  if (typeof v === 'string' && v.length > MAX_SAMPLE_STRING) {
    return v.slice(0, MAX_SAMPLE_STRING) + '…';
  }
  return v;
}

/**
 * Build a SAFE before/after summary. Never stores:
 *   - secret-named fields (password/token/key/hash/otp/code/...) — name only,
 *     listed under `redactedFields`.
 *   - sensitive paths (resumeStoragePath/signedUrl/...) — name only, listed
 *     under `changedFields` with no value.
 *   - nested objects/arrays — listed under `changedFields` with no value.
 * Only safe scalars (string≤120/number/boolean/null) for non-secret fields are
 * sampled under `samples`.
 */
export function sanitizeChangeSummary(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): ChangeSummary | null {
  if (!before && !after) return null;
  const beforeObj = (before && typeof before === 'object') ? before as Record<string, unknown> : {};
  const afterObj = (after && typeof after === 'object') ? after as Record<string, unknown> : {};
  const allKeys = new Set<string>([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  const changedFields: string[] = [];
  const redactedFields: string[] = [];
  const samples: Record<string, { before?: SafeScalar; after?: SafeScalar }> = {};

  for (const key of allKeys) {
    if (changedFields.length + redactedFields.length >= MAX_CHANGED_FIELDS) break;
    const b = beforeObj[key];
    const a = afterObj[key];
    const changed = b !== a;

    if (SECRET_FIELD_RE.test(key)) {
      if (changed) redactedFields.push(key);
      continue;
    }
    if (SENSITIVE_PATH_RE.test(key)) {
      if (changed) changedFields.push(key);
      continue;
    }
    const bSafe = isSafeScalar(b);
    const aSafe = isSafeScalar(a);
    if (bSafe || aSafe) {
      // At least one side is a safe scalar (the other may be undefined — e.g. a
      // field going absent→value or value→absent). Sample the present scalar(s)
      // only; never dump an object/array side.
      if (changed) {
        changedFields.push(key);
        const sample: { before?: SafeScalar; after?: SafeScalar } = {};
        if (bSafe) sample.before = truncateScalar(b);
        if (aSafe) sample.after = truncateScalar(a);
        samples[key] = sample;
      }
      continue;
    }
    // both sides are object/array/undefined-non-scalar — record the field
    // changed, no value.
    if (changed) changedFields.push(key);
  }

  if (changedFields.length === 0 && redactedFields.length === 0) return null;
  return { changedFields, redactedFields, samples };
}

/** Generate a fresh request correlation id (server-side, opaque hex). */
export function newCorrelationId(): string {
  return randomHex(12);
}

export interface AuditLogEntry {
  actor: AuditActor;
  eventType: AuditEventType;
  /** The kind of entity acted on, e.g. 'job' | 'jobApplication' | 'candidate' | 'admin'. */
  entityType: string;
  /** The entity's stable id (doc id / applicationId / email). */
  entityId: string;
  outcome?: AuditOutcome;
  /** Safe before/after summary (use `sanitizeChangeSummary`). */
  changeSummary?: ChangeSummary | null;
  /** Correlates multiple audit records from one request flow. */
  correlationId?: string;
  /** Small, safe, non-secret extra context (e.g. { fileName, sizeBytes }). */
  metadata?: Record<string, unknown>;
}

/**
 * Write one enriched audit record to `adminActivityLogs` (Firestore, Admin SDK).
 * Server-generated eventId/timestamp; actor from the verified session. Best-effort
 * (never throws). Returns the generated eventId (or null if unwritten).
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<string | null> {
  const db = getAdminDb();
  if (!db) {
    console.warn('[audit] admin SDK not configured; activity not logged.');
    return null;
  }
  const eventId = randomHex(12);
  const timestamp = Timestamp.now();
  const actor = entry.actor;
  const outcome: AuditOutcome = entry.outcome ?? 'success';
  try {
    await db.collection('adminActivityLogs').doc(eventId).set({
      // ---- Legacy fields (backward compat with the existing Activity page / GET route) ----
      adminEmail: actor.id,
      action: entry.eventType,
      resourceType: entry.entityType,
      resourceId: entry.entityId,
      timestamp,
      // ---- Enriched fields ----
      eventId,
      actorId: actor.id,
      actorRole: actor.role,
      actorTier: actor.tier,
      eventType: entry.eventType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      outcome,
      changeSummary: entry.changeSummary ?? null,
      correlationId: entry.correlationId ?? null,
      metadata: entry.metadata ?? null,
    });
    return eventId;
  } catch (e) {
    // Surface, but do not throw — the mutation already succeeded (or already
    // failed and is being recorded as a failure). Audit must never block.
    console.error('[audit] writeAuditLog failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
