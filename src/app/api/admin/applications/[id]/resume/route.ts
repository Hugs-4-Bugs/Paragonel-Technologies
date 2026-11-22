/**
 * GET /api/admin/applications/[id]/resume — issue a short-lived signed read URL
 * for the resume attached to application [id] (Phase 4, IU-0 slice 3).
 *
 * Security model:
 *   - Only an authenticated, authorized admin may request it (verifyAdmin → 401).
 *   - The resume object path is resolved from the authorized job-application
 *     record in Firestore — NEVER from a client-supplied path.
 *   - The stored path is validated against a strict `resumes/<safe-name>` pattern
 *     (defense in depth; rejects traversal, gs:// URLs, absolute paths, etc.).
 *   - The signed URL is generated with the Firebase Admin Storage SDK (bypasses
 *     the public-denied Storage rules) and expires after 5 minutes.
 *   - Signed URLs are NEVER persisted in Firestore and their query strings are
 *     NEVER logged. Credential material is never returned.
 *
 * Response: 200 { url, expiresAt, fileName } | 401 | 404 | 409 | 503 | 500.
 *
 * Emulator caveat: signed-URL issuance requires service-account credentials to
 * sign. In local emulator mode (no real creds) the signing step may fail with a
 * 500; the authorization + validation path up to that point is still verified.
 * Real signed-URL delivery is a production-bucket behavior (see test notes).
 */
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin';
import { verifyAdmin, serviceUnavailable } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_MS = 5 * 60 * 1000; // 5 minutes
// Strict resume object path. The actual stored path (set by
// /api/candidate/resume) is `candidates/{email}/resumes/{ts}_{safeName}` —
// NOT the legacy `resumes/<name>` this route previously assumed (which read
// the wrong field `resumeUrl` and matched the wrong pattern, always 404).
// This regex validates the real structure: an email-scoped candidate folder,
// a resumes/ prefix, and a sanitized filename. It rejects "..", leading "/",
// "gs://", query strings, and paths outside the candidates/.../resumes/ tree.
const RESUME_PATH_RE = /^candidates\/[A-Za-z0-9._@+-]{1,254}\/resumes\/[A-Za-z0-9._ -]{1,200}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response; // 401 (missing/invalid JWT)

  const db = getAdminDb();
  if (!db) return serviceUnavailable(); // 503

  const { id } = await params;

  // 1. Resolve the application record server-side.
  let snap;
  try {
    snap = await db.collection('jobApplications').doc(id).get();
  } catch (err) {
    console.error(
      '[admin/applications/[id]/resume] load failed:',
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: 'Failed to load application.' }, { status: 500 });
  }

  if (!snap.exists) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  // 2. Resolve the resume object path FROM THE RECORD (never from the request).
  // The job-application transaction stores the resume under `resumeStoragePath`
  // (the candidate's private Storage path from /api/candidate/resume), NOT
  // `resumeUrl`. The previous `data?.resumeUrl` read always returned undefined
  // → every admin resume download returned 404 "No resume on file".
  const data = snap.data();
  const resumePath = data?.resumeStoragePath;
  if (!resumePath || typeof resumePath !== 'string' || resumePath.trim() === '') {
    return NextResponse.json(
      { error: 'No resume on file for this application.' },
      { status: 404 }
    );
  }

  // 3. Validate the stored path against the strict pattern (reject untrusted refs).
  if (!RESUME_PATH_RE.test(resumePath)) {
    // Do not echo the rejected value back.
    console.warn('[admin/applications/[id]/resume] rejected non-conforming resume path');
    return NextResponse.json(
      { error: 'Invalid resume reference.' },
      { status: 409 }
    );
  }

  // 4. Generate a short-lived signed read URL via Admin Storage.
  const storage = getAdminBucket();
  if (!storage) return serviceUnavailable(); // 503

  try {
    const bucket = storage.bucket();
    const [url] = await bucket.file(resumePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
      version: 'v4',
    });

    return NextResponse.json({
      url,
      expiresAt: new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString(),
      fileName: resumePath.split('/').pop() || 'resume',
    });
  } catch (err) {
    // Never leak credentials or the signed query string in the response.
    console.error(
      '[admin/applications/[id]/resume] signing failed:',
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: 'Could not generate resume link.' },
      { status: 500 }
    );
  }
}
