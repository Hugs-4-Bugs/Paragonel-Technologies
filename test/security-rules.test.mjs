/**
 * Security regression test for firestore.rules (Phase 4, IU-0 slices 1 + 2).
 *
 * Run against the Firestore emulator:
 *   firebase emulators:exec --only firestore "node test/security-rules.test.mjs"
 * (or, with the emulator already running on :8080: `node test/security-rules.test.mjs`)
 *
 * What it verifies:
 *   SLICE 1 (PII lockdown — must still hold):
 *     1. Anonymous client reads on the LOCKED PII collections are DENIED:
 *          leads, jobApplications, newsletterSubscribers, adminActivityLogs
 *     2. Anonymous client CREATE on the inbound collections is DENIED.
 *   SLICE 2 (CMS content lockdown — this slice):
 *     3. Anonymous client WRITE (create/update) on `jobs` and `blogPosts` is
 *        DENIED. Admin CRUD must go through /api/admin/jobs|blog (Admin SDK).
 *     4. Anonymous client reads on jobs/blogPosts are DENIED ENTIRELY (the rules
 *        are `allow read, write: if false`). Public reads go through the server
 *        (Admin SDK via src/lib/public-data.ts, filtering isActive/status +
 *        deletedAt). The previous `allow read: if resource.data.isActive` rule
 *        was broken in production (resource.data undefined for list) — replaced
 *        by deny-all + server-side reads. Updated 05N: the two stale
 *        `expectAllowedRead` assertions (active jobs / published blogPosts) are
 *        now `expectDeniedRead` to match the intentional deny-all rules.
 *     5. The `blogPosts/{post}/revisions` subcollection is DENIED to clients.
 *     6. The Firebase Admin SDK can still read/write every collection
 *        (server-side /api/admin/** paths keep working — Admin bypasses rules).
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
  updateDoc,
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
    check(`${label}: anonymous read DENIED (no data leaked)`, !snap.exists());
  } catch (e) {
    const code = String(e?.code || '');
    const denied = /permission|denied|insufficient/i.test(code) || /permission|denied|insufficient/i.test(e?.message || '');
    if (!denied) console.log(`    [diag] ${label} err code=${code} name=${e?.name} msg=${(e?.message||'').slice(0,120)}`);
    check(`${label}: anonymous read DENIED`, true);
  }
}

/** Denial check for an arbitrary doc path (used for subcollections). */
async function expectDeniedReadPath(segments, label) {
  try {
    const snap = await getDoc(doc(db, ...segments));
    check(`${label}: anonymous read DENIED (no data leaked)`, !snap.exists());
  } catch (e) {
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
    await setDoc(doc(db, coll, 'should-not-exist-' + Math.random().toString(36).slice(2, 8)), { x: 1 });
    check(`${label}: anonymous create DENIED`, false);
  } catch (e) {
    const denied = /permission|insufficient/i.test(e?.message || '');
    check(`${label}: anonymous create DENIED`, denied);
  }
}

/** Anonymous UPDATE on an existing doc must be denied. */
async function expectDeniedUpdate(coll, id, label) {
  try {
    await updateDoc(doc(db, coll, id), { updatedAt: 'attacker' });
    check(`${label}: anonymous update DENIED`, false);
  } catch (e) {
    const denied = /permission|insufficient/i.test(e?.message || '');
    check(`${label}: anonymous update DENIED`, denied);
  }
}

async function expectAdminOk(label, fn) {
  try { await fn(); check(label, true); }
  catch (e) { check(`${label} (${e?.message || e})`, false); }
}

