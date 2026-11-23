/**
 * canonical-host.ts — canonical-domain redirect decision (Batch 3 Tasks 3 & 4).
 *
 * Extracted from src/middleware.ts so the host-redirect logic is unit-testable
 * (the middleware itself runs on the Edge + is awkward to test directly).
 *
 * Two canonical-domain decisions, both returning a 308 (permanent) redirect:
 *
 *  1. acquisitionos.net is NOT an approved AcquisitionOS destination — the only
 *     approved destination is the private-beta site. If the `.net` host is ever
 *     pointed at this app, redirect it to the approved beta domain so the
 *     paragonel site is never served under the `.net` host. Preserves the
 *     existing decision (forbidden in the AI system prompt + hardcoded
 *     PRODUCT_DOMAIN on the AcquisitionOS page) at the redirect layer.
 *
 *  2. www.paragonel.com → paragonel.com (apex). Canonical-domain consistency:
 *     the apex is the canonical host (matches metadataBase + sitemap/robots).
 *     Only fires if the www host is pointed at the app — the Vercel preview
 *     host (paragonel.vercel.app) is NEVER redirected, so preview access is
 *     unaffected.
 */

/** The only approved AcquisitionOS destination (the private-beta site). */
export const ACQUISITIONOS_APPROVED_DOMAIN = 'https://acquisitionosbeta.vercel.app/';

/** The canonical apex host for the paragonel site. */
export const PARAGONEL_APEX_HOST = 'paragonel.com';

export interface CanonicalRedirect {
  /** Absolute redirect URL (the approved beta domain, or the apex + path). */
  url: string;
  /** 308 permanent — both decisions are canonical, not temporary. */
  permanent: boolean;
}

/**
 * Decide whether a request's host should be canonical-redirected. Returns the
 * redirect target (with `permanent: true`) or null when the host is already
 * canonical (the apex, the Vercel preview, localhost, or any other host).
 */
export function canonicalHostRedirect(
  host: string,
  pathname: string,
  search: string,
): CanonicalRedirect | null {
  const h = (host || '').toLowerCase();
  if (!h) return null;

  if (h === 'acquisitionos.net' || h === 'www.acquisitionos.net') {
    return { url: ACQUISITIONOS_APPROVED_DOMAIN, permanent: true };
  }

  if (h === `www.${PARAGONEL_APEX_HOST}`) {
    const url = new URL(pathname || '/', `https://${PARAGONEL_APEX_HOST}`);
    url.search = search || '';
    return { url: url.toString(), permanent: true };
  }

  return null;
}
