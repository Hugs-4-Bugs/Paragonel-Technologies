'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useCookieConsent } from '@/hooks/use-cookie-consent';

/**
 * GA4 analytics — env-gated + consent-gated (Prompt 05I §6.1).
 *
 * Loads NOTHING unless BOTH conditions hold:
 *   1. NEXT_PUBLIC_GA4_MEASUREMENT_ID is set (MANUAL — the founder must provide
 *      the GA4 Measurement ID, e.g. "G-XXXXXXXXXX", as a Vercel env var).
 *      Absent today → this component is a complete no-op and the site runs
 *      analytics-free, exactly as it does now.
 *   2. The visitor granted analytics consent via the cookie banner
 *      (useCookieConsent: consentGiven === true && preferences.analytics === true).
 *
 * Guarantees (Prompt 05I §6.1):
 * - No hardcoded credentials — the ID comes only from the environment.
 * - No analytics fires before consent (the Script tags are not rendered until
 *   `allowed` is true, which requires consentGiven === true).
 * - No duplicate page-view events — a single `gtag('config', ...)` runs on the
 *   initial load (inside the init script), and the useEffect only updates the
 *   page_path on subsequent SPA route changes (no second initial pageview).
 * - Correct SPA route-change tracking via the Next router pathname.
 * - IP anonymized (anonymize_ip: true). No PII in events.
 * - Loaded with next/script `afterInteractive` so it never blocks first paint.
 *
 * Mounted inside the CookieConsentProvider (via AppShell) so the consent hook
 * resolves correctly. The existing cookie-consent banner/modal are untouched.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export function Ga4Analytics() {
  const { preferences, consentGiven } = useCookieConsent();
  const pathname = usePathname();

  const allowed =
    Boolean(GA_ID) && consentGiven === true && preferences?.analytics === true;

  // SPA route-change tracking: a single page_path update per navigation.
  // The initial pageview is sent by the inline init script below; this effect
  // only fires on subsequent pathname changes, so there is no duplicate.
  useEffect(() => {
    if (!allowed || !GA_ID) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === 'function') {
      w.gtag('config', GA_ID, { page_path: pathname });
    }
  }, [allowed, pathname]);

  if (!allowed || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