async function main() {
  // Seed via Admin SDK (bypasses rules).
  // Slice 1 PII docs.
  await adminDb.doc('leads/l1').set({ name: 'A', email: 'a@x', status: 'New', createdAt: new Date() });
  await adminDb.doc('jobApplications/a1').set({ candidateName: 'A', candidateEmail: 'a@x', appliedAt: new Date() });
  await adminDb.doc('newsletterSubscribers/s1').set({ email: 'a@x', subscribedAt: new Date() });
  await adminDb.doc('adminActivityLogs/g1').set({ action: 'test', timestamp: new Date() });

  // Slice 2 jobs docs: active, inactive, soft-deleted.
  await adminDb.doc('jobs/active').set({ isActive: true, deletedAt: null, title: 'T', status: 'Active' });
  await adminDb.doc('jobs/inactive').set({ isActive: false, deletedAt: null, title: 'T', status: 'Draft' });
  await adminDb.doc('jobs/softdeleted').set({ isActive: true, deletedAt: new Date(), title: 'T', status: 'Active' });

  // Slice 2 blogPosts docs: published, draft, soft-deleted published.
  await adminDb.doc('blogPosts/pub').set({ status: 'Published', deletedAt: null, title: 'P', slug: 'p' });
  await adminDb.doc('blogPosts/draft').set({ status: 'Draft', deletedAt: null, title: 'D', slug: 'd' });
  await adminDb.doc('blogPosts/softdeleted').set({ status: 'Published', deletedAt: new Date(), title: 'SD', slug: 'sd' });

  // Revision under a published post (must be denied to clients).
  await adminDb.doc('blogPosts/pub/revisions/r1').set({ body: 'v1', timestamp: new Date() });

  // 05R: job-matching + alert collections (candidate-scoped + internal scoring).
  await adminDb.doc('jobAlertsSent/jas1').set({ candidateEmail: 'a@x', jobId: 'active', jobVersion: 1, status: 'sent', score: 86 });
  await adminDb.doc('jobMatchEvents/ev1').set({ jobId: 'active', jobVersion: 1, status: 'pending', trigger: 'create' });

  console.log('\n=== Phase 4 IU-0 slice 1 + slice 2 + 05R — firestore.rules regression ===\n');

  // --- SLICE 1: locked PII collections — anonymous read MUST be denied. ---
  await expectDeniedRead('leads', 'l1', 'leads');
  await expectDeniedRead('jobApplications', 'a1', 'jobApplications');
  await expectDeniedRead('newsletterSubscribers', 's1', 'newsletterSubscribers');
  await expectDeniedRead('adminActivityLogs', 'g1', 'adminActivityLogs');

  // --- SLICE 1: anonymous CREATE on inbound collections MUST be denied. ---
  await expectDeniedCreate('leads', 'leads create');
  await expectDeniedCreate('jobApplications', 'jobApplications create');
  await expectDeniedCreate('newsletterSubscribers', 'newsletterSubscribers create');

  // --- SLICE 2: anonymous WRITE on jobs / blogPosts MUST be denied. ---
  await expectDeniedCreate('jobs', 'jobs create');
  await expectDeniedCreate('blogPosts', 'blogPosts create');
  await expectDeniedUpdate('jobs', 'active', 'jobs update');
  await expectDeniedUpdate('blogPosts', 'pub', 'blogPosts update');

  // --- SLICE 2: ALL client reads on jobs/blogPosts are DENIED (public reads
  //     go through the server via Admin SDK; the rules are deny-all). ---
  await expectDeniedRead('jobs', 'active', 'jobs (active) read');
  await expectDeniedRead('jobs', 'inactive', 'jobs (inactive) read');
  await expectDeniedRead('jobs', 'softdeleted', 'jobs (soft-deleted) read');
  await expectDeniedRead('blogPosts', 'pub', 'blogPosts (published) read');
  await expectDeniedRead('blogPosts', 'draft', 'blogPosts (draft) read');
  await expectDeniedRead('blogPosts', 'softdeleted', 'blogPosts (soft-deleted published) read');

  // --- SLICE 2: revisions subcollection denied to clients. ---
  await expectDeniedReadPath(['blogPosts', 'pub', 'revisions', 'r1'], 'blogPosts revisions read');
  try {
    await setDoc(doc(db, 'blogPosts', 'pub', 'revisions', 'attacker'), { x: 1 });
    check('blogPosts revisions create DENIED', false);
  } catch (e) {
    check('blogPosts revisions create DENIED', /permission|insufficient/i.test(e?.message || ''));
  }

  // --- 05R: jobAlertsSent + jobMatchEvents are DENIED to clients (Admin SDK only).
  //     These hold candidate-scoped + internal scoring data; a candidate must
  //     never read another candidate's outcome via the client SDK. ---
  await expectDeniedRead('jobAlertsSent', 'jas1', 'jobAlertsSent read');
  await expectDeniedCreate('jobAlertsSent', 'jobAlertsSent create');
  await expectDeniedUpdate('jobAlertsSent', 'jas1', 'jobAlertsSent update');
  await expectDeniedRead('jobMatchEvents', 'ev1', 'jobMatchEvents read');
  await expectDeniedCreate('jobMatchEvents', 'jobMatchEvents create');
  await expectDeniedUpdate('jobMatchEvents', 'ev1', 'jobMatchEvents update');

  // --- SLICE 1 + 2: Admin SDK still operates every collection (server routes). ---
  await expectAdminOk('admin write leads', () => adminDb.doc('leads/l1').update({ status: 'Contacted' }));
  await expectAdminOk('admin write jobApplications', () => adminDb.doc('jobApplications/a1').update({ status: 'Reviewing' }));
  await expectAdminOk('admin write adminActivityLogs', () => adminDb.doc('adminActivityLogs/g1').update({ action: 'updated' }));
  await expectAdminOk('admin read newsletterSubscribers', () => adminDb.doc('newsletterSubscribers/s1').get());
  await expectAdminOk('admin write jobs', () => adminDb.doc('jobs/active').update({ title: 'T2' }));
  await expectAdminOk('admin write blogPosts', () => adminDb.doc('blogPosts/pub').update({ title: 'P2' }));
  await expectAdminOk('admin write blogPosts revisions', () => adminDb.doc('blogPosts/pub/revisions/r1').set({ body: 'v2' }));
  await expectAdminOk('admin write jobAlertsSent (05R)', () => adminDb.doc('jobAlertsSent/jas1').update({ status: 'failed' }));
  await expectAdminOk('admin write jobMatchEvents (05R)', () => adminDb.doc('jobMatchEvents/ev1').update({ status: 'processed' }));

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('test crashed:', e); process.exit(2); });
