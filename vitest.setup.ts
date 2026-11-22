/**
 * vitest setup — loads .env.local into process.env so integration tests that
 * depend on the Firestore emulator (FIRESTORE_EMULATOR_HOST) + other local
 * config work when running `npm run test` standalone (without manually
 * exporting the env first).
 *
 * Existing process.env values are NEVER overwritten — real environment wins.
 * Only values that are absent from process.env are filled from .env.local.
 * This is read-only loading of the gitignored local env; it does not print or
 * log any values.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding single or double quotes.
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
} catch {
  // .env.local absent or unreadable — skip. Tests that require the emulator
  // will fail with a clear 503/Admin-SDK-unavailable message.
}
