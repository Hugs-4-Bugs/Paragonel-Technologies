/**
 * GET /api/admin/system/health — real system health for the Admin dashboard.
 *
 * Replaces the previously HARDCODED "System Health" card on /admin ("Firestore
 * Persistence: Online" + "AI Matching Engine: Ready 95%" were literal strings
 * with no underlying check). This endpoint derives each indicator from the real
 * configuration:
 *   - firestore   : isAdminConfigured() (Firebase Admin SDK reachable w/ creds,
 *                   or emulator mode).
 *   - resumeStorage: isResumeStorageConfigured() (Supabase server client ready).
 *   - ai          : hasGeminiKey() (a Gemini API key env var is present).
 *
 * Any active admin (verifyAdmin) may read it (the dashboard is not super_admin
 * only). Values are booleans only — never keys, URLs, or credentials.
 */
import { NextResponse } from 'next/server';
import { isAdminConfigured } from '@/lib/firebase-admin';
import { isResumeStorageConfigured } from '@/lib/resume-storage';
import { hasGeminiKey } from '@/ai/models';
import { verifyAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    health: {
      firestore: isAdminConfigured(),
      resumeStorage: isResumeStorageConfigured(),
      ai: hasGeminiKey(),
    },
    // ISO timestamp so the UI can show "checked Ns ago" honestly.
    checkedAt: new Date().toISOString(),
  });
}
