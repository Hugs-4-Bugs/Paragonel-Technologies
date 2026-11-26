/**
 * firestore-rules.test.ts — source-invariant guard for the Firestore rules.
 *
 * The app's security model requires EVERY collection to be denied to clients
 * (`allow read, write: if false`) because all access goes through Admin-SDK
 * route handlers. This test reads `firestore.rules` as text and asserts each
 * collection the app uses has an explicit deny block — so a future edit that
 * accidentally opens a collection (or omits a new one) fails the suite.
 *
 * This is a STATIC source check (no Firebase emulator / `firebase emulators:exec`
 * — that runtime rules test lives in test/security-rules.test.mjs, which needs
 * the emulator + is not part of the vitest run).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const RULES = readFileSync(
  path.resolve(__dirname, '../../../firestore.rules'),
  'utf8',
);

// Every collection the app touches (must match src/lib/** + src/app/api/**).
const DENIED_COLLECTIONS = [
  'jobs',
  'blogPosts',
  'jobApplications',
  'leads',
  'newsletterSubscribers',
  'adminActivityLogs',
  'admins',
  'candidates',
  'jobMatchEvents',
  'jobAlertsSent',
  'registrationChallenges',
  'services',
  'testimonials',
  'users',
  'otpRequests',
  'sessions',
  'securityEvents',
  'bootstrap',
  'clientProjects',
  'techEcosystem',
  'drafts',
];

describe('firestore.rules — defense-in-depth', () => {
  it('every app collection has an explicit deny block (no client access)', () => {
    for (const col of DENIED_COLLECTIONS) {
      // Find the match block for this collection.
      const matchRe = new RegExp(`match /${col}/\\{`);
      expect(matchRe.test(RULES), `rules must declare match /${col}/{`).toBe(true);
      // Extract the block from its `match` line (first 400 chars is plenty for
      // every block here) and assert it denies ALL client ops. Two valid forms:
      //   (a) `allow read, write: if false;`            (combined), OR
      //   (b) `allow create: if false;` + `allow read, update, delete: if false;` (split).
      // In both, every allow statement ends in `if false` — never `if true` or
      // `if request.auth...` (which would grant client access).
      const startIdx = RULES.search(matchRe);
      const block = RULES.slice(startIdx, startIdx + 400);
      expect(block, `${col} block must contain at least one deny`).toMatch(/if false/);
      expect(block, `${col} block must not grant client access (no 'if true' / request.auth)`).not.toMatch(/if true/);
      expect(block, `${col} block must not grant client access (no request.auth)`).not.toMatch(/request\.auth/);
      // Must deny the write side — a deny statement whose method list includes a
      // write method (write/update/delete). Matches both forms:
      //   `allow read, write: if false`            (combined)
      //   `allow read, update, delete: if false`   (split, multi-method)
      const deniesWrite = /allow [^:]*\b(write|update|delete)\b[^:]*:\s*if false/.test(block);
      expect(deniesWrite, `${col} block must deny writes (write/update/delete)`).toBe(true);
    }
  });

  it('the newly-added collections (clientProjects/techEcosystem/drafts) are explicitly denied (no longer default-deny-by-omission)', () => {
    for (const col of ['clientProjects', 'techEcosystem', 'drafts']) {
      expect(RULES).toContain(`match /${col}/{`);
    }
  });

  it('the stale "users remains open" comment was corrected (users IS locked now)', () => {
    // The old stale comment claimed `users` read/write remained open. It must
    // not be present (it misled readers about the security posture).
    expect(RULES).not.toMatch(/users['`]?\s+read\/write remains open/i);
    // And users must be explicitly denied.
    const idx = RULES.search(/match \/users\/\{/);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(/allow read, write:\s*if false/.test(RULES.slice(idx, idx + 200))).toBe(true);
  });

  it('the rules version is v2', () => {
    expect(RULES).toMatch(/rules_version\s*=\s*'2'/);
  });
});
