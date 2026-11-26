/**
 * resume-storage.ts — candidate resume file storage (Supabase Storage), with a
 * legacy Firebase Storage READ fallback for resumes uploaded before the migration.
 *
 * Backend: Supabase Storage private bucket `candidate-resumes` (defined in
 * supabase/migrations/0003_storage_buckets.sql — private, 5 MB, PDF/DOC/DOCX).
 * The service-role server client (`getSupabaseServer`, bypasses RLS) is used for
 * ALL resume operations because the application authenticates candidates via a
 * custom JWT session (email-scoped), NOT Supabase Auth — so the bucket's
 * `auth.uid()`-keyed RLS policies would never match. Authorization is enforced
 * HERE, server-side, via the candidate's session email scoping the object path
 * (`candidates/{email}/resumes/{ts}_{name}`) plus `validateResumePath`.
 *
 * PATH SHAPE (unchanged from the pre-migration Firebase layout): the Supabase
 * object key is `candidates/{email}/resumes/{ts}_{sanitizedName}`. Keeping the
 * same shape means the Firestore `resumeStoragePath` metadata field, the
 * `RESUME_PATH_RE` validators, and every UI consumer are unchanged — the
 * migration is a storage-backend swap, not a schema change.
 *
 * BACKWARD COMPATIBILITY: resumes uploaded to Firebase Storage before the
 * migration live at the SAME path shape. Downloads/deletes try Supabase first;
 * if the object is absent in Supabase they fall back to Firebase Admin Storage
 * (legacy) so existing resumes remain accessible until they are replaced. NEW
 * uploads go to Supabase ONLY (no Firebase writes). Existing Firebase files are
 * never deleted by the migration itself.
 *
 * SECURITY:
 *   - The service-role key is server-only (`SUPABASE_SERVICE_ROLE_KEY`); it is
 *     NEVER exposed to the browser and there is no `NEXT_PUBLIC_` privileged key.
 *   - Ownership: every candidate op validates the path is under
 *     `candidates/{email}/resumes/` for the authenticated email. Admin download
 *     resolves the path from the application record (never the request) and is
 *     gated by RBAC in the route.
 *   - No public bucket URLs are ever returned; only short-lived signed read URLs
 *     (5 min). Signed URLs are never persisted or logged.
 */
import { getSupabaseServer } from '@/lib/supabase/server';
import { getAdminBucket } from '@/lib/firebase-admin';
import { sanitizeFileName, validateResumePath } from '@/lib/resume-security';

/** Supabase private bucket for candidate resumes (migration 0003). */
export const RESUME_BUCKET = 'candidate-resumes';

/** Signed read-URL lifetime (seconds). Matches the pre-migration 5-minute TTL. */
const SIGNED_URL_TTL_SECONDS = 5 * 60;

/** Classified resume-storage error so routes can map to honest HTTP statuses. */
export class ResumeStorageError extends Error {
  readonly code:
    | 'forbidden'
    | 'unconfigured'
    | 'upload-failed'
    | 'delete-failed';
  constructor(code: ResumeStorageError['code'], message: string) {
    super(message);
    this.name = 'ResumeStorageError';
    this.code = code;
  }
}

export interface ResumeUploadResult {
  /** The Supabase object key (also stored as `resumeStoragePath` in Firestore). */
  path: string;
  size: number;
}

export interface ResumeSignedUrl {
  url: string;
  expiresIn: number;
}

export interface ResumeBytes {
  buf: Buffer;
  size: number;
}

/**
 * Enforce that `path` is within the authenticated candidate's own folder. The
 * route already validates this; this is defense-in-depth so a tampered profile
 * value can never make the storage module touch another candidate's object.
 */
function assertOwnedBy(path: string, email: string): void {
  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!validateResumePath(path) || !path.startsWith(expectedPrefix)) {
    throw new ResumeStorageError('forbidden', 'Resume path is not authorized.');
  }
}

/**
 * Build the candidate-scoped object key (same shape as the legacy Firebase
 * path): `candidates/{email}/resumes/{ts}_{sanitizedFileName}`. The timestamp
 * prevents collisions; sanitizeFileName strips path separators / control chars.
 */
export function buildResumePath(email: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `candidates/${email}/resumes/${Date.now()}_${safeName}`;
}

/**
 * UPLOAD a resume to Supabase Storage (new resumes only — no Firebase writes).
 * Enforces ownership. Returns the object key (stored as `resumeStoragePath`).
 *
 * Throws ResumeStorageError:
 *   - 'unconfigured'  : Supabase server client not configured (missing env).
 *   - 'forbidden'     : path not under the candidate's own folder (or 403 from Supabase).
 *   - 'upload-failed' : any other Supabase upload error.
 */
export async function uploadResume(input: {
  email: string;
  fileName: string;
  contentType: string;
  buf: Buffer;
}): Promise<ResumeUploadResult> {
  const path = buildResumePath(input.email, input.fileName);
  assertOwnedBy(path, input.email);
  const sb = getSupabaseServer();
  if (!sb) {
    throw new ResumeStorageError(
      'unconfigured',
      'Resume storage unavailable (Supabase not configured). Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  const { error } = await sb.storage
    .from(RESUME_BUCKET)
    .upload(path, input.buf, { contentType: input.contentType, upsert: false });
  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('403') || msg.includes('policy')) {
      throw new ResumeStorageError('forbidden', 'Resume storage permission denied.');
    }
    // Never leak the path, the key, or the raw error to the client.
    console.error('[resume-storage] upload failed:', error.message);
    throw new ResumeStorageError('upload-failed', 'Could not store resume. Please try again or contact support.');
  }
  return { path, size: input.buf.length };
}

