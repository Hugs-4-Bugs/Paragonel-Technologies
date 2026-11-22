/**
 * Next.js instrumentation hook — runs once when a new server instance starts.
 *
 * Calls the startup environment validation so missing/empty required variables
 * are surfaced with clear, non-sensitive messages at boot (instead of the
 * previous per-route 500/503 failures that were hard to diagnose).
 *
 * The guard `NEXT_RUNTIME === 'nodejs'` ensures this only runs in the Node.js
 * runtime (never the Edge runtime, which cannot import the full module).
 * validateEnvironment never throws — the app always starts; missing vars are
 * logged as warnings + the routes that depend on them already fail-closed.
 *
 * @see src/lib/env-validation.ts
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvironment } = await import('./lib/env-validation');
    validateEnvironment();
  }
}
