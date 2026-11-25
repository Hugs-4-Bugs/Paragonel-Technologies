/**
 * checksum.ts — deterministic checksums for migrated Firestore docs.
 *
 * A stable SHA-256 over a canonical JSON serialization of the source doc, so:
 *   - the same doc produces the same checksum regardless of key insertion
 *     order (sorted recursively);
 *   - a re-run can detect whether the source doc CHANGED since the last
 *     migration (compare the new checksum to the one stored in
 *     `migration_audit.checksum`);
 *   - the value is suitable as a `migration_audit.checksum` row.
 *
 * Pure (no I/O) so it is unit-testable with synthetic fixtures.
 */
import { createHash } from 'node:crypto';
import type { FirestoreDoc } from './mapper';

/** Normalize a Firestore value that may be a Timestamp, Date, ISO string, or null → ISO string | null. */
function normalizeTimestamp(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'object' && v !== null && '_seconds' in v) {
    const s = (v as { _seconds: number })._seconds;
    return new Date(s * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

/**
 * Stable JSON serialization: keys sorted recursively, Timestamp/Date values
 * normalized to ISO strings, arrays preserved in order. This is NOT a security
 * primitive — it is a deterministic fingerprint for drift detection.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForStableSerialize(value));
}

function normalizeForStableSerialize(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === 'object' && v !== null && '_seconds' in v) {
    return normalizeTimestamp(v);
  }
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(normalizeForStableSerialize);
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = normalizeForStableSerialize((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

/** SHA-256 (hex) of the stable serialization of `{ id, data }` for a Firestore doc. */
export function checksumDoc(doc: FirestoreDoc): string {
  const payload = stableStringify({ id: doc.id, data: doc.data });
  return createHash('sha256').update(payload).digest('hex');
}