/**
 * Create a short-lived signed READ URL. Tries Supabase first; if the object is
 * absent there, falls back to Firebase Admin Storage (legacy resumes uploaded
 * before the migration). Returns null if the object exists in neither backend.
 *
 * `opts.email` (candidate email) enforces ownership; omit for admin downloads
 * (the admin route resolves the path from the application record + gates via RBAC).
 */
export async function createResumeSignedUrl(
  path: string,
  opts: { email?: string; ttlSeconds?: number } = {},
): Promise<ResumeSignedUrl | null> {
  if (opts.email) assertOwnedBy(path, opts.email);
  const ttl = opts.ttlSeconds ?? SIGNED_URL_TTL_SECONDS;

  // 1. Supabase (primary).
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb.storage.from(RESUME_BUCKET).createSignedUrl(path, ttl);
      if (!error && data?.signedUrl) {
        return { url: data.signedUrl, expiresIn: ttl };
      }
    } catch {
      // fall through to legacy
    }
  }

  // 2. Legacy Firebase Storage fallback (resumes uploaded before the migration).
  const bucket = getAdminBucket()?.bucket();
  if (bucket) {
    try {
      const [url] = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + ttl * 1000,
        version: 'v4',
      });
      if (url) return { url, expiresIn: ttl };
    } catch {
      // not found in legacy either — fall through
    }
  }
  return null;
}

/**
 * Download resume bytes (for the application confirmation email attachment).
 * Supabase first; legacy Firebase fallback. Returns null if not found in either.
 */
export async function downloadResumeBytes(
  path: string,
  opts: { email?: string } = {},
): Promise<ResumeBytes | null> {
  if (opts.email) assertOwnedBy(path, opts.email);

  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data, error } = await sb.storage.from(RESUME_BUCKET).download(path);
      if (!error && data) {
        const buf = Buffer.from(await (data as Blob).arrayBuffer());
        if (buf.length > 0) return { buf, size: buf.length };
      }
    } catch {
      // fall through to legacy
    }
  }

  const bucket = getAdminBucket()?.bucket();
  if (bucket) {
    try {
      const [buf] = await bucket.file(path).download();
      if (buf && buf.length > 0) return { buf, size: buf.length };
    } catch {
      // not found
    }
  }
  return null;
}

/**
 * Delete a resume object. Deletes from Supabase AND best-effort from legacy
 * Firebase Storage (in case the resume was uploaded before the migration).
 *
 * Semantics: returns normally (void) when the object was deleted OR was already
 * absent in at least one configured backend (idempotent delete). THROWS a
 * ResumeStorageError('delete-failed') ONLY when a configured backend reported a
 * REAL failure (permission / transient / unavailable) AND no configured backend
 * confirmed the object is gone — so the caller can keep the Firestore metadata
 * intact + surface a retryable 500 instead of silently orphaning a private
 * candidate document (a GDPR retention gap). A not-found error is treated as
 * success (the object is already gone).
 */
export async function deleteResumeObject(
  path: string,
  opts: { email?: string } = {},
): Promise<void> {
  if (opts.email) {
    try {
      assertOwnedBy(path, opts.email);
    } catch {
      // A tampered path: do not delete anything. Treat as a no-op success (the
      // caller never had a legitimate object at this path to clean up).
      return;
    }
  }

  // Outcome per configured backend: 'gone' (deleted or already absent) | 'failed'
  // (real error). 'n/a' = backend not configured (not a failure source).
  type Outcome = 'gone' | 'failed' | 'n/a';
  const notFound = /not found|404|no such|not exist|notfound|nosuchkey/i;
  let supabaseOutcome: Outcome = 'n/a';
  let legacyOutcome: Outcome = 'n/a';

  const sb = getSupabaseServer();
  if (sb) {
    supabaseOutcome = 'failed';
    try {
      const { error } = await sb.storage.from(RESUME_BUCKET).remove([path]);
      if (error) {
        const m = String(error.message || '');
        if (notFound.test(m)) {
          supabaseOutcome = 'gone'; // already absent
        } else {
          console.warn('[resume-storage] supabase delete failed:', m);
        }
      } else {
        supabaseOutcome = 'gone'; // deleted
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      if (notFound.test(m)) {
        supabaseOutcome = 'gone';
      } else {
        console.warn('[resume-storage] supabase delete threw:', m);
      }
    }
  }

  const bucket = getAdminBucket()?.bucket();
  if (bucket) {
    legacyOutcome = 'failed';
    try {
      await bucket.file(path).delete();
      legacyOutcome = 'gone';
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      if (notFound.test(m)) {
        legacyOutcome = 'gone'; // only ever existed in Supabase, or already gone
      } else {
        console.warn('[resume-storage] legacy delete failed:', m);
      }
    }
  }

  // OK if at least one configured backend confirmed the object is gone. If every
  // configured backend failed, the object is still in storage -> throw so the
  // caller keeps the metadata + can retry (no silent orphan).
  const anyConfigured = supabaseOutcome !== 'n/a' || legacyOutcome !== 'n/a';
  const anyGone = supabaseOutcome === 'gone' || legacyOutcome === 'gone';
  if (anyConfigured && !anyGone) {
    throw new ResumeStorageError(
      'delete-failed',
      'Could not remove the resume file from storage. Please retry.',
    );
  }
}

/** Whether Supabase resume storage is configured (for health checks). */
export function isResumeStorageConfigured(): boolean {
  return getSupabaseServer() !== null;
}
