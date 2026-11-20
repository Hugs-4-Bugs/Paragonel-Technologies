/**
 * POST /api/job-applications — secure server-side job application (Phase 1B).
 *
 * Accepts multipart/form-data: application fields + an optional resume file.
 * Flow: parse -> validate -> honeypot -> rate limit -> duplicate check ->
 *       resume upload (Admin Storage) -> Firestore write.
 *
 * The browser no longer uploads to Storage or writes to Firestore directly.
 * Field set matches the existing admin /admin/applications CRM
 * (applicationId, candidateName, candidateEmail, candidatePhone, jobId,
 *  jobTitle, resumeUrl, status, appliedAt, appliedVia, deletedAt, skills).
 *
 * No email is sent by default (the AI email-formatting flow only formats text;
 * sending notifications is out of Phase 1B scope unless a requirement is given).
 *
 * Status codes: 201 created, 400 invalid, 409 duplicate, 429 rate-limited,
 *               503 admin SDK not configured.
 */
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin';
import {
  jobApplicationSchema,
  getClientId,
  checkRateLimit,
} from '@/lib/submission-security';

export const dynamic = 'force-dynamic';

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  // Honeypot.
  const hp = formData.get('website');
  if (typeof hp === 'string' && hp.trim() !== '') {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  // Pull fields, preserving original strings (the form sends arrays as comma-lists).
  const raw: Record<string, string> = {};
  for (const key of [
    'jobId', 'jobTitle', 'fullName', 'email', 'phone', 'primarySkills',
    'coverLetter', 'linkedinProfile', 'portfolioWebsite', 'expectedSalary',
    'noticePeriod', 'preferredJobLocation',
  ]) {
    const v = formData.get(key);
    raw[key] = typeof v === 'string' ? v : '';
  }

  const parsed = jobApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const clientId = getClientId(request);
  const rl = checkRateLimit('jobApplication', clientId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many applications. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Application service unavailable.' }, { status: 503 });
  }

  // Duplicate check: same email applying to same job, not soft-deleted.
  try {
    const existing = await db
      .collection('jobApplications')
      .where('candidateEmail', '==', data.email)
      .where('jobId', '==', data.jobId)
      .limit(1)
      .get();
    if (!existing.empty) {
      const d = existing.docs[0].data();
      if (d && d.deletedAt == null) {
        return NextResponse.json(
          { error: 'You have already applied for this role.' },
          { status: 409 }
        );
      }
    }
  } catch (err) {
    console.error('[job-app] dup-check failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not verify application.' }, { status: 500 });
  }

  // Resume upload via Admin Storage (emulator when STORAGE_EMULATOR_HOST set).
  let resumeUrl = '';
  const resume = formData.get('resume');
  if (resume && typeof resume !== 'string') {
    const file = resume as File;
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume too large (max 5 MB).' }, { status: 400 });
    }
    if (file.type && !ALLOWED_RESUME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported resume file type.' }, { status: 400 });
    }
    const storage = getAdminBucket();
    if (!storage) {
      return NextResponse.json(
        { error: 'Resume storage unavailable.' },
        { status: 503 }
      );
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const objectPath = `resumes/${Date.now()}_${safeName}`;
      const storageFile = storage.bucket().file(objectPath);
      await storageFile.save(buf, {
        metadata: { contentType: file.type || 'application/octet-stream' },
      });
      // Store the storage path. Production would issue a signed URL; for local
      // emulator preview, the path is sufficient for the CRM to reference it.
      resumeUrl = objectPath;
    } catch (err) {
      console.error('[job-app] resume upload failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ error: 'Could not store resume.' }, { status: 500 });
    }
  }

  try {
    await db.collection('jobApplications').add({
      applicationId: 'APP_' + Math.random().toString(36).slice(2, 11),
      candidateName: data.fullName,
      candidateEmail: data.email,
      candidatePhone: data.phone,
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      resumeUrl,
      skills: data.primarySkills.split(',').map((s) => s.trim()).filter(Boolean),
      coverLetter: data.coverLetter || '',
      status: 'New',
      appliedAt: new Date(),
      appliedVia: 'form',
      deletedAt: null,
    });
  } catch (err) {
    console.error('[job-app] store failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not store application.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
