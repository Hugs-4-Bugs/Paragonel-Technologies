"use client";

import { useCookieConsent } from '@/hooks/use-cookie-consent';

/**
 * CookieConsentManager (Prompt 05F honesty fix).
 *
 * Previously this component SIMULATED loading analytics/marketing/performance
 * scripts (console.log "Mock Google Analytics initialized", "Mock Facebook
 * Pixel initialized", etc.). That simulation claimed trackers were active when
 * the site loads NONE — violating the founder rule "do not claim to use cookies
 * or trackers that do not actually exist."
 *
 * Paragonel currently uses ONLY strictly-necessary cookies (authentication,
 * session, theme preference, and the cookie-consent record itself). No
 * analytics, marketing, advertising or performance-tracking scripts are loaded
 * by the website. The cookie preference UI therefore records the visitor's
 * preferences for any FUTURE use, but it does NOT load any non-essential script
 * today regardless of the preference state. If a real tracker is ever added, it
 * must be gated on the corresponding preference here AND disclosed in the
 * Cookie Policy.
 *
 * The component remains a pass-through wrapper so the consent banner / settings
 * modal continue to render (preserving existing functionality + stored
 * preferences). No client-side effects are triggered from preferences.
 */
export function CookieConsentManager({ children }: { children: React.ReactNode }) {
  // Read preferences so the hook stays mounted + preferences remain in sync,
  // but intentionally perform NO side effects: no scripts load from consent.
  useCookieConsent();
  return <>{children}</>;
}
