import { NextResponse } from 'next/server';

/**
 * Health-check endpoint for the supervised dev server (Phase 3 P0-A2).
 * Returns 200 + JSON when the Next.js process is alive and routing works.
 * The supervisor (scripts/dev-supervisor.sh) polls this to confirm recovery.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: 'alive',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      pid: typeof process !== 'undefined' ? process.pid : null,
    },
    { status: 200 }
  );
}


