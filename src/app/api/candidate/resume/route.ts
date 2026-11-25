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
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin';
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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 5 * 60; // 5 minutes
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

  const storage = getAdminBucket();
  if (!storage) return jsonError(503, 'Resume storage unavailable.');
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

  // Private, candidate-scoped path.
  const safeName = sanitizeFileName(f.name);
  const objectPath = `candidates/${email}/resumes/${Date.now()}_${safeName}`;
  const contentType = f.type || (kind === 'pdf' ? 'application/pdf' : kind === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword');

  try {
    await storage.bucket().file(objectPath).save(buf, {
      metadata: { contentType },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[candidate/resume] upload failed:', msg);
    // Surface a specific, diagnosable reason (never a fake success). The
    // message classifies the failure class without leaking the storage path,
    // credentials, or stack. This replaces the generic "Could not store
    // resume." which hid the real cause — most often a missing/misnamed
    // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or a service account without Storage
    // Admin permissions on the bucket. The founder can act on the classified
    // reason without needing Vercel function logs.
    const reason =
      /permission|forbidden|403/i.test(msg)
        ? 'Resume storage permission denied. The Firebase service account needs Storage Admin on the bucket.'
      : /not.?found|404|no such bucket/i.test(msg)
        ? 'Resume storage bucket not found. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET matches an existing bucket.'
      : /bucket.*not.*specif|no bucket|bucket name/i.test(msg)
        ? 'Resume storage bucket is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.'
        : 'Could not store resume. Please try again or contact support.';
    return jsonError(500, reason);
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
  try {
    await db.collection('candidates').doc(email).set(
      {
        email,
        resumeStoragePath: objectPath,
        resumeFileName: safeName,
        resumeContentType: contentType,
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
      await storage.bucket().file(objectPath).delete();
    } catch {
      // Non-fatal — the orphan is logged above for later cleanup.
    }
    const reason =
      /permission|forbidden|403/i.test(msg)
        ? 'Could not save resume metadata (permission denied). The Firebase service account needs Firestore write access.'
      : /not.?found|404|collection/i.test(msg)
        ? 'Could not save resume metadata (Firestore unavailable). Please try again or contact support.'
        : 'Could not save resume metadata. Please try again or contact support.';
    return jsonError(500, reason);
  }

  // Phase 4: delete the PREVIOUS resume object now that the new one is stored +
  // the profile points at the new path. Best-effort + non-fatal: a failure here
  // does NOT roll back the successful upload (the candidate has a working
  // resume). The orphan is logged for later cleanup but never blocks the user.
  if (previousPath && previousPath !== objectPath) {
    try {
      await storage.bucket().file(previousPath).delete();
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

  const storage = getAdminBucket();
  if (!storage) return jsonError(503, 'Resume storage unavailable.');

  // Enforce the path is within this candidate's own folder (ownership) AND
  // matches the strict resume-path shape (defense-in-depth against a tampered
  // or injected profile value). Both must pass.
  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!validateResumePath(path) || !path.startsWith(expectedPrefix)) {
    return jsonError(403, 'Resume path is not authorized.');
  }

  try {
    const [url] = await storage.bucket().file(path).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    });
    return NextResponse.json({ url, fileName: profile?.resumeFileName ?? 'resume', expiresIn: SIGNED_URL_TTL_SECONDS });
  } catch (err) {
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

  const storage = getAdminBucket();
  if (storage) {
    try {
      await storage.bucket().file(path).delete();
    } catch (err) {
      // Non-fatal if the file is already gone — clear the ref regardless.
      console.warn('[candidate/resume] delete file failed:', err instanceof Error ? err.message : err);
    }
  }

  await db.collection('candidates').doc(email).set(
    {
      resumeStoragePath: null,
      resumeFileName: null,
      resumeContentType: null,
      resumeParsedAt: null,
      resumeUploadedAt: null,
    },
    { merge: true },
  );

  return NextResponse.json({ message: 'Resume removed.' });
}
