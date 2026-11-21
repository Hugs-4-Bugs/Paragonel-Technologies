import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Custom branded 404 (Prompt 05M §1 — correct error states). Replaces the
 * default Next.js "404: This page could not be found." with a Paragonel-branded
 * page that offers a clear way home + to services. Server component, no client
 * JS, no fake data.
 */
export default function NotFound() {
  return (
    <section className="pt-section pt-surface-quiet min-h-[60vh] flex items-center">
      <div className="pt-shell text-center">
        <p className="pt-index text-sm">404</p>
        <h1 className="pt-h1 mt-4 text-foreground">
          This page could not be <span className="text-primary">found.</span>
        </h1>
        <p className="pt-lead mt-6 max-w-xl mx-auto">
          The page you were looking for may have moved, been renamed, or never existed. Use the
          links below to get back to something useful.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="pt-btn pt-btn-primary">
            <Home className="h-4 w-4 mr-2" /> Back home
          </Link>
          <Link href="/services" className="pt-btn pt-btn-ghost">
            <ArrowLeft className="h-4 w-4 mr-2" /> Browse services
          </Link>
        </div>
      </div>
    </section>
  );
}
