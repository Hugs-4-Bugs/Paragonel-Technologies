/**
 * POST/GET/DELETE /api/candidate/resume — candidate resume management (Prompt 05Q §8).
 *
 * Ownership: enforced server-side via verifySession(tier:'user'). The candidate's
 * email (from the session) determines the Storage path + the profile doc. A
 * candidate can ONLY upload/download/delete their OWN resume — never another
 * candidate's.
 *
 * Storage: PRIVATE. Resumes are stored at
 *   `candidates/{email}/resumes/{ts}_{safeName}`
 * under the Admin Storage bucket (storage.rules deny all public access). Downloads
 * use a short-lived v4 signed URL (5 min). The public Storage path is never
 * exposed; only the signed URL is returned, briefly.
 *
 * Parsing: the uploaded file is parsed via analyzeResume. The parsed data is
 * returned to the client marked as "parsed, unconfirmed" for review + correction
 * (Prompt 05Q §8: "Show extracted information for review before saving. Clearly
 * distinguish parsed values from user-confirmed values. Never fabricate."). The
 * parsed data is NOT auto-saved to the profile — the candidate confirms via
 * PUT /api/candidate/profile.
 *
 * File validation: type (PDF/DOC/DOCX), MIME (not extension alone), size (≤5MB),
 * filename sanitized. Uploaded content is never executed. Resume text is treated
 * as untrusted input (the analyzeResume flow prompt instructs the model to treat
 * it as data + never obey embedded instructions).
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth/sessions';
import { analyzeResume } from '@/ai/flows/analyze-resume-flow';
import { ResumeAnalysisError } from '@/lib/ai/resume-analysis-error';
import { jsonError } from '@/lib/auth/route-helpers';
import {
  MAX_RESUME_BYTES,
  ALLOWED_RESUME_TYPES,
  detectResumeKind,
  sanitizeFileName,
  validateResumePath,
} from '@/lib/resume-security';
import {
  uploadResume,
  createResumeSignedUrl,
  deleteResumeObject,
  ResumeStorageError,
} from '@/lib/resume-storage';
import { writeAuditLog, newCorrelationId } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PARSE_TIMEOUT_MS = 30_000; // hard cap on the AI parse call (parser-abuse guard)

/**
 * Race a promise against a timeout. Protects against pathological resumes
 * (or a slow/stuck model call) hanging the upload request indefinitely. A
 * timeout is treated as a parse failure (honest parseError), never a hang.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// Type/size/filename validation + DOCX ZIP hardening live in
// `@/lib/resume-security` (shared with the admin download + email-attachment
// paths and unit-tested there).

export async function POST(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, 'Expected multipart/form-data.');
  }

  const file = formData.get('resume');
  if (!file || typeof file === 'string') {
    return jsonError(400, 'No resume file provided.');
  }
  const f = file as File;

  if (f.size > MAX_RESUME_BYTES) {
    return jsonError(400, 'Resume too large (max 5 MB).');
  }
  if (f.type && !ALLOWED_RESUME_TYPES.includes(f.type)) {
    return jsonError(400, 'Unsupported resume type. Use PDF, DOC, or DOCX.');
  }

  const buf = Buffer.from(await f.arrayBuffer());
  const kind = detectResumeKind(buf);
  if (!kind) {
    // The file content doesn't match any allowed type — reject (don't trust the
    // extension/MIME alone, Prompt 05Q §8).
    return jsonError(400, 'The file content does not match a valid PDF/DOC/DOCX.');
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  // Phase 4: read the EXISTING resume path (if any) BEFORE uploading the new
  // one, so we can delete the previous object afterwards. Previously a new
  // upload silently replaced `resumeStoragePath` on the profile while the old
  // Storage object was orphaned indefinitely — accumulating private candidate
  // documents with no cleanup. The candidate still sees the new resume as
  // `confirmed:false` parsed data to review (the confirmation-before-overwrite
  // guarantee for PROFILE fields is unchanged).
  let previousPath: string | undefined;
  try {
    const prevSnap = await db.collection('candidates').doc(email).get();
    const prev = prevSnap.exists ? (prevSnap.data() as { resumeStoragePath?: string }) : null;
    previousPath = prev?.resumeStoragePath;
  } catch {
    // Non-fatal: if we cannot read the previous path, we simply skip cleanup.
  }

  const safeName = sanitizeFileName(f.name);
  const contentType = f.type || (kind === 'pdf' ? 'application/pdf' : kind === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword');

  // Upload to the private Supabase Storage bucket `candidate-resumes`. The
  // resume-storage module builds the candidate-scoped path
  // (`candidates/{email}/resumes/{ts}_{safeName}`) and enforces ownership; it
  // throws a classified ResumeStorageError on failure. The legacy Firebase
  // Storage backend is no longer used for NEW uploads — existing Firebase
  // resumes remain readable via the module's legacy read fallback.
  let objectPath: string;
  let uploadSize = 0;
  try {
    const uploaded = await uploadResume({ email, fileName: f.name, contentType, buf });
    objectPath = uploaded.path;
    uploadSize = uploaded.size;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[candidate/resume] upload failed:', msg);
    const code = err instanceof ResumeStorageError ? err.code : 'upload-failed';
    const status = code === 'unconfigured' ? 503 : 500;
    const reason =
      code === 'unconfigured'
        ? 'Resume storage unavailable. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      : code === 'forbidden'
        ? 'Resume storage permission denied. Check the Supabase service-role key and the candidate-resumes bucket policies.'
        : 'Could not store resume. Please try again or contact support.';
    return jsonError(status, reason);
  }

  // Parse via analyzeResume (injection-safe prompt — treats resume as data).
  // Build a data URI for the flow. The model API key must be configured; if not,
  // the parse fails + we return the resume stored-but-unparsed status honestly.
  const dataUri = `data:${contentType};base64,${buf.toString('base64')}`;
  let parsed: Awaited<ReturnType<typeof analyzeResume>> | null = null;
  let parseError: string | undefined;
  try {
    parsed = await withTimeout(analyzeResume({ resumeDataUri: dataUri }), PARSE_TIMEOUT_MS, 'analyzeResume');
  } catch (err) {
    // Surface an honest, classified reason so the candidate can tell whether
    // the AI service was unavailable (missing key / timeout / quota / bad key /
    // unsupported model) vs a genuine parse failure — and never a fake success.
    if (err instanceof ResumeAnalysisError) {
      parseError =
        err.reason === 'invalid_output'
          ? 'Could not parse this resume. Your resume was stored — fill in your profile manually.'
          : 'Resume parsing is unavailable right now (AI service). Your resume was stored — fill in your profile manually.';
    } else {
      parseError = 'Resume parsing failed. Your resume was stored — fill in your profile manually.';
    }
    console.error('[candidate/resume] parse failed:', err instanceof Error ? err.message.slice(0, 120) : err);
    // Not fatal — the resume is stored; the candidate can still use it.
  }

  // Record the resume ref on the candidate profile (storage path, NOT a URL).
  // Wrapped in try/catch (PHASE B4 fix): previously this Firestore write was
  // UNguarded — if it failed (Firestore unavailable / permissions / transient),
  // the route threw an unhandled 500 AFTER the resume was already stored, so the
  // resume was orphaned in Storage with no profile ref + the candidate saw a
  // generic "Internal Server Error" with no classified reason or recovery path.
  // Now: on failure, best-effort delete the just-uploaded Storage object (avoid
  // the orphan) + return a classified 500 the candidate can understand + retry.
  const now = Timestamp.fromMillis(Date.now());
  const correlationId = newCorrelationId();
  try {
    await db.collection('candidates').doc(email).set(
      {
        email,
        resumeStoragePath: objectPath,
        resumeFileName: safeName,
        resumeContentType: contentType,
        resumeSizeBytes: uploadSize,
        resumeUploadedAt: now,
        resumeParsedAt: parsed ? now : null,
        updatedAt: now,
      },
      { merge: true },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[candidate/resume] profile write failed:', msg);
    // Best-effort cleanup of the just-uploaded object so it does not orphan.
    try {
      await deleteResumeObject(objectPath, { email });
    } catch {
      // Non-fatal — the orphan is logged above for later cleanup.
    }
    // Server-generated failure audit (actor from the verified session).
    await writeAuditLog({
      actor: { id: email, role: 'candidate', tier: 'user' },
      eventType: 'candidate_resume_upload',
      entityType: 'candidate',
      entityId: email,
      outcome: 'failure',
      correlationId,
      metadata: { reason: 'metadata_write_failed', fileName: safeName, sizeBytes: uploadSize },
    });
    const reason =
      /permission|forbidden|403/i.test(msg)
        ? 'Could not save resume metadata (permission denied). The Firebase service account needs Firestore write access.'
      : /not.?found|404|collection/i.test(msg)
        ? 'Could not save resume metadata (Firestore unavailable). Please try again or contact support.'
        : 'Could not save resume metadata. Please try again or contact support.';
    return jsonError(500, reason);
  }

  // Server-generated success audit. Metadata is safe (filename + size + type);
  // the storage path itself is never logged (see resume-storage.ts).
  await writeAuditLog({
    actor: { id: email, role: 'candidate', tier: 'user' },
    eventType: 'candidate_resume_upload',
    entityType: 'candidate',
    entityId: email,
    outcome: 'success',
    correlationId,
    metadata: { fileName: safeName, sizeBytes: uploadSize, contentType, parsed: !!parsed },
  });

  // Phase 4: delete the PREVIOUS resume object now that the new one is stored +
  // the profile points at the new path. Best-effort + non-fatal: a failure here
  // does NOT roll back the successful upload (the candidate has a working
  // resume). The orphan is logged for later cleanup but never blocks the user.
  if (previousPath && previousPath !== objectPath) {
    try {
      await deleteResumeObject(previousPath, { email });
    } catch (err) {
      console.warn(
        '[candidate/resume] orphan cleanup failed (non-fatal):',
        err instanceof Error ? err.message : err,
      );
    }
  }

  return NextResponse.json({
    message: parsed ? 'Resume uploaded + parsed. Review the extracted fields before saving.' : 'Resume uploaded. Parsing could not be completed — you can fill in your profile manually.',
    resumeStoragePath: objectPath,
    resumeFileName: safeName,
    parsed: parsed
      ? {
          // Clearly marked as parsed/unconfirmed — the candidate reviews + edits
          // before these become "user-confirmed" values (saved via PUT /profile).
          confirmed: false,
          data: parsed,
        }
      : null,
    parseError,
  });
}

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snap = await db.collection('candidates').doc(email).get();
  const profile = snap.exists ? snap.data() as { resumeStoragePath?: string; resumeFileName?: string } : null;
  const path = profile?.resumeStoragePath;
  if (!path) return jsonError(404, 'No resume on file.');

  // Enforce the path is within this candidate's own folder (ownership) AND
  // matches the strict resume-path shape (defense-in-depth against a tampered
  // or injected profile value). Both must pass.
  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!validateResumePath(path) || !path.startsWith(expectedPrefix)) {
    return jsonError(403, 'Resume path is not authorized.');
  }

  try {
    const signed = await createResumeSignedUrl(path, { email });
    if (!signed) {
      return jsonError(500, 'Could not generate a download link.');
    }
    return NextResponse.json({ url: signed.url, fileName: profile?.resumeFileName ?? 'resume', expiresIn: signed.expiresIn });
  } catch (err) {
    if (err instanceof ResumeStorageError && err.code === 'forbidden') {
      return jsonError(403, 'Resume path is not authorized.');
    }
    console.error('[candidate/resume] signed-url failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not generate a download link.');
  }
}

export async function DELETE(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');
  const snap = await db.collection('candidates').doc(email).get();
  const profile = snap.exists ? snap.data() as { resumeStoragePath?: string } : null;
  const path = profile?.resumeStoragePath;
  if (!path) return jsonError(404, 'No resume on file.');

  // Same strict shape + ownership check as GET (defense-in-depth: a tampered
  // profile value cannot make this delete an arbitrary Storage path).
  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!validateResumePath(path) || !path.startsWith(expectedPrefix)) {
    return jsonError(403, 'Resume path is not authorized.');
  }

  // Best-effort delete from Supabase (primary) + legacy Firebase Storage (in
  // case the resume was uploaded before the migration). Non-throwing — the
  // Firestore ref is cleared below, so a storage delete failure never blocks the
  // candidate from removing their resume.
  await deleteResumeObject(path, { email });

  const correlationId = newCorrelationId();
  // Wrap the Firestore metadata clear in try/catch (PHASE B4 symmetric fix):
  // previously this was UNguarded — if it failed, the route threw an unhandled
  // 500 AFTER the storage object was already deleted (orphan-in-reverse: the
  // profile still claimed a resume that no longer existed, and the candidate
  // saw a generic 500). Now: on failure we surface a classified 500 (the
  // deletion did NOT fully succeed — do not claim success) + a failure audit.
  // On success we clear all resume fields (incl. resumeSizeBytes) + audit.
  try {
    await db.collection('candidates').doc(email).set(
      {
        resumeStoragePath: null,
        resumeFileName: null,
        resumeContentType: null,
        resumeSizeBytes: null,
        resumeParsedAt: null,
        resumeUploadedAt: null,
      },
      { merge: true },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[candidate/resume] metadata clear failed (storage object already deleted):', msg);
    await writeAuditLog({
      actor: { id: email, role: 'candidate', tier: 'user' },
      eventType: 'candidate_resume_delete',
      entityType: 'candidate',
      entityId: email,
      outcome: 'failure',
      correlationId,
      metadata: { reason: 'metadata_clear_failed' },
    });
    return jsonError(500, 'Resume file was removed, but we could not clear your profile metadata. Please retry or contact support.');
  }

  await writeAuditLog({
    actor: { id: email, role: 'candidate', tier: 'user' },
    eventType: 'candidate_resume_delete',
    entityType: 'candidate',
    entityId: email,
    outcome: 'success',
    correlationId,
  });

  return NextResponse.json({ message: 'Resume removed.' });
}
