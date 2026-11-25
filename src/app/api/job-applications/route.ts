/**
 * POST /api/job-applications — authenticated job application (Prompt 05Q §9).
 *
 * HARD BUSINESS RULE: a visitor MUST have an authenticated candidate account to
 * apply for any job. This route requires a user session (verifySession tier:'user').
 * Unauthenticated requests are rejected with 401 — a disabled Apply button is NOT
 * the only enforcement.
 *
 * Flow:
 *   1. Require candidate session → email (the authenticated candidate).
 *   2. Validate body (jobId + optional job-specific fields).
 *   3. Verify the job is genuinely published, active, NOT deleted (server-side).
 *   4. Read the candidate profile → verify it meets the minimum application info.
 *   5. Duplicate check (candidateEmail + jobId, not soft-deleted).
 *   6. Associate the application with the authenticated candidate ID + verified
 *      email (never a client-supplied email/userId).
 *   7. The resume is the candidate's profile resume (uploaded via
 *      /api/candidate/resume) — referenced by its private Storage path.
 *
 * Status codes: 201 created, 400 invalid, 401 unauthenticated, 404 job not found,
 *               409 duplicate, 422 profile incomplete, 429 rate-limited, 503 unavailable.
 */
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin';
import { z } from 'zod';
import { verifySession } from '@/lib/auth/sessions';
import { checkRateLimit, getClientId } from '@/lib/submission-security';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';
import { validateResumePath } from '@/lib/resume-security';
import { sendApplicationConfirmation, SAFE_ATTACHMENT_BYTES } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const applySchema = z.object({
  jobId: z.string().trim().min(1, 'Job ID is required').max(100),
  // Form-supplied identity (prefilled from the profile in the UI, editable).
  // Profile completeness is NEVER a gate — these fall back to the profile.
  fullName: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  // Optional resume path from an inline upload (stored via
  // /api/candidate/resume under candidates/{email}/resumes/). Ownership is
  // enforced server-side (the path MUST be under the authenticated candidate's
  // own prefix).
  resumeStoragePath: z.string().trim().max(300).optional().or(z.literal('')),
  coverLetter: z.string().trim().max(5000).optional().or(z.literal('')),
  expectedSalary: z.string().trim().max(100).optional().or(z.literal('')),
  noticePeriod: z.string().trim().max(100).optional().or(z.literal('')),
  preferredJobLocation: z.string().trim().max(200).optional().or(z.literal('')),
  // Explicit confirmation the candidate reviewed the application details.
  confirmSubmission: z.boolean().refine((v) => v === true, 'Please confirm the application details to submit.'),
  // Honeypot (kept for defense-in-depth even though auth is required).
  website: z.string().max(0).optional().or(z.literal('')),
});

