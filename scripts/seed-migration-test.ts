/** seed-migration-test.ts — writes a few test docs to the Firestore emulator so
 * the migration script has real data to read + map. Throwaway test fixture. */
import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  if (!db) throw new Error('emulator not initialized');
  await db.collection('newsletterSubscribers').doc('seed-sub-1').set({
    email: 'Seed@Test.com', source: 'Footer', subscribedAt: new Date(), deletedAt: null,
  });
  await db.collection('jobs').doc('seed-job-1').set({
    title: 'Migration Test Engineer', location: 'Remote', employmentType: 'Full Time',
    workArrangement: 'Remote', skills: ['TypeScript', 'Postgres'], isActive: true, createdAt: new Date(),
  });
  await db.collection('users').doc('seed-user@test.com').set({
    email: 'seed-user@test.com', fullName: 'Seed User', emailVerified: true, accountType: 'candidate',
    status: 'active', tokenVersion: 1, createdAt: new Date(),
  });
  await db.collection('candidates').doc('seed-user@test.com').set({
    email: 'seed-user@test.com', headline: 'Test Candidate', skills: ['TypeScript'],
    totalExperienceYears: 4, currentLocation: 'Remote', preferredJobLocation: 'Remote',
    workModePreference: 'Remote', matchingThreshold: 80, createdAt: new Date(),
  });
  console.log('[seed] wrote 1 newsletter, 1 job, 1 user, 1 candidate to the emulator');
}
main().catch((e) => { console.error(e); process.exit(1); });
