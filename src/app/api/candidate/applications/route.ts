/**
 * GET /api/candidate/applications — the authenticated candidate's application
 * history + status (Batch 2 Task 2).
 *
 * Closes the dead-end where `ApplyJobModal` told candidates to "track its
 * status from your profile" but `/candidate/profile` showed no applications.
 *
 * Ownership: `verifySession(tier:'user')` → the candidate's email. The query
 * is scoped to `candidateEmail == email` (server-set on submission); a
 * candidate can ONLY see their own applications — never another candidate's.
 * Soft-deleted applications (`deletedAt != null`) are excluded. The response
 * carries no resume path, no other candidate's data, no internal ids beyond
 * the application id + job id the candidate already knows.
 */
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifySession } from '@/lib/auth/sessions';
import { jsonError } from '@/lib/auth/route-helpers';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ApplicationRow {
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
  status?: string;
  appliedAt?: Timestamp | Date | string | null;
  deletedAt?: unknown;
}

function toISO(v: ApplicationRow['appliedAt']): string | null {
  if (!v) return null;
  try {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof v === 'string') return v;
  } catch {
    return null;
  }
  return null;
}

export async function GET(request: Request) {
  const v = await verifySession(request, undefined, 'user');
  if (!v.ok) return v.response;
  const email = v.user.email;

  const db = getAdminDb();
  if (!db) return jsonError(503, 'Service unavailable.');

  try {
    const snap = await db.collection('jobApplications').where('candidateEmail', '==', email).get();
    const applications = snap.docs
      .map((d) => d.data() as ApplicationRow)
      .filter((a) => a.deletedAt == null)
      .map((a) => ({
        applicationId: a.applicationId ?? null,
        jobId: a.jobId ?? null,
        jobTitle: a.jobTitle ?? '',
        status: a.status ?? 'New',
        appliedAt: toISO(a.appliedAt),
      }))
      .sort((a, b) => {
        const ta = a.appliedAt ? Date.parse(a.appliedAt) : 0;
        const tb = b.appliedAt ? Date.parse(b.appliedAt) : 0;
        return tb - ta;
      });
    return NextResponse.json({ applications });
  } catch {
    return jsonError(500, 'Could not load applications.');
  }
}