/** Sentinel thrown inside the create-transaction when an active application already exists. */
class DuplicateApplication extends Error {}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // 1. Require candidate session.
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) {
    // 401 — the UI redirects to /auth/login?redirect=/careers/{jobId}.
    return NextResponse.json(
      { error: 'Authentication required. Please sign in or create a candidate account to apply.', requiresAuth: true },
      { status: 401 },
    );
  }
  const email = v.user.email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid request body.');
  }

  // Honeypot.
  if (typeof body === 'object' && body && 'website' in body && (body as { website?: string }).website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // 2. Rate limit.
  const clientId = getClientId(request);
  const rl = checkRateLimit('jobApplication', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many applications. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Application service unavailable.');

  // 3. Verify the job is genuinely published, active, NOT deleted.
  let jobSnap;
  try {
    jobSnap = await db.collection('jobs').doc(data.jobId).get();
  } catch {
    return jsonError(503, 'Could not verify the job.');
  }
  if (!jobSnap.exists) return jsonError(404, 'Job not found.');
  const job = jobSnap.data() as { isActive?: boolean; deletedAt?: unknown; title?: string };
  if (!job.isActive || job.deletedAt) {
    return jsonError(404, 'This role is no longer accepting applications.');
  }

  // 4. Read the candidate profile (BEST-EFFORT prefill fallback). Profile
  //    completeness is NEVER a gate for applying — a candidate with an
  //    incomplete (or even non-existent) profile can submit a valid
  //    application. The form supplies fullName/phone/resumeStoragePath; the
  //    profile is only a fallback for fields the candidate left blank.
  const profileSnap = await db.collection('candidates').doc(email).get();
  const profile = profileSnap.exists
    ? (profileSnap.data() as { fullName?: string; phone?: string; skills?: string[]; resumeStoragePath?: string })
    : {};

  // 5. Resume handling. The resume is OPTIONAL by default. A job may set
  //    resumeRequired:true to require it (the apply form communicates this
  //    before submission). The candidate may supply a resumeStoragePath from
  //    an inline upload (stored via /api/candidate/resume under
  //    candidates/{email}/resumes/). OWNERSHIP is enforced: the path MUST be
  //    under the authenticated candidate's own prefix — a client cannot
  //    reference another candidate's resume. The shape is validated by
  //    validateResumePath.
  const jobData = jobSnap.data() as { resumeRequired?: boolean } | undefined;
  const resumeRequired = !!(jobData?.resumeRequired);
  let resumePath = '';
  if (typeof data.resumeStoragePath === 'string' && data.resumeStoragePath) {
    const ownerPrefix = `candidates/${email}/resumes/`;
    if (data.resumeStoragePath.startsWith(ownerPrefix) && validateResumePath(data.resumeStoragePath)) {
      resumePath = data.resumeStoragePath;
    } else {
      return jsonError(400, 'Invalid resume reference.');
    }
  }
  if (!resumePath) {
    // Fall back to the profile resume if the candidate has one (already owned:
    // /api/candidate/resume writes under the same authenticated prefix).
    resumePath = profile.resumeStoragePath && validateResumePath(profile.resumeStoragePath) ? profile.resumeStoragePath : '';
  }
  if (resumeRequired && !resumePath) {
    return jsonError(422, 'A resume is required for this role. Please upload your resume to continue.', { resumeRequired: true });
  }

  // 5 + 6. Transactional duplicate-check + create. The duplicate check + the
  //        insert run inside a single Firestore transaction so two concurrent
  //        authenticated POSTs from the same candidate cannot both pass an
  //        empty-result check and both write (the TOCTOU race a non-atomic
  //        query-then-write would leave). Firestore re-reads + retries the
  //        transaction on conflict, so the check + insert are atomic. A
  //        previously soft-deleted application does NOT block a fresh
  //        re-application (existing product policy).
  const appRef = db.collection('jobApplications').doc();
  const applicationId = 'APP_' + Math.random().toString(36).slice(2, 11);
  try {
    await db.runTransaction(async (tx) => {
      const dup = await tx.get(
        db
          .collection('jobApplications')
          .where('candidateEmail', '==', email)
          .where('jobId', '==', data.jobId),
      );
      const hasActive = dup.docs.some(
        (d) => (d.data() as { deletedAt?: unknown }).deletedAt == null,
      );
      if (hasActive) {
        throw new DuplicateApplication();
      }
      tx.create(appRef, {
        applicationId,
        candidateId: email, // authenticated candidate
        candidateName: data.fullName || profile.fullName || '',
        candidateEmail: email, // verified account email
        candidatePhone: data.phone || profile.phone || '',
        jobId: data.jobId,
        jobTitle: job.title || '',
        resumeStoragePath: resumePath, // validated + ownership-checked at step 5
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        coverLetter: data.coverLetter || '',
        expectedSalary: data.expectedSalary || '',
        noticePeriod: data.noticePeriod || '',
        preferredJobLocation: data.preferredJobLocation || '',
        status: 'New',
        appliedAt: new Date(),
        appliedVia: 'candidate_account',
        deletedAt: null,
      });
    });
  } catch (err) {
    if (err instanceof DuplicateApplication) {
      return jsonError(409, 'You have already applied for this role.');
    }
    console.error('[job-app] store failed:', err instanceof Error ? err.message : err);
    return jsonError(500, 'Could not store application.');
  }

  // 8. Branded application confirmation email (Phase 5.2 / Prompt 05Q §9).
  //    Best-effort resume attachment: the candidate's own resume is fetched
  //    from private Storage + attached ONLY if it downloads successfully AND
  //    its size is within the safe SMTP attachment limit. If the fetch or size
  //    check fails, the email is still sent with a secure authenticated
  //    reference (a link to the candidate's own profile). The resume path comes
  //    from the authenticated application record (never the request body), so
  //    another candidate's resume can never be attached. A failed email NEVER
  //    discards the successfully stored application.
  let resumeBuffer: Buffer | undefined;
  let resumeFileName: string | undefined;
  // resumePath is the validated + ownership-checked path computed at step 5
  // (form upload → profile fallback). Validate the shape BEFORE fetching the
  // object (defense-in-depth: a corrupted value cannot make this attachment
  // fetch an arbitrary Storage object). Ownership was already enforced.
  if (validateResumePath(resumePath)) {
    try {
      const bucket = getAdminBucket()?.bucket();
      if (bucket) {
        const file = bucket.file(resumePath);
        const [meta] = await file.getMetadata();
        const sizeBytes = Number(meta.size || 0);
        if (sizeBytes > 0 && sizeBytes <= SAFE_ATTACHMENT_BYTES) {
          const [buf] = await file.download();
          resumeBuffer = buf;
          resumeFileName = (resumePath.split('/').pop() || 'resume').slice(0, 100);
        }
      }
    } catch {
      // Non-fatal: send the confirmation without the attachment.
    }
  }
  const confirmation = await sendApplicationConfirmation({
    to: email,
    candidateName: data.fullName || profile.fullName || '',
    jobTitle: job.title || '',
    applicationId,
    appliedAt: new Date(),
    resumeBuffer,
    resumeFileName,
  });
  // Record the honest email status on the application document for diagnosis.
  try {
    await appRef.update({ confirmationEmail: { status: confirmation.status, detail: confirmation.detail || null, at: new Date() } });
  } catch {
    // Non-fatal: the application is already stored; this is diagnostic only.
  }

  await logSecurityEvent({ type: 'register', email, ip, detail: `job_application:${data.jobId}` });

  return NextResponse.json(
    { success: true, message: 'Application submitted.', reference: applicationId, notification: confirmation.status },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
