'use client';

import Link from 'next/link';

/**
 * Global error boundary — the LAST resort. Next.js renders this (instead of the
 * root layout) when an error escapes every segment boundary, including during
 * the root layout render itself. It MUST include its own <html> + <body>.
 *
 * In production no stack trace or error detail is rendered to the client; only
 * a safe, generic, branded message. A hard reload is offered (the root layout
 * cannot be incrementally `reset`).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '40rem' }}>
            <p style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              Paragonel Technologies
            </p>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', marginTop: '1rem' }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: '1.5rem', color: '#475569', lineHeight: 1.6 }}>
              An unexpected error occurred. The team has been notified. You can reload the page, or
              return home. If the problem persists, please contact support.
            </p>
            <div style={{ marginTop: '2.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #0f172a',
                  background: '#0f172a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Reload
              </button>
              <Link
                href="/"
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  background: 'transparent',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Back home
              </Link>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
