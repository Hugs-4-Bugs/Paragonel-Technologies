"use client";

/**
 * /profile — legacy profile route.
 *
 * Previously this page gated on the simulated auth context and wrote the
 * profile document directly to Firestore from the browser (`setDoc(doc(db,
 * 'users', uid), ...)`). Both are removed:
 *   - the Firestore security rules deny all client writes to `users`, so the
 *     client write silently failed (default-deny) and was never a real save
 *     path;
 *   - simulated auth is gone — the server-verified `/api/auth/me` is now the
 *     only proof of authentication.
 *
 * To preserve the "My Profile" capability and route without the insecure
 * client write, this page redirects to the server-verified candidate profile
 * page (`/candidate/profile`), which reads + writes through
 * `/api/candidate/profile` (`verifySession(tier:'user')`, Admin SDK,
 * zod-validated). If the visitor has no candidate session, that page redirects
 * them to `/auth/login?redirect=/candidate/profile`.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/candidate/profile');
  }, [router]);
  return null;
}
