/**
 * safe-redirect.ts — open-redirect defense for client-side redirect params.
 *
 * A `?redirect=` value is only honored when it is a same-origin relative path:
 * it must start with a single '/' and must NOT start with '//' (protocol-
 * relative) or be an absolute URL (scheme). Otherwise the fallback is used.
 *
 * This prevents a crafted `?redirect=https://evil.com` (or `//evil.com`) from
 * navigating a post-login/post-registration user off-site. It does NOT affect
 * legitimate in-app targets such as `/careers/{id}` or `/candidate/profile`.
 */
export function safeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;
  // Must start with a single '/', not '//' (protocol-relative), and not a scheme.
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  // Reject anything containing a scheme in the first segment (e.g. /javascript:).
  if (/^\/[^/]*:/.test(raw)) return fallback;
  return raw;
}
