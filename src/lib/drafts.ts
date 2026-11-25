/**
 * drafts.ts — secure server-backed draft persistence for authenticated admins.
 *
 * Replaces the Batch-1 localStorage-only autosave with an Admin-SDK path that
 * bypasses the default-deny Firestore rules (no client-SDK writes), enforces
 * per-owner authorization on every read/write/delete, and survives refreshes +
 * cross-device sessions. localStorage remains the offline/failure fallback in
 * `useAutosave`; this module is the authoritative cloud store.
 *
 * Storage model: one draft per (owner, type) — the doc id is derived from the
 * owner email + draft type, so it is stable across devices for a given admin.
 *   `drafts/{type}__{ownerEmail}`
 * Fields: `{ ownerEmail, type, data, createdAt, updatedAt }`.
 *
 * Ownership is enforced two ways: (1) the doc id is derived from the caller's
 * email (the route passes `auth.user.email`, never a client-supplied owner),
 * and (2) the stored `ownerEmail` is re-checked on load/update/delete so a
 * mismatched/legacy doc can never be read or mutated by the wrong admin.
 *
 * Pure-ish: `getAdminDb()` is the only I/O surface, so tests mock
 * `@/lib/firebase-admin` (same pattern as the auth tests) + drive the in-memory
 * fake.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export type DraftType = 'jobs' | 'blogPosts' | 'drafts';

export interface DraftRecord {
  ownerEmail: string;
  type: DraftType;
  data: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DraftPayload {
  data: Record<string, unknown>;
  updatedAt: string | null;
}

export type DraftOpResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; reason: 'unavailable' | 'forbidden' | 'not_found' | 'invalid' };

/** Stable, owner-scoped doc id (one draft per owner+type → cross-device). */
export function draftDocId(ownerEmail: string, type: DraftType): string {
  return `${type}__${ownerEmail.toLowerCase()}`;
}

function toISO(ts: Timestamp): string | null {
  try {
    return ts.toDate().toISOString();
  } catch {
    return null;
  }
}

/**
 * Create or update the caller's draft for `type`. If a draft already exists it
 * MUST be owned by the caller (otherwise `forbidden` — never silently
 * overwrites another admin's draft). `createdAt` is preserved on update.
 */
export async function saveDraft(input: {
  ownerEmail: string;
  type: DraftType;
  data: Record<string, unknown>;
}): Promise<DraftOpResult> {
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };
  if (!input.ownerEmail || !input.type) return { ok: false, reason: 'invalid' };

  const ref = db.collection('drafts').doc(draftDocId(input.ownerEmail, input.type));
  const now = Timestamp.now();
  try {
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as DraftRecord;
      if (existing.ownerEmail !== input.ownerEmail) {
        return { ok: false, reason: 'forbidden' };
      }
      await ref.update({ data: input.data, updatedAt: now });
    } else {
      await ref.set({
        ownerEmail: input.ownerEmail,
        type: input.type,
        data: input.data,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Load the caller's draft for `type`. Returns `not_found` when none exists and
 * `forbidden` when a doc exists but is owned by a different admin (never leaks
 * another admin's draft data).
 */
export async function loadDraft(input: {
  ownerEmail: string;
  type: DraftType;
}): Promise<DraftOpResult<DraftPayload>> {
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  const ref = db.collection('drafts').doc(draftDocId(input.ownerEmail, input.type));
  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, reason: 'not_found' };
    const d = snap.data() as DraftRecord;
    if (d.ownerEmail !== input.ownerEmail) return { ok: false, reason: 'forbidden' };
    return { ok: true, data: { data: d.data, updatedAt: toISO(d.updatedAt) } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Delete the caller's draft for `type`. Idempotent: a missing draft is a
 * success. A draft owned by a different admin is `forbidden` (never deleted).
 */
export async function deleteDraft(input: {
  ownerEmail: string;
  type: DraftType;
}): Promise<DraftOpResult> {
  const db = getAdminDb();
  if (!db) return { ok: false, reason: 'unavailable' };

  const ref = db.collection('drafts').doc(draftDocId(input.ownerEmail, input.type));
  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: true }; // idempotent
    const d = snap.data() as DraftRecord;
    if (d.ownerEmail !== input.ownerEmail) return { ok: false, reason: 'forbidden' };
    await ref.delete();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
