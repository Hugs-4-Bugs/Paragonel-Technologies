import { FakeFirestore } from './fake-firestore';

/** Singleton fake Firestore shared by the mock factory and the tests. */
export const fakeInstance = new FakeFirestore();

/** Clear all collections between tests. */
export function resetFake() {
  for (const c of fakeInstance.collections.values()) c.docs.clear();
}
