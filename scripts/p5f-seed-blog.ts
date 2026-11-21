/**
 * p5f-seed-blog.ts — dev-only: seed blogPosts into the Firestore emulator
 * via the Admin SDK (bypasses auth, like /api/admin/seed). Used only to verify
 * the blog reading experience locally; not run in production.
 *
 * Run with the emulator env (FIRESTORE_EMULATOR_HOST=localhost:8080).
 */
import { getAdminDb } from '../src/lib/firebase-admin';
import { blogPosts } from '../src/lib/data';

async function main() {
  const db = getAdminDb();
  if (!db) {
    console.error('Admin SDK not configured (no emulator?). Set FIRESTORE_EMULATOR_HOST.');
    process.exit(1);
  }
  let count = 0;
  for (const post of blogPosts) {
    const ref = db.collection('blogPosts').doc(post.id);
    await ref.set({ ...post, deletedAt: null });
    count++;
  }
  console.log(`Seeded ${count} blogPosts into the emulator.`);
}
main().catch((e) => {
  console.error('seed failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
