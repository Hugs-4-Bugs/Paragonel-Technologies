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
import { getAdminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { verifySession } from '@/lib/auth/sessions';
import { checkRateLimit, getClientId } from '@/lib/submission-security';
import { meetsApplicationMinimum } from '@/lib/auth/candidate-profile';
import { logSecurityEvent } from '@/lib/auth/security-events';
import { getClientIp, jsonError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const applySchema = z.object({
  jobId: z.string().trim().min(1, 'Job ID is required').max(100),
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

  // 4. Read the candidate profile → verify minimum application info.
  const profileSnap = await db.collection('candidates').doc(email).get();
  if (!profileSnap.exists) {
    return NextResponse.json(
      { error: 'Please complete your candidate profile before applying.', incomplete: true, redirect: '/candidate/profile' },
      { status: 422 },
    );
  }
  const profile = profileSnap.data() as {
    fullName?: string; phone?: string; skills?: string[]; resumeStoragePath?: string;
  };
  if (!meetsApplicationMinimum(profile)) {
    return NextResponse.json(
      { error: 'Your profile is missing required information (name, phone or location, and at least one skill/headline/designation). Please complete it before applying.', incomplete: true, redirect: '/candidate/profile' },
      { status: 422 },
    );
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
        candidateName: profile.fullName,
        candidateEmail: email, // verified account email
        candidatePhone: profile.phone || '',
        jobId: data.jobId,
        jobTitle: job.title || '',
        resumeStoragePath: profile.resumeStoragePath || '',
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

  await logSecurityEvent({ type: 'register', email, ip, detail: `job_application:${data.jobId}` });

  return NextResponse.json({ success: true, message: 'Application submitted.' }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
