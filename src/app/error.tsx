'use client';

import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';

/**
 * Segment-level error boundary (Prompt 05M — correct error states).
 *
 * Catches unhandled runtime errors in a route segment + renders a branded,
 * recoverable page. In production the error's message/stack is NEVER rendered
 * to the client (Next.js guarantees this); only a generic, safe message is
 * shown. A `reset()` retry re-attempts the segment render.
 *
 * This is a client component by requirement (Next.js error boundaries must be
 * client components so they can call `reset`).
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="pt-section pt-surface-quiet min-h-[60vh] flex items-center">
      <div className="pt-shell text-center">
        <p className="pt-index text-sm">500</p>
        <h1 className="pt-h1 mt-4 text-foreground">
          Something <span className="text-primary">went wrong.</span>
        </h1>
        <p className="pt-lead mt-6 max-w-xl mx-auto">
          An unexpected error occurred while rendering this page. You can try again, or head back
          home. If the problem persists, please contact support.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="pt-btn pt-btn-primary">
            <RotateCcw className="h-4 w-4 mr-2" /> Try again
          </button>
          <Link href="/" className="pt-btn pt-btn-ghost">
            <Home className="h-4 w-4 mr-2" /> Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
