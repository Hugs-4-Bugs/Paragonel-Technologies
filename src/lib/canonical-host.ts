/**
 * canonical-host.ts — Paragonel company-domain redirect decision
 * (Batch 3 Task 4 / Batch 4 Task 2 correction).
 *
 * Extracted from src/middleware.ts so the host-redirect logic is unit-testable.
 *
 * SCOPE — Paragonel company-domain redirects ONLY:
 *   - www.paragonel.com → paragonel.com (apex). Canonical-domain consistency:
 *     the apex is the canonical host (matches metadataBase + sitemap/robots).
 *     Only fires if the www host is pointed at the app — the Vercel preview
 *     host (paragonel.vercel.app) is NEVER redirected, so preview access is
 *     unaffected.
 *
 * DELIBERATELY NOT HANDLED HERE — the AcquisitionOS product domain
 * (acquisitionos.net) is a SEPARATE deployment (the AcquisitionOS product app,
 * not this paragonel site). Per Batch 4 Task 2, acquisitionos.net is the
 * INTENDED canonical product domain and is NOT redirected to the temporary beta
 * Vercel URL. The paragonel app does not redirect acquisitionos.net at all —
 * if that host arrives here it is a DNS misconfiguration (acquisitionos.net DNS
 * should point at the AcquisitionOS product deployment, not this app). See
 * docs/DOMAINS.md for the manual DNS configuration. This keeps Paragonel
 * company-domain redirects separate from AcquisitionOS domain handling and
 * guarantees no redirect loop (neither acquisitionos.net nor the beta host is
 * redirected by this app).
 */

/** The canonical apex host for the paragonel site. */
export const PARAGONEL_APEX_HOST = 'paragonel.com';

export interface CanonicalRedirect {
  /** Absolute redirect URL (the apex + preserved path + query). */
  url: string;
  /** 308 permanent — canonical, not temporary. */
  permanent: boolean;
}

/**
 * Decide whether a request's host should be canonical-redirected. Returns the
 * redirect target (with `permanent: true`) or null when the host is already
 * canonical (the apex, the Vercel preview, localhost, the AcquisitionOS hosts,
 * or any other host). acquisitionos.net + the beta host are intentionally NOT
 * redirected by this app (separate deployment — see file header).
 */
export function canonicalHostRedirect(
  host: string,
  pathname: string,
  search: string,
): CanonicalRedirect | null {
  const h = (host || '').toLowerCase();
  if (!h) return null;

  if (h === `www.${PARAGONEL_APEX_HOST}`) {
    const url = new URL(pathname || '/', `https://${PARAGONEL_APEX_HOST}`);
    url.search = search || '';
    return { url: url.toString(), permanent: true };
  }

  return null;
}
