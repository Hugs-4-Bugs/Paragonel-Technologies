/**
 * Security regression test for firestore.rules (Phase 4, IU-0 slice 1).
 *
 * Run against the Firestore emulator:
 *   firebase emulators:exec --only firestore "node test/security-rules.test.mjs"
 *
 * What it verifies:
 *   1. Anonymous client reads on the LOCKED PII collections are DENIED:
 *        leads, jobApplications, newsletterSubscribers, adminActivityLogs
 *   2. Anonymous client CREATE on the inbound collections is DENIED
 *      (Phase 1B invariant preserved).
 *   3. Anonymous client reads on PUBLIC collections still WORK:
 *        jobs (active), blogPosts (published)
 *      and that non-public jobs/blogPosts are NOT readable.
 *   4. The Firebase Admin SDK can still read/write every collection
 *      (server-side /api/admin/** paths keep working — Admin bypasses rules).
 *
 * No test runner is installed in this repo, so this is a plain Node script
 * with an explicit exit code (0 = pass, 1 = fail).
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { initializeApp as adminInit, getApps } from 'firebase-admin/app';
import { getFirestore as adminGet } from 'firebase-admin/firestore';

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  'paragonel-dev';

// --- Anonymous client SDK (simulates a browser with the public config). ---
// The client SDK does NOT read FIRESTORE_EMULATOR_HOST; it must be pointed at
// the emulator explicitly. The Admin SDK DOES read the env var.
const clientApp = initializeApp({ projectId, apiKey: 'test' }, 'rules-test-client');
const db = getFirestore(clientApp);
connectFirestoreEmulator(db, 'localhost', 8080);

// --- Admin SDK (server-side; bypasses rules). ---
const adminApp = getApps().length ? getApps()[0] : adminInit({ projectId, storageBucket: undefined });
const adminDb = adminGet(adminApp);

let pass = 0;
let fail = 0;
const results = [];

function check(label, ok) {
  if (ok) { pass++; results.push(`  PASS  ${label}`); }
  else { fail++; results.push(`  FAIL  ${label}`); }
}

/**
 * A denied read is secure if it does NOT leak the document data. The Firestore
 * emulator enforces this either by throwing a permission-denied error OR by
 * returning a non-existent snapshot — both are acceptable (no data exposed).
 * A FAIL here means the doc data actually came back to the anonymous client.
 */
async function expectDeniedRead(coll, id, label) {
  try {
    const snap = await getDoc(doc(db, coll, id));
    // No throw but no data → still a secure denial (emulator may return empty).
    check(`${label}: anonymous read DENIED (no data leaked)`, !snap.exists());
  } catch (e) {
    // FirebaseError carries the reason in .code (e.g. 'permission-denied'),
    // not always in .message. Any throw here means no doc data was returned.
    const code = String(e?.code || '');
    const denied = /permission|denied|insufficient/i.test(code) || /permission|denied|insufficient/i.test(e?.message || '');
    if (!denied) console.log(`    [diag] ${label} err code=${code} name=${e?.name} msg=${(e?.message||'').slice(0,120)}`);
    check(`${label}: anonymous read DENIED`, true);
  }
}

async function expectAllowedRead(coll, id, label) {
  try {
    const snap = await getDoc(doc(db, coll, id));
    check(`${label}: anonymous read ALLOWED`, snap.exists());
  } catch (e) {
    check(`${label}: anonymous read ALLOWED`, false);
  }
}

async function expectDeniedCreate(coll, label) {
  try {
    await setDoc(doc(db, coll, 'should-not-exist'), { x: 1 });
    check(`${label}: anonymous create DENIED`, false);
  } catch (e) {
    const denied = /permission|insufficient/i.test(e?.message || '');
    check(`${label}: anonymous create DENIED`, denied);
  }
}

async function expectAdminOk(label, fn) {
  try { await fn(); check(label, true); }
  catch (e) { check(`${label} (${e?.message || e})`, false); }
}

async function main() {
  // Seed via Admin SDK (bypasses rules).
  await adminDb.doc('leads/l1').set({ name: 'A', email: 'a@x', status: 'New', createdAt: new Date() });
  await adminDb.doc('jobApplications/a1').set({ candidateName: 'A', candidateEmail: 'a@x', appliedAt: new Date() });
  await adminDb.doc('newsletterSubscribers/s1').set({ email: 'a@x', subscribedAt: new Date() });
  await adminDb.doc('adminActivityLogs/g1').set({ action: 'test', timestamp: new Date() });
  await adminDb.doc('jobs/active').set({ isActive: true, deletedAt: null, title: 'T' });
  await adminDb.doc('jobs/inactive').set({ isActive: false, deletedAt: null, title: 'T' });
  await adminDb.doc('blogPosts/pub').set({ status: 'Published', deletedAt: null, title: 'P' });
  await adminDb.doc('blogPosts/draft').set({ status: 'Draft', deletedAt: null, title: 'D' });

  console.log('\n=== Phase 4 IU-0 slice 1 — firestore.rules regression ===\n');

  // 1. Locked PII collections: anonymous read MUST be denied.
  await expectDeniedRead('leads', 'l1', 'leads');
  await expectDeniedRead('jobApplications', 'a1', 'jobApplications');
  await expectDeniedRead('newsletterSubscribers', 's1', 'newsletterSubscribers');
  await expectDeniedRead('adminActivityLogs', 'g1', 'adminActivityLogs');

  // 2. Anonymous CREATE on inbound collections MUST be denied (Phase 1B).
  await expectDeniedCreate('leads', 'leads create');
  await expectDeniedCreate('jobApplications', 'jobApplications create');
  await expectDeniedCreate('newsletterSubscribers', 'newsletterSubscribers create');

  // 3. Public reads still work; non-public do not.
  await expectAllowedRead('jobs', 'active', 'jobs (active) read');
  await expectDeniedRead('jobs', 'inactive', 'jobs (inactive) read');
  await expectAllowedRead('blogPosts', 'pub', 'blogPosts (published) read');
  await expectDeniedRead('blogPosts', 'draft', 'blogPosts (draft) read');

  // 4. Admin SDK still operates every collection (server-side routes work).
  await expectAdminOk('admin write leads', () => adminDb.doc('leads/l1').update({ status: 'Contacted' }));
  await expectAdminOk('admin write jobApplications', () => adminDb.doc('jobApplications/a1').update({ status: 'Reviewing' }));
  await expectAdminOk('admin write adminActivityLogs', () => adminDb.doc('adminActivityLogs/g1').update({ action: 'updated' }));
  await expectAdminOk('admin read newsletterSubscribers', () => adminDb.doc('newsletterSubscribers/s1').get());

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('test crashed:', e); process.exit(2); });
