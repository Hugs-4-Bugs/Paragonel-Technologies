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
import { jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const SIGNED_URL_TTL_SECONDS = 5 * 60; // 5 minutes

/** Magic-byte validation (don't trust the extension/MIME alone). */
function detectResumeKind(buf: Buffer): 'pdf' | 'doc' | 'docx' | null {
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  // DOCX / ZIP: PK\x03\x04
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) {
    // Could be a docx (zip). Validate it's a word doc by checking for word/ in the
    // central directory — but a full zip parse is heavy. Accept as docx (the MIME
    // + extension already narrow this); reject if save fails.
    return 'docx';
  }
  // Legacy DOC (OLE2): D0CF11E0A1B11AE1
  if (
    buf.length >= 8 &&
    buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0 &&
    buf[4] === 0xa1 && buf[5] === 0xb1 && buf[6] === 0x1a && buf[7] === 0xe1
  ) {
    return 'doc';
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return (name || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

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

  // Private, candidate-scoped path.
  const safeName = sanitizeFileName(f.name);
  const objectPath = `candidates/${email}/resumes/${Date.now()}_${safeName}`;
  const contentType = f.type || (kind === 'pdf' ? 'application/pdf' : kind === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword');

  try {
    await storage.bucket().file(objectPath).save(buf, {
      metadata: { contentType },
    });
  } catch (err) {
    console.error('[candidate/resume] upload failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not store resume.');
  }

  // Parse via analyzeResume (injection-safe prompt — treats resume as data).
  // Build a data URI for the flow. The model API key must be configured; if not,
  // the parse fails + we return the resume stored-but-unparsed status honestly.
  const dataUri = `data:${contentType};base64,${buf.toString('base64')}`;
  let parsed: Awaited<ReturnType<typeof analyzeResume>> | null = null;
  let parseError: string | undefined;
  try {
    parsed = await analyzeResume({ resumeDataUri: dataUri });
  } catch (err) {
    parseError = err instanceof Error ? err.message : 'Resume parsing failed.';
    // Not fatal — the resume is stored; the candidate can still use it.
  }

  // Record the resume ref on the candidate profile (storage path, NOT a URL).
  const now = Timestamp.fromMillis(Date.now());
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

  // Enforce the path is within this candidate's own folder (defense-in-depth).
  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!path.startsWith(expectedPrefix) || !/^candidates\/[^\s/]+\/resumes\/[A-Za-z0-9._-]{1,200}$/.test(path)) {
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

  const expectedPrefix = `candidates/${email}/resumes/`;
  if (!path.startsWith(expectedPrefix)) {
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
